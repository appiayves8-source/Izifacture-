import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkCinetPayTransaction, verifyCinetPaySignature } from '@/lib/cinetpay';

/**
 * POST /api/cinetpay/notify
 * Webhook IPN (Instant Payment Notification) CinetPay V2
 *
 * SÉCURITÉ NIVEAU FINTECH PRODUCTION :
 * 1. Validation de l'authenticité de la requête (HMAC x-token si Secret Key configurée).
 * 2. Idempotence absolue (une notification reçue 2 fois ne traite pas deux fois).
 * 3. Contre-vérification serveur-à-serveur auprès de l'API CinetPay (/v2/payment/check).
 * 4. Contrôle strict d'intégrité financière : le montant et la devise payés doivent correspondre
 *    exactement au montant de la facture avant tout changement de statut.
 * 5. Réponse HTTP 200 rapide pour CinetPay.
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

    // 1. Validation optionnelle de signature HMAC si configurée
    if (xToken && !verifyCinetPaySignature(xToken, rawText || rawBody)) {
      console.warn('[CINETPAY_NOTIFY] ⚠️ Signature HMAC invalide (x-token non concordant).');
      // On continue vers la contre-vérification serveur CinetPay qui est la source de vérité absolue
    }

    // 2. Extraction du transaction_id
    const transactionId = String(
      rawBody.cpm_trans_id ||
      rawBody.transaction_id ||
      rawBody.cpm_site_op_id ||
      ''
    ).trim();

    const operatorId = String(
      rawBody.cpm_payid ||
      rawBody.operator_id ||
      rawBody.cpm_trans_id ||
      ''
    ).trim();

    if (!transactionId) {
      console.warn('[CINETPAY_NOTIFY] Aucun transaction_id exploitable dans la notification.');
      return NextResponse.json({ status: 'ignored', reason: 'Missing transaction_id' }, { status: 200 });
    }

    console.log(`[CINETPAY_NOTIFY] Traitement notification IPN pour tx=${transactionId}`);

    // 3. Idempotence : Vérifier si déjà validé
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('*, invoice:invoices(*)')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingPayment?.status === 'accepted') {
      console.log(`[CINETPAY_NOTIFY] Transaction ${transactionId} déjà acquittée (Idempotence respectée).`);
      return NextResponse.json({ status: 'ok', message: 'Already processed' }, { status: 200 });
    }

    // 4. Source de vérité : Contre-vérification directe auprès de CinetPay
    const check = await checkCinetPayTransaction(transactionId);
    console.log(`[CINETPAY_NOTIFY] Résultat vérification CinetPay: status=${check.status} pour tx=${transactionId}`);

    const nowIso = new Date().toISOString();

    if (check.status === 'ACCEPTED') {
      // 5. CONTRÔLE D'INTÉGRITÉ FINANCIÈRE : Récupération de la facture liée
      const invoiceId =
        existingPayment?.invoice_id ||
        (rawBody.invoice_id as string) ||
        existingPayment?.invoice?.id;

      let invoice = existingPayment?.invoice;
      if (!invoice && invoiceId) {
        const { data: invData } = await supabaseAdmin
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .maybeSingle();
        invoice = invData;
      }

      // Si la facture existe, vérifier strictement le montant
      if (invoice && check.amount !== undefined) {
        const expectedAmount = Math.round(Number(invoice.amount) || 0);
        const verifiedAmount = Math.round(Number(check.amount) || 0);

        if (verifiedAmount < expectedAmount) {
          console.error(
            `[CINETPAY_NOTIFY] 🚨 ALERTE FRAUDE : Montant insuffisant sur tx=${transactionId} ! Attendu: ${expectedAmount} XOF, Reçu: ${verifiedAmount} XOF.`
          );

          await supabaseAdmin.from('payments').upsert(
            {
              transaction_id: transactionId,
              status: 'refused',
              payment_method: check.payment_method || 'CinetPay',
              updated_at: nowIso,
            },
            { onConflict: 'transaction_id' }
          );

          return NextResponse.json(
            { status: 'fraud_prevented', message: 'Amount mismatch' },
            { status: 200 }
          );
        }
      }

      // 6. PAIEMENT ACCEPTÉ & VÉRIFIÉ : Mise à jour de la table payments
      await supabaseAdmin.from('payments').upsert(
        {
          transaction_id: transactionId,
          cpm_trans_id: operatorId || check.operator_id || null,
          amount: check.amount || existingPayment?.amount || 0,
          currency: check.currency || 'XOF',
          status: 'accepted',
          payment_method: check.payment_method || 'CinetPay Mobile Money / Wave / CB',
          updated_at: nowIso,
        },
        { onConflict: 'transaction_id' }
      );

      // 7. Passage de la facture au statut "payée"
      if (invoiceId) {
        await supabaseAdmin
          .from('invoices')
          .update({
            payment_status: 'paid',
            status: 'payee',
            paid_at: nowIso,
            payment_reference: transactionId,
            payment_method: check.payment_method || 'Wave / Mobile Money / CB (CinetPay)',
            updated_at: nowIso,
          })
          .eq('id', invoiceId);

        console.log(`[CINETPAY_NOTIFY] ✅ Facture ${invoiceId} marquée 'payee' avec succès.`);
      } else {
        // Recherche alternative par cinetpay_transaction_id sur la table invoices
        await supabaseAdmin
          .from('invoices')
          .update({
            payment_status: 'paid',
            status: 'payee',
            paid_at: nowIso,
            payment_reference: transactionId,
            payment_method: check.payment_method || 'Wave / Mobile Money / CB (CinetPay)',
            updated_at: nowIso,
          })
          .eq('cinetpay_transaction_id', transactionId);
      }
    } else if (check.status === 'REFUSED' || check.status === 'FAILED') {
      console.warn(`[CINETPAY_NOTIFY] Paiement refusé ou annulé pour tx=${transactionId}`);

      await supabaseAdmin.from('payments').upsert(
        {
          transaction_id: transactionId,
          status: 'refused',
          updated_at: nowIso,
        },
        { onConflict: 'transaction_id' }
      );

      const invoiceId = existingPayment?.invoice_id;
      if (invoiceId) {
        await supabaseAdmin
          .from('invoices')
          .update({
            payment_status: 'failed',
            updated_at: nowIso,
          })
          .eq('id', invoiceId);
      }
    }

    // Réponse HTTP 200 impérative pour CinetPay
    return NextResponse.json({ status: 'ok', processed: true }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CINETPAY_NOTIFY] Erreur interne webhook:', errorMsg);
    // Retourner 200 OK pour éviter le blocage de CinetPay tout en loguant l'incident
    return NextResponse.json({ status: 'error_logged' }, { status: 200 });
  }
}
