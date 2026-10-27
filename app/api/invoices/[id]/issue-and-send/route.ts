import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendInvoiceWhatsApp } from '@/lib/services/whatsappService';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/invoices/[id]/issue-and-send
 * Action serveur unifiée et idempotente d'émission et d'envoi automatique de facture.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const invoiceId = params?.id;
  if (!invoiceId) {
    return NextResponse.json(
      { success: false, error: 'Identifiant de facture manquant.' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const isResend = Boolean(body.resend);
    const idempotencyKey = req.headers.get('x-idempotency-key') || body.idempotencyKey || null;

    console.log(`[ISSUE_AND_SEND] Début traitement pour facture id=${invoiceId} (resend=${isResend}, key=${idempotencyKey || 'none'})`);

    // 1. Récupération de la facture, de son client, et de ses articles
    const { data: invoice, error: invoiceErr } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceErr || !invoice) {
      console.error(`[ISSUE_AND_SEND] Facture introuvable id=${invoiceId}:`, invoiceErr);
      return NextResponse.json(
        { success: false, error: 'Facture introuvable en base de données.' },
        { status: 404 }
      );
    }

    // 2. Contrôle d'Idempotence strict : Si la même clé d'idempotence a déjà été traitée avec succès
    if (idempotencyKey && invoice.idempotency_key === idempotencyKey && invoice.send_status === 'sent') {
      console.log(`[ISSUE_AND_SEND] Idempotence respectée : facture ${invoiceId} déjà émise et envoyée avec cette clé.`);
      const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://izifacture-fawn.vercel.app';
      const appUrl = (rawAppUrl.includes('localhost') ? 'https://izifacture-fawn.vercel.app' : rawAppUrl).replace(/\/$/, '');
      return NextResponse.json({
        success: true,
        idempotentReplay: true,
        invoice,
        sendStatus: invoice.send_status,
        paymentUrl: `${appUrl}/pay/${invoice.id}`,
        message: 'Facture déjà émise et envoyée.',
      });
    }

    // 3. Validation de la facture
    // a. Montant > 0
    const amount = Number(invoice.amount) || 0;
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'La facture doit avoir un montant supérieur à 0 FCFA pour être émise.' },
        { status: 400 }
      );
    }

    // b. Lignes d'articles présentes
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'La facture doit comporter au moins une prestation ou un article.' },
        { status: 400 }
      );
    }

    // c. Client et coordonnées de contact (Téléphone recommandé mais non bloquant pour wa.me)
    const clientPhone = invoice.client?.phone || body.phone || '';
    if (!clientPhone || String(clientPhone).trim().length < 6) {
      console.warn(`[ISSUE_AND_SEND] Client "${invoice.client?.name}" sans téléphone valide. Émission sans envoi WhatsApp automatique.`);
    }

    // d. Facture déjà payée ?
    if (invoice.status === 'payee' || invoice.payment_status === 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cette facture est déjà intégralement payée. Elle ne peut plus être réémise.',
          alreadyPaid: true,
        },
        { status: 400 }
      );
    }

    // e. Facture déjà envoyée sans demande explicite de renvoi
    if (invoice.status === 'envoyee' && !isResend && invoice.send_status === 'sent') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cette facture a déjà été émise et transmise au client. Utilisez l’action "Renvoyer" pour un second envoi.',
          alreadySent: true,
        },
        { status: 409 }
      );
    }

    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://izifacture-fawn.vercel.app';
    // WhatsApp mobile refuse de rendre cliquable 'localhost'. On garantit une URL HTTPS publique.
    const appUrl = (rawAppUrl.includes('localhost') ? 'https://izifacture-fawn.vercel.app' : rawAppUrl).replace(/\/$/, '');
    // URL de paiement stable et pérenne basée sur l'identifiant réel de la facture
    const paymentUrl = `${appUrl}/pay/${invoice.id}`;

    // Récupération des paramètres entreprise
    const { data: settings } = await supabaseAdmin
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const companyName = settings?.company_name || 'IziFacture SARL';
    const nowIso = new Date().toISOString();

    // 5. Mise à jour de l'état d'émission de la facture (colonnes réelles de Supabase)
    const updatePayload: Record<string, unknown> = {
      status: 'envoyee',
      updated_at: nowIso,
    };
    if (clientPhone) {
      updatePayload.payment_reference = `whatsapp:${clientPhone}`;
    }

    const { error: updErr } = await supabaseAdmin
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoice.id);

    if (updErr) {
      console.warn(`[ISSUE_AND_SEND] Avertissement update invoice ${invoiceId}:`, updErr.message);
    } else {
      console.log(`[ISSUE_AND_SEND] Facture ${invoiceId} marquée 'envoyee'. URL=${paymentUrl}`);
    }

    // 6. Envoi automatique du message WhatsApp
    const sendResult = await sendInvoiceWhatsApp({
      invoiceNumber: invoice.invoice_number || invoice.id,
      companyName,
      amount,
      dueDate: invoice.due_date || 'À réception',
      paymentUrl,
      clientName: invoice.client?.name || 'Client',
      clientPhone,
      clientCountry: invoice.client?.country || "Côte d'Ivoire",
    });

    const sendStatus = sendResult.success ? 'sent' : 'failed';
    const sendError = sendResult.success ? null : (sendResult.error || 'Échec de transmission WhatsApp');
    console.log(`[ISSUE_AND_SEND] Statut transmission WhatsApp : ${sendStatus}`);

    // Récupérer la facture fraîchement mise à jour
    const { data: updatedInvoice } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', invoice.id)
      .single();

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice || { ...invoice, ...updatePayload, send_status: sendStatus, send_error: sendError },
      sendStatus,
      sendError,
      paymentUrl,
      whatsappUrl: sendResult.whatsappUrl,
      message: sendResult.success
        ? 'Facture émise et envoyée avec succès par WhatsApp !'
        : 'Facture émise avec succès. La passerelle API WhatsApp est en attente de configuration serveur.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ISSUE_AND_SEND] Erreur serveur critique:`, errorMsg);
    return NextResponse.json(
      { success: false, error: 'Une erreur interne est survenue lors de l’émission de la facture.' },
      { status: 500 }
    );
  }
}
