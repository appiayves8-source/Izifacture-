'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Share2,
  QrCode
} from 'lucide-react';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { useInvoiceStore } from '@/lib/store/invoiceStore';

export default function LatestInvoiceCard() {
  const { invoices } = useInvoiceStore();
  const latest = invoices.length > 0 ? invoices[0] : null;

  if (!latest) {
    return (
      <div className="bg-gradient-to-br from-[#12131C] via-[#141522] to-[#1A1926] rounded-2xl p-6 border border-[#D4AF37]/30 text-center">
        <p className="text-sm text-slate-300 font-medium">Aucune facture émise pour le moment.</p>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 mt-3 rounded-xl bg-[#D4AF37] text-black font-bold text-xs"
        >
          Créer votre première facture
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#12131C] via-[#141522] to-[#1A1926] rounded-2xl p-5 border border-[#D4AF37]/30 shadow-[0_4px_25px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Decorative top corner accent */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#D4AF37]/15 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DFBA55] to-[#B8860B] text-black font-bold flex items-center justify-center shadow-md">
            <FileText className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                Dernière Facture Émise
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37]/20 text-[#F5E6B3] rounded-full border border-[#D4AF37]/40">
                Active
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white font-mono">
              {latest.invoiceNumber}
            </h3>
          </div>
        </div>

        {/* Status Pill */}
        {latest.status === 'payee' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_6px_rgba(212,175,55,0.8)]"></span>
            Payée intégralement
          </div>
        )}
        {latest.status === 'envoyee' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-600/40 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Envoyée au client
          </div>
        )}
        {latest.status === 'en_retard' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/50 text-red-300 border border-red-800/40 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            En retard (impayé)
          </div>
        )}
        {latest.status === 'brouillon' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Brouillon
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-3.5 border-y border-[#D4AF37]/15 my-3 text-xs">
        <div>
          <span className="text-slate-400 font-medium text-[11px] block">Client B2B</span>
          <p className="font-bold text-white mt-0.5 text-xs truncate">
            {latest.client.name}
          </p>
          <p className="text-[11px] text-slate-400">
            {latest.client.city}, {latest.client.country}
          </p>
        </div>

        <div>
          <span className="text-slate-400 font-medium text-[11px] block">Prestation & Dates</span>
          <p className="font-semibold text-slate-200 mt-0.5 truncate">
            {latest.serviceType}
          </p>
          <p className="text-[11px] text-[#D4AF37]/80 font-mono">
            Émise: {formatDate(latest.issueDate)} • Échéance: {formatDate(latest.dueDate)}
          </p>
        </div>

        <div>
          <span className="text-slate-400 font-medium text-[11px] block">Règlement reçu via</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-sky-950/50 text-sky-300 font-semibold rounded text-[10px] border border-sky-600/40">
              Wave QR
            </span>
            <span className="px-2 py-0.5 bg-amber-950/50 text-amber-300 font-semibold rounded text-[10px] border border-amber-600/40">
              Orange Money
            </span>
          </div>
        </div>

        <div className="sm:text-right">
          <span className="text-slate-400 font-medium text-[11px] block">Montant Total Réglé</span>
          <p className="text-lg font-black text-[#F5E6B3] font-mono tabular-nums mt-0.5">
            {formatFCFA(latest.amount)}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            Dont TVA 18% incluse
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Lien public sécurisé : <code className="text-amber-200 font-mono bg-[#090A0F] px-1.5 py-0.5 rounded border border-[#D4AF37]/25">izifacture.com/f/snt-9482</code></span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/${latest.id}`}
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181926] hover:bg-[#202234] text-slate-200 border border-[#D4AF37]/25 font-semibold text-xs transition-colors"
          >
            <span>Consulter le détail</span>
          </Link>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181926] hover:bg-[#202234] text-slate-200 border border-[#D4AF37]/25 font-semibold text-xs transition-colors">
            <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Partager WhatsApp</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-bold text-xs shadow-[0_2px_12px_rgba(212,175,55,0.3)] transition-all"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Télécharger PDF A4</span>
          </button>
        </div>
      </div>
    </div>
  );
}
