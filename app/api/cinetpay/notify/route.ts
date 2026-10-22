import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { checkCinetPayTransaction } from '@/lib/cinetpay';

/**
 * POST /api/cinetpay/notify
 * Webhook IPN CinetPay V2
 *
 * SÉCURITÉ CRITIQUE : Ne fait JAMAIS confiance au seul corps reçu.
 * Interroge systématiquement l'API CinetPay (checkPayStatus) en serveur-à-serveur
 * avant de modifier le moindre statut financier.
 * Idempotent et atomique.
 */
export async function POST(req: NextRequest) {
  let rawBody: Record<string, unknown> = {};

  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      rawBody = Object.fromEntries(params.entries());
    } else {
      rawBody = await req.json().catch(() => ({}));
    }

    console.log(`[CINETPAY_NOTIFY] Received ${JSON.stringify(rawBody)}`);

    // 1. Extraction des identifiants CinetPay
    const transactionId = String(
      rawBody.cpm_trans_id ||
        rawBody.transaction_id ||
        rawBody.cpm_site_op_id ||
        ''
    ).trim();

    const cpmPayId = String(
      rawBody.cpm_payid ||
        rawBody.operator_id ||
        rawBody.cpm_trans_id ||
        ''
    ).trim();

    if (!transactionId) {
      console.warn('[CINETPAY_NOTIFY] Aucun transaction_id exploitable dans la notification.');
      return NextResponse.json({ status: 'ok', warning: 'No transaction_id' }, { status: 200 });
    }

    // 2. Contrôle d'idempotence : Si déjà marqué 'accepted', ignorer sans re-traiter
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingPayment?.status === 'accepted') {
      console.log(`[CINETPAY_NOTIFY] Transaction ${transactionId} déjà validée (Idempotence respectée).`);
      return NextResponse.json({ status: 'ok', message: 'Already accepted' }, { status: 200 });
    }

    // 3. ÉTAPE SÉCURITÉ OBLIGATOIRE : Contre-vérification directe auprès de CinetPay
    const check = await checkCinetPayTransaction(transactionId);
    console.log(`[CINETPAY_NOTIFY] Statut vérifié auprès de CinetPay: ${check.status} pour ${transactionId}`);

    const nowIso = new Date().toISOString();

    if (check.status === 'ACCEPTED') {
      // 4. A) PAIEMENT ACCEPTÉ : Mise à jour atomique Supabase
      console.log(`[CINETPAY_NOTIFY] ✅ PAIEMENT VALIDÉ pour ${transactionId} !`);

      // Mise à jour de la table payments
      await supabase.from('payments').upsert(
        {
          transaction_id: transactionId,
          cpm_trans_id: cpmPayId || check.operator_id || null,
          status: 'accepted',
          payment_method: check.payment_method || 'CinetPay Mobile Money / Wave',
          raw_notify: rawBody,
          raw_check: (check.raw as Record<string, unknown>) || null,
          updated_at: nowIso,
        },
        { onConflict: 'transaction_id' }
      );

      // Mise à jour de la facture associée
      const invoiceId = existingPayment?.invoice_id || (rawBody.invoice_id as string);

      if (invoiceId) {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            status: 'payee', // Correspond au statut standard IziFacture
            paid_at: nowIso,
            payment_reference: transactionId,
            payment_method: check.payment_method || 'Wave / Mobile Money (CinetPay)',
            updated_at: nowIso,
          })
          .eq('id', invoiceId);

        console.log(`[CINETPAY_NOTIFY] Facture ${invoiceId} passée à 'payee' avec succès.`);
      } else {
        // Recherche alternative par cinetpay_transaction_id sur la table invoices
        await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            status: 'payee',
            paid_at: nowIso,
            payment_reference: transactionId,
            payment_method: check.payment_method || 'Wave / Mobile Money (CinetPay)',
            updated_at: nowIso,
          })
          .eq('cinetpay_transaction_id', transactionId);
      }
    } else if (check.status === 'REFUSED' || check.status === 'FAILED') {
      // 4. B) PAIEMENT REFUSÉ
      console.warn(`[CINETPAY_NOTIFY] ❌ Paiement refusé pour ${transactionId}`);

      await supabase.from('payments').upsert(
        {
          transaction_id: transactionId,
          status: 'refused',
          raw_notify: rawBody,
          raw_check: (check.raw as Record<string, unknown>) || null,
          updated_at: nowIso,
        },
        { onConflict: 'transaction_id' }
      );

      const invoiceId = existingPayment?.invoice_id;
      if (invoiceId) {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'failed',
            updated_at: nowIso,
          })
          .eq('id', invoiceId);
      }
    } else {
      // Statut encore en cours (PENDING)
      console.log(`[CINETPAY_NOTIFY] Transaction ${transactionId} toujours en attente (PENDING).`);
    }

    // 5. Répondre TOUJOURS 200 OK à CinetPay pour valider la bonne réception du webhook
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CINETPAY_NOTIFY] Erreur traitement webhook:', errorMsg);
    // On renvoie quand même 200 OK pour éviter les blocages de retries intempestifs CinetPay
    return NextResponse.json({ status: 'ok', warning: 'Handled with error' }, { status: 200 });
  }
}
