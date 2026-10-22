/**
 * Module Centralisé CinetPay V2 — IziFacture Production-Ready
 *
 * Conforme aux spécifications FinTech OHADA / UEMOA (Côte d'Ivoire).
 * Supporte : Wave, Orange Money, MTN MoMo, Moov Money et Cartes Bancaires (Visa / Mastercard).
 *
 * Utilise strictement les variables d'environnement :
 * - CINETPAY_API_KEY
 * - CINETPAY_SITE_ID
 * - CINETPAY_API_PASSWORD
 * - CINETPAY_SECRET_KEY
 * - NEXT_PUBLIC_APP_URL
 */

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

// ─── 1. Configuration & Détection Mode Test ──────────────────────────────────

/**
 * Détecte si l'environnement est en mode test/sandbox
 */
export function isTestMode(): boolean {
  const apiKey = process.env.CINETPAY_API_KEY || '';
  return apiKey.toLowerCase().includes('test');
}

/**
 * Récupère la configuration CinetPay centralisée
 */
export function getCinetPayConfig(): CinetPayConfig {
  const apiKey = process.env.CINETPAY_API_KEY || '';
  const siteId = process.env.CINETPAY_SITE_ID || '';
  const apiPassword = process.env.CINETPAY_API_PASSWORD || '';
  const secretKey = process.env.CINETPAY_SECRET_KEY || '';
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://izifacture-fawn.vercel.app'
  ).replace(/\/$/, '');

  return {
    apiKey,
    siteId,
    apiPassword,
    secretKey,
    appUrl,
    isTest: isTestMode(),
  };
}

/**
 * Génère un identifiant de transaction unique, traçable et < 20 caractères
 * Format : IZI-${shortId}-${Date.now()}
 */
export function generateTransactionId(invoiceId: string): string {
  // 4 caractères d'identification de facture (alphanumériques)
  const cleanId = (invoiceId || 'INV')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-4)
    .toUpperCase()
    .padStart(4, '0');

  // Timestamp UNIX en secondes (10 chiffres)
  const nowSeconds = Math.floor(Date.now() / 1000).toString();

  // Format : IZI (3) + '-' (1) + cleanId (4) + '-' (1) + nowSeconds (10) = 19 caractères
  const txId = `IZI-${cleanId}-${nowSeconds}`;
  return txId.slice(0, 20);
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

// ─── Cache OAuth pour support multi-environnements CinetPay ─────────────────
interface CachedToken {
  token: string;
  expiresAt: number;
}
let cachedAuthToken: CachedToken | null = null;

async function getCinetPayBearerToken(config: CinetPayConfig): Promise<string | null> {
  if (!config.apiPassword || !config.apiKey) return null;
  const now = Date.now();
  if (cachedAuthToken && cachedAuthToken.expiresAt > now + 60000) {
    return cachedAuthToken.token;
  }

  try {
    const baseUrl = process.env.CINETPAY_BASE_URL || 'https://api.cinetpay.net';
    const res = await fetchWithTimeout(
      `${baseUrl}/v1/oauth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: config.apiKey,
          api_password: config.apiPassword,
        }),
        cache: 'no-store',
      },
      8000
    );

    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      cachedAuthToken = {
        token: data.access_token,
        expiresAt: now + (data.expires_in || 86400) * 1000,
      };
      return cachedAuthToken.token;
    }
  } catch (err) {
    console.warn('[CINETPAY_AUTH] Fallback OAuth non disponible:', err);
  }
  return null;
}

// ─── 3. Initialisation de Paiement (V1/V2 & NextGen) ─────────────────────────

/**
 * Initialise un paiement CinetPay sécurisé pour une facture
 */
export async function initCinetPayPayment(
  params: CinetPayInitParams
): Promise<CinetPayInitResult> {
  const config = getCinetPayConfig();

  if (!config.apiKey) {
    console.error('[CINETPAY_INIT] Configuration manquante : CINETPAY_API_KEY requis');
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: 'Paiement temporairement indisponible, réessayez (clé API manquante)',
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

  console.log(`[CINETPAY_INIT] Création paiement transaction_id=${params.transaction_id} montant=${intAmount} XOF`);

  // Tentative 1 : Endpoint CinetPay v1 / v2 Signature & Checkout API
  if (config.siteId) {
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
        v2Payload.test_mode = 1;
      }

      // Appel à l'API CinetPay v2
      const endpoint = 'https://api-checkout.cinetpay.com/v2/payment';
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(v2Payload),
          cache: 'no-store',
        },
        10000
      );

      const json = await res.json().catch(() => null);
      console.log(`[CINETPAY_INIT] Réponse API V2 (HTTP ${res.status}):`, json);

      if (json && (json.code === '201' || json.code === 201) && json.data?.payment_url) {
        return {
          success: true,
          transaction_id: params.transaction_id,
          payment_url: json.data.payment_url,
          payment_token: json.data.payment_token,
          code: json.code,
          message: json.message || 'Paiement initié',
          raw: json,
        };
      }
    } catch (err) {
      console.warn('[CINETPAY_INIT] Échec API V2 standard, essai du fallback:', err);
    }
  }

  // Tentative 2 : Endpoint CinetPay API NextGen / Sandbox (avec apikey + password)
  try {
    const token = await getCinetPayBearerToken(config);
    if (token) {
      const baseUrl = process.env.CINETPAY_BASE_URL || 'https://api.cinetpay.net';
      const payloadNextGen = {
        amount: intAmount,
        currency: 'XOF',
        merchant_transaction_id: params.transaction_id,
        designation: params.description || `Facture ${params.invoice_number || params.transaction_id}`,
        success_url: returnUrl,
        failed_url: returnUrl,
        notify_url: notifyUrl,
        channels: 'ALL',
        metadata: JSON.stringify(params.metadata || {}),
      };

      const res = await fetchWithTimeout(
        `${baseUrl}/v1/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payloadNextGen),
          cache: 'no-store',
        },
        10000
      );

      const json = await res.json().catch(() => null);
      console.log(`[CINETPAY_INIT] Réponse API NextGen (HTTP ${res.status}):`, json);

      if (json && (json.code === 200 || json.code === '200') && json.payment_url) {
        return {
          success: true,
          transaction_id: params.transaction_id,
          payment_url: json.payment_url,
          payment_token: json.payment_token,
          code: json.code,
          message: json.details?.message || json.status || 'Paiement initié',
          raw: json,
        };
      }
    }
  } catch (err) {
    console.error('[CINETPAY_INIT] Erreur fallback NextGen:', err);
  }

  return {
    success: false,
    transaction_id: params.transaction_id,
    message: 'Paiement temporairement indisponible, réessayez',
  };
}

