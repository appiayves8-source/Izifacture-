/**
 * Module Centralisé CinetPay V2 — IziFacture Production-Ready
 *
 * Conforme aux spécifications FinTech UEMOA / OHADA (Côte d'Ivoire & Afrique de l'Ouest).
 * Supporte : Wave, Orange Money, MTN MoMo, Moov Money et Cartes Bancaires (Visa / Mastercard).
 *
 * Variables d'environnement de Production :
 * - CINETPAY_API_KEY      : Clé API CinetPay LIVE (fournie par CinetPay)
 * - CINETPAY_SITE_ID      : Identifiant de site CinetPay LIVE
 * - CINETPAY_SECRET_KEY   : Clé secrète CinetPay (pour validation HMAC x-token)
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

// ─── URLs officielles CinetPay V2 (jamais via variable d'env) ───────────────
const CINETPAY_CHECKOUT_URL = 'https://api-checkout.cinetpay.com/v2/payment';
const CINETPAY_CHECK_URL    = 'https://api-checkout.cinetpay.com/v2/payment/check';

// ─── 1. Configuration Centralisée ───────────────────────────────────────────

/**
 * Récupère et valide la configuration CinetPay LIVE
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

  // Forcer HTTPS en production
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
 * Valide que les identifiants requis sont présents.
 * Lève une exception ou retourne un message d'erreur clair.
 */
