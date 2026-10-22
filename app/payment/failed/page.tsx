'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, RotateCcw, Home, HelpCircle, ShieldAlert } from 'lucide-react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id') || '';
  const invoiceId = searchParams.get('invoice_id') || '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090A0F] text-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.12),rgba(9,10,15,1))]">
      <div className="w-full max-w-lg bg-[#12131C] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_35px_rgba(239,68,68,0.12)] text-center space-y-6">
        {/* Failed Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-500/20 via-red-600/15 to-red-950/30 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
          <AlertCircle className="w-9 h-9 stroke-[2.5]" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-300 border border-red-500/30">
            Transaction Interrompue
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
            Le paiement n&apos;a pas pu aboutir
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Aucun débit n&apos;a été effectué sur votre compte. Vous pouvez réessayer avec le même moyen de paiement ou en choisir un autre (Wave, Orange Money, MTN MoMo, Moov ou Carte Bancaire).
          </p>
        </div>

        {/* Transaction ID if present */}
        {transactionId && (
          <div className="p-3.5 rounded-2xl bg-[#181926] border border-[#D4AF37]/20 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">Réf. transaction</span>
            <span className="text-[#F5E6B3] font-bold">{transactionId}</span>
          </div>
        )}

        {/* Reasons list */}
        <div className="p-4 rounded-2xl bg-[#181926]/70 border border-[#D4AF37]/15 text-left text-xs text-slate-300 space-y-2">
          <p className="font-bold text-white text-[11px] uppercase tracking-wider">
            Raisons fréquentes :
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>Solde insuffisant sur votre compte Mobile Money ou carte.</li>
            <li>Délai de validation OTP ou confirmation PIN dépassé sur votre téléphone.</li>
            <li>Annulation manuelle de la transaction.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {invoiceId ? (
            <Link
              href={`/pay/${invoiceId}`}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:scale-[1.01] transition-all"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Réessayer le paiement</span>
            </Link>
          ) : (
            <Link
              href="/invoices"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(212,175,55,0.3)]"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Réessayer depuis les factures</span>
            </Link>
          )}

          <Link
            href="/"
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#181926] text-slate-300 hover:text-white border border-[#D4AF37]/25 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Accueil</span>
          </Link>
        </div>

        {/* Support */}
        <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Besoin d&apos;assistance ? Contactez le support IziFacture</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#090A0F] text-[#F5E6B3]">
          Chargement...
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
