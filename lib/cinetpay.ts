/**
 * Module Centralisé CinetPay V2 — IziFacture
 *
 * IS_TEST_MODE = true  → Mode sandbox CinetPay actif (paiements simulés)
 * IS_TEST_MODE = false → Mode LIVE (paiements réels)
 *
 * Variables d'env utilisées (Vercel) :
 *   CINETPAY_API_KEY, CINETPAY_SITE_ID,
 *   CINETPAY_API_PASSWORD, CINETPAY_SECRET_KEY,
 *   NEXT_PUBLIC_APP_URL
 */

// ─── 🔴 INTERRUPTEUR TEST / LIVE — mettre false quand CinetPay valide le compte LIVE
const IS_TEST_MODE = true;

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface CinetPayConfig {
  apiKey: string;
  siteId: string;
  apiPassword?: string;
  secretKey?: string;
  appUrl: string;
  isTest: boolean;
}

export interface CinetPayInitParams {
  transaction_id: string;
  amount: number;
  description: string;
  invoice_number?: string;
  customer_name?: string;
  customer_surname?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_country?: string;
  customer_state?: string;
  customer_zip_code?: string;
  notify_url?: string;
  return_url?: string;
  metadata?: Record<string, unknown>;
}

export interface CinetPayInitResult {
  success: boolean;
  payment_url?: string;
  transaction_id: string;
  payment_token?: string;
  code?: string | number;
  message?: string;
  raw?: unknown;
}

export interface CinetPayCheckResult {
  success: boolean;
  transaction_id: string;
  status: 'ACCEPTED' | 'REFUSED' | 'PENDING' | 'FAILED' | 'UNKNOWN';
  amount?: number;
  currency?: string;
  payment_method?: string;
  operator_id?: string;
  payment_date?: string;
  code?: string | number;
  message?: string;
  raw?: unknown;
}

// ─── 1. Configuration & Mode TEST/LIVE ───────────────────────────────────────

/**
 * Retourne true si IS_TEST_MODE est activé (interrupteur manuel en haut du fichier)
 */
export function isTestMode(): boolean {
  return IS_TEST_MODE;
}

/**
 * Récupère la configuration CinetPay centralisée.
 * En mode TEST : utilise CINETPAY_TEST_API_KEY / CINETPAY_TEST_SITE_ID si définis,
 * sinon retombe sur CINETPAY_API_KEY / CINETPAY_SITE_ID (avec metadata test injectée).
 */
export function getCinetPayConfig(): CinetPayConfig {
  // Log du mode actif — visible dans les logs Vercel à chaque appel
  console.log('[MODE]', IS_TEST_MODE ? 'TEST 🧪' : 'LIVE 🟢');

  // En mode TEST : préférer les clés TEST dédiées si présentes dans Vercel
  const apiKey = IS_TEST_MODE
    ? (process.env.CINETPAY_TEST_API_KEY || process.env.CINETPAY_API_KEY || '')
    : (process.env.CINETPAY_API_KEY || '');

  const siteId = IS_TEST_MODE
    ? (process.env.CINETPAY_TEST_SITE_ID || process.env.CINETPAY_SITE_ID || '')
    : (process.env.CINETPAY_SITE_ID || '');

  const apiPassword = process.env.CINETPAY_API_PASSWORD || '';
  const secretKey   = process.env.CINETPAY_SECRET_KEY   || '';
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://izifacture-fawn.vercel.app'
  ).replace(/\/$/, '');

  console.log('[CINETPAY_CONFIG]', {
    mode:    IS_TEST_MODE ? 'TEST' : 'LIVE',
    site_id: siteId,
    has_key: !!apiKey,
  });

  return {
    apiKey,
    siteId,
    apiPassword,
    secretKey,
    appUrl,
    isTest: IS_TEST_MODE,
  };
}

/**
 * Génère un identifiant de transaction UNIQUE — format : IZI-${Date.now()}-${random}
 * Garantit l'unicité grâce au timestamp en ms + entropy aléatoire.
 */
