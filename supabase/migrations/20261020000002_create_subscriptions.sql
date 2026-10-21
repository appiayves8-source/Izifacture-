-- ==============================================================================
-- Migration 002: Table subscriptions & RLS (Abonnements CinetPay IziFacture)
-- ==============================================================================

-- 1. Create table public.subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id text UNIQUE NOT NULL,
  cinetpay_transaction_id text,
  payment_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'failed')),
  plan text NOT NULL DEFAULT 'pro_5000',
  amount integer NOT NULL DEFAULT 5000 CHECK (amount = 5000),
  currency text NOT NULL DEFAULT 'XOF',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  raw_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Indexes for fast filtering and idempotence queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_transaction_id ON public.subscriptions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_pending ON public.subscriptions(user_id, status, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Authenticated users can only view their own subscriptions
CREATE POLICY "Users can select their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their pending subscriptions
CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- STRICT SECURITY: NO direct client updates allowed.
-- Only the service_role (CinetPay Webhook) can perform UPDATE operations.
-- In Supabase RLS, omitting UPDATE policy prevents all authenticated/anon roles from updating rows.

-- 5. Atomic RPC function for Subscription Activation
CREATE OR REPLACE FUNCTION public.activate_subscription_tx(
  p_transaction_id text,
  p_cinetpay_trans_id text,
  p_payload jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_sub public.subscriptions%ROWTYPE;
  v_new_end timestamptz;
BEGIN
  -- Row-level lock to prevent concurrent webhook races
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE transaction_id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription transaction % not found', p_transaction_id;
  END IF;

  -- Idempotency check: if already active, return immediately without duplicate side-effects
  IF v_sub.status = 'active' THEN
    RETURN jsonb_build_object(
      'success', true,
      'status', 'already_active',
      'transaction_id', p_transaction_id
    );
  END IF;

  v_new_end := now() + interval '30 days';

  -- 1. Update subscription record
  UPDATE public.subscriptions
  SET status = 'active',
      cinetpay_transaction_id = p_cinetpay_trans_id,
      current_period_start = now(),
      current_period_end = v_new_end,
      raw_payload = p_payload,
      updated_at = now()
  WHERE transaction_id = p_transaction_id;

  -- 2. Update user profile to active subscription
  UPDATE public.profiles
  SET is_subscribed = true,
      subscription_ends_at = v_new_end,
      updated_at = now()
  WHERE id = v_sub.user_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'activated',
    'transaction_id', p_transaction_id,
    'user_id', v_sub.user_id,
    'subscription_ends_at', v_new_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
