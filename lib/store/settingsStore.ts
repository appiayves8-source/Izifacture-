'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface CompanySettings {
  companyName: string;
  tagline: string;
  rccm: string;
  nif: string;
  currency: string;
  vatRate: number; // Taux de TVA en pourcentage (ex: 18 pour 18%)
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  bankName: string;
  iban: string;
  mobileMoney: string;
  invoicePrefix: string;
  quotePrefix: string;
  paymentTermsDays: number;
  invoiceFooterNotes: string;
}

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'IziFacture SARL',
  tagline: 'Solutions SaaS & Facturation B2B UEMOA',
  rccm: 'CI-ABJ-2023-B-12948',
  nif: '2109482 X',
  currency: 'Franc CFA (FCFA)',
  vatRate: 18,
  phone: '+225 07 00 00 00 00',
  email: 'contact@izifacture.com',
  website: 'www.izifacture.com',
  address: 'Boulevard de la République, Plateau',
  city: 'Abidjan',
  country: "Côte d'Ivoire",
  bankName: 'Société Générale Côte d’Ivoire (SGCI)',
  iban: 'CI93 CI03 4010 0100 1234 5678 9012',
  mobileMoney: 'Wave / Orange Money : +225 07 00 00 00 00',
  invoicePrefix: 'FAC-2024-',
  quotePrefix: 'DEV-2024-',
  paymentTermsDays: 15,
  invoiceFooterNotes: "Paiement exigible à la date d'échéance. Tout retard entraînera des pénalités légales en vigueur dans l'espace OHADA/UEMOA.",
};

export function createDefaultSettingsForUser(user?: { email?: string; user_metadata?: { full_name?: string } } | null): CompanySettings {
  const currentYear = new Date().getFullYear();
  const rawName = user?.user_metadata?.full_name?.trim();
  const companyName = rawName ? `Entreprise ${rawName}` : 'Mon Entreprise';
  return {
    companyName,
    tagline: 'Facturation & Gestion Commerciale B2B',
    rccm: '',
    nif: '',
    currency: 'Franc CFA (FCFA)',
    vatRate: 18,
    phone: '',
    email: user?.email || '',
    website: '',
    address: '',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    bankName: '',
    iban: '',
    mobileMoney: '',
    invoicePrefix: `FAC-${currentYear}-`,
    quotePrefix: `DEV-${currentYear}-`,
    paymentTermsDays: 15,
    invoiceFooterNotes: "Paiement exigible à la date d'échéance. Tout retard entraînera des pénalités légales en vigueur dans l'espace OHADA/UEMOA.",
  };
}

export function getInitialUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('-auth-token')) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed?.user?.id) return parsed.user.id;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

const EVENT_SETTINGS_UPDATED = 'izifacture_settings_updated';

interface SettingsDbRow {
  company_name?: string;
  tagline?: string;
  rccm?: string;
  nif?: string;
  currency?: string;
  vat_rate?: number;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  bank_name?: string;
  iban?: string;
  mobile_money?: string;
  invoice_prefix?: string;
  quote_prefix?: string;
  payment_terms_days?: number;
  invoice_footer_notes?: string;
}

function mapDbToSettings(row: SettingsDbRow, fallback: CompanySettings = DEFAULT_SETTINGS): CompanySettings {
  return {
    companyName: row.company_name ?? fallback.companyName,
    tagline: row.tagline ?? fallback.tagline,
    rccm: row.rccm ?? fallback.rccm,
    nif: row.nif ?? fallback.nif,
    currency: row.currency ?? fallback.currency,
    vatRate: Number(row.vat_rate ?? fallback.vatRate),
    phone: row.phone ?? fallback.phone,
    email: row.email ?? fallback.email,
    website: row.website ?? fallback.website,
    address: row.address ?? fallback.address,
    city: row.city ?? fallback.city,
    country: row.country ?? fallback.country,
    bankName: row.bank_name ?? fallback.bankName,
    iban: row.iban ?? fallback.iban,
    mobileMoney: row.mobile_money ?? fallback.mobileMoney,
    invoicePrefix: row.invoice_prefix ?? fallback.invoicePrefix,
    quotePrefix: row.quote_prefix ?? fallback.quotePrefix,
    paymentTermsDays: Number(row.payment_terms_days ?? fallback.paymentTermsDays),
    invoiceFooterNotes: row.invoice_footer_notes ?? fallback.invoiceFooterNotes,
  };
}

function mapSettingsToDb(settings: CompanySettings, targetId: string) {
  return {
    id: targetId,
    company_name: settings.companyName,
    tagline: settings.tagline,
    rccm: settings.rccm,
    nif: settings.nif,
    currency: settings.currency,
    vat_rate: settings.vatRate,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    address: settings.address,
    city: settings.city,
    country: settings.country,
    bank_name: settings.bankName,
    iban: settings.iban,
    mobile_money: settings.mobileMoney,
    invoice_prefix: settings.invoicePrefix,
    quote_prefix: settings.quotePrefix,
    payment_terms_days: settings.paymentTermsDays,
    invoice_footer_notes: settings.invoiceFooterNotes,
    updated_at: new Date().toISOString(),
  };
}

export interface SettingsStoreValue {
  settings: CompanySettings;
  isLoaded: boolean;
  saveSettings: (newSettings: CompanySettings) => Promise<void>;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<CompanySettings>;
  resetSettings: () => Promise<void>;
  defaultSettings: CompanySettings;
}

const SettingsStoreContext = createContext<SettingsStoreValue | null>(null);

