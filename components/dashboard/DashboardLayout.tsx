'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';

import SubscriptionGuard from '@/components/monetization/SubscriptionGuard';

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumb?: {
    section: string;
    page: string;
  };
  fullWidth?: boolean;
}

export default function DashboardLayout({
  children,
  breadcrumb = { section: 'Opérations', page: "Vue d'ensemble" },
  fullWidth = false,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090A0F] text-[#F5E6B3]">
        <div className="w-10 h-10 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Chargement IziFacture…
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#090A0F] print:!bg-white print:!bg-none print:!min-h-0 print:!h-auto text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.07),rgba(9,10,15,1))]">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full print:bg-white">
        {/* Topbar */}
        <Topbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          breadcrumb={breadcrumb}
        />

        {/* Dashboard Content Container with Subscription Guard */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:bg-white print:space-y-0 ${fullWidth ? 'max-w-none' : 'max-w-7xl'}`}>
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        </main>
      </div>
    </div>
  );
}