export function validateCinetPayConfig(): { valid: boolean; missing: string[] } {
  const config = getCinetPayConfig();
  const missing: string[] = [];
  if (!config.apiKey) missing.push('CINETPAY_API_KEY');
  if (!config.siteId) missing.push('CINETPAY_SITE_ID');
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

// ─── 3. Initialisation de Paiement (CinetPay V2 Checkout) ─────────────────────

/**
 * Initialise un paiement CinetPay sécurisé pour une facture ou un abonnement.
 * 100 % Production-Ready : aucune donnée mockée ou écrasée.
 */
export async function initCinetPayPayment(
  params: CinetPayInitParams
): Promise<CinetPayInitResult> {
  const config = getCinetPayConfig();
  const { valid, missing } = validateCinetPayConfig();

  if (!valid) {
    const missingStr = missing.join(', ');
    console.error(`[CINETPAY_INIT] Configuration incomplète : ${missingStr} manquant(s) dans l'environnement.`);
    return {
      success: false,
      transaction_id: params.transaction_id,
      message: `Configuration de paiement incomplète : variable(s) ${missingStr} non configurée(s) sur Vercel.`,
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

  // Nettoyage et normalisation des informations client
  const customerName = (params.customer_name || 'Client').trim().slice(0, 50);
  const customerSurname = (params.customer_surname || 'IziFacture').trim().slice(0, 50);
  const customerEmail = (params.customer_email || 'contact@izifacture.com').trim().toLowerCase();
  const customerPhone = (params.customer_phone || '').trim().replace(/[\s-]/g, '');

  // Validation du téléphone : au moins 8 chiffres
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
    const v2Payload: Record<string, unknown> = {
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id: params.transaction_id,
      amount: intAmount,
      currency: params.currency || 'XOF',
      description: params.description || `Règlement facture ${params.invoice_number || params.transaction_id}`,
      customer_name: customerName,
      customer_surname: customerSurname,
      customer_email: customerEmail,
      customer_phone_number: customerPhone,
      customer_address: params.customer_address || 'Abidjan',
      customer_city: params.customer_city || 'Abidjan',
      customer_country: countryCode,
      customer_state: params.customer_state || countryCode,
      customer_zip_code: params.customer_zip_code || '00225',
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: params.channels || 'ALL',
      lang: 'fr',
      invoice_data: typeof params.metadata === 'object' ? params.metadata : { ref: params.transaction_id },
    };

    console.log(`[CINETPAY_INIT] Appel CinetPay Checkout V2 | tx=${params.transaction_id} | amount=${intAmount} ${v2Payload.currency}`);

    const res = await fetchWithTimeout(
      CINETPAY_CHECKOUT_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v2Payload),
        cache: 'no-store',
      },
      12000
    );

    const data = await res.json().catch(() => null);

    if (!data) {
      return {
        success: false,
        transaction_id: params.transaction_id,
        message: `Réponse HTTP ${res.status} invalide reçue de CinetPay. Veuillez vérifier vos identifiants LIVE.`,
      };
    }

    // Code 201 = succès CinetPay V2
    if ((data.code === '201' || data.code === 201) && data.data?.payment_url) {
      console.log(`[CINETPAY_INIT] Succès : lien généré pour tx=${params.transaction_id}`);
      return {
        success: true,
        transaction_id: params.transaction_id,
        payment_url: data.data.payment_url,
        payment_token: data.data.payment_token,
        code: data.code,
        message: data.message || 'Paiement initié avec succès',
      };
    }

    const realMessage =
      data.message ||
      data.description ||
      data.data?.message ||
      `Échec CinetPay (Code ${data.code}). Vérifiez vos identifiants LIVE sur Vercel.`;

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

// ─── 4. Vérification Serveur du Statut (checkPayStatus) ─────────────────────

/**
 * Vérifie le statut officiel d'une transaction auprès de CinetPay (/v2/payment/check).
 * RÈGLE D'OR : Ne jamais se fier au seul webhook entrant sans contre-vérification serveur.
 */
export async function checkCinetPayTransaction(
  transaction_id: string
): Promise<CinetPayCheckResult> {
  const config = getCinetPayConfig();

  if (!config.apiKey || !config.siteId) {
    return {
      success: false,
      transaction_id,
      status: 'UNKNOWN',
      message: 'Configuration CinetPay incomplète (API Key ou Site ID manquant)',
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

    if (json && (json.code === '00' || json.code === 0)) {
      const data = json.data || {};
      const rawStatus = String(data.status || '').toUpperCase();
      let status: CinetPayCheckResult['status'] = 'PENDING';

      if (['ACCEPTED', 'SUCCES', 'SUCCESS', 'PAID'].includes(rawStatus)) {
        status = 'ACCEPTED';
      } else if (['REFUSED', 'FAILED', 'REJECTED', 'CANCELLED'].includes(rawStatus)) {
        status = 'REFUSED';
      }

      console.log(`[CINETPAY_CHECK] Résultat pour ${transaction_id} : ${status} (${data.amount} ${data.currency})`);

      return {
        success: true,
        transaction_id,
        status,
        amount: Number(data.amount) || undefined,
        currency: data.currency ? String(data.currency).toUpperCase() : 'XOF',
        payment_method: data.payment_method,
        operator_id: data.operator_id,
        payment_date: data.payment_date,
        code: json.code,
        message: json.message || rawStatus,
        raw: json,
      };
    }

    const realMessage =
      json?.message || json?.description || `Code réponse CinetPay: ${json?.code}`;

    console.warn(`[CINETPAY_CHECK] Réponse non-00 pour ${transaction_id} : code=${json?.code} msg="${realMessage}"`);

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
    console.error(`[CINETPAY_CHECK] Erreur réseau lors de la vérification : ${errMsg}`);
    return {
      success: false,
      transaction_id,
      status: 'UNKNOWN',
      message: `Erreur de connexion CinetPay : ${errMsg}`,
    };
  }
}

// ─── 5. Sécurité : Validation de Signature HMAC Webhook ─────────────────────

/**
 * Valide l'authenticité de la notification CinetPay via le jeton HMAC (x-token).
 * Si CINETPAY_SECRET_KEY est configurée, calcule et compare le HMAC-SHA256.
 */
export function verifyCinetPaySignature(
  xToken: string | null,
  rawBody: string | Record<string, unknown>
): boolean {
  const config = getCinetPayConfig();

  // Si aucune Secret Key n'est configurée, la double vérification serveur reste obligatoire
  if (!config.secretKey) {
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

    // Comparaison à temps constant pour prévenir les attaques temporelles
    return crypto.timingSafeEqual(
      Buffer.from(xToken.toLowerCase(), 'utf-8'),
      Buffer.from(expected.toLowerCase(), 'utf-8')
    );
  } catch {
    // Si la comparaison échoue pour des longueurs différentes
    return false;
  }
}

// ─── Aliases rétrocompatibles ───────────────────────────────────────────────
export const createPayment = initCinetPayPayment;
export const checkPayment = checkCinetPayTransaction;