// ─── Provider global SettingsStoreProvider ──────────────────────────────────
// Isole les boutiques par utilisateur : chaque compte possède sa propre boutique.
export function SettingsStoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const uid = getInitialUserId();
        const key = uid ? `izifacture_settings_${uid}` : 'izifacture_settings_v1';
        const stored = localStorage.getItem(key);
        if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        // Fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Charger depuis Supabase pour l'utilisateur connecté
  const fetchSettingsFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Mode invité ou déconnecté : lecture de 'default'
        const { data } = await supabase
          .from('company_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();
        if (data) {
          const loaded = mapDbToSettings(data as SettingsDbRow, DEFAULT_SETTINGS);
          setSettings(loaded);
        }
        setIsLoaded(true);
        return;
      }

      // Utilisateur authentifié : recherche de sa boutique dédiée
      const targetId = user.id;
      const storageKey = `izifacture_settings_${targetId}`;

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (error) {
        console.warn('Supabase fetch error for settings:', error.message);
      } else if (data) {
        // Boutique personnalisée trouvée
        const loaded = mapDbToSettings(data as SettingsDbRow, createDefaultSettingsForUser(user));
        setSettings(loaded);
        try {
          localStorage.setItem(storageKey, JSON.stringify(loaded));
        } catch { /* storage unavailable */ }
      } else {
        // Pas encore de boutique pour cet utilisateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', targetId)
          .maybeSingle();

        const isAdmin = profile?.role === 'admin';

        if (isAdmin) {
          // Administrateur (Cyrille) : fallback sur la boutique 'default' (IziFacture)
          const { data: defData } = await supabase
            .from('company_settings')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();

          const loaded = defData ? mapDbToSettings(defData as SettingsDbRow, DEFAULT_SETTINGS) : DEFAULT_SETTINGS;
          setSettings(loaded);
          // Persistance sous l'ID admin pour isolation future
          try {
            await supabase.from('company_settings').upsert(mapSettingsToDb(loaded, targetId));
            localStorage.setItem(storageKey, JSON.stringify(loaded));
          } catch { /* ignore */ }
        } else {
          // Nouvel utilisateur standard : création de sa propre boutique vierge
          const cleanUserDefault = createDefaultSettingsForUser(user);
          setSettings(cleanUserDefault);
          try {
            await supabase.from('company_settings').upsert(mapSettingsToDb(cleanUserDefault, targetId));
            localStorage.setItem(storageKey, JSON.stringify(cleanUserDefault));
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.warn('Error fetching settings from Supabase:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchSettingsFromSupabase();

    // Réagir aux changements de connexion (connexion nouvel utilisateur / déconnexion)
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSettings(DEFAULT_SETTINGS);
        setIsLoaded(true);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = session?.user;
        if (u) {
          const cached = localStorage.getItem(`izifacture_settings_${u.id}`);
          if (cached) {
            try { setSettings(JSON.parse(cached)); } catch { /* ignore */ }
          } else {
            setSettings(createDefaultSettingsForUser(u));
          }
        }
        fetchSettingsFromSupabase();
      }
    });

    const handleUpdate = () => {
      try {
        const uid = getInitialUserId();
        const key = uid ? `izifacture_settings_${uid}` : 'izifacture_settings_v1';
        const stored = localStorage.getItem(key);
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener(EVENT_SETTINGS_UPDATED, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Écoute Realtime sur Supabase
    const channelId = `settings_rt_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_settings' },
        async (payload) => {
          if (payload.new) {
            const { data: { user } } = await supabase.auth.getUser();
            const currentTargetId = user?.id || 'default';
            const row = payload.new as SettingsDbRow & { id?: string };
            if (row.id === currentTargetId) {
              const updated = mapDbToSettings(row, createDefaultSettingsForUser(user));
              setSettings(updated);
              try {
                localStorage.setItem(`izifacture_settings_${currentTargetId}`, JSON.stringify(updated));
              } catch { /* storage unavailable */ }
            }
          }
        }
      )
      .subscribe();

    return () => {
      authSub.subscription.unsubscribe();
      window.removeEventListener(EVENT_SETTINGS_UPDATED, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [fetchSettingsFromSupabase]);

  const saveSettings = async (newSettings: CompanySettings) => {
    setSettings(newSettings);

    let targetId = 'default';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) targetId = user.id;
    } catch { /* ignore */ }

    try {
      localStorage.setItem(`izifacture_settings_${targetId}`, JSON.stringify(newSettings));
      window.dispatchEvent(new Event(EVENT_SETTINGS_UPDATED));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }

    try {
      const dbData = mapSettingsToDb(newSettings, targetId);
      const { error } = await supabase.from('company_settings').upsert(dbData, { onConflict: 'id' });
      if (error) {
        console.error('Supabase error upserting settings:', error.message);
      }
    } catch (e) {
      console.error('Error saving settings to Supabase:', e);
    }
  };

  const updateSettings = async (updates: Partial<CompanySettings>) => {
    const merged = { ...settings, ...updates };
    await saveSettings(merged);
    return merged;
  };

  const resetSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const cleanDefault = createDefaultSettingsForUser(user);
    await saveSettings(cleanDefault);
  };

  const value: SettingsStoreValue = {
    settings,
    isLoaded,
    saveSettings,
    updateSettings,
    resetSettings,
    defaultSettings: DEFAULT_SETTINGS,
  };

  return React.createElement(SettingsStoreContext.Provider, { value }, children);
}

// ─── Hook d'accès useSettingsStore ──────────────────────────────────────────
export function useSettingsStore(): SettingsStoreValue {
  const ctx = useContext(SettingsStoreContext);
  if (!ctx) {
    return {
      settings: DEFAULT_SETTINGS,
      isLoaded: true,
      saveSettings: async () => {},
      updateSettings: async (updates) => ({ ...DEFAULT_SETTINGS, ...updates }),
      resetSettings: async () => {},
      defaultSettings: DEFAULT_SETTINGS,
    };
  }
  return ctx;
}
