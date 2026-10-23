import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { initCinetPayPayment, getCinetPayConfig, validateCinetPayConfig } from '@/lib/cinetpay';

const SUBSCRIPTION_AMOUNT = 5000; // 5 000 FCFA / mois

/**
 * POST /api/subscription/create
 * Initialisation d'un paiement d'abonnement IziFacture Pro (5 000 FCFA / mois)
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Session non autorisée. Veuillez vous connecter.' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Session invalide ou expirée.' }, { status: 401 });
    }

    // Validation des identifiants CinetPay
    const { valid, missing } = validateCinetPayConfig();
    if (!valid) {
      return NextResponse.json(
        {
          error: `Le module de paiement CinetPay n'est pas encore configuré (${missing.join(', ')} manquant sur Vercel).`,
          missing_config: true,
        },
        { status: 503 }
      );
    }

    const config = getCinetPayConfig();
    const transactionId = `ABO-${user.id.slice(0, 8)}-${Date.now()}`;

    // Extraction des coordonnées de l'utilisateur
    const rawFullName = (user.user_metadata?.full_name || 'Client IziFacture').trim();
    const nameParts = rawFullName.split(' ');
    const customerName = nameParts[0] || 'Client';
    const customerSurname = nameParts.slice(1).join(' ') || 'IziFacture';
    const customerPhone = (user.user_metadata?.phone || user.phone || '0500000000').trim().replace(/[\s-]/g, '');

    // Initialisation via le module centralisé CinetPay V2
    const result = await initCinetPayPayment({
      transaction_id: transactionId,
      amount: SUBSCRIPTION_AMOUNT,
      currency: 'XOF',
      description: 'Abonnement IziFacture Pro - 5 000 F CFA / mois',
      customer_name: customerName,
      customer_surname: customerSurname,
      customer_email: user.email || 'contact@izifacture.com',
      customer_phone: customerPhone,
      customer_country: 'CI',
      notify_url: `${config.appUrl}/api/subscription/webhook`,
      return_url: `${config.appUrl}/dashboard?payment=success&tx=${encodeURIComponent(transactionId)}`,
      channels: 'ALL',
      metadata: {
        type: 'subscription',
        user_id: user.id,
        plan: 'pro_5000',
      },
    });

    if (!result.success || !result.payment_url) {
      return NextResponse.json(
        { error: result.message || "Échec d'initialisation du paiement CinetPay." },
        { status: 400 }
      );
    }

    // Enregistrement de la session en attente dans la table subscriptions
    await supabaseAdmin.from('subscriptions').insert({
      user_id: user.id,
      transaction_id: transactionId,
      status: 'pending',
      amount: SUBSCRIPTION_AMOUNT,
      currency: 'XOF',
      payment_url: result.payment_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      payment_url: result.payment_url,
      transaction_id: transactionId,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[api/subscription/create] Erreur:', errorMsg);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement d’abonnement.' },
      { status: 500 }
    );
  }
}
