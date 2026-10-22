'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id') || searchParams.get('token') || '';

  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(1);
  const [statusMessage, setStatusMessage] = useState('Interrogation des serveurs CinetPay...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setChecking(false);
      setErrorDetails('Identifiant de transaction manquant.');
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const verify = async (currentAttempt: number) => {
      try {
        setStatusMessage(`Vérification du règlement en direct (tentative ${currentAttempt}/4)...`);

        const res = await fetch('/api/cinetpay/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: transactionId }),
        });

        const data = await res.json().catch(() => ({}));
        console.log(`[CINETPAY_RETURN] Statut vérifié:`, data);

        if (!isMounted) return;

        if (data.status === 'ACCEPTED') {
          setStatusMessage('Paiement confirmé ! Redirection...');
          router.replace(
            `/payment/success?transaction_id=${encodeURIComponent(transactionId)}&invoice_id=${encodeURIComponent(
              data.invoice_id || ''
            )}&amount=${encodeURIComponent(data.amount || '')}`
          );
          return;
        }

        if (data.status === 'REFUSED' || data.status === 'FAILED') {
          router.replace(
            `/payment/failed?transaction_id=${encodeURIComponent(transactionId)}&invoice_id=${encodeURIComponent(
              data.invoice_id || ''
            )}`
          );
          return;
        }

        // Si le statut est encore PENDING, retenter jusqu'à 4 fois (intervalle 3s)
        if (currentAttempt < 4) {
          timer = setTimeout(() => {
            setAttempt(currentAttempt + 1);
            verify(currentAttempt + 1);
          }, 3000);
        } else {
          setChecking(false);
          setStatusMessage('Traitement en cours auprès de votre opérateur');
        }
      } catch (err) {
        console.error('[CINETPAY_RETURN] Erreur vérification:', err);
        if (currentAttempt < 4) {
          timer = setTimeout(() => {
            setAttempt(currentAttempt + 1);
            verify(currentAttempt + 1);
          }, 3000);
        } else {
          setChecking(false);
          setErrorDetails('Impossible de confirmer le statut immédiatement.');
        }
      }
    };

    verify(1);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [transactionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090A0F] text-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.12),rgba(9,10,15,1))]">
      <div className="w-full max-w-md bg-[#12131C] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(212,175,55,0.1)] text-center space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFBA55] to-[#B8860B] flex items-center justify-center text-black font-extrabold text-sm shadow-md">
            IZ
          </div>
          <span className="text-lg font-black tracking-tight font-sans text-white">
            IziFacture Pay
          </span>
        </div>

        {checking ? (
          <div className="space-y-4 py-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
              <ShieldCheck className="w-7 h-7 text-[#D4AF37]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white font-sans">
                Vérification du paiement en cours
              </h2>
              <p className="text-xs text-slate-300">{statusMessage}</p>
            </div>

            {transactionId && (
              <div className="p-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[11px] font-mono text-[#F5E6B3]">
                Réf : {transactionId}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white font-sans">
                Confirmation en cours
              </h2>
              <p className="text-xs text-slate-300">
                {errorDetails ||
                  "Votre paiement est en cours de traitement par l'opérateur Mobile Money. La facture sera automatiquement mise à jour dès validation."}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setChecking(true);
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser le statut</span>
              </button>

              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl bg-[#181926] text-slate-300 hover:text-white border border-[#D4AF37]/20 text-xs font-semibold"
              >
                Retourner à l&apos;accueil
              </Link>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Sécurisé par CinetPay V2 Checkout</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#090A0F] text-[#F5E6B3]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
