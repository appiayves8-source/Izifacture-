-- ==============================================================================
-- Migration 006: Système de rôles + Isolation des données par utilisateur (RLS)
-- Date: 2026-10-25
-- Objectif:
--   1. Ajouter un champ "role" ('admin' | 'user') sur profiles
--   2. Fonction sécurisée is_admin() pour vérifier le rôle admin
--   3. Ajouter user_id sur invoices, clients et quotes pour l'isolation multi-tenant
--   4. RLS policies: un utilisateur normal ne voit et ne modifie QUE ses propres données,
--      tandis qu'un administrateur a la visibilité complète pour superviser la plateforme
-- ==============================================================================

-- 1. Ajouter la colonne role sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('admin', 'user'));

-- Index pour recherche rapide par rôle
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Sécurité: Les utilisateurs ne peuvent pas modifier leur propre rôle
REVOKE UPDATE (role) ON public.profiles FROM authenticated;
REVOKE UPDATE (role) ON public.profiles FROM anon;

-- 2. Fonction utilitaire sécurisée is_admin() (STABLE SECURITY DEFINER)
--    Créée en premier pour pouvoir être utilisée immédiatement dans les politiques RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Ajouter user_id sur les tables métier
-- 3.1. Invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- 3.2. Clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- 3.3. Quotes (Devis)
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);

-- 4. Attribution des enregistrements existants sans user_id à l'administrateur principal (Cyrille)
UPDATE public.invoices
  SET user_id = '7a103ad7-7698-4410-afea-78f35e107c4b'
  WHERE user_id IS NULL;

UPDATE public.clients
  SET user_id = '7a103ad7-7698-4410-afea-78f35e107c4b'
  WHERE user_id IS NULL;

UPDATE public.quotes
  SET user_id = '7a103ad7-7698-4410-afea-78f35e107c4b'
  WHERE user_id IS NULL;

-- 5. POLICIES RLS : INVOICES
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can select their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users and admins can select invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users and admins can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users and admins can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Service role has full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin can view all invoices" ON public.invoices;

CREATE POLICY "Users and admins can select invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert their own invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users and admins can update invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users and admins can delete invoices"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Service role has full access to invoices"
  ON public.invoices FOR ALL
  TO service_role
  USING (true);

-- 6. POLICIES RLS : CLIENTS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Users can select their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users and admins can select clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users and admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users and admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Service role has full access to clients" ON public.clients;

CREATE POLICY "Users and admins can select clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert their own clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users and admins can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users and admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Service role has full access to clients"
  ON public.clients FOR ALL
  TO service_role
  USING (true);

-- 7. POLICIES RLS : QUOTES (DEVIS)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users and admins can select quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users and admins can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users and admins can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Service role has full access to quotes" ON public.quotes;

CREATE POLICY "Users and admins can select quotes"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert their own quotes"
  ON public.quotes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users and admins can update quotes"
  ON public.quotes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users and admins can delete quotes"
  ON public.quotes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Service role has full access to quotes"
  ON public.quotes FOR ALL
  TO service_role
  USING (true);

-- 8. POLICIES RLS : INVOICE_ITEMS & QUOTE_ITEMS
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can manage items of their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users and admins can manage invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Service role has full access to invoice_items" ON public.invoice_items;

CREATE POLICY "Users and admins can manage invoice items"
  ON public.invoice_items FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid() OR public.is_admin()
    )
  );

CREATE POLICY "Service role has full access to invoice_items"
  ON public.invoice_items FOR ALL
  TO service_role
  USING (true);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for quote_items" ON public.quote_items;
DROP POLICY IF EXISTS "Users and admins can manage quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Service role has full access to quote_items" ON public.quote_items;

CREATE POLICY "Users and admins can manage quote items"
  ON public.quote_items FOR ALL
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM public.quotes WHERE user_id = auth.uid() OR public.is_admin()
    )
  );

CREATE POLICY "Service role has full access to quote_items"
  ON public.quote_items FOR ALL
  TO service_role
  USING (true);

-- 9. Trigger d'inscription: role = 'user' par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_subscribed, subscription_ends_at, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    true,
    now() + interval '30 days',
    'user',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET is_subscribed = true,
      subscription_ends_at = now() + interval '30 days',
      email = EXCLUDED.email,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
