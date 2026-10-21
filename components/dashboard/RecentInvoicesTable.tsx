'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FileText, Download, Eye, ChevronRight } from 'lucide-react';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { useInvoiceStore, Invoice, InvoiceStatus } from '@/lib/store/invoiceStore';

export default function RecentInvoicesTable() {
  const router = useRouter();
  const { invoices } = useInvoiceStore();
  const displayInvoices = invoices.slice(0, 6);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'payee':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]"></span>
            Payée
          </span>
        );
      case 'envoyee':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/30 text-amber-300 border border-amber-600/35">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Envoyée
          </span>
        );
      case 'en_retard':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/40 text-red-300 border border-red-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            En retard
          </span>
        );
      case 'brouillon':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Brouillon
          </span>
        );
    }
  };

  return (
    <div className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Table Header */}
      <div className="p-5 flex items-center justify-between border-b border-[#D4AF37]/15">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">
              Dernières Factures Émises
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37]/20 text-[#F5E6B3] rounded-full border border-[#D4AF37]/40 shadow-sm">
              Temps réel
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Suivi des factures récentes et coordonnées de paiement
          </p>
        </div>

        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#E5C158] hover:text-amber-200 hover:underline transition-colors"
        >
          <span>Voir tout ({invoices.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#D4AF37]/15 bg-[#090A0F]/70 text-[11px] font-semibold text-[#D4AF37]/80 uppercase tracking-wider font-sans">
              <th className="py-3 px-5">Numéro & Service</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Émise le</th>
              <th className="py-3 px-4">Échéance</th>
              <th className="py-3 px-4 text-right">Montant TTC</th>
              <th className="py-3 px-5 text-center">Statut</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D4AF37]/10">
            {displayInvoices.map((invoice, index) => {
              const isFirst = index === 0;
              return (
                <tr
                  key={invoice.id}
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                  className={`group transition-colors hover:bg-white/[0.04] cursor-pointer ${
                    isFirst ? 'bg-[#D4AF37]/[0.05]' : ''
                  }`}
                >
                  {/* Invoice ID & Service */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#181926] border border-[#D4AF37]/20 flex items-center justify-center text-[#E5C158] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors duration-200 flex-shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono group-hover:text-[#F5E6B3] transition-colors">
                            {invoice.invoiceNumber}
                          </span>
                          {isFirst && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#D4AF37]/25 text-[#F5E6B3] rounded border border-[#D4AF37]/40">
                              Dernière
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {invoice.serviceType}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Client & City */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white group-hover:text-[#F5E6B3] transition-colors">
                      {invoice.client?.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {invoice.client?.city}, {invoice.client?.country}
                    </div>
                  </td>

                  {/* Issue Date */}
                  <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums">
                    {formatDate(invoice.issueDate)}
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums">
                    {formatDate(invoice.dueDate)}
                  </td>

                  {/* Amount in FCFA */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-[#F5E6B3] font-mono text-xs tabular-nums">
                      {formatFCFA(invoice.amount)}
                    </span>
                  </td>

                  {/* Status badge */}
                  <td className="py-3.5 px-5 text-center">
                    {getStatusBadge(invoice.status)}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E5C158] hover:text-amber-200">
                      <span>Détail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
