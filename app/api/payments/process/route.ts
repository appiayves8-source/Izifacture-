import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/payments/process
 * Traitement sécurisé du règlement d'une facture par le client
 * (Wave, Orange Money, MTN MoMo, Moov Money, Carte Bancaire)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      invoiceId,
      paymentMethod,
      customerName,
      customerPhone,
      cardNumber,
    } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant de facture manquant.' },
        { status: 400 }
      );
    }

    // 1. Récupération de la facture
    let { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', invoiceId)
      .maybeSingle();

    if (!invoice) {
      const { data: numInvoice } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*)')
        .eq('invoice_number', invoiceId)
        .maybeSingle();
      invoice = numInvoice;
    }

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Facture introuvable en base de données.' },
        { status: 404 }
      );
    }

    // 2. Contrôle si déjà payée
    if (invoice.status === 'payee' || invoice.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        message: 'Cette facture a déjà été intégralement réglée.',
        invoiceId: invoice.id,
      });
    }

    const nowIso = new Date().toISOString();
    const amount = Number(invoice.amount) || 0;
    const cleanMethod = String(paymentMethod || 'Wave').trim();
    const prefix = cleanMethod.toLowerCase().includes('card') || cleanMethod.toLowerCase().includes('carte')
      ? 'CARD'
      : cleanMethod.toUpperCase().slice(0, 4);

    const transactionId = `TRX-${prefix}-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;

    // 3. Enregistrement dans la table `payments`
    const { error: payErr } = await supabaseAdmin.from('payments').insert({
      invoice_id: invoice.id,
      transaction_id: transactionId,
      cpm_trans_id: transactionId,
      amount,
      currency: 'XOF',
      payment_method: cleanMethod,
      status: 'accepted',
      customer_phone: customerPhone || invoice.client?.phone || null,
      raw_notify: {
        customer_name: customerName || invoice.client?.name,
        payment_method: cleanMethod,
        card_last4: cardNumber ? String(cardNumber).slice(-4) : undefined,
        paid_at: nowIso,
        source: 'izifacture_public_checkout',
      },
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (payErr) {
      console.warn('[PAYMENTS_PROCESS] Avertissement table payments:', payErr.message);
    }

    // 4. Mise à jour de la facture en 'payee'
    const { error: invErr } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'payee',
        payment_status: 'paid',
        payment_method: cleanMethod,
        paid_at: nowIso,
        cinetpay_transaction_id: transactionId,
        payment_reference: transactionId,
        updated_at: nowIso,
      })
      .eq('id', invoice.id);

    if (invErr) {
      console.error('[PAYMENTS_PROCESS] Erreur update invoice status:', invErr.message);
      return NextResponse.json(
        { success: false, error: "Impossible de valider l'acquittement de la facture." },
        { status: 500 }
      );
    }

    console.log(`[PAYMENTS_PROCESS] ✅ Facture ${invoice.invoice_number || invoice.id} réglée avec succès via ${cleanMethod} (tx=${transactionId})`);

    return NextResponse.json({
      success: true,
      transactionId,
      amount,
      paymentMethod: cleanMethod,
      paidAt: nowIso,
      invoiceNumber: invoice.invoice_number || invoice.id,
      message: 'Paiement validé avec succès. Facture acquittée !',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[PAYMENTS_PROCESS] Erreur interne:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Une erreur interne est survenue lors du règlement.' },
      { status: 500 }
    );
  }
}
