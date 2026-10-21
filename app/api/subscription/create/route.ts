import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Session invalide ou expirée.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const isSandboxDirect = Boolean(body?.sandbox_direct);

    // Sandbox / Test Instant Activation Mode
    if (isSandboxDirect) {
      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          is_subscribed: true,
          subscription_ends_at: endsAt,
          updated_at: now.toISOString(),
        });

      return NextResponse.json({
        success: true,
        activated: true,
        message: 'Abonnement Pro activé avec succès pour 30 jours (Mode Test Sandbox) !',
      });
    }

    // Production CinetPay V2 Initialization
    const CINETPAY_APIKEY = process.env.CINETPAY_APIKEY;
    const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!CINETPAY_APIKEY || !CINETPAY_SITE_ID) {
      return NextResponse.json(
        {
          error: 'Configuration CinetPay manquante : CINETPAY_APIKEY ou CINETPAY_SITE_ID absent de .env.local. Utilisez le bouton "Activer en mode Test" pour débloquer l\'accès immédiatement.',
          missing_config: true,
        },
        { status: 400 }
      );
    }

    const transactionId = `ABO-${user.id.slice(0, 8)}-${Date.now()}`;
    const rawFullName = (user.user_metadata?.full_name || 'Client IziFacture').trim();
    const nameParts = rawFullName.split(' ');
    const customerName = nameParts[0] || 'Client';
    const customerSurname = nameParts.slice(1).join(' ') || 'IziFacture';
    const customerPhone = user.user_metadata?.phone || '0700000000';

    const cinetpayPayload = {
      apikey: CINETPAY_APIKEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: 5000,
      currency: 'XOF',
      description: 'Abonnement IziFacture Pro - 5000 F/mois',
      customer_name: customerName,
      customer_surname: customerSurname,
      customer_email: user.email || 'contact@izifacture.com',
      customer_phone_number: customerPhone,
      customer_address: 'Abidjan Plateau',
      customer_city: 'Abidjan',
      customer_country: 'CI',
      customer_state: 'Lagunes',
      customer_zip_code: '00225',
      notify_url: `${appUrl}/api/subscription/webhook`,
      return_url: `${appUrl}/dashboard?payment=success`,
      channels: 'ALL',
      lang: 'fr',
      metadata: user.id,
    };

    const cinetRes = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cinetpayPayload),
    });

    const cinetData = await cinetRes.json();

    if (String(cinetData.code) !== '201' || !cinetData.data?.payment_url) {
      return NextResponse.json(
        {
          error: `Erreur CinetPay (${cinetData.code}): ${cinetData.message || cinetData.description || 'Échec initialisation'}`,
        },
        { status: 400 }
      );
    }

    // Save pending subscription in DB
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      transaction_id: transactionId,
      status: 'pending',
      amount: 5000,
      currency: 'XOF',
      payment_url: cinetData.data.payment_url,
      raw_payload: cinetData.data,
    });

    return NextResponse.json({
      payment_url: cinetData.data.payment_url,
      transaction_id: transactionId,
    });
  } catch (err: unknown) {
    console.error('[api/subscription/create] Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
}
