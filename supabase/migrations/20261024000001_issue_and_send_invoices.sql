-- ==============================================================================
-- Migration 005: Émission & Envoi Automatique Factures (WhatsApp & Token Paiement)
-- Date: 2026-10-24
-- ==============================================================================

-- 1. Ajout des colonnes d'émission, jeton unique de paiement et suivi d'envoi sur public.invoices
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS payment_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS send_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS send_error text,
  ADD COLUMN IF NOT EXISTS send_channel text DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS send_recipient text,
  ADD COLUMN IF NOT EXISTS send_provider_id text,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Index pour recherche instantanée par jeton sécurisé (page /pay/<token>)
CREATE INDEX IF NOT EXISTS idx_invoices_payment_token ON public.invoices(payment_token);
CREATE INDEX IF NOT EXISTS idx_invoices_send_status ON public.invoices(send_status);

-- 2. Création de la table de journalisation des envois (Audit Trail & Idempotence)
CREATE TABLE IF NOT EXISTS public.invoice_send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text REFERENCES public.invoices(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp',
  recipient text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  provider_id text,
  error_message text,
  idempotency_key text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_send_logs_invoice_id ON public.invoice_send_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_send_logs_idempotency ON public.invoice_send_logs(idempotency_key);

-- 3. Activation RLS
ALTER TABLE public.invoice_send_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour logs d'envoi
DROP POLICY IF EXISTS "Authenticated users can read send logs" ON public.invoice_send_logs;
CREATE POLICY "Authenticated users can read send logs"
  ON public.invoice_send_logs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role has full access to send logs" ON public.invoice_send_logs;
CREATE POLICY "Service role has full access to send logs"
  ON public.invoice_send_logs FOR ALL
  TO service_role
  USING (true);
