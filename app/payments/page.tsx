'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Smartphone,
  Building,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Wifi,
  Phone,
  CreditCard,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { formatFCFA } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase/client';
import { useSettingsStore } from '@/lib/store/settingsStore';

// ─── Types ───────────────────────────────────────────────
interface MobileMoneyAccount {
  id: string;
  provider: string;
  logo: string;
  color: string;
  bgColor: string;
  borderColor: string;
  phone: string;
  accountName: string;
  active: boolean;
  lastTransaction?: string;
  totalReceived?: number;
}

// ─── Initial Data ─────────────────────────────────────────
const INITIAL_ACCOUNTS: MobileMoneyAccount[] = [
  {
    id: 'wave',
    provider: 'Wave',
    logo: '🌊',
    color: 'text-sky-300',
    bgColor: 'bg-sky-950/40',
    borderColor: 'border-sky-700/40',
    phone: '+225 07 00 00 00 00',
    accountName: 'IziFacture SARL',
    active: true,
    lastTransaction: '2024-10-04',
    totalReceived: 3850000,
  },
  {
    id: 'orange',
    provider: 'Orange Money',
    logo: '🟠',
    color: 'text-orange-300',
    bgColor: 'bg-orange-950/40',
    borderColor: 'border-orange-700/40',
    phone: '+225 05 00 00 00 00',
    accountName: 'IziFacture SARL',
    active: true,
    lastTransaction: '2024-10-02',
    totalReceived: 2400000,
  },
  {
    id: 'mtn',
    provider: 'MTN MoMo',
    logo: '💛',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-950/40',
    borderColor: 'border-yellow-700/40',
    phone: '+225 07 50 00 00 00',
    accountName: 'IziFacture SARL',
    active: true,
    lastTransaction: '2024-09-30',
    totalReceived: 1850000,
  },
  {
    id: 'moov',
    provider: 'Moov Money',
    logo: '🟣',
    color: 'text-purple-300',
    bgColor: 'bg-purple-950/40',
    borderColor: 'border-purple-700/40',
    phone: '+225 01 00 00 00 00',
    accountName: 'IziFacture SARL',
    active: false,
    lastTransaction: undefined,
    totalReceived: 0,
  },
];

