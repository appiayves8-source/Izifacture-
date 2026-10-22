-- Migration : CinetPay V2 Payments & Invoices updates
-- Date: 2026-10-22

-- 1. Ajout des colonnes CinetPay sur la table invoices si manquantes
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS cinetpay_transaction_id text,
  ADD COLUMN IF NOT EXISTS cinetpay_token text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_reference text;

-- 2. Création de la table payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id text REFERENCES public.invoices(id) ON DELETE SET NULL,
  transaction_id text UNIQUE NOT NULL,
  cpm_trans_id text,
  amount integer NOT NULL,
  currency text DEFAULT 'XOF',
  payment_method text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused', 'failed')),
  customer_phone text,
  raw_notify jsonb,
  raw_check jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour recherche rapide par transaction_id et invoice_id
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- Activation de RLS sur payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Public read payments" ON public.payments;
CREATE POLICY "Public read payments" ON public.payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert payments" ON public.payments;
CREATE POLICY "Public insert payments" ON public.payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update payments" ON public.payments;
CREATE POLICY "Public update payments" ON public.payments FOR UPDATE USING (true);
