'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 md:px-margin">
      <div className="w-full max-w-7xl h-16 bg-surface-container-lowest/90 backdrop-blur-xl rounded-full px-space-lg flex items-center justify-between shadow-[0_8px_32px_rgba(15,23,42,0.08)] border border-white/60">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-space-sm group">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          </div>
          <span className="font-title-lg text-title-lg tracking-tight text-on-surface font-bold">iziFacture</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-space-sm p-space-xs">
          <a
            className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            href="#fonctionnalites"
          >
            Fonctionnalités
          </a>
          <a
            className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            href="#comment-ca-marche"
          >
            Comment ça marche
          </a>
          <a
            className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            href="#tarifs"
          >
            Tarifs
          </a>
          <a
            className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            href="#temoignages"
          >
            Témoignages
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-space-sm">
          <Link
            className="hidden sm:inline-flex items-center justify-center px-space-lg py-space-sm rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_10px_24px_rgba(37,99,235,0.28)] hover:bg-primary transition-all duration-200"
            href="/login"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/login"
            title="Se connecter"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm hover:scale-105 transition-transform text-on-primary"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 inset-x-4 bg-surface-container-lowest/95 backdrop-blur-2xl rounded-2xl p-5 shadow-[0_12px_36px_rgba(15,23,42,0.15)] border border-white flex flex-col gap-3">
          <a
            href="#fonctionnalites"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Fonctionnalités
          </a>
          <a
            href="#comment-ca-marche"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Comment ça marche
          </a>
          <a
            href="#tarifs"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Tarifs
          </a>
          <a
            href="#temoignages"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Témoignages
          </a>
          <div className="pt-3 border-t border-surface-container flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold text-center shadow-md hover:bg-primary transition-colors"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-full bg-surface-container-low text-on-surface font-label-md text-label-md font-medium text-center hover:bg-surface-container transition-colors"
            >
              Se connecter à mon compte
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