// ─── Edit Modal ───────────────────────────────────────────
function EditAccountModal({
  account,
  onClose,
  onSave,
}: {
  account: MobileMoneyAccount;
  onClose: () => void;
  onSave: (id: string, phone: string, name: string, active: boolean) => void;
}) {
  const [phone, setPhone] = useState(account.phone);
  const [name, setName] = useState(account.accountName);
  const [active, setActive] = useState(account.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#12131C] border border-[#D4AF37]/30 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{account.logo}</span>
            <div>
              <h2 className="text-base font-extrabold text-white">Modifier {account.provider}</h2>
              <p className="text-xs text-slate-400">Paramètres du compte Mobile Money</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1.5">
              Numéro de téléphone marchand
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1.5">
              Titulaire du compte
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Raison sociale ou nom complet"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium text-sm placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#181926] border border-[#D4AF37]/20">
            <div>
              <p className="text-xs font-bold text-white">Statut du canal</p>
              <p className="text-[11px] text-slate-400">Visible sur les factures émises</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                active
                  ? 'bg-[#D4AF37]/20 text-[#F5E6B3] border-[#D4AF37]/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {active ? '● Actif' : '○ Inactif'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(account.id, phone, name, active);
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_20px_rgba(212,175,55,0.5)] active:scale-95 transition-all"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Card ─────────────────────────────────────────
function AccountCard({
  account,
  onEdit,
  onToggle,
}: {
  account: MobileMoneyAccount;
  onEdit: (a: MobileMoneyAccount) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        account.active
          ? `${account.bgColor} ${account.borderColor} shadow-[0_4px_20px_rgba(0,0,0,0.3)]`
          : 'bg-[#12131C] border-[#D4AF37]/10 opacity-60'
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 rounded-xl bg-black/30 border border-white/5">{account.logo}</span>
          <div>
            <h3 className="text-sm font-extrabold text-white">{account.provider}</h3>
            <p className={`text-[11px] font-medium ${account.active ? account.color : 'text-slate-500'}`}>
              {account.active ? '● Actif' : '○ Inactif'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(account)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#F5E6B3] hover:bg-[#181926] border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 transition-all"
            title="Modifier"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggle(account.id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
              account.active
                ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30 hover:bg-[#D4AF37]/20'
                : 'text-slate-500 bg-[#181926] border-slate-700 hover:text-slate-300'
            }`}
            title={account.active ? 'Désactiver' : 'Activer'}
          >
            <Wifi className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/10">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-400 font-medium">Numéro</span>
          </div>
          <span className="font-mono text-[#F5E6B3] font-bold text-xs tabular-nums">{account.phone}</span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-400 font-medium">Compte</span>
          </div>
          <span className="text-xs font-semibold text-white">{account.accountName}</span>
        </div>
        {account.totalReceived !== undefined && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/10">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] text-slate-400 font-medium">Total encaissé</span>
            </div>
            <span className="font-mono text-[#F5E6B3] font-bold text-xs tabular-nums">
              {formatFCFA(account.totalReceived)}
            </span>
          </div>
        )}
      </div>

      {account.active ? (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Actif — prêt à recevoir les encaissements</span>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Compte inactif — n&apos;apparaît pas sur les factures</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function PaymentsPage() {
  const [accounts, setAccounts] = useState<MobileMoneyAccount[]>(INITIAL_ACCOUNTS);
  const [editingAccount, setEditingAccount] = useState<MobileMoneyAccount | null>(null);

  // Synchronisation avec settingsStore pour la banque
  const { settings, updateSettings } = useSettingsStore();
  const [bankName, setBankName] = useState(settings.bankName || 'Société Générale Côte d’Ivoire (SGCI)');
  const [iban, setIban] = useState(settings.iban || 'CI93 CI03 4010 0100 1234 5678 9012');
  const [editingBank, setEditingBank] = useState(false);

  useEffect(() => {
    if (settings.bankName) setBankName(settings.bankName);
    if (settings.iban) setIban(settings.iban);
  }, [settings.bankName, settings.iban]);

  // Charger les comptes depuis Supabase
  const loadAccountsFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('payment_accounts').select('*');
      if (!error && data && data.length > 0) {
        const loaded: MobileMoneyAccount[] = data.map((a: { id: string; provider: string; logo?: string; color?: string; bg_color?: string; border_color?: string; phone?: string; account_name?: string; active?: boolean; last_transaction?: string; total_received?: number }) => ({
          id: a.id,
          provider: a.provider,
          logo: a.logo || '💳',
          color: a.color || 'text-[#F5E6B3]',
          bgColor: a.bg_color || 'bg-slate-900/40',
          borderColor: a.border_color || 'border-[#D4AF37]/20',
          phone: a.phone || '',
          accountName: a.account_name || 'IziFacture SARL',
          active: a.active ?? true,
          lastTransaction: a.last_transaction,
          totalReceived: Number(a.total_received || 0),
        }));
        setAccounts(loaded);
      }
    } catch (err) {
      console.warn('Erreur chargement payment_accounts Supabase:', err);
    }
  }, []);

  useEffect(() => {
    loadAccountsFromSupabase();
  }, [loadAccountsFromSupabase]);

  const totalReceived = accounts.reduce((s, a) => s + (a.totalReceived ?? 0), 0);
  const activeCount = accounts.filter((a) => a.active).length;

  const handleToggle = async (id: string) => {
    const updated = accounts.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    setAccounts(updated);
    const target = updated.find((a) => a.id === id);
    if (target) {
      await supabase.from('payment_accounts').update({ active: target.active }).eq('id', id);
    }
  };

  const handleSaveAccount = async (id: string, phone: string, name: string, active: boolean) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, phone, accountName: name, active } : a))
    );
    await supabase.from('payment_accounts').update({
      phone,
      account_name: name,
      active,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
  };

  const handleSaveBank = async () => {
    setEditingBank(false);
    await updateSettings({ bankName, iban });
  };

  return (
    <DashboardLayout breadcrumb={{ section: 'Gestion', page: 'Paiements & Mobile Money' }}>
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSave={handleSaveAccount}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-amber-200 transition-colors font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Paiements &amp; Mobile Money
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Gérez vos comptes d'encaissement Wave, Orange Money, MTN MoMo, Moov Money et RIB bancaire synchronisés avec Supabase.
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#12131C] rounded-2xl p-4 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <p className="text-[11px] text-slate-400 font-medium mb-1">Méthodes actives</p>
          <p className="text-2xl font-black text-[#F5E6B3] font-mono tabular-nums">{activeCount}<span className="text-sm text-slate-400 font-normal"> / {accounts.length}</span></p>
        </div>
        <div className="sm:col-span-2 bg-[#12131C] rounded-2xl p-4 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <p className="text-[11px] text-slate-400 font-medium mb-1">Total encaissé via Mobile Money</p>
          <p className="text-2xl font-black text-[#F5E6B3] font-mono tabular-nums">{formatFCFA(totalReceived)}</p>
        </div>
      </div>

      {/* Mobile Money Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-extrabold text-white">Canaux Mobile Money (UEMOA)</h2>
          </div>
          <span className="text-xs text-slate-400">Cliquez sur l&apos;icône wifi pour activer/désactiver</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={setEditingAccount}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Bank Account Section */}
      <div className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Compte Bancaire Professionnel</h2>
              <p className="text-xs text-slate-400">Coordonnées bancaires pour les virements B2B</p>
            </div>
          </div>
          <button
            onClick={() => setEditingBank(!editingBank)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-xs font-semibold text-[#F5E6B3] hover:border-[#D4AF37]/50 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingBank ? 'Fermer' : 'Modifier'}</span>
          </button>
        </div>

        {editingBank ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-1.5">Banque</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-1.5">IBAN / RIB</label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
              />
            </div>
            <button
              onClick={handleSaveBank}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] active:scale-95 transition-all"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" /> Enregistrer
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-[#181926] border border-[#D4AF37]/15">
              <span className="text-[10px] text-slate-400 block font-sans mb-1">Banque</span>
              <span className="font-semibold text-white text-sm">{bankName}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#181926] border border-[#D4AF37]/15">
              <span className="text-[10px] text-slate-400 block font-sans mb-1">IBAN / RIB</span>
              <span className="font-bold text-[#F5E6B3] font-mono text-sm tabular-nums">{iban}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#D4AF37]/80 font-semibold mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ce RIB est inclus dans vos factures PDF automatiquement</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
