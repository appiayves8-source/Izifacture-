'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowLeft,
  Search,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  Link2,
  Check,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useInvoiceStore, InvoiceStatus } from '@/lib/store/invoiceStore';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function InvoicesListPage() {
  const router = useRouter();
  const { invoices } = useInvoiceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPaymentLink = (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invoiceId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Synchronisation du filtre depuis l'URL (?status=payee, etc.)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('status');
      if (s && ['all', 'payee', 'envoyee', 'en_retard', 'brouillon'].includes(s)) {
        setSelectedStatus(s);
      }
    }
  }, []);

  // Filter options
  const filterTabs = [
    { key: 'all', label: 'Toutes les factures', count: invoices.length },
    {
      key: 'payee',
      label: 'Payées',
      count: invoices.filter((i) => i.status === 'payee').length,
    },
    {
      key: 'envoyee',
      label: 'Envoyées',
      count: invoices.filter((i) => i.status === 'envoyee').length,
    },
    {
      key: 'en_retard',
      label: 'En retard',
      count: invoices.filter((i) => i.status === 'en_retard').length,
    },
    {
      key: 'brouillon',
      label: 'Brouillons',
      count: invoices.filter((i) => i.status === 'brouillon').length,
    },
  ];

  // Filtering logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedStatus !== 'all' && inv.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inv.client?.name?.toLowerCase().includes(q) ||
          inv.client?.city?.toLowerCase().includes(q) ||
          inv.invoiceNumber?.toLowerCase().includes(q) ||
          inv.serviceType?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, selectedStatus, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredInvoices.length);
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleStatusChange = (key: string) => {
    setSelectedStatus(key);
    setCurrentPage(1);
  };
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Page numbers to display (window of 5)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, safePage - delta);
      i <= Math.min(totalPages, safePage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [safePage, totalPages]);

  const getStatusBadge = (status: InvoiceStatus, paymentStatus?: string) => {
    // 1. Vert = paid
    if (paymentStatus === 'paid' || status === 'payee') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
          Payée
        </span>
      );
    }
    // 2. Jaune = pending_payment
    if (paymentStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          En attente paiement
        </span>
      );
    }
    // 3. Rouge = failed
    if (paymentStatus === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/50 text-red-300 border border-red-800/50 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          Échoué
        </span>
      );
    }
    // 4. Gris = envoyée
    if (status === 'envoyee') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Envoyée
        </span>
      );
    }
    if (status === 'en_retard') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/40 text-red-300 border border-red-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          En retard
        </span>
      );
    }
    // Brouillon
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        Brouillon
      </span>
    );
  };

  return (
    <DashboardLayout breadcrumb={{ section: 'Opérations', page: 'Factures' }}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-amber-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Gestion des Factures
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Consultez, filtrez et gérez vos factures et flux financiers en Francs CFA.
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200 self-start sm:self-center"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Créer une facture</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3 pt-2">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusChange(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-[#D4AF37]/20 text-[#F5E6B3] border border-[#D4AF37]/50 shadow-sm font-bold'
                    : 'bg-[#12131C] text-slate-400 border border-[#D4AF37]/15 hover:text-white hover:bg-[#181926]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-[#D4AF37] text-black'
                      : 'bg-[#181926] text-slate-400 border border-[#D4AF37]/20'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par nom de client, numéro de facture (FAC-...), ville ou prestation..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12131C] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Table summary header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#D4AF37]/15 bg-[#12131C]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-white">
              {filteredInvoices.length}{' '}
              {filteredInvoices.length > 1 ? 'factures trouvées' : 'facture trouvée'}
            </span>
            {selectedStatus !== 'all' && (
              <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                Filtre : {filterTabs.find((t) => t.key === selectedStatus)?.label}
              </span>
            )}
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Lignes par page :</span>
            <div className="flex items-center gap-1">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all ${
                    pageSize === size
                      ? 'bg-[#D4AF37] text-black'
                      : 'bg-[#181926] text-slate-400 border border-[#D4AF37]/20 hover:text-[#F5E6B3] hover:border-[#D4AF37]/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#D4AF37]/15 bg-[#090A0F]/70 text-[11px] font-semibold text-[#D4AF37]/80 uppercase tracking-wider font-sans">
                <th className="py-3 px-5">Numéro &amp; Prestation</th>
                <th className="py-3 px-4">Client B2B</th>
                <th className="py-3 px-4">Émission</th>
                <th className="py-3 px-4">Échéance</th>
                <th className="py-3 px-4 text-right">Montant TTC</th>
                <th className="py-3 px-5 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-[#D4AF37]/60 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-300">Aucune facture ne correspond à ces critères.</p>
                    <p className="text-xs text-slate-500 mt-1">Modifiez vos filtres ou effectuez une autre recherche.</p>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                    className="group transition-colors hover:bg-white/[0.04] cursor-pointer"
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
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
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
                      <span className="font-bold text-[#F5E6B3] font-mono text-sm tabular-nums">
                        {formatFCFA(invoice.amount)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-5 text-center">
                      {getStatusBadge(invoice.status, invoice.paymentStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton Copier le lien de paiement direct */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyPaymentLink(invoice.id, e)}
                          title="Copier le lien public CinetPay pour le client"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181926] hover:bg-[#202234] border border-[#D4AF37]/25 text-xs text-[#F5E6B3] hover:text-white transition-all active:scale-95 cursor-pointer"
                        >
                          {copiedId === invoice.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px] font-bold">Lien copié !</span>
                            </>
                          ) : (
                            <>
                              <Link2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span className="text-[11px] hidden md:inline">Lien de paiement</span>
                            </>
                          )}
                        </button>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E5C158] hover:text-amber-200">
                          <span className="hidden sm:inline">Détails</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        {filteredInvoices.length > 0 && (
          <div className="px-4 sm:px-5 py-4 border-t border-[#D4AF37]/15 bg-[#0D0E18] flex flex-col sm:flex-row items-center justify-between gap-3">

            {/* Left: position indicator */}
            <p className="text-[11px] text-slate-400 font-medium order-2 sm:order-1">
              Affichage{' '}
              <span className="font-mono font-bold text-[#F5E6B3]">{startIndex + 1}</span>
              {' '}–{' '}
              <span className="font-mono font-bold text-[#F5E6B3]">{endIndex}</span>
              {' '}sur{' '}
              <span className="font-mono font-bold text-white">{filteredInvoices.length}</span>
              {' '}factures
            </p>

            {/* Right: navigation controls */}
            <div className="flex items-center gap-1.5 order-1 sm:order-2">

              {/* First page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                aria-label="Première page"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D4AF37]/20 bg-[#181926] text-slate-400 hover:text-[#F5E6B3] hover:border-[#D4AF37]/50 hover:bg-[#202234] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Previous page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                aria-label="Page précédente"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20 bg-[#181926] text-slate-300 text-xs font-semibold hover:text-[#F5E6B3] hover:border-[#D4AF37]/50 hover:bg-[#202234] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Précédente</span>
              </button>

              {/* First page shortcut if window doesn't start at 1 */}
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D4AF37]/15 bg-[#181926] text-slate-400 hover:text-[#F5E6B3] hover:border-[#D4AF37]/40 text-xs font-mono font-bold transition-all"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span className="text-slate-500 text-xs px-1">…</span>
                  )}
                </>
              )}

              {/* Page number buttons */}
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  aria-current={page === safePage ? 'page' : undefined}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono font-bold transition-all ${
                    page === safePage
                      ? 'bg-gradient-to-br from-[#DFBA55] to-[#B8860B] text-black shadow-[0_2px_10px_rgba(212,175,55,0.4)] scale-105'
                      : 'border border-[#D4AF37]/15 bg-[#181926] text-slate-400 hover:text-[#F5E6B3] hover:border-[#D4AF37]/40 hover:bg-[#202234]'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Last page shortcut if window doesn't reach totalPages */}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="text-slate-500 text-xs px-1">…</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D4AF37]/15 bg-[#181926] text-slate-400 hover:text-[#F5E6B3] hover:border-[#D4AF37]/40 text-xs font-mono font-bold transition-all"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                aria-label="Page suivante"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20 bg-[#181926] text-slate-300 text-xs font-semibold hover:text-[#F5E6B3] hover:border-[#D4AF37]/50 hover:bg-[#202234] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="hidden sm:inline">Suivante</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                aria-label="Dernière page"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D4AF37]/20 bg-[#181926] text-slate-400 hover:text-[#F5E6B3] hover:border-[#D4AF37]/50 hover:bg-[#202234] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
