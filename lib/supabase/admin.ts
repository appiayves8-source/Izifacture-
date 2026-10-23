import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://cdtqzdfxhustrnndinxs.supabase.co';

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

/**
 * Client Supabase avec privilèges d'administration (Service Role).
 * À utiliser UNIQUEMENT côté serveur (Routes API, Webhooks).
 * Permet de bypasser les politiques RLS pour l'enregistrement sécurisé des paiements et abonnements.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
