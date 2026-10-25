'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingHero() {
  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Ambient Silky Light Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[950px] pointer-events-none -z-10 opacity-70">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-fixed/25 via-surface-container-high/40 to-transparent blur-3xl rounded-full transform -rotate-12 scale-125"></div>
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary-container/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-40 left-10 w-[600px] h-[400px] bg-secondary-fixed/30 blur-[140px] rounded-full"></div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative w-full max-w-7xl mx-auto px-4 md:px-margin pt-6 md:pt-12 pb-20 flex flex-col items-center text-center">
        {/* Top Pill Badge */}
        <div className="inline-flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-sm border border-white/60 mb-8 transition-transform hover:scale-105 duration-300">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></span>
          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
            Conforme normes OHADA &amp; TVA 18% UEMOA
          </span>
          <span className="material-symbols-outlined text-primary text-base">verified</span>
        </div>

        {/* Editorial High-Contrast Headline */}
        <h1 className="max-w-4xl font-headline-hero text-headline-hero-mobile md:text-headline-hero text-on-surface tracking-tight mb-6">
          Toute votre facturation{" "}
          <span className="font-headline-hero italic font-normal text-primary">d&apos;entrepreneur</span>, réunie en{" "}
          <span className="font-headline-hero italic font-normal">un seul endroit.</span>
        </h1>
        <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant mb-10 leading-relaxed">
          Dites adieu aux factures bricolées sur Word et Excel. iziFacture automatise vos devis, calcule la TVA 18% et suit vos règlements en FCFA en temps réel.
        </p>

        {/* Dual Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-space-md mb-16">
          <Link
            className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-8 py-4 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_16px_36px_rgba(37,99,235,0.32)] hover:bg-primary transition-all duration-300 hover:scale-[1.02]"
            href="/login?mode=signup"
          >
            <span>Commencer gratuitement</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
          <a
            className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-8 py-4 rounded-full bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:shadow-md transition-all duration-300 border border-white/80"
            href="#demo"
          >
            <span className="material-symbols-outlined text-primary text-lg">play_circle</span>
            <span>Voir la démo (2 min)</span>
          </a>
        </div>

        {/* Telemetry Perspective UI Display */}
        <div className="relative w-full max-w-5xl mt-4" id="demo">
          {/* Ambient Backing Glow under mockup */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-fixed-dim/20 via-surface-container/60 to-secondary-fixed/30 rounded-3xl blur-2xl transform -translate-y-4"></div>

          {/* Main Glass Console Container */}
          <div className="relative bg-surface-container-lowest/90 backdrop-blur-2xl rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] border border-white/90 text-left">
            {/* Console Header Strip */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-surface-container">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#27C93F]"></span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold ml-2">
                  iziFacture Live Console
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">
                  Synchronisé • UEMOA Cloud
                </span>
              </div>
            </div>

            {/* Inner Console Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recent Invoices Active Queue (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    Factures Récentes &amp; Règlements
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Devise: XOF (FCFA)</span>
                </div>

                {/* Invoices Table Simulated */}
                <div className="flex flex-col gap-3">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-container-low transition-colors duration-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        AD
                      </div>
                      <div>
                        <h4 className="font-title-md text-title-md text-on-surface">Awa Diallo</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Prestation Digitale • Dakar, SN
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-title-md text-title-md text-on-surface font-bold">450 000 FCFA</p>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Payé (Wave)
                      </span>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-container-low transition-colors duration-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-sm">
                        CK
                      </div>
                      <div>
                        <h4 className="font-title-md text-title-md text-on-surface">Cabinet Kouassi &amp; Associés</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Audit Comptable Semestriel • Abidjan, CI
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-title-md text-title-md text-on-surface font-bold">1 200 000 FCFA</p>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Payé (Virement)
                      </span>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-container-low transition-colors duration-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-bold text-sm">
                        BE
                      </div>
                      <div>
                        <h4 className="font-title-md text-title-md text-on-surface">BTP Étoile Douala</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Fourniture Matériaux • Douala, CM
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-title-md text-title-md text-on-surface font-bold">850 000 FCFA</p>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-amber-600 font-semibold">
                        <span className="material-symbols-outlined text-sm">schedule</span> Échéance 48h
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Insights (4 cols) */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-4 p-5 rounded-2xl bg-surface-container-low">
                <div className="flex flex-col gap-2">
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Assistant Facturation Rapide
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    Générez un acompte avec calcul automatique de la TVA 18% &amp; retenue BNC.
                  </p>
                  <div className="mt-3 p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between shadow-xs">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">TVA (18%) calculée</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">873 000 FCFA</span>
                  </div>
                </div>
                <Link
                  href="/login?mode=signup"
                  className="w-full py-3 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Créer Facture Express
                </Link>
              </div>
            </div>
          </div>

          {/* Overlapping Floating Card Left */}
          <div className="hidden sm:flex absolute -bottom-8 -left-6 z-20 flex-col gap-2 p-5 rounded-2xl bg-gradient-to-br from-primary-container to-primary text-on-primary shadow-[0_20px_48px_-10px_rgba(37,99,235,0.45)] border border-white/30 text-left min-w-[240px] transform hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-sm">receipt_long</span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-white/25">Mois en cours</span>
            </div>
            <p className="font-label-md text-label-md text-on-primary/90">Factures réglées</p>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-md text-headline-md font-bold">48 Factures</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-primary/90 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> +18.4% vs mois dernier
            </span>
          </div>

          {/* Overlapping Floating Card Right */}
          <div className="hidden sm:flex absolute -bottom-6 -right-6 z-20 flex-col gap-1.5 p-5 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl text-on-surface shadow-[0_20px_40px_rgba(15,23,42,0.12)] border border-white text-left min-w-[250px] transform hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                99.4% encaissé
              </span>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant">Total Encaissé</span>
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              4 850 000 <span className="text-sm font-normal text-on-surface-variant">FCFA</span>
            </span>
            <div className="flex items-center gap-2 pt-1 border-t border-surface-container text-[11px] text-on-surface-variant">
              <span className="text-primary font-bold">+2.3% cette semaine</span>
              <span>•</span>
              <span>Wave / MoMo / Banques</span>
            </div>
          </div>
        </div>

        {/* Social Proof Logos Strip */}
        <div className="w-full mt-24 pt-8 flex flex-col items-center">
          <p className="font-label-md text-label-md text-on-surface-variant tracking-wider uppercase mb-6 font-semibold">
            Adopté par plus de 2 500 PME et indépendants à Abidjan, Dakar, Douala et Cotonou
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary">apartment</span> BTP Afrique
            </div>
            <div className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary">hub</span> Teranga Tech
            </div>
            <div className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary">local_shipping</span> Sahel Express
            </div>
            <div className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary">gavel</span> Cabinet Diallo &amp; Cie
            </div>
            <div className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary">storefront</span> Baobab Retail
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
