'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Percent,
  Phone,
  Mail,
  Globe,
  MapPin,
  Landmark,
  Smartphone,
  Save,
  RotateCcw,
  CheckCircle2,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useSettingsStore, CompanySettings } from '@/lib/store/settingsStore';

type SettingsTab = 'general' | 'tax' | 'contact' | 'banking' | 'templates';

export default function SettingsPage() {
  const { settings, isLoaded, saveSettings, resetSettings } = useSettingsStore();

  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync form when settings are loaded from store
  useEffect(() => {
    if (isLoaded) {
      setFormData(settings);
    }
  }, [isLoaded, settings]);

  const handleChange = (field: keyof CompanySettings, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveSettings(formData);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3500);
  };

  const handleReset = () => {
    if (window.confirm('Voulez-vous réinitialiser tous les paramètres aux valeurs d’origine ?')) {
      resetSettings();
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const tabs = [
    { id: 'general' as SettingsTab, label: 'Entreprise & Légal', icon: Building2 },
    { id: 'tax' as SettingsTab, label: 'Fiscalité & Devise', icon: Percent },
    { id: 'contact' as SettingsTab, label: 'Contact & Siège', icon: Phone },
    { id: 'banking' as SettingsTab, label: 'Banque & Mobile Money', icon: Landmark },
    { id: 'templates' as SettingsTab, label: 'Facturation & Mentions', icon: FileText },
  ];

  return (
    <DashboardLayout breadcrumb={{ section: 'Système', page: 'Paramètres' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#D4AF37]/15">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-amber-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans mt-1">
            Paramètres de l&apos;Entreprise
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Personnalisez vos mentions légales OHADA/UEMOA (NIF, RCCM), taux de TVA, coordonnées et options de paiement.
          </p>
        </div>

        {/* Global Save Actions */}
        <div className="flex items-center gap-2.5">
          {hasChanges && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-600/35 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Modifications non enregistrées
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#13141F] border border-[#D4AF37]/30 text-xs font-semibold text-slate-300 hover:text-[#F5E6B3] hover:bg-[#181926] hover:border-[#D4AF37]/60 active:scale-95 transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Enregistrer les modifications</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="bg-[#12131C] border border-[#D4AF37]/60 shadow-[0_4px_25px_rgba(212,175,55,0.2)] rounded-xl p-4 flex items-center justify-between gap-3 text-sm text-[#F5E6B3] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#DFBA55]" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">Paramètres enregistrés avec succès !</p>
              <p className="text-xs text-slate-300">
                Vos nouvelles données d&apos;entreprise sont immédiatement prises en compte dans vos factures et devis.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSaveSuccess(false)}
            className="text-xs text-[#D4AF37] hover:underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#D4AF37]/15">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] text-black shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                  : 'bg-[#12131C] text-slate-300 hover:text-white border border-[#D4AF37]/20 hover:border-[#D4AF37]/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black stroke-[2.5]' : 'text-[#D4AF37]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container (2 Columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            {/* Tab 1: General & Legal */}
            {activeTab === 'general' && (
              <div className="bg-[#12131C] rounded-2xl p-6 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#D4AF37]/15">
                  <Building2 className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">Identité Juridique de l&apos;Entreprise</h2>
                    <p className="text-[11px] text-slate-400">Ces mentions figureront sur l&apos;en-tête de tous vos documents officiels.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Raison Sociale / Nom commercial <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="Ex: IziFacture SARL"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Slogan ou Activité Principale
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      placeholder="Ex: Solutions SaaS B2B UEMOA"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Numéro RCCM <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.rccm}
                      onChange={(e) => handleChange('rccm', e.target.value)}
                      placeholder="Ex: CI-ABJ-2023-B-12948"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      NIF / Compte Contribuable (CC) <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nif}
                      onChange={(e) => handleChange('nif', e.target.value)}
                      placeholder="Ex: 2109482 X"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Tax & Currency */}
            {activeTab === 'tax' && (
              <div className="bg-[#12131C] rounded-2xl p-6 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#D4AF37]/15">
                  <Percent className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">Paramètres Fiscaux & Monétaires</h2>
                    <p className="text-[11px] text-slate-400">Configurez votre monnaie et vos règles de taxe applicables.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Devise Principale
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    >
                      <option value="Franc CFA (FCFA)">Franc CFA (FCFA / XOF / XAF)</option>
                      <option value="EUR (€)">Euro (€ / EUR)</option>
                      <option value="USD ($)">Dollar US ($ / USD)</option>
                      <option value="GNF">Franc Guinéen (GNF)</option>
                      <option value="CDF">Franc Congolais (CDF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Taux de TVA Standard (%) <span className="text-[#D4AF37]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        required
                        value={formData.vatRate}
                        onChange={(e) => handleChange('vatRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-bold focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono font-bold">
                        %
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Ex: 18% en Côte d&apos;Ivoire et UEMOA, 19.25% au Cameroun (CEMAC).
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Délai de paiement par défaut (en jours)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={formData.paymentTermsDays}
                        onChange={(e) => handleChange('paymentTermsDays', parseInt(e.target.value, 10) || 15)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-bold focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">
                        Jours
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Contact & Headquarters */}
            {activeTab === 'contact' && (
              <div className="bg-[#12131C] rounded-2xl p-6 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#D4AF37]/15">
                  <Phone className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">Coordonnées & Siège Social</h2>
                    <p className="text-[11px] text-slate-400">Vos canaux officiels pour les relances et la relation client.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Téléphone Officiel <span className="text-[#D4AF37]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Email Commercial <span className="text-[#D4AF37]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="contact@entreprise.ci"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Site Web Officiel
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="www.monentreprise.ci"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                      <Globe className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Ville & Pays <span className="text-[#D4AF37]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={`${formData.city}, ${formData.country}`}
                        onChange={(e) => {
                          const parts = e.target.value.split(',');
                          handleChange('city', parts[0]?.trim() || '');
                          if (parts[1]) handleChange('country', parts[1]?.trim() || '');
                        }}
                        placeholder="Abidjan, Côte d'Ivoire"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Adresse Physique Complète
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Immeuble Horizon, Boulevard de la République, Plateau"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Banking & Mobile Money */}
            {activeTab === 'banking' && (
              <div className="bg-[#12131C] rounded-2xl p-6 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#D4AF37]/15">
                  <Landmark className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">Coordonnées Bancaires & Mobile Money</h2>
                    <p className="text-[11px] text-slate-400">Ces informations sont imprimées au bas de vos factures pour le règlement.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Établissement Bancaire Principal
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      placeholder="Ex: Société Générale Côte d'Ivoire (SGCI) / Ecobank"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      IBAN / Relevé d&apos;Identité Bancaire (RIB)
                    </label>
                    <input
                      type="text"
                      value={formData.iban}
                      onChange={(e) => handleChange('iban', e.target.value)}
                      placeholder="CI93 CI03 4010 0100 1234 5678 9012"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Numéros Mobile Money (Wave / Orange / MTN / Moov)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.mobileMoney}
                        onChange={(e) => handleChange('mobileMoney', e.target.value)}
                        placeholder="Wave / Orange Money : +225 07 00 00 00 00"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                      <Smartphone className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Templates & Legal notes */}
            {activeTab === 'templates' && (
              <div className="bg-[#12131C] rounded-2xl p-6 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#D4AF37]/15">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">Numérotation & Mentions Légales</h2>
                    <p className="text-[11px] text-slate-400">Préfixes de numérotation séquentielle et clauses obligatoires.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Préfixe des Factures
                    </label>
                    <input
                      type="text"
                      value={formData.invoicePrefix}
                      onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                      placeholder="FAC-2024-"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Préfixe des Devis
                    </label>
                    <input
                      type="text"
                      value={formData.quotePrefix}
                      onChange={(e) => handleChange('quotePrefix', e.target.value)}
                      placeholder="DEV-2024-"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Mentions Légales de Pied de Page (Pénalités de retard, Juridiction)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.invoiceFooterNotes}
                      onChange={(e) => handleChange('invoiceFooterNotes', e.target.value)}
                      placeholder="Paiement exigible à la date d'échéance. Tout retard..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium text-xs placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Toutes les modifications sont sauvegardées localement dans votre espace de travail.
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Enregistrer</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Panel (Right Side) */}
        <div className="space-y-6">
          <div className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/25 shadow-[0_4px_25px_rgba(0,0,0,0.5)] sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/15 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Aperçu Direct sur Facture
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                Temps réel
              </span>
            </div>

            {/* Mini Invoice Preview Card */}
            <div className="bg-[#090A0F] rounded-xl p-4 border border-[#D4AF37]/20 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight">
                    {formData.companyName || 'Nom de votre Entreprise'}
                  </h3>
                  <p className="text-[10px] text-[#DFBA55] font-medium">
                    {formData.tagline || 'Activité / Slogan'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#D4AF37] font-bold block">
                    {formData.invoicePrefix}0042
                  </span>
                  <span className="text-[9px] text-slate-400">FACTURE B2B</span>
                </div>
              </div>

              <div className="text-[10px] space-y-1 text-slate-300 font-mono bg-[#141522] p-2.5 rounded-lg border border-[#D4AF37]/15">
                <p className="flex justify-between">
                  <span className="text-slate-400">RCCM :</span>
                  <span className="text-[#F5E6B3] font-bold">{formData.rccm || '—'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">NIF / CC :</span>
                  <span className="text-[#F5E6B3] font-bold">{formData.nif || '—'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">TVA Standard :</span>
                  <span className="text-[#F5E6B3] font-bold">{formData.vatRate}%</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Devise :</span>
                  <span className="text-white font-medium">{formData.currency}</span>
                </p>
              </div>

              <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-[#D4AF37]/10 pt-2">
                <p className="text-slate-300 font-sans">
                  {formData.address || 'Adresse physique'}
                </p>
                <p className="text-slate-300 font-sans">
                  {formData.city}, {formData.country}
                </p>
                <p className="text-[#F5E6B3] font-mono">
                  {formData.phone} • {formData.email}
                </p>
              </div>

              {formData.iban && (
                <div className="text-[9px] text-slate-400 bg-[#12131C] p-2 rounded border border-[#D4AF37]/15">
                  <span className="text-[#D4AF37] font-bold block mb-0.5">Règlement :</span>
                  <p className="font-mono text-slate-300">{formData.bankName}</p>
                  <p className="font-mono text-[#F5E6B3] truncate">{formData.iban}</p>
                  {formData.mobileMoney && (
                    <p className="font-mono text-amber-300 mt-0.5 truncate">{formData.mobileMoney}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-[#141522] border border-[#D4AF37]/15 flex items-start gap-2 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <span>
                Ces mentions sont conformes aux normes OHADA et aux dispositions de la Direction Générale des Impôts (DGI) dans l&apos;espace UEMOA/CEMAC.
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
