'use client';

import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatFCFA } from '@/lib/utils/formatters';
import { StatKpi } from '@/lib/data/mockData';

import Link from 'next/link';

const iconMap = {
  FileText: FileText,
  CheckCircle2: CheckCircle2,
  Clock: Clock,
  AlertTriangle: AlertTriangle,
};

interface StatCardProps {
  kpi: StatKpi;
}

export default function StatCard({ kpi }: StatCardProps) {
  const IconComponent = iconMap[kpi.icon as keyof typeof iconMap] || FileText;

  // Specific theme accent by card type
  const getTheme = () => {
    switch (kpi.id) {
      case 'total_facture':
        return {
          iconBg: 'bg-[#D4AF37]/20 text-[#E5C158] border border-[#D4AF37]/40 shadow-sm',
          badgeBg: 'bg-[#D4AF37]/15 text-[#F5E6B3] border-[#D4AF37]/35',
          accent: 'border-l-4 border-l-[#D4AF37]',
          href: '/invoices',
        };
      case 'total_encaisse':
        return {
          iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm',
          badgeBg: 'bg-amber-500/15 text-amber-200 border-amber-500/35',
          accent: 'border-l-4 border-l-[#E5C158]',
          href: '/invoices?status=payee',
        };
      case 'en_attente':
        return {
          iconBg: 'bg-slate-800/90 text-slate-300 border border-slate-700 shadow-sm',
          badgeBg: 'bg-slate-800/80 text-slate-300 border-slate-700',
          accent: 'border-l-4 border-l-slate-600',
          href: '/invoices?status=envoyee',
        };
      case 'en_retard':
        return {
          iconBg: 'bg-red-950/50 text-red-300 border border-red-800/40 shadow-sm',
          badgeBg: 'bg-red-950/40 text-red-300 border-red-800/40',
          accent: 'border-l-4 border-l-red-500/70',
          href: '/invoices?status=en_retard',
        };
      default:
        return {
          iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          accent: '',
          href: '/invoices',
        };
    }
  };

  const theme = getTheme();

  return (
    <Link
      href={theme.href}
      prefetch={true}
      className={`group bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/60 hover:shadow-[0_4px_25px_rgba(212,175,55,0.18)] active:scale-[0.98] transition-all duration-200 flex flex-col justify-between cursor-pointer ${theme.accent}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold text-slate-400 group-hover:text-amber-100 uppercase tracking-wider font-sans transition-colors">
          {kpi.title}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme.iconBg} group-hover:scale-110 transition-transform duration-200`}>
          <IconComponent className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xl sm:text-2xl font-black text-white group-hover:text-[#F5E6B3] tracking-tight font-sans tabular-nums transition-colors">
          {formatFCFA(kpi.amount)}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${theme.badgeBg}`}
          >
            {kpi.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {kpi.change}
          </span>
          <span className="text-[11px] text-slate-400 font-medium truncate">
            {kpi.subtext}
          </span>
        </div>
      </div>
    </Link>
  );
}