// ─── 4. Vérification Sécurisée du Statut (checkPayStatus) ─────────────────────

/**
 * Vérifie le statut réel d'une transaction directement auprès de CinetPay
 * Ne fait jamais confiance au seul corps d'une requête webhook sans contre-vérification.
 */
export async function checkCinetPayTransaction(
  transaction_id: string
): Promise<CinetPayCheckResult> {
  const config = getCinetPayConfig();
  console.log(`[CINETPAY_CHECK] Vérification statut pour transaction_id=${transaction_id}`);

  // 1. Essai via API CinetPay checkPayStatus standard (avec apikey & site_id)
  if (config.apiKey && config.siteId) {
    try {
      const checkPayload = {
        apikey: config.apiKey,
        site_id: config.siteId,
        transaction_id,
      };

      const res = await fetchWithTimeout(
        'https://api-checkout.cinetpay.com/v2/payment/check',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkPayload),
          cache: 'no-store',
        },
        10000
      );

      const json = await res.json().catch(() => null);
      console.log(`[CINETPAY_CHECK] Réponse check API V2 (HTTP ${res.status}):`, json);

      if (json && (json.code === '00' || json.code === 0)) {
        const data = json.data || {};
        const rawStatus = String(data.status || '').toUpperCase();
        let status: CinetPayCheckResult['status'] = 'PENDING';

        if (rawStatus === 'ACCEPTED' || rawStatus === 'SUCCES' || rawStatus === 'SUCCESS') {
          status = 'ACCEPTED';
        } else if (rawStatus === 'REFUSED' || rawStatus === 'FAILED' || rawStatus === 'CANCELLED') {
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
    } catch (err) {
      console.warn('[CINETPAY_CHECK] Échec API V2 checkPayStatus, essai du fallback:', err);
    }
  }

  // 2. Essai via API NextGen Bearer Token
  try {
    const token = await getCinetPayBearerToken(config);
    if (token) {
      const baseUrl = process.env.CINETPAY_BASE_URL || 'https://api.cinetpay.net';
      const res = await fetchWithTimeout(
        `${baseUrl}/v1/payment/${transaction_id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        },
        10000
      );

      const json = await res.json().catch(() => null);
      console.log(`[CINETPAY_CHECK] Réponse check NextGen (HTTP ${res.status}):`, json);

      if (json) {
        const rawStatus = String(json.status || json.details?.status || '').toUpperCase();
        let status: CinetPayCheckResult['status'] = 'PENDING';

        if (['ACCEPTED', 'SUCCES', 'SUCCESS', 'PAID'].includes(rawStatus)) {
          status = 'ACCEPTED';
        } else if (['REFUSED', 'FAILED', 'REJECTED', 'CANCELLED'].includes(rawStatus)) {
          status = 'REFUSED';
        }

        return {
          success: res.ok,
          transaction_id,
          status,
          amount: Number(json.amount) || undefined,
          currency: json.currency || 'XOF',
          payment_method: json.payment_method || json.channel,
          operator_id: json.operator_id || json.cpm_payid,
          payment_date: json.payment_date || json.updated_at,
          code: json.code,
          message: json.details?.message || json.message || rawStatus,
          raw: json,
        };
      }
    }
  } catch (err) {
    console.error('[CINETPAY_CHECK] Erreur fallback check NextGen:', err);
  }

  return {
    success: false,
    transaction_id,
    status: 'UNKNOWN',
    message: 'Impossible de vérifier le statut auprès de CinetPay',
  };
}

// ─── Aliases rétrocompatibles pour code existant ────────────────────────────
export const createPayment = initCinetPayPayment;
export const checkPayment = checkCinetPayTransaction;
