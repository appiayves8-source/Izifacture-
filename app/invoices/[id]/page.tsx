'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Download,
  FileText,
  ChevronDown,
  ShieldCheck,
  Link2,
  Check,
  ExternalLink,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CinetPayButton from '@/components/payments/CinetPayButton';
import { useInvoiceStore, InvoiceStatus } from '@/lib/store/invoiceStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = String(params?.id || '');

  const { getInvoice, updateInvoiceStatus, deleteInvoice, isLoaded } = useInvoiceStore();
  const { settings } = useSettingsStore();

  const invoice = getInvoice(invoiceId);

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleCopyPaymentLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Lien de paiement copié dans le presse-papier !');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoaded && !invoice) {
    return (
      <DashboardLayout breadcrumb={{ section: 'Opérations', page: 'Facture introuvable' }}>
        <div className="bg-[#12131C] rounded-2xl p-8 border border-[#D4AF37]/20 text-center max-w-lg mx-auto mt-12 space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Facture introuvable</h2>
          <p className="text-xs text-slate-400">
            La facture demandée n&apos;existe pas ou a été supprimée.
          </p>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] text-black text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste des factures</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout breadcrumb={{ section: 'Opérations', page: 'Chargement...' }}>
        <div className="py-20 text-center text-slate-400 text-xs">
          Chargement des données de la facture...
        </div>
      </DashboardLayout>
    );
  }

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    updateInvoiceStatus(invoice.id, newStatus);
    setStatusMenuOpen(false);
    showToast(`Statut mis à jour : ${newStatus.toUpperCase()}`);
  };

  const handleDeleteConfirm = () => {
    deleteInvoice(invoice.id);
    setDeleteModalOpen(false);
    router.push('/invoices');
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'payee':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)] animate-pulse"></span>
            Payée intégralement
          </span>
        );
      case 'envoyee':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/30 text-amber-300 border border-amber-600/35">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Envoyée au client
          </span>
        );
      case 'en_retard':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/40 text-red-300 border border-red-800/40">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            En retard de règlement
          </span>
        );
      case 'brouillon':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Brouillon non transmis
          </span>
        );
    }
  };

  const handlePrint = () => {
    const prevTitle = typeof document !== 'undefined' ? document.title : '';
    if (typeof document !== 'undefined') {
      document.title = `${invoice.invoiceNumber}_${invoice.client?.name || 'Client'}`;
    }
    window.print();
    setTimeout(() => {
      if (typeof document !== 'undefined') document.title = prevTitle;
    }, 1000);
  };

  // Renvoie l'emoji + label + couleur du moyen de paiement
  const getPaymentMethodDisplay = (method?: string) => {
    const m = (method || 'Wave').trim();
    if (m.startsWith('Wave') && m.includes('Virement')) return { emoji: '🌊🏦', label: 'Wave + Virement Bancaire', color: 'text-sky-400 print:text-sky-700', bg: 'bg-sky-950/40 print:bg-sky-50', border: 'border-sky-700/40 print:border-sky-300' };
    if (m.startsWith('Orange') && m.includes('Virement')) return { emoji: '🟠🏦', label: 'Orange Money + Virement', color: 'text-orange-400 print:text-orange-700', bg: 'bg-orange-950/40 print:bg-orange-50', border: 'border-orange-700/40 print:border-orange-300' };
    if (m === 'Wave') return { emoji: '🌊', label: 'Wave', color: 'text-sky-400 print:text-sky-700', bg: 'bg-sky-950/40 print:bg-sky-50', border: 'border-sky-700/40 print:border-sky-300' };
    if (m === 'Orange Money') return { emoji: '🟠', label: 'Orange Money', color: 'text-orange-400 print:text-orange-700', bg: 'bg-orange-950/40 print:bg-orange-50', border: 'border-orange-700/40 print:border-orange-300' };
    if (m === 'MTN MoMo') return { emoji: '💛', label: 'MTN MoMo', color: 'text-yellow-400 print:text-yellow-700', bg: 'bg-yellow-950/40 print:bg-yellow-50', border: 'border-yellow-700/40 print:border-yellow-300' };
    if (m === 'Moov Money') return { emoji: '🟣', label: 'Moov Money', color: 'text-purple-400 print:text-purple-700', bg: 'bg-purple-950/40 print:bg-purple-50', border: 'border-purple-700/40 print:border-purple-300' };
    if (m === 'Virement Bancaire') return { emoji: '🏦', label: 'Virement Bancaire', color: 'text-emerald-400 print:text-emerald-700', bg: 'bg-emerald-950/40 print:bg-emerald-50', border: 'border-emerald-700/40 print:border-emerald-300' };
    return { emoji: '💳', label: m, color: 'text-slate-300 print:text-slate-700', bg: 'bg-slate-800/40 print:bg-slate-50', border: 'border-slate-700/40 print:border-slate-300' };
  };

  return (
    <DashboardLayout breadcrumb={{ section: 'Opérations', page: invoice.invoiceNumber }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-[#12131C] border border-[#D4AF37]/50 text-[#F5E6B3] text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 no-print">
          <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header & Actions (Hidden during Print/PDF export) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-amber-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la liste des factures</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Facture <span className="font-mono text-[#F5E6B3]">{invoice.invoiceNumber}</span>
            </h1>
            <div>{getStatusBadge(invoice.status)}</div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#13141F] border border-[#D4AF37]/35 text-xs font-semibold text-[#F5E6B3] hover:bg-[#181926] hover:border-[#D4AF37]/60 active:scale-95 transition-all shadow-sm"
            >
              <span>Changer le statut</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>

            {statusMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-[#13141F] border border-[#D4AF37]/40 shadow-2xl py-1 z-30 animate-in fade-in-50 zoom-in-95 backdrop-blur-xl">
                <button
                  onClick={() => handleStatusChange('payee')}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#F5E6B3] hover:bg-[#D4AF37]/15 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                  <span>Marquer comme Payée</span>
                </button>
                <button
                  onClick={() => handleStatusChange('envoyee')}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-950/40 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Marquer comme Envoyée</span>
                </button>
                <button
                  onClick={() => handleStatusChange('en_retard')}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/40 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span>Marquer En retard</span>
                </button>
                <button
                  onClick={() => handleStatusChange('brouillon')}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Marquer comme Brouillon</span>
                </button>
              </div>
            )}
          </div>

          {/* Bouton Copier le lien de paiement public */}
          <button
            onClick={handleCopyPaymentLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181926] hover:bg-[#202234] text-[#F5E6B3] border border-[#D4AF37]/35 font-semibold text-xs transition-colors active:scale-95 shadow-sm cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Lien copié !</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Copier lien de paiement</span>
              </>
            )}
          </button>

          {/* Lien vers portail de paiement public */}
          <Link
            href={`/pay/${invoice.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181926] hover:bg-[#202234] text-slate-200 border border-[#D4AF37]/25 font-semibold text-xs transition-colors active:scale-95 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Portail client</span>
          </Link>

          {/* Edit Button */}
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181926] hover:bg-[#202234] text-slate-200 border border-[#D4AF37]/25 font-semibold text-xs transition-colors active:scale-95 shadow-sm"
          >
            <Edit className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Modifier</span>
          </Link>

          {/* Delete Button */}
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181926] hover:bg-red-950/40 text-red-400 border border-red-800/30 hover:border-red-600/50 font-semibold text-xs transition-colors active:scale-95 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>

          {/* Print/Download Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Télécharger PDF / Imprimer</span>
          </button>
        </div>
      </div>

      {/* CinetPay Quick Checkout Banner for non-paid invoices */}
      {invoice.status !== 'payee' && (
        <div className="no-print p-4 rounded-2xl bg-gradient-to-r from-[#141522] via-[#12131C] to-[#181926] border border-[#D4AF37]/35 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#F5E6B3] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Règlement en direct via Wave, Orange Money, MTN, Moov & Carte
              </p>
              <p className="text-[11px] text-slate-400">
                Paiement certifié CinetPay V2. Dès validation, la facture passera automatiquement en statut Payée.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
            <CinetPayButton invoice={invoice} size="sm" />
          </div>
        </div>
      )}

      {/* Main Invoice Document View (Noir & Or Luxury Layout on Screen / Clean & Crystal Clear on Print) */}
      <div id="invoice-document" className="printable-invoice bg-[#12131C] print:bg-white print:text-slate-900 rounded-2xl print:rounded-xl border border-[#D4AF37]/25 print:border-2 print:border-[#D4AF37] shadow-[0_4px_25px_rgba(0,0,0,0.5)] print:shadow-none overflow-hidden print:overflow-visible">
        {/* Document Header Banner */}
        <div className="invoice-header-banner p-6 sm:p-8 print:p-6 border-b border-[#D4AF37]/15 print:border-[#D4AF37] bg-gradient-to-r from-[#12131C] via-[#141524] to-[#18192A] print:bg-[#F8FAFC] flex flex-col md:flex-row print:flex-row md:items-center print:items-start md:justify-between print:justify-between gap-6 print:gap-8">
          {/* Issuer Info */}
          <div>
            <div className="flex items-center gap-3.5 mb-2.5 print:mb-2">
              <div className="w-10 h-10 print:w-10 print:h-10 rounded-xl bg-gradient-to-br from-[#DFBA55] via-[#D4AF37] to-[#8C6709] flex items-center justify-center shadow-md print:shadow-none">
                <FileText className="w-5 h-5 print:w-5 print:h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl print:text-xl font-extrabold text-white print:text-slate-900 tracking-tight">{settings.companyName}</h2>
                <span className="text-[10px] print:text-xs font-bold text-[#E5C158] print:text-[#854D0E] bg-[#D4AF37]/20 print:bg-amber-100 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 print:border-amber-300">
                  {settings.tagline}
                </span>
              </div>
            </div>
            <p className="text-xs print:text-xs text-slate-400 print:text-slate-700 leading-relaxed">
              RCCM : <strong className="print:text-slate-900 font-bold">{settings.rccm}</strong> • NIF / CC : <strong className="print:text-slate-900 font-bold">{settings.nif}</strong>
            </p>
            <p className="text-xs print:text-xs text-slate-400 print:text-slate-700 leading-relaxed">
              {settings.address} • {settings.city}, {settings.country}
            </p>
          </div>

          {/* Invoice Meta Dates & Amount */}
          <div className="md:text-right print:text-right space-y-1.5 print:space-y-1">
            <span className="text-xs print:text-xs font-bold text-[#D4AF37] print:text-[#854D0E] uppercase tracking-wider block">
              FACTURE COMMERCIALE NATIVE
            </span>
            <div className="text-xs print:text-xs text-slate-300 print:text-slate-800 font-mono">
              Date d&apos;émission : <strong className="text-white print:text-slate-900 font-bold">{formatDate(invoice.issueDate)}</strong>
            </div>
            <div className="text-xs print:text-xs text-slate-300 print:text-slate-800 font-mono">
              Date d&apos;échéance : <strong className="text-[#F5E6B3] print:text-slate-900 font-bold">{formatDate(invoice.dueDate)}</strong>
            </div>
            <div className="pt-2 print:pt-1">
              <span className="text-xs print:text-xs text-slate-400 print:text-slate-600 block font-medium">Montant Total TTC :</span>
              <span className="text-xl sm:text-2xl print:text-2xl font-black text-[#F5E6B3] print:text-[#B45309] font-mono tabular-nums">
                {formatFCFA(invoice.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Billing Information Grid */}
        <div className="invoice-client-section p-6 sm:p-8 print:p-6 border-b border-[#D4AF37]/15 print:border-slate-300 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-8 bg-[#0E0F18]/60 print:bg-white">
          {/* Bill To */}
          <div className="space-y-2 print:space-y-1.5">
            <span className="text-[11px] print:text-xs font-bold text-[#D4AF37] print:text-[#854D0E] uppercase tracking-wider block">
              FACTURÉ À (CLIENT B2B)
            </span>
            <h3 className="text-base sm:text-lg print:text-lg font-extrabold text-white print:text-slate-900">{invoice.client?.name}</h3>
            <p className="text-xs print:text-xs text-slate-300 print:text-slate-700 leading-relaxed">{invoice.client?.address}</p>
            <p className="text-xs print:text-xs text-slate-300 print:text-slate-700 leading-relaxed">{invoice.client?.city}, {invoice.client?.country}</p>
            <p className="text-xs print:text-xs text-slate-400 print:text-slate-700 font-mono pt-1 print:pt-1">
              Tél : <strong className="print:text-slate-900 font-bold">{invoice.client?.phone}</strong> • Email : <strong className="print:text-slate-900 font-bold">{invoice.client?.email}</strong>
            </p>
          </div>

          {/* Payment & Object */}
          <div className="space-y-2 print:space-y-1.5 md:text-right print:text-right">
            <span className="text-[11px] print:text-xs font-bold text-[#D4AF37] print:text-[#854D0E] uppercase tracking-wider block">
              DÉTAILS DU RÈGLEMENT
            </span>
            <p className="text-xs print:text-xs text-slate-300 print:text-slate-700 leading-relaxed">
              Objet : <span className="font-bold text-white print:text-slate-900">{invoice.serviceType}</span>
            </p>

            {/* Badge Moyen de paiement */}
            {(() => {
              const pm = getPaymentMethodDisplay(invoice.paymentMethod);
              return (
                <div className="flex items-center md:justify-end print:justify-end gap-2">
                  <span className="text-[11px] print:text-xs text-slate-400 print:text-slate-600">Mode de paiement :</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${pm.bg} ${pm.border} ${pm.color}`}>
                    <span className="text-sm">{pm.emoji}</span>
                    <span>{pm.label}</span>
                  </span>
                </div>
              );
            })()}

            <div className="pt-2 print:pt-1.5 flex items-center md:justify-end print:justify-end gap-2 text-xs print:text-xs text-slate-400 print:text-slate-600">
              <ShieldCheck className="w-4 h-4 print:w-4 print:h-4 text-[#D4AF37] print:text-[#854D0E]" />
              <span>Conforme aux normes fiscales régionales SYSCOHADA</span>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[720px] print:min-w-0 text-left text-xs print:text-sm">
            <thead>
              <tr className="border-b border-[#D4AF37]/15 print:border-slate-300 bg-[#090A0F]/80 print:bg-slate-100 text-[11px] print:text-xs font-bold text-[#D4AF37]/90 print:text-slate-800 uppercase tracking-wider font-sans">
                <th className="py-3.5 print:py-3 px-6 print:px-4 w-12 text-center">#</th>
                <th className="py-3.5 print:py-3 px-4 print:px-4">Désignation des prestations / articles</th>
                <th className="py-3.5 print:py-3 px-4 print:px-4 w-28 text-center">Quantité</th>
                <th className="py-3.5 print:py-3 px-4 print:px-4 w-44 text-right">Prix Unitaire HT</th>
                <th className="py-3.5 print:py-3 px-6 print:px-4 w-44 text-right">Total HT (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10 print:divide-slate-200">
              {invoice.items?.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-white/[0.02] print:bg-white">
                  <td className="py-4 print:py-3.5 px-6 print:px-4 text-center font-mono text-slate-500 print:text-slate-700 font-bold">
                    {idx + 1}
                  </td>
                  <td className="py-4 print:py-3.5 px-4 print:px-4 font-semibold text-white print:text-slate-900 print:text-sm">
                    {item.description}
                  </td>
                  <td className="py-4 print:py-3.5 px-4 print:px-4 text-center font-mono font-bold text-[#F5E6B3] print:text-slate-900 print:text-sm">
                    {item.quantity}
                  </td>
                  <td className="py-4 print:py-3.5 px-4 print:px-4 text-right font-mono text-slate-300 print:text-slate-800 font-semibold tabular-nums print:text-sm">
                    {formatFCFA(item.unitPrice)}
                  </td>
                  <td className="py-4 print:py-3.5 px-6 print:px-4 text-right font-mono font-black text-[#F5E6B3] print:text-black tabular-nums text-sm print:text-base">
                    {formatFCFA(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Document Footer: Notes & Totals Calculation */}
        <div className="invoice-footer-section p-6 sm:p-8 print:p-6 border-t border-[#D4AF37]/15 print:border-slate-300 bg-[#090A0F]/80 print:bg-white grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-8 items-start">
          {/* Notes & Bank Details */}
          <div className="space-y-4 print:space-y-3">
            <div>
              <span className="text-[11px] print:text-xs font-bold text-[#D4AF37] print:text-[#854D0E] uppercase tracking-wider block mb-1.5">
                CONDITIONS & MENTIONS DE PAIEMENT
              </span>
              <p className="invoice-notes-box text-xs print:text-xs text-slate-300 print:text-slate-800 leading-relaxed bg-[#12131C] print:bg-[#F8FAFC] p-3.5 print:p-3 rounded-xl border border-[#D4AF37]/15 print:border-slate-300">
                {invoice.notes || settings.invoiceFooterNotes || 'Paiement à réception. Tout retard entraînera des pénalités légales en vigueur dans l’espace OHADA/UEMOA.'}
              </p>
            </div>

            <div className="invoice-bank-box p-3.5 print:p-3.5 rounded-xl bg-[#12131C] print:bg-[#F8FAFC] border border-[#D4AF37]/15 print:border-slate-300 text-xs space-y-2 print:space-y-2">
              <div>
                <span className="text-[10px] print:text-xs text-slate-400 print:text-slate-600 font-sans block mb-0.5">Coordonnées Bancaires ({settings.bankName}) :</span>
                <span className="font-mono text-[#F5E6B3] print:text-slate-900 font-bold block print:text-xs">{settings.iban}</span>
              </div>
              {settings.mobileMoney && (
                <div className="pt-2 print:pt-2 border-t border-[#D4AF37]/10 print:border-slate-200">
                  <span className="text-[10px] print:text-xs text-slate-400 print:text-slate-600 font-sans block mb-0.5">Paiements Mobile Money :</span>
                  <span className="font-mono text-[#F5E6B3] print:text-slate-900 font-bold text-xs print:text-xs block">{settings.mobileMoney}</span>
                </div>
              )}
            </div>
          </div>

          {/* Final Financial Totals Breakdown */}
          <div className="invoice-totals-card bg-[#12131C] print:bg-[#FFFDF5] rounded-2xl print:rounded-xl p-5 print:p-5 border border-[#D4AF37]/30 print:border-2 print:border-[#D4AF37] shadow-md print:shadow-none space-y-3.5 print:space-y-3">
            <div className="flex items-center justify-between text-xs print:text-sm pb-2.5 print:pb-2 border-b border-[#D4AF37]/10 print:border-amber-200">
              <span className="text-slate-400 print:text-slate-700 font-medium print:font-semibold">Sous-total Hors Taxes (HT)</span>
              <span className="font-bold text-white print:text-slate-900 font-mono tabular-nums text-sm print:text-sm">
                {formatFCFA(invoice.subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs print:text-sm pb-2.5 print:pb-2 border-b border-[#D4AF37]/10 print:border-amber-200">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 print:text-slate-700 font-medium print:font-semibold">TVA légale (18.00%)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] print:text-xs bg-[#D4AF37]/20 print:bg-amber-100 text-[#E5C158] print:text-[#854D0E] font-mono font-bold">
                  UEMOA
                </span>
              </div>
              <span className="font-bold text-amber-200 print:text-slate-900 font-mono tabular-nums text-sm print:text-sm">
                {formatFCFA(invoice.taxAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5 print:pt-2">
              <div>
                <span className="text-xs print:text-xs font-bold text-white print:text-slate-900 block uppercase tracking-wider font-sans">
                  Total Net à Régler (TTC)
                </span>
                <span className="text-[10px] print:text-xs text-slate-400 print:text-slate-600 font-mono">
                  Arrondi à l&apos;entier FCFA
                </span>
              </div>
              <span className="text-2xl sm:text-3xl print:text-2xl font-black text-[#F5E6B3] print:text-[#B45309] font-mono tabular-nums">
                {formatFCFA(invoice.amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setDeleteModalOpen(false)}
          />

          <div className="relative bg-[#12131C] rounded-2xl p-6 border border-red-500/40 shadow-2xl max-w-md w-full z-10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/50 text-red-400 border border-red-800/50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supprimer la facture ?</h3>
                <p className="text-xs text-slate-400">
                  Cette action est irréversible et supprimera définitivement la facture <strong className="text-white">{invoice.invoiceNumber}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181926] border border-[#D4AF37]/15 text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Client :</span>
                <span className="font-bold text-white">{invoice.client?.name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Montant :</span>
                <span className="font-bold text-[#F5E6B3] font-mono">{formatFCFA(invoice.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#181926] text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all active:scale-95"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
