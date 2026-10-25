'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingCta() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-margin mb-16">
      <div className="relative w-full rounded-3xl bg-inverse-surface text-on-primary p-8 md:p-16 overflow-hidden flex flex-col items-center text-center shadow-2xl">
        {/* Subtle Decorative Radial Shimmer Background */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md font-label-sm text-label-sm font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-primary-fixed"></span>
          <span className="text-primary-fixed">Rejoignez l&apos;élite des entrepreneurs africains</span>
        </div>

        <h2 className="font-headline-lg text-headline-lg md:text-5xl font-bold max-w-3xl mb-6 leading-tight">
          Rejoignez plus de 2 500 entrepreneurs qui facturent{" "}
          <span className="italic font-serif font-normal text-primary-fixed">comme des pros.</span>
        </h2>

        <p className="font-body-lg text-body-lg text-inverse-on-surface/80 max-w-xl mb-10">
          Commencez gratuitement dès aujourd&apos;hui. Aucune carte bancaire requise, configuration instantanée.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
          <Link
            className="px-8 py-4 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-[0_16px_36px_rgba(37,99,235,0.4)] hover:bg-primary transition-all duration-300 hover:scale-105"
            href="/login?mode=signup"
          >
            Commencer gratuitement
          </Link>
          <a
            className="px-8 py-4 rounded-full bg-white/10 text-on-primary hover:bg-white/20 transition-all font-label-lg text-label-lg font-medium"
            href="#demo"
          >
            Planifier un appel d&apos;onboarding
          </a>
        </div>

        <div className="mt-8 flex items-center gap-6 text-xs text-inverse-on-surface/60">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">lock</span> Données chiffrées SSL 256 bits
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">bolt</span> Activation en 30 sec
          </span>
        </div>
      </div>
    </section>
  );
}
