import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  initCinetPayPayment,
  generateTransactionId,
  getCinetPayConfig,
  validateCinetPayConfig,
} from '@/lib/cinetpay';

/**
 * POST /api/cinetpay/init
 * Initialisation d'une transaction de paiement CinetPay V2 pour une facture client
 */
export async function POST(req: NextRequest) {
  try {
    // Vérification de la configuration CinetPay au démarrage
    const { valid, missing } = validateCinetPayConfig();
    if (!valid) {
      console.error(`[CINETPAY_INIT] Configuration incomplète : ${missing.join(', ')}`);
      return NextResponse.json(
        {
          success: false,
          error: `Le module de paiement en ligne n'est pas encore configuré (${missing.join(', ')} manquant sur Vercel).`,
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const invoiceId = String(body.invoiceId || body.invoice_id || '').trim();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant de facture (invoiceId) manquant.' },
        { status: 400 }
      );
    }

    // 1. Récupération de la facture et de son client depuis Supabase (Admin pour garantir l'accès)
    let { data: invoice, error: invoiceErr } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', invoiceId)
      .maybeSingle();

    // Fallback par jeton de paiement sécurisé si l'identifiant fourni est un token
    if (!invoice) {
      const { data: tokenInvoice } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*)')
        .eq('payment_token', invoiceId)
        .maybeSingle();
      if (tokenInvoice) {
        invoice = tokenInvoice;
        invoiceErr = null;
      }
    }

    if (invoiceErr || !invoice) {
      console.error(`[CINETPAY_INIT] Facture introuvable id/token=${invoiceId}:`, invoiceErr);
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

    // 4. Extraction et validation des coordonnées du client
    const clientName = (invoice.client?.name || body.customer_name || 'Client B2B').trim();
    const nameParts = clientName.split(' ');
    const surname = nameParts[0] || 'Client';
    const name = nameParts.slice(1).join(' ') || 'Entreprise';

    // Numéro de téléphone prioritaire : fourni dans le corps ou sur la fiche client
    let customerPhone = (body.customer_phone || invoice.client?.phone || '').trim().replace(/[\s-]/g, '');
    
    // Détection de code pays par défaut
    let countryCode = 'CI';
    const rawCountry = (invoice.client?.country || '').toLowerCase();
    if (rawCountry.includes('sénégal') || rawCountry.includes('senegal') || rawCountry === 'sn') countryCode = 'SN';
    else if (rawCountry.includes('mali') || rawCountry === 'ml') countryCode = 'ML';
    else if (rawCountry.includes('burkina') || rawCountry === 'bf') countryCode = 'BF';
    else if (rawCountry.includes('bénin') || rawCountry.includes('benin') || rawCountry === 'bj') countryCode = 'BJ';
    else if (rawCountry.includes('togo') || rawCountry === 'tg') countryCode = 'TG';
    else if (rawCountry.includes('cameroun') || rawCountry === 'cm') countryCode = 'CM';

    if (!customerPhone || customerPhone.length < 8) {
      // Si aucun téléphone n'est enregistré sur le client, utiliser un préfixe local indicatif propre
      customerPhone = '0500000000';
    }

    // 5. Génération de l'identifiant de transaction unique (< 20 caractères)
    const transactionId = generateTransactionId(invoice.id);
    const config = getCinetPayConfig();

    // 6. Enregistrement initial dans la table payments (status: pending)
    const { error: payErr } = await supabaseAdmin.from('payments').upsert(
      {
        invoice_id: invoice.id,
        transaction_id: transactionId,
        amount,
        currency: 'XOF',
        status: 'pending',
        customer_phone: customerPhone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'transaction_id' }
    );

    if (payErr) {
      console.warn('[CINETPAY_INIT] Avertissement insertion table payments:', payErr.message);
    }

    // 7. Appel CinetPay V2 Checkout
    const result = await initCinetPayPayment({
      transaction_id: transactionId,
      amount,
      currency: 'XOF',
      description: `Règlement Facture ${invoice.invoice_number || invoice.id}`,
      invoice_number: invoice.invoice_number,
      customer_name: name,
      customer_surname: surname,
      customer_email: invoice.client?.email || 'contact@izifacture.com',
      customer_phone: customerPhone,
      customer_address: invoice.client?.address || 'Abidjan',
      customer_city: invoice.client?.city || 'Abidjan',
      customer_country: countryCode,
      notify_url: `${config.appUrl}/api/cinetpay/notify`,
      return_url: `${config.appUrl}/payment/return?transaction_id=${encodeURIComponent(transactionId)}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
      },
    });

    if (!result.success || !result.payment_url) {
      console.error('[CINETPAY_INIT] Échec création lien de paiement:', result.message);
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Paiement temporairement indisponible. Veuillez réessayer.',
        },
        { status: 502 }
      );
    }

    // 8. Sauvegarder la référence de paiement sur la facture
    await supabaseAdmin
      .from('invoices')
      .update({
        cinetpay_transaction_id: transactionId,
        cinetpay_token: result.payment_token || null,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    return NextResponse.json({
      success: true,
      transaction_id: transactionId,
      payment_url: result.payment_url,
      amount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CINETPAY_INIT] Erreur serveur:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Une erreur interne est survenue lors de l’initialisation du paiement.' },
      { status: 500 }
    );
  }
}
