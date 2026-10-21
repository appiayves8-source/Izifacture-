// Supabase Edge Function: check-subscription (Deno)
// Path: supabase/functions/check-subscription/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[check-subscription] Missing server configuration.");
      return new Response(
        JSON.stringify({ error: "Configuration serveur manquante." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Authenticate User via Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé: En-tête Authorization manquant." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Session invalide ou expirée." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // 3. Query Profile
    let { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_subscribed, subscription_ends_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.warn(`[check-subscription] Error fetching profile for ${userId}:`, profileError);
    }

    // Auto-provision profile if not found
    if (!profile) {
      const { data: newProfile } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          email: user.email,
          is_subscribed: false,
        })
        .select("id, is_subscribed, subscription_ends_at")
        .single();

      profile = newProfile;
    }

    // 4. Calculate Subscription Expiration State (Zero Trust)
    const now = new Date();
    const endsAt = profile?.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
    let isActive = Boolean(profile?.is_subscribed && endsAt && endsAt.getTime() > now.getTime());

    // Auto-expire profile if time has passed
    if (profile?.is_subscribed && endsAt && endsAt.getTime() <= now.getTime()) {
      console.log(`[check-subscription] Subscription expired for user ${userId}. Deactivating...`);
      isActive = false;
      await supabaseAdmin
        .from("profiles")
        .update({
          is_subscribed: false,
          updated_at: now.toISOString(),
        })
        .eq("id", userId);
    }

    // 5. Query active subscription details if active
    let plan = "pro_5000";
    if (isActive) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("plan")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub?.plan) {
        plan = sub.plan;
      }
    }

    return new Response(
      JSON.stringify({
        isActive,
        endsAt: endsAt ? endsAt.toISOString() : null,
        plan,
        checkedAt: now.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[check-subscription] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Erreur interne." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
