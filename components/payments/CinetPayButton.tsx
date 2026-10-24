'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatFCFA } from '@/lib/utils/formatters';

export interface CinetPayButtonInvoice {
  id: string;
  amount: number;
  invoiceNumber?: string;
  invoice_number?: string;
  payment_status?: string;
  status?: string;
}

interface CinetPayButtonProps {
  invoice: CinetPayButtonInvoice;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CinetPayButton({
  invoice,
  className = '',
  size = 'md',
}: CinetPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaid =
    invoice.payment_status === 'paid' ||
    invoice.status === 'payee' ||
    invoice.status === 'paid';

  // Si la facture est déjà soldée
  if (isPaid) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold ${className}`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Facture Déjà Réglée</span>
      </div>
    );
  }

  const handlePay = async () => {
    setError(null);
    setLoading(true);

    try {
      console.log(`[CinetPayButton] Lancement paiement pour facture ${invoice.id}...`);

      const res = await fetch('/api/cinetpay/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !data.payment_url) {
        throw new Error('Paiement indisponible');
      }

      console.log(`[CinetPayButton] Redirection vers CinetPay Checkout: ${data.payment_url}`);
      window.location.href = data.payment_url;
    } catch (err: unknown) {
      console.error('[CinetPayButton] Erreur initiation interne:', err);
      // Règle de sécurité : Message client non technique, aucun secret ni IP exposé
      setError('Le paiement est momentanément indisponible, réessayez dans quelques minutes.');
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'py-2 px-3.5 text-xs',
    md: 'py-3.5 px-6 text-sm',
    lg: 'py-4 px-8 text-base',
  }[size];

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className={`w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white font-extrabold tracking-wide shadow-[0_4px_25px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_30px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${sizeClasses} ${className}`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <span>Connexion à la passerelle de paiement...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>Payer {formatFCFA(invoice.amount)}</span>
            <ArrowRight className="w-4 h-4 text-emerald-200" />
          </>
        )}
      </button>

      {error && (
        <div className="w-full p-3 rounded-2xl bg-[#1D1418] border border-red-500/40 text-red-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white font-bold text-[11px] border border-red-500/30 transition-colors shrink-0"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
