'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import {
  Sparkles,
  CheckCircle2,
  Zap,
  Clock,
  X,
  Trophy,
  ArrowRight,
} from 'lucide-react';

export default function SubscriptionStatusBanner() {
  const {
    isActive,
    hasReachedLimit,
    loading,
    initiatePayment,
    isInitiating,
  } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed) {
    return null;
  }

  // 1. PRO ACTIVE USERS (cbonano056@gmail.com, appiayves8@gmail.com)
  if (isActive) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141522] via-[#12131C] to-[#181928] border border-[#D4AF37]/35 p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),0_0_20px_rgba(212,175,55,0.08)] mb-6 transition-all duration-300">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#DFBA55]/20 via-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/20 text-[#F5E6B3] border border-[#D4AF37]/40 shadow-sm">
                  <Zap className="w-3 h-3 text-[#D4AF37]" />
                  Licence Pro Illimitée
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  • Facturation & Paiements illimités
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-extrabold text-white mt-1 tracking-tight">
                Toutes les fonctionnalités IziFacture Pro sont actives
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Factures et devis illimités, passerelle Wave & Mobile Money, exports PDF certifiés et réconciliation bancaire.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Masquer le bandeau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-3 pt-3 border-t border-[#D4AF37]/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Facturation OHADA illimitée</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Passerelle Wave & Mobile Money</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Exports PDF & WhatsApp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Multi-banques & RIB configurables</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. AT THE 6th INVOICE (Automatic conversion trigger when limit reached)
  if (hasReachedLimit) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#181926] via-[#141522] to-[#1a1710] border border-[#D4AF37]/50 p-5 sm:p-6 shadow-[0_6px_30px_rgba(212,175,55,0.18)] mb-6 transition-all duration-300">
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DFBA55]/30 to-[#B8860B]/20 border border-[#D4AF37]/50 flex items-center justify-center flex-shrink-0 shadow-md">
              <Trophy className="w-6 h-6 text-[#D4AF37]" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-[#F5E6B3] border border-amber-500/40">
                  🎉 Palier Atteint
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Félicitations pour vos 5 premières factures ! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Votre entreprise se développe activement et vos clients vous font confiance. Vous avez profité gratuitement de vos 5 premières factures offertes. Pour continuer à facturer en illimité et encaisser facilement via <span className="text-[#F5E6B3] font-bold">Wave</span>, Orange Money et MTN MoMo, activez votre abonnement Pro pour seulement 5 000 F CFA / mois.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => initiatePayment()}
              disabled={isInitiating}
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-xs tracking-wide shadow-[0_2px_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Passer à IziFacture Pro - 5 000 F</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. FREE USERS WITH LESS THAN 5 INVOICES:
  // Discrétion totale : le texte "5 factures gratuites" ne s'affiche PAS !
  // Le décompte est entièrement automatique et silencieux.
  return null;
}
