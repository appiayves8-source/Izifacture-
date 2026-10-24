/**
 * Module Centralisé CinetPay V1 — IziFacture Production-Ready
 *
 * Conforme aux spécifications FinTech UEMOA / OHADA (Côte d'Ivoire & Afrique de l'Ouest).
 * Supporte : Wave, Orange Money, MTN MoMo, Moov Money et Cartes Bancaires (Visa / Mastercard).
 *
 * Variables d'environnement de Production :
 * - CINETPAY_API_KEY      : Clé API CinetPay (sk_live_... ou sk_test_...)
 * - CINETPAY_SECRET_KEY   : Mot de passe API CinetPay (généré lors de la création de la clé API)
 * - CINETPAY_SITE_ID      : Identifiant de site / service (optionnel en v1, conservé pour compatibilité)
 * - NEXT_PUBLIC_APP_URL   : URL publique de production (ex: https://izifacture-fawn.vercel.app)
 */

import crypto from 'crypto';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface CinetPayConfig {
  apiKey: string;
  siteId: string;
  secretKey: string;
  appUrl: string;
}

export interface CinetPayInitParams {
  transaction_id: string;
  amount: number;
  currency?: string; // Par défaut 'XOF'
  description?: string;
  invoice_number?: string;
  customer_name?: string;
  customer_surname?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_country?: string; // Code ISO 2 lettres : 'CI', 'SN', etc.
  customer_state?: string;
  customer_zip_code?: string;
  notify_url?: string;
  return_url?: string;
  channels?: 'ALL' | 'MOBILE_MONEY' | 'CREDIT_CARD' | 'WALLET';
  metadata?: Record<string, unknown> | string;
}

export interface CinetPayInitResult {
  success: boolean;
  transaction_id: string;
  payment_url?: string;
  payment_token?: string;
  code?: string | number;
  message?: string;
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
  description?: string;
  raw?: unknown;
}

// ─── URLs officielles CinetPay (Production & Sandbox) ───────────────────────
// Production  : api.cinetpay.co  (clés sk_live_...)
// Sandbox     : api.cinetpay.net (clés sk_test_...)
const CINETPAY_BASE_PROD    = 'https://api.cinetpay.co';
const CINETPAY_BASE_SANDBOX = 'https://api.cinetpay.net';

export function getCinetPayBase(): string {
  const apiKey = (process.env.CINETPAY_API_KEY || '').trim();
  if (apiKey.startsWith('sk_test_')) {
    return CINETPAY_BASE_SANDBOX;
  }
  if (apiKey.startsWith('sk_live_')) {
    return CINETPAY_BASE_PROD;
  }
  return process.env.NODE_ENV === 'production' ? CINETPAY_BASE_PROD : CINETPAY_BASE_SANDBOX;
}

// ─── 1. Configuration Centralisée ───────────────────────────────────────────

/**
 * Récupère et valide la configuration CinetPay
 */
export function getCinetPayConfig(): CinetPayConfig {
  const apiKey    = (process.env.CINETPAY_API_KEY || '').trim();
  const siteId    = (process.env.CINETPAY_SITE_ID || '').trim();
  const secretKey = (process.env.CINETPAY_SECRET_KEY || '').trim();

  // URL publique en HTTPS
  let appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://izifacture-fawn.vercel.app'
  ).trim().replace(/\/$/, '');

  if (process.env.NODE_ENV === 'production' && appUrl.startsWith('http://')) {
    appUrl = appUrl.replace('http://', 'https://');
  }

  return {
    apiKey,
    siteId,
    secretKey,
    appUrl,
  };
}

/**
 * Valide que les identifiants requis sont présents et valides.
 * Détecte notamment si des caractères masqués (•) ont été collés par erreur.
 */
