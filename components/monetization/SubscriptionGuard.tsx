'use client';

import React from 'react';
import { useSubscription, MAX_FREE_INVOICES } from '@/lib/hooks/useSubscription';
import {
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  Zap,
  AlertTriangle,
  Trophy,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const {
    isActive,
    endsAt,
    loading,
    isPolling,
    invoicesCount,
    hasReachedLimit,
    error,
    initiatePayment,
    activateSandboxDirect,
    isInitiating,
    refreshSubscription,
  } = useSubscription();

  // 1. Vérification silencieuse en arrière-plan : on affiche le contenu normalement
  // pendant le chargement pour éviter tout écran de blocage visible.
  // Si l'abonnement est actif ou si la limite n'est pas atteinte, on laisse passer.
  if (loading) {
    // Rendu transparent pendant la vérification — aucun écran visible
    return <>{children}</>;
  }

  // 2. Polling silencieux après retour CinetPay : on affiche le contenu
  // La synchronisation se fait en arrière-plan sans interruption UI
  if (isPolling) {
    return <>{children}</>;
  }

  // 3. User is actively subscribed: always grant full access
  if (isActive) {
    return <>{children}</>;
  }

  // 4. Free Tier User with quota available (< 5 invoices): grant normal access
  if (!hasReachedLimit) {
    return <>{children}</>;
  }

  // 5. User reached the limit (at 6th invoice) OR subscription expired: Show Subscription Paywall
  const isFreeQuotaReached = invoicesCount >= MAX_FREE_INVOICES;

  return (
    <div className="relative min-h-[82vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.08),transparent_65%)] pointer-events-none" />

      <div className="relative w-full max-w-2xl bg-[#12131C] border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-10 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.12)]">
        {/* Top Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#D4AF37]/15">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1c1b18] to-[#12131C] border border-[#D4AF37]/40 flex items-center justify-center shadow-inner">
              {isFreeQuotaReached ? (
                <Trophy className="w-6 h-6 text-[#D4AF37]" />
              ) : (
                <Lock className="w-6 h-6 text-[#D4AF37]" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                {isFreeQuotaReached ? 'Offre Découverte Atteinte' : 'Accès Abonnement Pro'}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                IziFacture Pro — UEMOA / OHADA
              </h2>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            {isFreeQuotaReached
              ? `${invoicesCount} / ${MAX_FREE_INVOICES} factures générées`
              : (endsAt ? `Expiré le ${formatDate(endsAt)}` : 'Abonnement Requis')}
          </div>
        </div>

        {/* Core Convincing Message starting with "Félicitations..." */}
        <div className="mt-6 text-center sm:text-left space-y-3">
          {isFreeQuotaReached ? (
            <>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Félicitations pour vos 5 premières factures ! 🎉
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Votre entreprise se développe activement et vos clients vous font confiance. Vous avez profité gratuitement de vos 5 premières factures offertes. Pour débloquer la facturation illimitée et continuer à encaisser vos règlements via <span className="font-bold text-[#F5E6B3]">Wave</span>, Orange Money et MTN MoMo, activez votre abonnement Pro pour seulement 5 000 F CFA / mois.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Ton abonnement Pro à 5.000 F a expiré.
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Renouvelle pour continuer à facturer et encaisser via{' '}
                <span className="font-bold text-[#F5E6B3]">Wave</span>, Orange Money, MTN MoMo et Carte Bancaire.
              </p>
            </>
          )}
        </div>

        {/* Pricing Offer Card */}
        <div className="mt-6 p-5 rounded-2xl bg-[#181926]/90 border border-[#D4AF37]/25 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Formule Mensuelle Sans Engagement
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#F5E6B3] tracking-tight">
                  5 000
                </span>
                <span className="text-xs font-bold text-slate-400">
                  FCFA / mois (TTC)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/30 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#D4AF37]" />
                Facturation Illimitée
              </span>
            </div>
          </div>

          {/* Value propositions */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-[#D4AF37]/15 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Factures & Devis illimités (OHADA)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Encaissement direct Wave & Mobile Money</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Exports PDF certifiés & Envoi WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Gestion multi-comptes bancaires & RIB</span>
            </div>
          </div>
        </div>

        {/* Payment Channels Supported */}
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Canaux d&apos;encaissement CinetPay supportés :
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="px-2.5 py-2 rounded-xl bg-[#141522] border border-[#D4AF37]/20 flex flex-col items-center justify-center">
              <span className="text-xs font-extrabold text-[#1DC3F4]">Wave</span>
              <span className="text-[9px] text-slate-400">Côte d&apos;Ivoire</span>
            </div>
            <div className="px-2.5 py-2 rounded-xl bg-[#141522] border border-[#D4AF37]/20 flex flex-col items-center justify-center">
              <span className="text-xs font-extrabold text-[#FF6600]">Orange</span>
              <span className="text-[9px] text-slate-400">OM CI</span>
            </div>
            <div className="px-2.5 py-2 rounded-xl bg-[#141522] border border-[#D4AF37]/20 flex flex-col items-center justify-center">
              <span className="text-xs font-extrabold text-[#FFCC00]">MTN</span>
              <span className="text-[9px] text-slate-400">MoMo</span>
            </div>
            <div className="px-2.5 py-2 rounded-xl bg-[#141522] border border-[#D4AF37]/20 flex flex-col items-center justify-center">
              <span className="text-xs font-extrabold text-[#006699]">Moov</span>
              <span className="text-[9px] text-slate-400">Money</span>
            </div>
            <div className="col-span-2 sm:col-span-1 px-2.5 py-2 rounded-xl bg-[#141522] border border-[#D4AF37]/20 flex flex-col items-center justify-center">
              <span className="text-xs font-extrabold text-[#F5E6B3] flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#D4AF37]" /> CB
              </span>
              <span className="text-[9px] text-slate-400">Visa / Master</span>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-xs text-red-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              💡 Astuce : En environnement de développement, vous pouvez utiliser le bouton ci-dessous pour activer instantanément l&apos;accès Pro sans passer par une carte bancaire.
            </p>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => initiatePayment()}
            disabled={isInitiating}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_4px_25px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_30px_rgba(212,175,55,0.6)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isInitiating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Connexion CinetPay…</span>
              </>
            ) : (
              <>
                <span>Passer à IziFacture Pro - 5 000 F</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={() => refreshSubscription()}
            disabled={isInitiating}
            className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-[#181926] hover:bg-[#202234] text-xs font-bold text-[#F5E6B3] border border-[#D4AF37]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Rafraîchir après paiement"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Sandbox Direct Test Option */}
        <div className="mt-4 pt-4 border-t border-[#D4AF37]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Mode Développeur / Sandbox
            </span>
            <p className="text-[11px] text-slate-400">
              Débloquer la licence Pro immédiatement pour vos tests
            </p>
          </div>
          <button
            type="button"
            onClick={() => activateSandboxDirect()}
            disabled={isInitiating}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#F5E6B3] border border-[#D4AF37]/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
            Activer Pro (Mode Test Gratuit)
          </button>
        </div>

        {/* Security stamp */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>Paiement chiffré SSL 256 bits via CinetPay Checkout V2</span>
        </div>
      </div>
    </div>
  );
}
