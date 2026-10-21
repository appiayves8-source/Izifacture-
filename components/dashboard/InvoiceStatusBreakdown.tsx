'use client';

import React from 'react';
import { useInvoiceStore } from '@/lib/store/invoiceStore';

export default function InvoiceStatusBreakdown() {
  const { invoices } = useInvoiceStore();

  const totalCount = invoices.length;
  const paidCount = invoices.filter((i) => i.status === 'payee').length;
  const sentCount = invoices.filter((i) => i.status === 'envoyee').length;
  const pendingCount = invoices.filter((i) => i.status === 'brouillon').length;
  const overdueCount = invoices.filter((i) => i.status === 'en_retard').length;

  const getPct = (cnt: number) => (totalCount > 0 ? Math.round((cnt / totalCount) * 100) : 0);

  const statuses = [
    {
      key: 'payee',
      label: 'Payées',
      count: paidCount,
      percentage: getPct(paidCount),
      color: '#D4AF37',
    },
    {
      key: 'envoyee',
      label: 'Envoyées',
      count: sentCount,
      percentage: getPct(sentCount),
      color: '#f59e0b',
    },
    {
      key: 'en_retard',
      label: 'En retard',
      count: overdueCount,
      percentage: getPct(overdueCount),
      color: '#ef4444',
    },
    {
      key: 'brouillon',
      label: 'Brouillons',
      count: pendingCount,
      percentage: getPct(pendingCount),
      color: '#64748b',
    },
  ];

  return (
    <div className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-full flex flex-col justify-between">
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-white tracking-tight font-sans">
          Statut des Factures
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Répartition du portefeuille actuel
        </p>
      </div>

      {/* Large number & sublabel */}
      <div className="my-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight font-sans tabular-nums">
            {totalCount}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            factures au total
          </span>
        </div>

        {/* Multi-segment progress bar */}
        <div className="h-2.5 w-full flex rounded-full overflow-hidden mt-3 gap-0.5 bg-[#090A0F] p-0.5 border border-[#D4AF37]/25">
          {statuses.map((s) => (
            <div
              key={s.key}
              style={{
                width: `${s.percentage}%`,
                backgroundColor: s.color,
              }}
              className="h-full rounded-sm transition-all duration-500 first:rounded-l-full last:rounded-r-full shadow-sm"
              title={`${s.label}: ${s.count} (${s.percentage}%)`}
            />
          ))}
        </div>
      </div>

      {/* Status rows */}
      <div className="space-y-3 pt-2 border-t border-[#D4AF37]/15">
        {statuses.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between text-xs py-0.5 group cursor-default"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: s.color }}
                className="w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_5px_currentColor]"
              />
              <span className="text-slate-300 font-medium group-hover:text-amber-200 transition-colors">
                {s.label}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-bold text-white font-mono tabular-nums">
                {s.count}
              </span>
              <span className="text-slate-400 font-medium font-mono text-[11px] w-8 text-right tabular-nums">
                {s.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