export function generateTransactionId(_invoiceId?: string): string {
  const ts = Date.now().toString(36).toUpperCase();     // base36, court
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase(); // 4 chars aléatoires
  return `IZI-${ts}-${rand}`.slice(0, 20); // ≤ 20 chars max CinetPay
}

// ─── 2. Client HTTP avec Timeout 10s ────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err: unknown) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── URLs officielles CinetPay (jamais via variable d'env) ─────────────────
const CINETPAY_CHECKOUT_URL = 'https://api-checkout.cinetpay.com/v2/payment';
const CINETPAY_CHECK_URL    = 'https://api-checkout.cinetpay.com/v2/payment/check';

// ─── 3. Initialisation de Paiement (CinetPay V2 Checkout) ─────────────────────

/**
 * Initialise un paiement CinetPay sécurisé pour une facture.
 * Utilise l'URL officielle en dur : CINETPAY_CHECKOUT_URL.
 */
export async function initCinetPayPayment(
  params: CinetPayInitParams
): Promise<CinetPayInitResult> {
  const config = getCinetPayConfig();

  // Validation des variables d'environnement obligatoires
  if (!config.apiKey || !config.siteId) {
    const missing = [!config.apiKey && 'CINETPAY_API_KEY', !config.siteId && 'CINETPAY_SITE_ID']
      .filter(Boolean)
      .join(', ');
    console.error(`[CINETPAY_INIT] ❌ Variables manquantes : ${missing}`);
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: `Configuration CinetPay incomplète : ${missing} manquant(s)`,
    };
  }

  const intAmount = Math.round(Number(params.amount));
  if (intAmount < 100) {
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: 'Le montant minimum de paiement CinetPay est de 100 FCFA',
    };
  }

  const notifyUrl = params.notify_url || `${config.appUrl}/api/cinetpay/notify`;
  const returnUrl =
    params.return_url ||
    `${config.appUrl}/payment/return?transaction_id=${params.transaction_id}`;

  console.log(
    `[CINETPAY_INIT] Appel ${CINETPAY_CHECKOUT_URL} | tx=${params.transaction_id} | amount=${intAmount} XOF | site_id=${config.siteId}`
  );

  try {
    const v2Payload: Record<string, unknown> = {
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id: params.transaction_id,
      amount: intAmount,
      currency: 'XOF',
      description: params.description || `Facture ${params.invoice_number || params.transaction_id}`,
      customer_name: params.customer_name || 'Client',
      customer_surname: params.customer_surname || 'IziFacture',
      customer_email: params.customer_email || 'client@izifacture.com',
      customer_phone_number: params.customer_phone || '0700000000',
      customer_address: params.customer_address || 'Abidjan',
      customer_city: params.customer_city || 'Abidjan',
      customer_country: params.customer_country || 'CI',
      customer_state: params.customer_state || 'CI',
      customer_zip_code: params.customer_zip_code || '00225',
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: 'ALL',
      lang: 'fr',
      invoice_data: params.metadata || { invoice_number: params.invoice_number },
    };

    if (config.isTest) {
      v2Payload.metadata = 'test';
    }

    const res = await fetchWithTimeout(
      CINETPAY_CHECKOUT_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v2Payload),
        cache: 'no-store',
      },
      10000
    );

    const data = await res.json().catch(() => null);

    // ⚠️ Log brut OBLIGATOIRE — révèle la vraie réponse CinetPay dans Vercel
    console.log('[CINETPAY_RAW]', JSON.stringify(data));

    if (!data) {
      return {
        success: false,
        transaction_id: params.transaction_id,
        message: `CinetPay: réponse HTTP ${res.status} non-JSON (vérifiez les credentials)`,
      };
    }

    // Succès : code 201 = paiement initié avec URL de redirection
    if ((data.code === '201' || data.code === 201) && data.data?.payment_url) {
      console.log(`[CINETPAY_INIT] ✅ Lien de paiement généré : ${data.data.payment_url}`);
      return {
        success: true,
        transaction_id: params.transaction_id,
        payment_url: data.data.payment_url,
        payment_token: data.data.payment_token,
        code: data.code,
        message: data.message || 'Paiement initié avec succès',
        raw: data,
      };
    }

    // Échec CinetPay : retourner le VRAI message, jamais le message générique
    const realMessage =
      data.message ||
      data.description ||
      data.data?.message ||
      `Erreur CinetPay code=${data.code} — vérifiez CINETPAY_API_KEY et CINETPAY_SITE_ID sur Vercel`;

    console.error(
      `[CINETPAY_INIT] ❌ Rejet CinetPay : code=${data.code} | "${realMessage}"`
    );

    return {
      success: false,
      transaction_id: params.transaction_id,
      code: data.code,
      message: realMessage,
      raw: data,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[CINETPAY_INIT] ❌ Erreur réseau/timeout vers CinetPay : ${errMsg}`);
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: `Erreur réseau CinetPay : ${errMsg}`,
    };
  }
}

// ─── 4. Vérification Sécurisée du Statut (checkPayStatus) ─────────────────────

/**
 * Vérifie le statut réel d'une transaction directement auprès de CinetPay.
 * Ne fait jamais confiance au seul corps d'une requête webhook sans contre-vérification.
 */
export async function checkCinetPayTransaction(
  transaction_id: string
): Promise<CinetPayCheckResult> {
  const config = getCinetPayConfig();
  console.log(`[CINETPAY_CHECK] Vérification statut transaction_id=${transaction_id}`);

  if (!config.apiKey || !config.siteId) {
    return {
      success: false,
      transaction_id,
      status: 'UNKNOWN',
      message: 'Configuration CinetPay incomplète (CINETPAY_API_KEY ou CINETPAY_SITE_ID manquant)',
    };
  }

  try {
    const checkPayload = {
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id,
    };

    const res = await fetchWithTimeout(
      CINETPAY_CHECK_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkPayload),
        cache: 'no-store',
      },
      10000
    );

    const json = await res.json().catch(() => null);
    console.log('[CINETPAY_RAW_CHECK]', JSON.stringify(json));

    if (json && (json.code === '00' || json.code === 0)) {
      const data = json.data || {};
      const rawStatus = String(data.status || '').toUpperCase();
      let status: CinetPayCheckResult['status'] = 'PENDING';

      if (['ACCEPTED', 'SUCCES', 'SUCCESS', 'PAID'].includes(rawStatus)) {
        status = 'ACCEPTED';
      } else if (['REFUSED', 'FAILED', 'REJECTED', 'CANCELLED'].includes(rawStatus)) {
        status = 'REFUSED';
      }

      return {
        success: true,
        transaction_id,
        status,
        amount: Number(data.amount) || undefined,
        currency: data.currency || 'XOF',
        payment_method: data.payment_method,
        operator_id: data.operator_id,
        payment_date: data.payment_date,
        code: json.code,
        message: json.message || rawStatus,
        raw: json,
      };
    }

    // Retourner le vrai message CinetPay
    const realMessage =
      json?.message || json?.description || `CinetPay check code=${json?.code}`;
    console.error(`[CINETPAY_CHECK] ❌ Échec : ${realMessage}`);

    return {
      success: false,
      transaction_id,
      status: 'UNKNOWN',
      message: realMessage,
      code: json?.code,
      raw: json,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[CINETPAY_CHECK] ❌ Erreur réseau : ${errMsg}`);
    return {
      success: false,
      transaction_id,
      status: 'UNKNOWN',
      message: `Erreur réseau CinetPay : ${errMsg}`,
    };
  }
}

// ─── Aliases rétrocompatibles pour code existant ────────────────────────────
export const createPayment = initCinetPayPayment;
export const checkPayment = checkCinetPayTransaction;
