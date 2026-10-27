'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import UserDashboardOverview from '@/components/user/UserDashboardOverview';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (isAdmin) {
      router.replace('/admin');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090A0F] text-[#F5E6B3]">
        <div className="w-10 h-10 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Chargement de votre espace…
        </p>
      </div>
    );
  }

  if (!user || isAdmin) return null;

  return (
    <DashboardLayout breadcrumb={{ section: 'Mon Espace', page: 'Tableau de bord' }}>
      <UserDashboardOverview />
    </DashboardLayout>
  );
}
