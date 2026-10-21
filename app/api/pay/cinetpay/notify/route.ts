import { NextRequest, NextResponse } from 'next/server';
import { checkPayment } from '@/lib/cinetpay';

/**
 * Endpoint IPN (Instant Payment Notification) CinetPay
 * Reçoit la notification asynchrone dès qu'un paiement est validé par l'opérateur (MTN, Wave, OM, etc.).
 * Obligatoire pour la certification et le passage en production.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let data: Record<string, unknown> = {};

    if (contentType.includes('application/json')) {
      data = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      formData.forEach((val, key) => {
        data[key] = val.toString();
      });
    } else {
      // Tentative fallback text / json
      const rawText = await req.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        // Tentative URLSearchParams
        const searchParams = new URLSearchParams(rawText);
        searchParams.forEach((val, key) => {
          data[key] = val;
        });
      }
    }

    console.log('[CINETPAY IPN] Notification reçue avec succès :', JSON.stringify(data, null, 2));

    // Identification du transaction_id (CinetPay utilise `cpm_trans_id` ou `transaction_id`)
    const transactionId =
      (data.cpm_trans_id as string) ||
      (data.transaction_id as string) ||
      (data.trans_id as string);

    if (!transactionId) {
      console.warn('[CINETPAY IPN] Aucun transaction_id trouvé dans le corps du webhook');
      return NextResponse.json(
        { status: 'ignored', message: 'transaction_id non renseigné dans le payload IPN' },
        { status: 200 }
      );
    }

    console.log(`[CINETPAY IPN] Double vérification serveur requise pour: ${transactionId}`);
    // Bonne pratique de sécurité Senior Payment : toujours contre-vérifier l'IPN auprès de l'API CinetPay
    const verifyResult = await checkPayment(transactionId);
    console.log(`[CINETPAY IPN] Statut vérifié officiel pour ${transactionId}:`, {
      status: verifyResult.status,
      amount: verifyResult.amount,
      currency: verifyResult.currency,
      payment_method: verifyResult.payment_method,
      operator_id: verifyResult.operator_id,
    });

    return NextResponse.json(
      {
        status: 'OK',
        message: 'Notification IPN traitée et validée avec succès',
        transaction_id: transactionId,
        verified_status: verifyResult.status,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CINETPAY IPN] Erreur traitement webhook:', errorMsg);
    // On retourne 200 pour éviter que CinetPay ne bloque les retries infinis si c'est une erreur de formatage
    return NextResponse.json(
      { status: 'error', message: errorMsg },
      { status: 200 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Test de disponibilité du webhook par CinetPay ou health check
  return NextResponse.json({
    status: 'online',
    service: 'IziFacture CinetPay IPN Webhook',
    timestamp: new Date().toISOString(),
  });
}
