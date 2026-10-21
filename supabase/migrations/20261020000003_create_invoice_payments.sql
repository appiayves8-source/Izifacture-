-- ==============================================================================
-- Migration 003: Table invoice_payments & RLS (Paiements Factures CinetPay)
-- ==============================================================================

-- 1. Create table public.invoice_payments
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  transaction_id text UNIQUE NOT NULL,
  cinetpay_transaction_id text,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  cinetpay_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_invoice_payments_facture ON public.invoice_payments(facture_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_user ON public.invoice_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_trans_id ON public.invoice_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_status ON public.invoice_payments(status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can select their own invoice payments"
  ON public.invoice_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice payments"
  ON public.invoice_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only service_role can update payment status from webhook

-- 5. Atomic RPC function for Invoice Payment Completion
CREATE OR REPLACE FUNCTION public.complete_invoice_payment_tx(
  p_transaction_id text,
  p_cinetpay_trans_id text,
  p_payload jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_payment public.invoice_payments%ROWTYPE;
BEGIN
  -- Row lock
  SELECT * INTO v_payment
  FROM public.invoice_payments
  WHERE transaction_id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice payment % not found', p_transaction_id;
  END IF;

  -- Idempotency check
  IF v_payment.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'status', 'already_paid',
      'transaction_id', p_transaction_id
    );
  END IF;

  -- 1. Mark payment as paid
  UPDATE public.invoice_payments
  SET status = 'paid',
      cinetpay_transaction_id = p_cinetpay_trans_id,
      cinetpay_response = p_payload,
      updated_at = now()
  WHERE transaction_id = p_transaction_id;

  -- 2. Update invoice status to 'payee' if linked invoice exists
  IF v_payment.facture_id IS NOT NULL THEN
    UPDATE public.invoices
    SET status = 'payee',
        payment_method = 'CinetPay (Mobile Money / Wave / CB)',
        updated_at = now()
    WHERE id = v_payment.facture_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'completed',
    'transaction_id', p_transaction_id,
    'facture_id', v_payment.facture_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
