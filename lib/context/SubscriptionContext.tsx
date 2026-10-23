'use client';

/**
 * SubscriptionContext — Contexte global d'abonnement IziFacture
 *
 * PERFORMANCE : Une seule requête Supabase au démarrage de session.
 * Cache localStorage de 5 minutes → navigations instantanées entre pages.
 * Tous les composants (SubscriptionGuard, Banner, InvoiceForm) partagent
 * le même état sans re-déclencher d'appels réseau.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';

export const MAX_FREE_INVOICES = 5;

// Durée du cache localStorage : 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY = 'izifacture_sub_cache_v1';

interface SubCache {
  userId: string;
  isActive: boolean;
  endsAt: string | null;
  invoicesCount: number;
  cachedAt: number;
}

function readCache(userId: string): SubCache | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: SubCache = JSON.parse(raw);
    if (cache.userId !== userId) return null;
    if (Date.now() - cache.cachedAt > CACHE_TTL_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

function writeCache(data: SubCache) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }
  } catch {
    // Ignore write errors
  }
}

function clearCache() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {
    // Ignore
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubscriptionState {
  isActive: boolean;
  endsAt: string | null;
  plan: string;
  loading: boolean;
  isPolling: boolean;
  pollingProgress: number;
  invoicesCount: number;
  maxFreeInvoices: number;
  hasReachedLimit: boolean;
  error: string | null;
  isInitiating: boolean;
  refreshSubscription: () => Promise<boolean>;
  initiatePayment: () => Promise<void>;
  incrementInvoiceCount: () => Promise<number>;
}

const defaultState: SubscriptionState = {
  isActive: false,
  endsAt: null,
  plan: 'pro_5000',
  loading: true,
  isPolling: false,
  pollingProgress: 0,
  invoicesCount: 0,
  maxFreeInvoices: MAX_FREE_INVOICES,
  hasReachedLimit: false,
  error: null,
  isInitiating: false,
  refreshSubscription: async () => false,
  initiatePayment: async () => {},
  incrementInvoiceCount: async () => 0,
};

// ─── Context ─────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionState>(defaultState);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [plan] = useState('pro_5000');
  const [invoicesCount, setInvoicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // Garde-fou : éviter des doubles appels simultanés
  const fetchingRef = useRef(false);

  // ── Fetch depuis Supabase (appelé UNE seule fois par session) ──────────────
  const refreshSubscription = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setIsActive(false);
      setEndsAt(null);
      setInvoicesCount(0);
      setLoading(false);
      return false;
    }

    // Lecture du cache d'abord → 0 délai réseau
    const cached = readCache(user.id);
    if (cached) {
      setIsActive(cached.isActive);
      setEndsAt(cached.endsAt);
      setInvoicesCount(cached.invoicesCount);
      setLoading(false);
      return cached.isActive;
    }

    // Éviter les appels en double simultanés
    if (fetchingRef.current) return isActive;
    fetchingRef.current = true;

    try {
      setError(null);

      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('is_subscribed, subscription_ends_at, invoices_count')
        .eq('id', user.id)
        .maybeSingle();

      if (!dbError && profile) {
        const now = new Date();
        const subEnd = profile.subscription_ends_at
          ? new Date(profile.subscription_ends_at)
          : null;
        const active = Boolean(
          profile.is_subscribed && subEnd && subEnd.getTime() > now.getTime()
        );
        const count = Number(profile.invoices_count) || 0;

        setIsActive(active);
        setEndsAt(subEnd ? subEnd.toISOString() : null);
        setInvoicesCount(count);
        setLoading(false);

        // Écrire dans le cache pour les navigations suivantes
        writeCache({
          userId: user.id,
          isActive: active,
          endsAt: subEnd ? subEnd.toISOString() : null,
          invoicesCount: count,
          cachedAt: Date.now(),
        });

        fetchingRef.current = false;
        return active;
      }

      // Fallback API Route
      const currentSession = session || (await supabase.auth.getSession()).data.session;
      const token = currentSession?.access_token;

      if (token) {
        const res = await fetch('/api/subscription/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          const active = Boolean(data.isActive);
          const count = Number(data.invoicesCount) || 0;
          const ends = data.endsAt || null;

          setIsActive(active);
          setEndsAt(ends);
          setInvoicesCount(count);
          setLoading(false);

          writeCache({
            userId: user.id,
            isActive: active,
            endsAt: ends,
            invoicesCount: count,
            cachedAt: Date.now(),
          });

          fetchingRef.current = false;
          return active;
        }
      }

      setLoading(false);
      fetchingRef.current = false;
      return false;
    } catch (err: unknown) {
      console.warn('[SubscriptionContext] refreshSubscription:', err);
      setLoading(false);
      fetchingRef.current = false;
      return false;
    }
  }, [user, session, isActive]);

  // ── Chargement initial : une seule fois par changement d'utilisateur ────────
  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      clearCache();
      setIsActive(false);
      setEndsAt(null);
      setInvoicesCount(0);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Dépendance sur user.id uniquement → pas de boucle

  // ── Polling silencieux après retour CinetPay ?payment=success ──────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;

    // Invalider le cache pour forcer une vraie vérification
    clearCache();
    setIsPolling(true);
    setPollingProgress(0);

    const startTime = Date.now();
    const maxDuration = 30000;

    pollingRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      setPollingProgress(Math.min(30, Math.floor(elapsed / 1000)));

      clearCache(); // Forcer la lecture fraîche à chaque poll
      const active = await refreshSubscription();

      if (active) {
        clearInterval(pollingRef.current!);
        setIsPolling(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (elapsed >= maxDuration) {
        clearInterval(pollingRef.current!);
        setIsPolling(false);
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Incrémenter le compteur de factures (optimistic update) ────────────────
  const incrementInvoiceCount = async (): Promise<number> => {
    if (!user) return invoicesCount;
    const nextCount = invoicesCount + 1;
    setInvoicesCount(nextCount);

    // Mettre à jour le cache local immédiatement
    const cached = readCache(user.id);
    if (cached) {
      writeCache({ ...cached, invoicesCount: nextCount });
    }

    try {
      await supabase
        .from('profiles')
        .update({ invoices_count: nextCount, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (err) {
      console.warn('[SubscriptionContext] incrementInvoiceCount:', err);
    }

    return nextCount;
  };

  // ── Lancer le paiement CinetPay ────────────────────────────────────────────
  const initiatePayment = async () => {
    try {
      setIsInitiating(true);
      setError(null);

      const currentSession = session || (await supabase.auth.getSession()).data.session;
      const token = currentSession?.access_token;

      if (!token) {
        throw new Error('Veuillez vous reconnecter pour poursuivre le paiement.');
      }

      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.payment_url) {
        throw new Error(data.error || "Impossible d'initialiser le paiement CinetPay.");
      }

      window.location.href = data.payment_url;
    } catch (err: unknown) {
      console.error('[SubscriptionContext] initiatePayment:', err);
      setError((err as Error).message || 'Erreur de connexion au guichet de paiement.');
      setIsInitiating(false);
    }
  };

  const hasReachedLimit = !isActive && invoicesCount >= MAX_FREE_INVOICES;

  const value: SubscriptionState = {
    isActive,
    endsAt,
    plan,
    loading,
    isPolling,
    pollingProgress,
    invoicesCount,
    maxFreeInvoices: MAX_FREE_INVOICES,
    hasReachedLimit,
    error,
    isInitiating,
    refreshSubscription,
    initiatePayment,
    incrementInvoiceCount,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ─── Hook d'accès ─────────────────────────────────────────────────────────────

export function useSubscription(): SubscriptionState {
  return useContext(SubscriptionContext);
}
