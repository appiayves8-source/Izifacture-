'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, FileText, ArrowRight, Download, Home, ShieldCheck } from 'lucide-react';
import { formatFCFA } from '@/lib/utils/formatters';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id') || 'IZI-VALIDATED';
  const invoiceId = searchParams.get('invoice_id') || '';
  const rawAmount = searchParams.get('amount');
  const amount = rawAmount ? Number(rawAmount) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090A0F] text-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.12),rgba(9,10,15,1))]">
      <div className="w-full max-w-lg bg-[#12131C] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_35px_rgba(34,197,94,0.15)] text-center space-y-6">
        {/* Animated Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/15 to-emerald-950/30 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(34,197,94,0.3)]">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Règlement Validé
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
            Paiement Confirmé avec Succès !
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Votre transaction a été validée par l&apos;opérateur et la facture est désormais acquittée.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#181926] border border-[#D4AF37]/20 text-left space-y-3">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-[#D4AF37]/15">
            <span className="text-slate-400 font-medium">Référence CinetPay</span>
            <span className="font-mono text-[#F5E6B3] font-bold text-xs">{transactionId}</span>
          </div>

          {amount && (
            <div className="flex items-center justify-between text-xs pb-3 border-b border-[#D4AF37]/15">
              <span className="text-slate-400 font-medium">Montant Réglé</span>
              <span className="font-mono text-emerald-400 font-extrabold text-sm">
                {formatFCFA(amount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Mode de paiement</span>
            <span className="text-white font-semibold">Wave / Mobile Money CI</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Date & Heure</span>
            <span className="text-slate-300 font-mono text-[11px]">
              {new Date().toLocaleString('fr-FR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {invoiceId ? (
            <Link
              href={`/pay/${invoiceId}`}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:scale-[1.01] transition-all"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>Consulter la facture acquittée</span>
            </Link>
          ) : (
            <Link
              href="/invoices"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(212,175,55,0.3)]"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>Voir mes factures</span>
            </Link>
          )}

          <Link
            href="/"
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#181926] text-slate-300 hover:text-white border border-[#D4AF37]/25 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Tableau de bord</span>
          </Link>
        </div>

        {/* Trust Footer */}
        <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Certifié et chiffré SSL 256 bits via CinetPay V2</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#090A0F] text-[#F5E6B3]">
          Chargement...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
