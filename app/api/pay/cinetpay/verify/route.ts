import { NextRequest, NextResponse } from 'next/server';
import { checkPayment } from '@/lib/cinetpay';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transaction_id = searchParams.get('transaction_id');

    if (!transaction_id) {
      return NextResponse.json(
        { success: false, error: 'Paramètre transaction_id obligatoire' },
        { status: 400 }
      );
    }

    console.log(`[API /api/pay/cinetpay/verify] Vérification statut pour: ${transaction_id}`);
    const result = await checkPayment(transaction_id);

    return NextResponse.json({
      success: result.success,
      transaction_id: result.transaction_id,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      payment_method: result.payment_method,
      operator_id: result.operator_id,
      payment_date: result.payment_date,
      message: result.message,
      description: result.description,
      raw: result.raw,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API /api/pay/cinetpay/verify] Erreur vérification:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Erreur interne lors de la vérification', details: errorMsg },
      { status: 500 }
    );
  }
}
