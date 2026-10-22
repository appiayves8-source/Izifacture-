import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { checkCinetPayTransaction } from '@/lib/cinetpay';

/**
 * POST /api/cinetpay/check-status
 * Vérifie le statut d'un paiement en cours pour la page de retour ou l'actualisation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const transactionId = String(body.transaction_id || body.transactionId || '').trim();

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant de transaction manquant.' },
        { status: 400 }
      );
    }

    console.log(`[CINETPAY_CHECK_STATUS] Requête statut pour ${transactionId}`);

    // 1. Consultation de la base locale
    const { data: localPayment } = await supabase
      .from('payments')
      .select('*, invoice:invoices(*)')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    // 2. Interrogation directe de CinetPay
    const check = await checkCinetPayTransaction(transactionId);
    const nowIso = new Date().toISOString();

    // 3. Réconciliation immédiate si accepté
    if (check.status === 'ACCEPTED') {
      const invoiceId = localPayment?.invoice_id;

      await supabase.from('payments').upsert(
        {
          transaction_id: transactionId,
          status: 'accepted',
          payment_method: check.payment_method || localPayment?.payment_method || 'CinetPay',
          updated_at: nowIso,
          raw_check: (check.raw as Record<string, unknown>) || null,
        },
        { onConflict: 'transaction_id' }
      );

      if (invoiceId) {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            status: 'payee',
            paid_at: nowIso,
            payment_reference: transactionId,
            updated_at: nowIso,
          })
          .eq('id', invoiceId);
      }
    } else if (check.status === 'REFUSED' || check.status === 'FAILED') {
      await supabase.from('payments').upsert(
        {
          transaction_id: transactionId,
          status: 'refused',
          updated_at: nowIso,
        },
        { onConflict: 'transaction_id' }
      );
    }

    return NextResponse.json({
      success: true,
      status: check.status, // 'ACCEPTED' | 'REFUSED' | 'PENDING' | 'FAILED'
      transaction_id: transactionId,
      invoice_id: localPayment?.invoice_id || null,
      amount: check.amount || localPayment?.amount || null,
      currency: check.currency || 'XOF',
      payment_method: check.payment_method || null,
      message: check.message || null,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CINETPAY_CHECK_STATUS] Erreur:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification du statut', details: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * GET support pour compatibilité
 */
export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get('transaction_id');
  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'transaction_id requis' }, { status: 400 });
  }

  // Déléguer au handler POST
  const fakeReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ transaction_id: transactionId }),
  });
  return POST(fakeReq);
}
