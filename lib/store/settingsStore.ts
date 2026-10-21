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

const STORAGE_KEY_SETTINGS = 'izifacture_settings_v1';
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

function mapDbToSettings(row: SettingsDbRow): CompanySettings {
  return {
    companyName: row.company_name ?? DEFAULT_SETTINGS.companyName,
    tagline: row.tagline ?? DEFAULT_SETTINGS.tagline,
    rccm: row.rccm ?? DEFAULT_SETTINGS.rccm,
    nif: row.nif ?? DEFAULT_SETTINGS.nif,
    currency: row.currency ?? DEFAULT_SETTINGS.currency,
    vatRate: Number(row.vat_rate ?? DEFAULT_SETTINGS.vatRate),
    phone: row.phone ?? DEFAULT_SETTINGS.phone,
    email: row.email ?? DEFAULT_SETTINGS.email,
    website: row.website ?? DEFAULT_SETTINGS.website,
    address: row.address ?? DEFAULT_SETTINGS.address,
    city: row.city ?? DEFAULT_SETTINGS.city,
    country: row.country ?? DEFAULT_SETTINGS.country,
    bankName: row.bank_name ?? DEFAULT_SETTINGS.bankName,
    iban: row.iban ?? DEFAULT_SETTINGS.iban,
    mobileMoney: row.mobile_money ?? DEFAULT_SETTINGS.mobileMoney,
    invoicePrefix: row.invoice_prefix ?? DEFAULT_SETTINGS.invoicePrefix,
    quotePrefix: row.quote_prefix ?? DEFAULT_SETTINGS.quotePrefix,
    paymentTermsDays: Number(row.payment_terms_days ?? DEFAULT_SETTINGS.paymentTermsDays),
    invoiceFooterNotes: row.invoice_footer_notes ?? DEFAULT_SETTINGS.invoiceFooterNotes,
  };
}

function mapSettingsToDb(settings: CompanySettings) {
  return {
    id: 'default',
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
// Initialise les paramètres depuis localStorage immédiatement (0ms)
// et effectue une synchronisation unique en arrière-plan avec Supabase.
export function SettingsStoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        // Fallback
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger depuis Supabase une seule fois au montage
  const fetchSettingsFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) {
        console.warn('Supabase fetch error for settings:', error.message);
      } else if (data) {
        const loaded = mapDbToSettings(data as SettingsDbRow);
        setSettings(loaded);
        try {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(loaded));
        } catch { /* storage unavailable */ }
      }
    } catch (err) {
      console.warn('Error fetching settings from Supabase:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchSettingsFromSupabase();

    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener(EVENT_SETTINGS_UPDATED, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Écoute Realtime sur Supabase (uniquement au niveau racine du Provider)
    const channelId = `settings_rt_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_settings' },
        (payload) => {
          if (payload.new) {
            const updated = mapDbToSettings(payload.new as SettingsDbRow);
            setSettings(updated);
            try {
              localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
            } catch { /* storage unavailable */ }
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener(EVENT_SETTINGS_UPDATED, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [fetchSettingsFromSupabase]);

  const saveSettings = async (newSettings: CompanySettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
      window.dispatchEvent(new Event(EVENT_SETTINGS_UPDATED));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }

    try {
      const dbData = mapSettingsToDb(newSettings);
      const { error } = await supabase.from('company_settings').upsert(dbData);
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
    await saveSettings(DEFAULT_SETTINGS);
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
