import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkCinetPayTransaction, verifyCinetPaySignature } from '@/lib/cinetpay';

const SUBSCRIPTION_AMOUNT = 5000;

/**
 * POST /api/subscription/webhook
 * Webhook IPN dédié à l'activation des abonnements SaaS IziFacture Pro
 */
export async function POST(req: NextRequest) {
  let rawBody: Record<string, unknown> = {};
  let rawText = '';

  try {
    const contentType = req.headers.get('content-type') || '';
    const xToken = req.headers.get('x-token');

    if (contentType.includes('application/x-www-form-urlencoded')) {
      rawText = await req.text();
      const params = new URLSearchParams(rawText);
      rawBody = Object.fromEntries(params.entries());
    } else {
      rawText = await req.text();
      try {
        rawBody = JSON.parse(rawText);
      } catch {
        rawBody = {};
      }
    }

    if (xToken && !verifyCinetPaySignature(xToken, rawText || rawBody)) {
      console.warn('[SUBSCRIPTION_WEBHOOK] Signature HMAC non concordante, double vérification requise.');
    }

    const transactionId = String(
      rawBody.cpm_trans_id ||
      rawBody.transaction_id ||
      rawBody.cpm_site_op_id ||
      ''
    ).trim();

    if (!transactionId) {
      return NextResponse.json({ status: 'ignored', reason: 'No transaction_id' }, { status: 200 });
    }

    console.log(`[SUBSCRIPTION_WEBHOOK] Notification reçue pour tx=${transactionId}`);

    // 1. Idempotence : Vérifier si l'abonnement est déjà activé
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingSub?.status === 'active') {
      console.log(`[SUBSCRIPTION_WEBHOOK] Abonnement ${transactionId} déjà actif (idempotence).`);
      return NextResponse.json({ status: 'ok', message: 'Already activated' }, { status: 200 });
    }

    // 2. Contre-vérification directe auprès des serveurs CinetPay
    const check = await checkCinetPayTransaction(transactionId);

    if (check.status === 'ACCEPTED') {
      // 3. Contrôle strict du montant et de la devise
      const verifiedAmount = Math.round(Number(check.amount) || 0);
      if (verifiedAmount < SUBSCRIPTION_AMOUNT || check.currency !== 'XOF') {
        console.error(
          `[SUBSCRIPTION_WEBHOOK] ALERTE FRAUDE : Montant attendu ${SUBSCRIPTION_AMOUNT} XOF, reçu: ${verifiedAmount} ${check.currency}`
        );
        return NextResponse.json({ status: 'amount_mismatch' }, { status: 200 });
      }

      // 4. Activation de l'abonnement pour 30 jours
      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          cinetpay_transaction_id: check.operator_id || null,
          updated_at: now.toISOString(),
        })
        .eq('transaction_id', transactionId);

      const userId = existingSub?.user_id;
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: true,
            subscription_ends_at: endsAt,
            updated_at: now.toISOString(),
          })
          .eq('id', userId);

        console.log(`[SUBSCRIPTION_WEBHOOK] ✅ Profil ${userId} activé Pro avec succès jusqu'au ${endsAt}`);
      }
    } else if (check.status === 'REFUSED' || check.status === 'FAILED') {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_id', transactionId);
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[SUBSCRIPTION_WEBHOOK] Erreur interne:', errorMsg);
    return NextResponse.json({ status: 'error_logged' }, { status: 200 });
  }
}
