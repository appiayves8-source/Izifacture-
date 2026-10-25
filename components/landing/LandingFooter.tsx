'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="w-full bg-surface-container-low mt-space-xl py-space-xl border-t border-surface-container">
      <div className="max-w-7xl mx-auto px-4 md:px-margin flex flex-col gap-space-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <Link href="/" className="flex items-center gap-space-sm">
              <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-xs">
                <span className="material-symbols-outlined text-[17px]">receipt_long</span>
              </div>
              <span className="font-title-md text-title-md font-bold text-on-surface">iziFacture</span>
            </Link>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mt-1">
              Plateforme de facturation et conformité fiscale conçue pour l&apos;accélération des PME africaines.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              Wave
            </div>
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              Orange Money
            </div>
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              MTN MoMo
            </div>
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              Virement Bancaire (UEMOA)
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md border-t border-surface-container/60">
          <div className="flex items-center gap-space-sm">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-label-md text-label-md text-on-surface-variant">Fait avec fierté en Afrique</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-space-lg text-center">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Confidentialité
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Mentions Légales
            </span>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              href="/support"
            >
              Support
            </Link>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              &copy; {new Date().getFullYear()} iziFacture. Tous droits réservés.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}