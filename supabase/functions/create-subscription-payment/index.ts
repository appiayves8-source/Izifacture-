// Supabase Edge Function: create-subscription-payment (Deno + CinetPay Checkout V2)
// Path: supabase/functions/create-subscription-payment/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUBSCRIPTION_AMOUNT_XOF = 5000; // Strict integer - 5.000 FCFA/mois
const CURRENCY_CODE = "XOF";
const PLAN_ID = "pro_5000";

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Méthode non autorisée. Utilisez POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate Environment Variables (Zero hardcoding)
    const CINETPAY_APIKEY = Deno.env.get("CINETPAY_APIKEY");
    const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:3000";

    if (!CINETPAY_APIKEY || !CINETPAY_SITE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[create-subscription-payment] Missing server secrets in environment.");
      return new Response(
        JSON.stringify({ error: "Configuration serveur incomplète (secrets manquants)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Authenticate User via Authorization Bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "En-tête Authorization manquant." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("[create-subscription-payment] Auth failure:", authError);
      return new Response(
        JSON.stringify({ error: "Session invalide ou expirée." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`[create-subscription-payment] Initiating subscription for user: ${userId}`);

    // 4. Idempotency Check: pending transaction in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: existingPending, error: pendingError } = await supabaseAdmin
      .from("subscriptions")
      .select("transaction_id, payment_url, created_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("created_at", fifteenMinutesAgo)
      .not("payment_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      console.warn("[create-subscription-payment] Check pending error:", pendingError);
    }

    if (existingPending && existingPending.payment_url) {
      console.log(`[create-subscription-payment] Reusing existing pending payment session: ${existingPending.transaction_id}`);
      return new Response(
        JSON.stringify({
          payment_url: existingPending.payment_url,
          transaction_id: existingPending.transaction_id,
          reused: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Generate unique transaction ID (ABO-{user_id_short}-{unix_ms})
    const userIdShort = userId.slice(0, 8);
    const transactionId = `ABO-${userIdShort}-${Date.now()}`;

    // Format customer details safely
    const rawFullName = (user.user_metadata?.full_name || "Client IziFacture").trim();
    const nameParts = rawFullName.split(" ");
    const customerName = nameParts[0] || "Client";
    const customerSurname = nameParts.slice(1).join(" ") || "IziFacture";
    const customerEmail = user.email || "contact@izifacture.com";
    const customerPhone = user.user_metadata?.phone || "0700000000";

    const notifyUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/cinetpay-webhook`;
    const returnUrl = `${APP_URL.replace(/\/$/, "")}/dashboard?payment=success`;

    // 6. CinetPay Checkout V2 Payload
    // CRITICAL: Amount MUST be strict INT (never string, never float)
    const cinetpayPayload = {
      apikey: CINETPAY_APIKEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: SUBSCRIPTION_AMOUNT_XOF,
      currency: CURRENCY_CODE,
      description: "Abonnement IziFacture Pro - 5000 F/mois",
      customer_name: customerName,
      customer_surname: customerSurname,
      customer_email: customerEmail,
      customer_phone_number: customerPhone,
      customer_address: "Abidjan Plateau",
      customer_city: "Abidjan",
      customer_country: "CI",
      customer_state: "Lagunes",
      customer_zip_code: "00225",
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: "ALL",
      lang: "fr",
      metadata: userId,
    };

    console.log(`[create-subscription-payment] Calling CinetPay API for ${transactionId}...`);

    // 7. Call CinetPay V2 API
    const cinetpayResponse = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cinetpayPayload),
    });

    const cinetpayData = await cinetpayResponse.json();
    console.log("[create-subscription-payment] CinetPay response code:", cinetpayData.code);

    // CinetPay returns code "201" (string or number) on successful payment initialization
    const statusCode = String(cinetpayData.code);
    if (statusCode !== "201" || !cinetpayData.data?.payment_url) {
      console.error("[create-subscription-payment] CinetPay Init Failed:", cinetpayData);
      const errorMessage = cinetpayData.message || cinetpayData.description || "Échec d'initialisation CinetPay";
      return new Response(
        JSON.stringify({ error: `Erreur CinetPay (${statusCode}): ${errorMessage}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentUrl = cinetpayData.data.payment_url;

    // 8. Persist Pending Subscription in DB (Protected via service_role)
    const { error: insertError } = await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      transaction_id: transactionId,
      status: "pending",
      plan: PLAN_ID,
      amount: SUBSCRIPTION_AMOUNT_XOF,
      currency: CURRENCY_CODE,
      payment_url: paymentUrl,
      raw_payload: cinetpayData.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[create-subscription-payment] Failed to save subscription record:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur d'enregistrement de la souscription." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[create-subscription-payment] Subscription ${transactionId} pending with URL: ${paymentUrl}`);

    // 9. Return payment URL to frontend
    return new Response(
      JSON.stringify({
        payment_url: paymentUrl,
        transaction_id: transactionId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[create-subscription-payment] Unhandled exception:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Erreur interne du serveur." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
