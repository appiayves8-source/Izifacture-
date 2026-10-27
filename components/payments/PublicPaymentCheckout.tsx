'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Phone,
  User,
  Calendar,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Printer,
  X,
  FileCheck,
} from 'lucide-react';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';

interface PublicPaymentCheckoutProps {
  invoice: {
    id: string;
    invoice_number?: string;
    amount: number;
    currency?: string;
    service_type?: string;
    due_date?: string;
    status?: string;
    payment_status?: string;
    client?: {
      name?: string;
      phone?: string;
      email?: string;
      city?: string;
      country?: string;
    };
  };
  companyName?: string;
}

type PaymentMethodType = 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Carte Bancaire';

export default function PublicPaymentCheckout({ invoice, companyName = 'IziFacture' }: PublicPaymentCheckoutProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('Wave');

  // Coordonnées de paiement
  const [customerName, setCustomerName] = useState(invoice.client?.name || '');
  const [customerPhone, setCustomerPhone] = useState(invoice.client?.phone || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // États de soumission
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepText, setStepText] = useState('Connexion sécurisée...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    transactionId: string;
    paidAt: string;
    amount: number;
    paymentMethod: string;
  } | null>(null);

  const isAlreadyPaid =
    receipt !== null ||
    invoice.status === 'payee' ||
    invoice.status === 'paid' ||
    invoice.payment_status === 'paid';

  const handleOpenModal = (method?: PaymentMethodType) => {
    if (method) setSelectedMethod(method);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }

    if (selectedMethod !== 'Carte Bancaire') {
      if (!customerPhone.trim() || customerPhone.trim().length < 8) {
        setErrorMsg('Veuillez renseigner un numéro de téléphone Mobile Money valide.');
        return;
      }
    } else {
      if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 16) {
        setErrorMsg('Veuillez renseigner un numéro de carte bancaire valide (16 chiffres).');
        return;
      }
      if (!cardExpiry.trim()) {
        setErrorMsg('Veuillez renseigner la date d’expiration de la carte.');
        return;
      }
      if (!cardCvv.trim() || cardCvv.length < 3) {
        setErrorMsg('Veuillez renseigner le code CVV (3 chiffres au verso).');
        return;
      }
    }

    setIsProcessing(true);
    setStepText('Connexion à la passerelle sécurisée...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setStepText(
        selectedMethod === 'Carte Bancaire'
          ? 'Autorisation bancaire 3D Secure...'
          : `Validation du débit ${selectedMethod}...`
      );

      const res = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          paymentMethod: selectedMethod,
          customerName,
          customerPhone,
          cardNumber: selectedMethod === 'Carte Bancaire' ? cardNumber : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Échec du traitement du règlement.');
      }

      setStepText('Génération de la quittance d’acquittement...');
      await new Promise((r) => setTimeout(r, 600));

      setReceipt({
        transactionId: data.transactionId,
        paidAt: data.paidAt,
        amount: data.amount || invoice.amount,
        paymentMethod: data.paymentMethod || selectedMethod,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // ─── Si déjà payée ─────────────────────────────────────────────────────────
  if (isAlreadyPaid && !modalOpen) {
    return (
      <div className="w-full p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Facture Acquittée Intégralement</p>
            <p className="text-xs text-emerald-300">
              Règlement enregistré avec succès. Merci pour votre confiance !
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-white font-bold text-xs border border-emerald-500/40 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer la quittance</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Bouton Principal d'action */}
      <button
        type="button"
        onClick={() => handleOpenModal('Wave')}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-base tracking-wide shadow-[0_4px_25px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_30px_rgba(212,175,55,0.6)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
      >
        <ShieldCheck className="w-5 h-5 text-black stroke-[2.5]" />
        <span>Régler cette Facture ({formatFCFA(invoice.amount)})</span>
        <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
      </button>

      {/* Raccourcis directs par canal de paiement */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
        <button
          type="button"
          onClick={() => handleOpenModal('Wave')}
          className="p-2.5 rounded-xl bg-[#181926] hover:bg-[#202234] border border-[#D4AF37]/25 hover:border-[#1DC3F4]/70 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <span className="font-extrabold text-[#1DC3F4] text-xs group-hover:scale-105 transition-transform">
            Wave
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">Côte d&apos;Ivoire</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenModal('Orange Money')}
          className="p-2.5 rounded-xl bg-[#181926] hover:bg-[#202234] border border-[#D4AF37]/25 hover:border-[#FF6600]/70 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <span className="font-extrabold text-[#FF6600] text-xs group-hover:scale-105 transition-transform">
            Orange Money
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">OM CI / SN</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenModal('MTN MoMo')}
          className="p-2.5 rounded-xl bg-[#181926] hover:bg-[#202234] border border-[#D4AF37]/25 hover:border-[#FFCC00]/70 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <span className="font-extrabold text-[#FFCC00] text-xs group-hover:scale-105 transition-transform">
            MTN MoMo
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">Mobile Money</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenModal('Moov Money')}
          className="p-2.5 rounded-xl bg-[#181926] hover:bg-[#202234] border border-[#D4AF37]/25 hover:border-[#006699]/70 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <span className="font-extrabold text-[#006699] text-xs group-hover:scale-105 transition-transform">
            Moov Money
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">Flooz</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenModal('Carte Bancaire')}
          className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-[#181926] hover:bg-[#202234] border border-[#D4AF37]/25 hover:border-[#D4AF37]/70 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <span className="font-extrabold text-[#F5E6B3] text-xs flex items-center gap-1 group-hover:scale-105 transition-transform">
            <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" /> Carte
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">Visa / Mastercard</span>
        </button>
      </div>

      {/* ─── MODAL DU GUICHET DE PAIEMENT SÉCURISÉ ─────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#12131C] border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.8)] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#DFBA55] to-[#B8860B] flex items-center justify-center text-black font-black text-xs">
                  IZ
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Guichet de Paiement Sécurisé</h3>
                  <p className="text-[10px] text-slate-400">
                    Facture n° <strong className="text-white font-mono">{invoice.invoice_number || invoice.id}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#181926] text-slate-400 hover:text-white border border-[#D4AF37]/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Écran de Quittance / Succès */}
            {receipt ? (
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                  <FileCheck className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white">Paiement Validé avec Succès !</h4>
                  <p className="text-xs text-emerald-300 mt-1">
                    Votre facture a été intégralement acquittée.
                  </p>
                </div>

                {/* Détails du reçu */}
                <div className="p-4 rounded-2xl bg-[#181926] border border-[#D4AF37]/20 text-xs text-left space-y-2 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Référence transaction :</span>
                    <strong className="text-[#F5E6B3]">{receipt.transactionId}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Mode de règlement :</span>
                    <strong className="text-white">{receipt.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Montant réglé :</span>
                    <strong className="text-[#F5E6B3] text-sm font-bold">{formatFCFA(receipt.amount)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Date & Heure :</span>
                    <strong className="text-slate-300">{formatDate(receipt.paidAt)}</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimer la Facture Acquittée</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      if (typeof window !== 'undefined') window.location.reload();
                    }}
                    className="py-3 px-4 rounded-xl bg-[#181926] text-[#F5E6B3] hover:text-white font-bold text-xs border border-[#D4AF37]/30 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              /* Formulaire de paiement */
              <form onSubmit={handleProcessPayment} className="space-y-4">
                {/* Montant récapitulatif */}
                <div className="p-4 rounded-2xl bg-[#181926] border border-[#D4AF37]/25 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Montant Total à Payer :</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#F5E6B3] tabular-nums">
                    {formatFCFA(invoice.amount)}
                  </span>
                </div>

                {/* Choix du mode de paiement */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Sélectionnez votre moyen de paiement :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Carte Bancaire'] as PaymentMethodType[]).map((m) => {
                      const isSel = selectedMethod === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedMethod(m);
                            setErrorMsg(null);
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                            isSel
                              ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F5E6B3] shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                              : 'bg-[#181926] border-[#D4AF37]/20 text-slate-300 hover:border-[#D4AF37]/50'
                          }`}
                        >
                          <span>{m}</span>
                          {isSel && <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Saisie des Coordonnées */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nom complet du payeur
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: Cyrille Bonano"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {selectedMethod !== 'Carte Bancaire' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Numéro Mobile Money ({selectedMethod})
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Ex: +225 07 00 11 22 33"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        💡 Une notification de débit sécurisé {selectedMethod} sera envoyée sur ce numéro pour validation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Numéro de Carte Bancaire
                        </label>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4000 1234 5678 9010"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-300 mb-1">
                            Expiration (MM/AA)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="12/28"
                            className="w-full px-3 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-300 mb-1">
                            Code CVC / CVV
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full px-3 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Bouton de confirmation */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white font-extrabold text-sm tracking-wide shadow-[0_4px_25px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>{stepText}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Confirmer & Payer {formatFCFA(invoice.amount)}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Paiement chiffré SSL 256 bits • Normes OHADA & UEMOA</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
