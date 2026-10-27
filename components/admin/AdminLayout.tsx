'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import SubscriptionGuard from '@/components/monetization/SubscriptionGuard';

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumb?: { section: string; page: string };
  fullWidth?: boolean;
}

/**
 * AdminLayout — Wrapper réservé aux administrateurs (role = 'admin').
 * Redirige vers /login si non connecté, vers /dashboard si rôle 'user'.
 * Identité visuelle Noir & Or inchangée.
 */
export default function AdminLayout({
  children,
  breadcrumb = { section: 'Administration', page: "Vue d'ensemble" },
  fullWidth = false,
}: AdminLayoutProps) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      // Utilisateur connecté mais pas admin : renvoi vers son espace
      router.replace('/dashboard');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090A0F] text-[#F5E6B3]">
        <div className="w-10 h-10 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Vérification accès administrateur…
        </p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#090A0F] print:!bg-white print:!bg-none print:!min-h-0 print:!h-auto text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.07),rgba(9,10,15,1))]">
      {/* Bannière Admin */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-6 bg-gradient-to-r from-[#B8860B]/90 via-[#D4AF37]/90 to-[#B8860B]/90 flex items-center justify-center gap-2 text-black text-[10px] font-extrabold tracking-widest uppercase print:hidden">
        <span>⚙️</span>
        <span>Espace Administrateur — Accès Restreint</span>
        <span>⚙️</span>
      </div>

      {/* Sidebar Navigation (décalée de 24px pour la bannière) */}
      <div className="mt-6 print:mt-0">
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          adminMode
        />
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full print:bg-white mt-6 print:mt-0">
        <Topbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          breadcrumb={breadcrumb}
        />
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:bg-white print:space-y-0 ${fullWidth ? 'max-w-none' : 'max-w-7xl'}`}>
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        </main>
      </div>
    </div>
  );
}