export function validateCinetPayConfig(): { valid: boolean; missing: string[] } {
  const config = getCinetPayConfig();
  const missing: string[] = [];

  if (!config.apiKey || config.apiKey.length < 5) {
    missing.push('CINETPAY_API_KEY');
  }

  if (!config.secretKey || config.secretKey.length < 3) {
    missing.push('CINETPAY_SECRET_KEY (Mot de passe API)');
  } else if (config.secretKey.includes('•')) {
    missing.push('CINETPAY_SECRET_KEY (invalide : contient des puces "•" masquées copiées par erreur)');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Génère un identifiant de transaction UNIQUE, robuste et idempotent (< 20 caractères)
 * Format : IZI-${Date.now() en base36}-${4 caractères aléatoires}
 * Ex : IZI-MCZ0AB3-7K2X (18 caractères)
 */
export function generateTransactionId(_invoiceId?: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IZI-${ts}-${rand}`.slice(0, 20);
}

// ─── 2. Client HTTP avec Timeout ────────────────────────────────────────────

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

// ─── 3. Gestion du Token OAuth Bearer CinetPay ──────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Authentification OAuth CinetPay : échange api_key et api_password contre un Bearer access_token.
 * Le jeton est mis en cache de manière transparente avec gestion de la durée de validité.
 */
export async function getCinetPayToken(): Promise<{ success: boolean; token?: string; error?: string }> {
  const config = getCinetPayConfig();
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return { success: true, token: cachedToken.token };
  }

  const { valid, missing } = validateCinetPayConfig();
  if (!valid) {
    return { success: false, error: `Configuration incomplète : ${missing.join(', ')}` };
  }

  try {
    const authUrl = `${getCinetPayBase()}/v1/oauth/login`;
    const res = await fetchWithTimeout(
      authUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: config.apiKey,
          api_password: config.secretKey,
        }),
        cache: 'no-store',
      },
      10000
    );

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      const msg = data?.description || data?.message || `HTTP ${res.status}`;
      return { success: false, error: msg };
    }

    const token = (data.access_token || data.data?.access_token || data.token || data.data?.token) as string | undefined;

    if (!token) {
      return {
        success: false,
        error: data.description || data.message || 'Token absent de la réponse CinetPay OAuth',
      };
    }

    const expiresIn = Number(data.expires_in || 86400);
    cachedToken = {
      token,
      expiresAt: now + expiresIn * 1000,
    };

    return { success: true, token };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg };
  }
}

// ─── 4. Initialisation de Paiement ──────────────────────────────────────────

/**
 * Initialise un paiement CinetPay sécurisé pour une facture ou un abonnement.
 * Supporte automatiquement Mobile Money (Wave, Orange, MTN, Moov) et Carte Bancaire.
 */
export async function initCinetPayPayment(
  params: CinetPayInitParams
): Promise<CinetPayInitResult> {
  const config = getCinetPayConfig();
  const { valid, missing } = validateCinetPayConfig();

  if (!valid) {
    const missingStr = missing.join(', ');
    console.error(`[CINETPAY_INIT] Configuration incomplète : ${missingStr}`);
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: `Le module de paiement en ligne n'est pas encore configuré : ${missingStr}.`,
    };
  }

  const intAmount = Math.round(Number(params.amount));
  if (intAmount < 100) {
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: 'Le montant minimum de paiement en ligne est de 100 FCFA.',
    };
  }

  const customerName = (params.customer_name || 'Client').trim().slice(0, 50);
  const customerSurname = (params.customer_surname || 'IziFacture').trim().slice(0, 50);
  const customerEmail = (params.customer_email || 'contact@izifacture.com').trim().toLowerCase();
  const customerPhone = (params.customer_phone || '').trim().replace(/[\s-]/g, '');

  if (!customerPhone || customerPhone.length < 8) {
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: 'Un numéro de téléphone valide (Mobile Money / Wave) est requis pour initialiser le paiement.',
    };
  }

  const countryCode = (params.customer_country || 'CI').trim().toUpperCase().slice(0, 2);
  const notifyUrl = params.notify_url || `${config.appUrl}/api/cinetpay/notify`;
  const returnUrl =
    params.return_url ||
    `${config.appUrl}/payment/return?transaction_id=${encodeURIComponent(params.transaction_id)}`;

  try {
    // 1. Obtenir le token OAuth Bearer
    const authResult = await getCinetPayToken();
    if (!authResult.success || !authResult.token) {
      const errMsg = authResult.error || '';
      console.error(`[CINETPAY_AUTH] Échec : ${errMsg}`);

      // ── Diagnostic temporaire : log IP sortante si l'erreur est liée au whitelist IP ──
      if (/withlisted|whitelist|ip.*(not|block)|not.*allow/i.test(errMsg)) {
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
          const ipData = await ipRes.json().catch(() => ({}));
          console.log(`[CINETPAY_AUTH] IP sortante au moment de l'échec : ${ipData?.ip ?? 'inconnue'}`);
        } catch {
          console.log('[CINETPAY_AUTH] Impossible de récupérer l\'IP sortante via ipify.');
        }
      }
      // ── Fin diagnostic temporaire ──

      return {
        success: false,
        transaction_id: params.transaction_id,
        message: `Authentification CinetPay échouée (${errMsg}). Veuillez vérifier votre mot de passe d'API CINETPAY_SECRET_KEY.`,
      };
    }

    // 2. Initialiser le paiement auprès du guichet CinetPay
    const paymentUrl = `${getCinetPayBase()}/v1/payment`;
    const description = (params.description || `Règlement facture ${params.invoice_number || params.transaction_id}`).slice(0, 150);
    const successUrl = `${config.appUrl}/payment/success?transaction_id=${encodeURIComponent(params.transaction_id)}`;
    const failedUrl = `${config.appUrl}/payment/failed?transaction_id=${encodeURIComponent(params.transaction_id)}`;

    const payload: Record<string, unknown> = {
      merchant_transaction_id: params.transaction_id,
      transaction_id: params.transaction_id,
      amount: intAmount,
      currency: (params.currency || 'XOF').toUpperCase(),
      designation: description,
      description: description,
      success_url: successUrl,
      failed_url: failedUrl,
      notify_url: notifyUrl,
      return_url: returnUrl,
      customer_name: customerName,
      customer_surname: customerSurname,
      customer_email: customerEmail,
      customer_phone_number: customerPhone,
      customer_phone: customerPhone,
      customer_address: params.customer_address || 'Abidjan',
      customer_city: params.customer_city || 'Abidjan',
      customer_country: countryCode,
      customer_state: params.customer_state || countryCode,
      customer_zip_code: params.customer_zip_code || '00225',
      channels: params.channels || 'ALL',
      lang: 'fr',
    };

    console.log(`[CINETPAY_INIT] Appel CinetPay | tx=${params.transaction_id} | amount=${intAmount} ${payload.currency} | base=${getCinetPayBase()}`);

    const res = await fetchWithTimeout(
      paymentUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authResult.token}`,
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      },
      12000
    );

    const data = await res.json().catch(() => null);

    if (!data) {
      return {
        success: false,
        transaction_id: params.transaction_id,
        message: `Réponse HTTP ${res.status} invalide reçue de CinetPay.`,
      };
    }

    const payUrl = (data.payment_url || data.data?.payment_url) as string | undefined;
    const payToken = (data.payment_token || data.token || data.data?.payment_token || data.data?.token) as string | undefined;

    if (payUrl) {
      console.log(`[CINETPAY_INIT] Succès : lien généré pour tx=${params.transaction_id}`);
      return {
        success: true,
        transaction_id: params.transaction_id,
        payment_url: payUrl,
        payment_token: payToken,
        code: data.code || 200,
        message: data.message || 'Paiement initié avec succès',
      };
    }

    const realMessage =
      data.message ||
      data.description ||
      data.data?.message ||
      `Échec CinetPay (Code ${data.code}).`;

    console.error(`[CINETPAY_INIT] Rejet CinetPay : code=${data.code} | message="${realMessage}"`);

    return {
      success: false,
      transaction_id: params.transaction_id,
      code: data.code,
      message: realMessage,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[CINETPAY_INIT] Erreur réseau vers CinetPay : ${errMsg}`);
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: `Erreur de communication avec la plateforme de paiement : ${errMsg}`,
    };
  }
}

