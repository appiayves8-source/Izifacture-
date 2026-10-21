// Supabase Edge Function: cinetpay-webhook (Deno)
// Path: supabase/functions/cinetpay-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  const startTime = Date.now();

  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Helper response to guarantee HTTP 200 within 1s
  const return200 = (message: string, details?: Record<string, unknown>) => {
    const elapsed = Date.now() - startTime;
    console.log(`[cinetpay-webhook] Replying 200 OK (${elapsed}ms): ${message}`, details || {});
    return new Response(
      JSON.stringify({ status: "received", message, elapsed_ms: elapsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  };

  try {
    if (req.method !== "POST") {
      return return200("Ignored non-POST method");
    }

    // 2. Parse Webhook Body (support both JSON and x-www-form-urlencoded)
    let payload: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json().catch(() => ({}));
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        formData.forEach((value, key) => {
          payload[key] = value.toString();
        });
      }
    } else {
      const rawText = await req.text().catch(() => "");
      try {
        payload = JSON.parse(rawText);
      } catch {
        // Fallback parse url search params
        const params = new URLSearchParams(rawText);
        params.forEach((v, k) => {
          payload[k] = v;
        });
      }
    }

    // Structured Log of the raw incoming notification
    console.log(`[cinetpay-webhook][${new Date().toISOString()}] IPN Notification Received:`, {
      payload,
      contentType,
      userAgent: req.headers.get("user-agent"),
    });

    // 3. Extract transaction identifier
    // CinetPay can send either transaction_id, cpm_trans_id_client, or cpm_custom
    const rawTransactionId =
      payload.transaction_id ||
      payload.cpm_trans_id_client ||
      payload.cpm_custom ||
      payload.token;

    const cpmTransId =
      payload.cpm_trans_id ||
      payload.cinetpay_transaction_id ||
      payload.operator_id;

    if (!rawTransactionId || typeof rawTransactionId !== "string") {
      console.warn("[cinetpay-webhook] Missing transaction_id in webhook payload:", payload);
      return return200("Missing transaction_id in payload");
    }

    const transactionId = rawTransactionId.trim();

    // 4. Validate Secrets
    const CINETPAY_APIKEY = Deno.env.get("CINETPAY_APIKEY");
    const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!CINETPAY_APIKEY || !CINETPAY_SITE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[cinetpay-webhook] Critical: Missing server configuration/secrets.");
      return return200("Server secrets not configured");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // =========================================================================
    // ÉTAPE 1: RÈGLE D'OR CINETPAY — APPELER /v2/payment/check POUR AVOIR LA VÉRITÉ
    // =========================================================================
    console.log(`[cinetpay-webhook] Verifying transaction ${transactionId} via CinetPay /v2/payment/check...`);

    const checkResponse = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: CINETPAY_APIKEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: transactionId,
      }),
    });

    const checkResult = await checkResponse.json().catch(() => null);
    console.log(`[cinetpay-webhook] Check response for ${transactionId}:`, checkResult);

    if (!checkResult) {
      console.error(`[cinetpay-webhook] Check API returned unreadable response for ${transactionId}`);
      return return200("Check API response null");
    }

    // =========================================================================
    // ÉTAPE 2: VÉRIFIER STATUT, MONTANT STRICT ET DEVISE
    // =========================================================================
    const checkCode = String(checkResult.code);
    const checkData = checkResult.data || {};
    const paymentStatus = String(checkData.status || "").toUpperCase();
    const verifiedAmount = Number(checkData.amount);
    const verifiedCurrency = String(checkData.currency || "").toUpperCase();
    const verifiedOperatorId = String(checkData.operator_id || cpmTransId || "N/A");

    if (checkCode !== "00" || paymentStatus !== "ACCEPTED") {
      console.warn(`[cinetpay-webhook] Payment ${transactionId} not accepted: code=${checkCode}, status=${paymentStatus}`);

      // If status is explicit failure, update status in DB
      if (paymentStatus === "REFUSED" || paymentStatus === "FAILED") {
        if (transactionId.startsWith("ABO-")) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "failed", raw_payload: checkData, updated_at: new Date().toISOString() })
            .eq("transaction_id", transactionId);
        } else if (transactionId.startsWith("IZI-")) {
          await supabaseAdmin
            .from("invoice_payments")
            .update({ status: "failed", cinetpay_response: checkData, updated_at: new Date().toISOString() })
            .eq("transaction_id", transactionId);
        }
      }

      return return200(`Payment check not accepted (${paymentStatus})`);
    }

    // =========================================================================
    // ÉTAPE 3: TRAITEMENT ABONNEMENT SAAS (ABO-...)
    // =========================================================================
    if (transactionId.startsWith("ABO-")) {
      // Vérification stricte du montant et de la devise
      if (verifiedAmount !== 5000 || verifiedCurrency !== "XOF") {
        console.error(
          `[cinetpay-webhook] FRAUD ALERT: Amount mismatch on subscription ${transactionId}! Expected: 5000 XOF, received: ${verifiedAmount} ${verifiedCurrency}`
        );
        return return200("Amount or currency mismatch");
      }

      // Check idempotency first: if already active, do not execute side-effects again
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("status, user_id")
        .eq("transaction_id", transactionId)
        .maybeSingle();

      if (existingSub && existingSub.status === "active") {
        console.log(`[cinetpay-webhook] Idempotency: subscription ${transactionId} already active.`);
        return return200("Subscription already active");
      }

      // Execute atomic transaction via Postgres RPC
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("activate_subscription_tx", {
        p_transaction_id: transactionId,
        p_cinetpay_trans_id: verifiedOperatorId,
        p_payload: checkData,
      });

      if (rpcError) {
        console.warn(`[cinetpay-webhook] RPC activate_subscription_tx failed, falling back to direct updates:`, rpcError);

        // Fallback direct updates if RPC is not installed
        const now = new Date();
        const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { error: subUpdateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            cinetpay_transaction_id: verifiedOperatorId,
            current_period_start: now.toISOString(),
            current_period_end: endsAt,
            raw_payload: checkData,
            updated_at: now.toISOString(),
          })
          .eq("transaction_id", transactionId);

        if (subUpdateError) {
          console.error("[cinetpay-webhook] Fallback subscription update failed:", subUpdateError);
        }

        if (existingSub?.user_id) {
          await supabaseAdmin
            .from("profiles")
            .update({
              is_subscribed: true,
              subscription_ends_at: endsAt,
              updated_at: now.toISOString(),
            })
            .eq("id", existingSub.user_id);
        }
      } else {
        console.log(`[cinetpay-webhook] Subscription successfully activated via RPC:`, rpcResult);
      }

      return return200("Subscription successfully activated");
    }

    // =========================================================================
    // ÉTAPE 4: TRAITEMENT PAIEMENT DE FACTURE CLIENT (IZI-...)
    // =========================================================================
    if (transactionId.startsWith("IZI-")) {
      console.log(`[cinetpay-webhook] Processing invoice payment ${transactionId}...`);

      const { data: invRpcResult, error: invRpcError } = await supabaseAdmin.rpc("complete_invoice_payment_tx", {
        p_transaction_id: transactionId,
        p_cinetpay_trans_id: verifiedOperatorId,
        p_payload: checkData,
      });

      if (invRpcError) {
        console.warn(`[cinetpay-webhook] RPC complete_invoice_payment_tx failed, falling back to table update:`, invRpcError);

        await supabaseAdmin
          .from("invoice_payments")
          .update({
            status: "paid",
            cinetpay_transaction_id: verifiedOperatorId,
            cinetpay_response: checkData,
            updated_at: new Date().toISOString(),
          })
          .eq("transaction_id", transactionId);
      } else {
        console.log(`[cinetpay-webhook] Invoice payment processed:`, invRpcResult);
      }

      return return200("Invoice payment recorded");
    }

    // Unrecognized prefix
    console.warn(`[cinetpay-webhook] Unrecognized transaction prefix for ${transactionId}`);
    return return200("Unrecognized transaction prefix");

  } catch (err: unknown) {
    console.error("[cinetpay-webhook] Critical unhandled error in webhook:", err);
    // Golden Rule: Always respond 200 OK so CinetPay does not flood retries
    return return200("Webhook caught error and logged");
  }
});
