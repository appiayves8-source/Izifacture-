import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import {
  initCinetPayPayment,
  generateTransactionId,
  getCinetPayConfig,
} from '@/lib/cinetpay';

/**
 * POST /api/cinetpay/init
 * Initialisation d'une transaction de paiement CinetPay V2 pour une facture
 */
export async function POST(req: NextRequest) {
  try {
    // Log de diagnostic — vérifie la présence des variables d'env CinetPay
    console.log('[CINETPAY_CALL]', {
      site_id: process.env.CINETPAY_SITE_ID,
      has_key: !!process.env.CINETPAY_API_KEY,
      has_password: !!process.env.CINETPAY_API_PASSWORD,
      has_secret: !!process.env.CINETPAY_SECRET_KEY,
    });

    const body = await req.json().catch(() => ({}));
    const invoiceId = String(body.invoiceId || body.invoice_id || '').trim();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant de facture (invoiceId) manquant.' },
        { status: 400 }
      );
    }

    console.log(`[CINETPAY_INIT] Recherche facture id=${invoiceId}`);

    // 1. Récupération de la facture et de son client depuis Supabase
    const { data: invoice, error: invoiceErr } = await supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceErr || !invoice) {
      console.error(`[CINETPAY_INIT] Facture introuvable:`, invoiceErr);
      return NextResponse.json(
        { success: false, error: 'Facture introuvable en base de données.' },
        { status: 404 }
      );
    }

    // 2. Validation du montant (Minimum 100 FCFA pour CinetPay)
    const amount = Math.round(Number(invoice.amount) || 0);
    if (amount < 100) {
      return NextResponse.json(
        {
          success: false,
          error: `Le montant de la facture (${amount} FCFA) doit être d'au moins 100 FCFA pour être payé en ligne.`,
        },
        { status: 400 }
      );
    }

    // 3. Vérifier si la facture n'est pas déjà payée
    if (invoice.payment_status === 'paid' || invoice.status === 'payee') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cette facture est déjà intégralement réglée.',
          alreadyPaid: true,
        },
        { status: 400 }
      );
    }

    // 4. Génération de l'identifiant de transaction unique (< 20 caractères)
    const transactionId = generateTransactionId(invoice.id);
    const config = getCinetPayConfig();

    // 5. Enregistrement initial dans la table payments (status: pending)
    const { error: payErr } = await supabase.from('payments').upsert(
      {
        invoice_id: invoice.id,
        transaction_id: transactionId,
        amount,
        currency: 'XOF',
        status: 'pending',
        customer_phone: invoice.client?.phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'transaction_id' }
    );

    if (payErr) {
      console.error('[CINETPAY_INIT] Erreur insertion payments:', payErr);
      // On continue car la table peut être en cours de synchro
    }

    // 6. Extraction des données client
    const clientName = invoice.client?.name || 'Client B2B';
    const nameParts = clientName.split(' ');
    const surname = nameParts[0] || 'Client';
    const name = nameParts.slice(1).join(' ') || 'IziFacture';

    // 7. Appel CinetPay V2
    const result = await initCinetPayPayment({
      transaction_id: transactionId,
      amount,
      description: `Règlement Facture ${invoice.invoice_number || invoice.id}`,
      invoice_number: invoice.invoice_number,
      customer_name: name,
      customer_surname: surname,
      customer_email: invoice.client?.email || 'contact@izifacture.com',
      customer_phone: invoice.client?.phone || '0700000000',
      customer_address: invoice.client?.address || 'Abidjan',
      customer_city: invoice.client?.city || 'Abidjan',
      customer_country: 'CI',
      notify_url: `${config.appUrl}/api/cinetpay/notify`,
      return_url: `${config.appUrl}/payment/return?transaction_id=${transactionId}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
      },
    });

    if (!result.success || !result.payment_url) {
      console.error('[CINETPAY_INIT] ❌ Échec création lien de paiement:', result);
      // Retourner le VRAI message CinetPay, jamais le message générique
      const errorMessage =
        result.message ||
        'Paiement indisponible — voire les logs Vercel ([CINETPAY_RAW]) pour la vraie cause';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 502 }
      );
    }

    // 8. Sauvegarder le token et mettre à jour la facture (statut en attente)
    await supabase
      .from('invoices')
      .update({
        cinetpay_transaction_id: transactionId,
        cinetpay_token: result.payment_token || null,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    console.log(`[CINETPAY_INIT] Lien généré avec succès pour ${transactionId} -> ${result.payment_url}`);

    return NextResponse.json({
      success: true,
      transaction_id: transactionId,
      payment_url: result.payment_url,
      amount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CINETPAY_INIT] ❌ Erreur serveur inattendue:', errorMsg);
    return NextResponse.json(
      { success: false, error: `Erreur serveur : ${errorMsg}` },
      { status: 500 }
    );
  }
}
