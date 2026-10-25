'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPricing() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-margin py-24 flex flex-col items-center" id="tarifs">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm font-bold mb-4">
        <span>TRANSPARENCE TOTALE</span>
      </div>
      <h2 className="font-headline-lg text-headline-lg md:text-4xl text-on-surface text-center font-bold max-w-2xl mb-4">
        Des tarifs clairs, <span className="italic font-serif font-normal text-primary">en Franc CFA</span>.
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-xl mb-12">
        Pas de frais cachés, aucun engagement de durée. Choisissez le forfait qui accompagne l&apos;envergure de votre business.
      </p>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
        {/* Plan 1: Découverte */}
        <div className="p-8 rounded-3xl bg-surface-container-low flex flex-col justify-between">
          <div>
            <span className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
              Découverte
            </span>
            <div className="flex items-baseline gap-1 mt-4 mb-6">
              <span className="font-headline-hero text-headline-hero font-bold text-on-surface">0</span>
              <span className="font-title-md text-title-md text-on-surface-variant">FCFA / mois</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Idéal pour les indépendants qui débutent leur activité commerciale.
            </p>
            <ul className="flex flex-col gap-3 pt-6 border-t border-surface-container">
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> 5 factures &amp; devis / mois
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> 1 utilisateur unique
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> Calcul automatique TVA 18%
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> Export PDF avec logo standard
              </li>
            </ul>
          </div>
          <Link
            className="mt-8 w-full py-3.5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md font-bold text-center hover:bg-surface-container transition-colors shadow-xs"
            href="/login"
          >
            Commencer gratuitement
          </Link>
        </div>

        {/* Plan 2: Pro Entrepreneur (Highlighted Hero) */}
        <div className="p-8 md:p-10 rounded-3xl bg-surface-container-lowest shadow-[0_20px_50px_rgba(37,99,235,0.18)] flex flex-col justify-between relative border-2 border-primary-container md:scale-105 z-10">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold uppercase tracking-wide shadow-sm">
            Le Plus Choisi
          </div>
          <div>
            <span className="font-label-md text-label-md font-bold text-primary uppercase tracking-wider">
              Pro Entrepreneur
            </span>
            <div className="flex items-baseline gap-1 mt-4 mb-6">
              <span className="font-headline-hero text-headline-hero font-bold text-on-surface">5 000</span>
              <span className="font-title-md text-title-md text-on-surface-variant">FCFA / mois</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Pour les PME et consultants qui souhaitent accélérer leurs encaissements.
            </p>
            <ul className="flex flex-col gap-3.5 pt-6 border-t border-surface-container">
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm font-semibold">
                <span className="material-symbols-outlined text-primary text-base">check</span> Factures &amp; devis illimités
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm font-semibold">
                <span className="material-symbols-outlined text-primary text-base">check</span> Relances automatiques WhatsApp &amp; SMS
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm font-semibold">
                <span className="material-symbols-outlined text-primary text-base">check</span> Personnalisation complète de marque
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> Export comptable conforme OHADA
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> Support prioritaire 7j/7 WhatsApp
              </li>
            </ul>
          </div>
          <Link
            className="mt-8 w-full py-4 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold text-center shadow-[0_12px_28px_rgba(37,99,235,0.3)] hover:bg-primary transition-all duration-200"
            href="/login"
          >
            Activer l&apos;offre Pro
          </Link>
        </div>

        {/* Plan 3: Business */}
        <div className="p-8 rounded-3xl bg-surface-container-low flex flex-col justify-between">
          <div>
            <span className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
              Croissance Business
            </span>
            <div className="flex items-baseline gap-1 mt-4 mb-6">
              <span className="font-headline-hero text-headline-hero font-bold text-on-surface">15 000</span>
              <span className="font-title-md text-title-md text-on-surface-variant">FCFA / mois</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Conçu pour les structures établies avec équipes commerciales et comptables.
            </p>
            <ul className="flex flex-col gap-3 pt-6 border-t border-surface-container">
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> Jusqu&apos;à 10 collaborateurs
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> Multi-devises (FCFA, EUR, USD, NGN)
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> Gestion multi-entreprises &amp; filiales
              </li>
              <li className="flex items-center gap-2 text-on-surface font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-primary text-base">check</span> API &amp; intégration ERP personnalisée
              </li>
            </ul>
          </div>
          <Link
            className="mt-8 w-full py-3.5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md font-bold text-center hover:bg-surface-container transition-colors shadow-xs"
            href="/login"
          >
            Contacter notre équipe
          </Link>
        </div>
      </div>
    </section>
  );
}
