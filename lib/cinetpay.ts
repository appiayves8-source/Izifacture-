/**
 * Module d'intégration CinetPay Sandbox & Production
 * Spécialement optimisé pour la Côte d'Ivoire (CI) et la zone UEMOA / CEMAC (XOF / XAF).
 * Prend en charge l'API CinetPay nouvelle génération (sans site_id, avec apikey + password)
 * avec gestion automatique et transparente du jeton OAuth Bearer (durée de validité 24h).
 */

export interface CreatePaymentParams {
  transaction_id: string;
  amount: number;
  currency?: string; // Par défaut 'XOF'
  description: string;
  customer_name?: string;
  customer_surname?: string;
  customer_email?: string;
  customer_phone?: string;
  notify_url?: string;
  return_url?: string;
  channels?: 'ALL' | 'MOBILE_MONEY' | 'WALLET' | 'CREDIT_CARD';
  metadata?: string;
}

export interface PaymentInitResult {
  success: boolean;
  transaction_id: string;
  cinetpay_transaction_id?: string;
  payment_url?: string;
  payment_token?: string;
  code?: string | number;
  message?: string;
  description?: string;
  raw?: unknown;
}

export interface PaymentCheckResult {
  success: boolean;
  transaction_id: string;
  cinetpay_transaction_id?: string;
  status: 'ACCEPTED' | 'REFUSED' | 'PENDING' | 'CANCELLED' | 'UNKNOWN' | 'ERROR';
  raw_status?: string;
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

// ─── Cache du token OAuth en mémoire ─────────────────────────────────────────
interface CachedToken {
  token: string;
  expiresAt: number;
}
let cachedAuthToken: CachedToken | null = null;

/**
 * Obtient un jeton d'accès OAuth Bearer auprès de CinetPay
 */
export async function getCinetPayToken(): Promise<string> {
  const now = Date.now();
  if (cachedAuthToken && cachedAuthToken.expiresAt > now + 60000) {
    return cachedAuthToken.token;
  }

  const apiKey = process.env.CINETPAY_API_KEY;
  const password = process.env.CINETPAY_API_PASSWORD;
  const baseUrl = process.env.CINETPAY_BASE_URL || 'https://api.cinetpay.net';

  if (!apiKey || !password) {
    throw new Error('CINETPAY_API_KEY ou CINETPAY_API_PASSWORD manquant dans les variables d’environnement (.env.local)');
  }

  const loginUrl = `${baseUrl}/v1/oauth/login`;
  console.log(`[CinetPay] Authentification OAuth en cours via ${loginUrl}...`);

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      api_password: password,
    }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (res.status !== 200 || !data.access_token) {
    console.error('[CinetPay] Échec de l’authentification OAuth:', data);
    throw new Error(data.description || data.message || `Erreur OAuth HTTP ${res.status}`);
  }

  const expiresInMs = (data.expires_in || 86400) * 1000;
  cachedAuthToken = {
    token: data.access_token,
    expiresAt: now + expiresInMs,
  };

  console.log(`[CinetPay] Token OAuth régénéré avec succès (valide 24h, utilisateur: ${data.user_email || 'CinetPay'})`);
  return cachedAuthToken.token;
}

/**
 * 1. Initialise un paiement CinetPay
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentInitResult> {
  try {
    const token = await getCinetPayToken();
    const baseUrl = process.env.CINETPAY_BASE_URL || 'https://api.cinetpay.net';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const paymentUrl = `${baseUrl}/v1/payment`;

    const success_url =
      params.return_url ||
      `${appUrl}/test-paiement?transaction_id=${params.transaction_id}&status=success`;
    const failed_url =
      params.return_url ||
      `${appUrl}/test-paiement?transaction_id=${params.transaction_id}&status=failed`;
    const notify_url =
      params.notify_url ||
      `${appUrl}/api/pay/cinetpay/notify`;

    const payload = {
      amount: params.amount,
      currency: params.currency || 'XOF',
      merchant_transaction_id: params.transaction_id,
      designation: params.description || `Paiement IziFacture (${params.transaction_id})`,
      success_url,
      failed_url,
      notify_url,
      channels: params.channels || 'ALL',
      metadata: params.metadata || '',
    };

    console.log(`[CinetPay] Initialisation paiement pour ${params.transaction_id} :`, {
      amount: payload.amount,
      currency: payload.currency,
      designation: payload.designation,
      notify_url: payload.notify_url,
      success_url: payload.success_url,
    });

    const res = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const json = await res.json();
    console.log(`[CinetPay] Réponse création paiement (HTTP ${res.status}):`, json);

    if (json.code === 200 && json.payment_url) {
      return {
        success: true,
        transaction_id: params.transaction_id,
        cinetpay_transaction_id: json.transaction_id,
        payment_url: json.payment_url,
        payment_token: json.payment_token,
        code: json.code,
        message: json.details?.message || json.status || 'Paiement initié',
        raw: json,
      };
    }

    return {
      success: false,
      transaction_id: params.transaction_id,
      code: json.code || json.details?.code || res.status,
      message: json.details?.message || json.description || 'Échec de la création du paiement',
      description: JSON.stringify(json.details?.errors || json),
      raw: json,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CinetPay] Erreur createPayment:', errorMsg);
    return {
      success: false,
      transaction_id: params.transaction_id,
      code: 'NETWORK_ERROR',
      message: `Erreur lors de l’initialisation CinetPay: ${errorMsg}`,
    };
  }
}

/**
 * 2. Vérifie le statut d'un paiement CinetPay
 */
export async function checkPayment(transaction_id: string): Promise<PaymentCheckResult> {
  try {
    const token = await getCinetPayToken();
    const baseUrl = process.env.CINETPAY_BASE_URL || 'https://api.cinetpay.net';
    const checkUrl = `${baseUrl}/v1/payment/${transaction_id}`;

    console.log(`[CinetPay] Vérification du statut de la transaction: ${transaction_id}`);

    const res = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const json = await res.json();
    console.log(`[CinetPay] Réponse vérification statut (HTTP ${res.status}):`, json);

    const rawStatus = (json.status || json.details?.status || 'UNKNOWN').toUpperCase();

    let status: PaymentCheckResult['status'] = 'UNKNOWN';
    if (rawStatus === 'ACCEPTED' || rawStatus === 'SUCCES' || rawStatus === 'SUCCESS' || rawStatus === 'PAID') {
      status = 'ACCEPTED';
    } else if (rawStatus === 'REFUSED' || rawStatus === 'FAILED' || rawStatus === 'REJECTED') {
      status = 'REFUSED';
    } else if (rawStatus === 'INITIATED' || rawStatus === 'PENDING' || rawStatus === 'WAITING_FOR_PAYMENT') {
      status = 'PENDING';
    } else if (rawStatus === 'CANCELLED') {
      status = 'CANCELLED';
    }

    return {
      success: res.status === 200,
      transaction_id,
      cinetpay_transaction_id: json.transaction_id,
      status,
      raw_status: rawStatus,
      amount: json.amount,
      currency: json.currency,
      payment_method: json.payment_method || json.channel,
      operator_id: json.operator_id || json.cpm_payid,
      payment_date: json.payment_date || json.updated_at,
      code: json.code,
      message: json.details?.message || json.message || rawStatus,
      description: json.description,
      raw: json,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[CinetPay] Erreur checkPayment:', errorMsg);
    return {
      success: false,
      transaction_id,
      status: 'ERROR',
      code: 'NETWORK_ERROR',
      message: `Erreur lors de la vérification CinetPay: ${errorMsg}`,
    };
  }
}
