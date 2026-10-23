import { NextRequest, NextResponse } from 'next/server';
import { createPayment } from '@/lib/cinetpay';

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Le banc d’essai sandbox est désactivé en environnement de production.' },
        { status: 403 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Body vide autorisé
    }

    // Récupération de l'origine pour les URLs de redirection & callback
    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Génération d'un identifiant de transaction unique IZIFACTURE-TEST-{timestamp}
    const timestamp = Date.now();
    const transaction_id =
      (body.transaction_id as string) || `IZIFACTURE-TEST-${timestamp}`;

    const amount = Number(body.amount) || 100; // 100 FCFA obligatoire pour la certification
    const currency = (body.currency as string) || 'XOF';
    const description =
      (body.description as string) || `Test Certification CinetPay - 100 FCFA (${transaction_id})`;

    const customer_name = (body.customer_name as string) || 'Cyrille M.';
    const customer_email = (body.customer_email as string) || 'contact@izifacture.com';
    const customer_phone = (body.customer_phone as string) || '0700000000'; // Numéro test MTN CI

    const notify_url =
      (body.notify_url as string) || `${origin}/api/pay/cinetpay/notify`;
    const return_url =
      (body.return_url as string) || `${origin}/test-paiement?transaction_id=${transaction_id}&status=returned`;

    console.log(`[API /api/pay/cinetpay/init] Initialisation transaction ${transaction_id} montant: ${amount} ${currency}`);

    const result = await createPayment({
      transaction_id,
      amount,
      currency,
      description,
      customer_name,
      customer_email,
      customer_phone,
      notify_url,
      return_url,
      channels: 'ALL',
      metadata: JSON.stringify({
        source: 'izifacture_certification_sandbox',
        initiated_at: new Date().toISOString(),
      }),
    });

    if (!result.success) {
      console.warn(`[API /api/pay/cinetpay/init] Échec création:`, result);
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Impossible d’initialiser le paiement CinetPay',
          details: result,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction_id: result.transaction_id,
      payment_url: result.payment_url,
      payment_token: result.payment_token,
      code: result.code,
      message: result.message,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API /api/pay/cinetpay/init] Erreur interne:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur', details: errorMsg },
      { status: 500 }
    );
  }
}