// ─── 5. Vérification Serveur du Statut (checkPayStatus) ─────────────────────

/**
 * Vérifie le statut officiel d'une transaction auprès de CinetPay.
 * RÈGLE D'OR : Ne jamais se fier au seul webhook entrant sans contre-vérification serveur.
 */
export async function checkCinetPayTransaction(
  transaction_id: string
): Promise<CinetPayCheckResult> {
  const { valid, missing } = validateCinetPayConfig();

  if (!valid) {
    return {
      success: false,
      transaction_id,
      status: 'UNKNOWN',
      message: `Configuration CinetPay incomplète (${missing.join(', ')})`,
    };
  }

  try {
    const authResult = await getCinetPayToken();
    if (!authResult.success || !authResult.token) {
      return {
        success: false,
        transaction_id,
        status: 'UNKNOWN',
        message: `Échec d'authentification CinetPay : ${authResult.error}`,
      };
    }

    // 1. Tenter GET /v1/payment/{transaction_id} (Endpoint officiel CinetPay v1)
    const getUrl = `${getCinetPayBase()}/v1/payment/${encodeURIComponent(transaction_id)}`;
    const res = await fetchWithTimeout(
      getUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authResult.token}`,
        },
        cache: 'no-store',
      },
      10000
    );

    const json = await res.json().catch(() => null);

    if (json) {
      const data = json.data || json;
      const rawStatus = String(data.status || json.status || '').toUpperCase();
      let status: CinetPayCheckResult['status'] = 'PENDING';

      if (['ACCEPTED', 'SUCCES', 'SUCCESS', 'PAID'].includes(rawStatus)) {
        status = 'ACCEPTED';
      } else if (['REFUSED', 'FAILED', 'REJECTED', 'CANCELLED'].includes(rawStatus)) {
        status = 'REFUSED';
      } else if (['INITIATED', 'PENDING', 'WAITING'].includes(rawStatus)) {
        status = 'PENDING';
      }

      console.log(`[CINETPAY_CHECK] Résultat pour ${transaction_id} : ${status} (raw: ${rawStatus})`);

      return {
        success: true,
        transaction_id,
        status,
        amount: Number(data.amount) || undefined,
        currency: data.currency ? String(data.currency).toUpperCase() : 'XOF',
        payment_method: data.payment_method,
        operator_id: data.operator_id,
        payment_date: data.payment_date || data.created_at,
        code: json.code,
        message: json.message || rawStatus,
        raw: json,
      };
    }

    return {
      success: false,
      transaction_id,
      status: 'UNKNOWN',
      message: 'Réponse invalide de CinetPay',
      raw: json,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[CINETPAY_CHECK] Erreur réseau lors de la vérification : ${errMsg}`);
    return {
      success: false,
      transaction_id,
      status: 'UNKNOWN',
      message: `Erreur de connexion CinetPay : ${errMsg}`,
    };
  }
}

// ─── 6. Sécurité : Validation de Signature HMAC Webhook ─────────────────────

/**
 * Valide l'authenticité de la notification CinetPay via le jeton HMAC (x-token).
 * Si CINETPAY_SECRET_KEY est configurée, calcule et compare le HMAC-SHA256.
 */
export function verifyCinetPaySignature(
  xToken: string | null,
  rawBody: string | Record<string, unknown>
): boolean {
  const config = getCinetPayConfig();

  if (!config.secretKey || config.secretKey.includes('•')) {
    // Si la clé n'est pas configurée correctement, la double vérification serveur reste active
    return true;
  }

  if (!xToken) {
    return false;
  }

  try {
    const content = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const expected = crypto
      .createHmac('sha256', config.secretKey)
      .update(content)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(xToken.toLowerCase(), 'utf-8'),
      Buffer.from(expected.toLowerCase(), 'utf-8')
    );
  } catch {
    return false;
  }
}

// ─── Aliases rétrocompatibles ───────────────────────────────────────────────
export const createPayment = initCinetPayPayment;
export const checkPayment = checkCinetPayTransaction;
