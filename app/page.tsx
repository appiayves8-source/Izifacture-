'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronDown,
  Plus,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import RevenueActivityChart from '@/components/dashboard/RevenueActivityChart';
import InvoiceStatusBreakdown from '@/components/dashboard/InvoiceStatusBreakdown';
import RecentInvoicesTable from '@/components/dashboard/RecentInvoicesTable';
import LatestInvoiceCard from '@/components/dashboard/LatestInvoiceCard';
import SubscriptionStatusBanner from '@/components/dashboard/SubscriptionStatusBanner';
import { useInvoiceStore } from '@/lib/store/invoiceStore';
import { useAuth } from '@/lib/context/AuthContext';

export interface StatKpi {
  id: string;
  title: string;
  amount: number;
  change: string;
  isPositive: boolean;
  subtext: string;
  icon: string;
}

export default function DashboardOverviewPage() {
  const [period, setPeriod] = useState('Toutes les factures');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const { invoices } = useInvoiceStore();
  const { firstName } = useAuth();

  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'payee');
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  
  const pendingInvoices = invoices.filter((inv) => inv.status === 'envoyee' || inv.status === 'brouillon');
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  const overdueInvoices = invoices.filter((inv) => inv.status === 'en_retard');
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  const recoveryRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) + '%' : '0%';

  const dynamicKpis: StatKpi[] = [
    {
      id: 'total_facture',
      title: 'TOTAL FACTURÉ',
      amount: totalBilled,
      change: `${invoices.length} facture${invoices.length > 1 ? 's' : ''}`,
      isPositive: true,
      subtext: 'volume global en base Supabase',
      icon: 'FileText',
    },
    {
      id: 'total_encaisse',
      title: 'TOTAL ENCAISSÉ',
      amount: totalPaid,
      change: recoveryRate,
      isPositive: true,
      subtext: `${paidInvoices.length} facture${paidInvoices.length > 1 ? 's' : ''} soldée${paidInvoices.length > 1 ? 's' : ''}`,
      icon: 'CheckCircle2',
    },
    {
      id: 'en_attente',
      title: 'EN ATTENTE',
      amount: totalPending,
      change: `${pendingInvoices.length} facture${pendingInvoices.length > 1 ? 's' : ''}`,
      isPositive: false,
      subtext: `${invoices.filter((i) => i.status === 'envoyee').length} envoyée${invoices.filter((i) => i.status === 'envoyee').length > 1 ? 's' : ''}, ${invoices.filter((i) => i.status === 'brouillon').length} brouillon`,
      icon: 'Clock',
    },
    {
      id: 'en_retard',
      title: 'EN RETARD (IMPAYÉ)',
      amount: totalOverdue,
      change: `${overdueInvoices.length} facture${overdueInvoices.length > 1 ? 's' : ''}`,
      isPositive: false,
      subtext: overdueInvoices.length > 0 ? 'relance exigée' : 'aucun impayé',
      icon: 'AlertTriangle',
    },
  ];

  const periods = [
    'Toutes les factures',
    '30 derniers jours',
    '7 derniers jours',
    'Ce trimestre (T4)',
  ];

  return (
    <DashboardLayout breadcrumb={{ section: 'Opérations', page: "Vue d'ensemble" }}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans">Opérations</span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-xs text-slate-300 font-medium">Vue d&apos;ensemble</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
            <span>Bonjour, {firstName || 'Cyrille'}</span>
            <span className="text-xl sm:text-2xl animate-pulse">✨</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Tableau de bord financier connecté en direct à votre base de données Supabase.
          </p>
        </div>

        {/* Actions: Period Selector & New Invoice Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#13141F] border border-[#D4AF37]/30 text-xs font-semibold text-[#F5E6B3] shadow-sm hover:bg-[#181926] hover:border-[#D4AF37]/60 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{period}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {periodDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#13141F] border border-[#D4AF37]/40 shadow-2xl py-1 z-30 animate-in fade-in-50 zoom-in-95 backdrop-blur-xl">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                      p === period
                        ? 'bg-[#D4AF37]/20 text-[#F5E6B3] font-bold border-l-2 border-[#D4AF37]'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Call to Action */}
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nouvelle Facture</span>
          </Link>
        </div>
      </div>

      {/* Mode Test Gratuit / Subscription Pro Status Banner */}
      <SubscriptionStatusBanner />

      {/* 4 Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicKpis.map((kpi) => (
          <StatCard key={kpi.id} kpi={kpi} />
        ))}
      </section>

      {/* Activity Chart & Status Breakdown (Grid matching Atlas layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueActivityChart />
        </div>
        <div className="lg:col-span-1">
          <InvoiceStatusBreakdown />
        </div>
      </section>

      {/* Highlight Card: Dernière Facture */}
      <section>
        <LatestInvoiceCard />
      </section>

      {/* Table: Dernières Factures */}
      <section>
        <RecentInvoicesTable />
      </section>
    </DashboardLayout>
  );
}
