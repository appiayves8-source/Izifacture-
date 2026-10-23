'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Terminal,
  Smartphone,
  KeyRound,
  Coins,
  CreditCard,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface CertificationTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'ACCEPTED' | 'PENDING' | 'REFUSED' | 'UNKNOWN' | string;
  operator_id?: string;
  payment_method?: string;
  date: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

const STORAGE_CERTIF_KEY = 'izifacture_cinetpay_certif_v1';
const TEST_PHONE = '0700000000';
const TEST_OTP = '123456';
const TEST_AMOUNT = 100;

function TestPaymentContent() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#12131C] border border-[#D4AF37]/30 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Environnement Production Actif</h1>
          <p className="text-xs text-slate-400">
            Le laboratoire de certification Sandbox CinetPay est désactivé en production. Les paiements réels s&apos;effectuent directement sur vos factures.
          </p>
          <Link
            href="/"
            className="inline-block mt-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black text-xs font-bold shadow-md"
          >
            Retourner au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const searchParams = useSearchParams();
  const urlTransactionId = searchParams.get('transaction_id') || searchParams.get('id');
  const urlStatus = searchParams.get('status');

  // État du formulaire & transaction en cours
  const [currentTransactionId, setCurrentTransactionId] = useState<string>(() => {
    return urlTransactionId || `IZIFACTURE-TEST-${Date.now()}`;
  });
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'redirect' | 'iframe' | 'new_tab'>('new_tab');

  // Statuts d'exécution
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: string;
    message: string;
    operator_id?: string;
    raw?: unknown;
  } | null>(null);

  // Historique des 5 transactions
  const [transactions, setTransactions] = useState<CertificationTransaction[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fonction d'ajout de log dans la console intégrée
  const addLog = useCallback((type: LogEntry['type'], message: string, data?: unknown) => {
    const time = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: time,
        type,
        message,
        data,
      },
      ...prev.slice(0, 49), // Conserver les 50 derniers logs
    ]);
  }, []);

  // Chargement de l'historique depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CERTIF_KEY);
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch {
      // Ignorer
    }
    addLog('info', 'Laboratoire de Certification CinetPay initialisé (Sandbox CI)');
  }, [addLog]);

  // Sauvegarde des transactions
  const saveTransactions = (list: CertificationTransaction[]) => {
    setTransactions(list);
    try {
      localStorage.setItem(STORAGE_CERTIF_KEY, JSON.stringify(list));
    } catch {
      // Ignorer
    }
  };

  // Copie de texte dans le presse-papier avec feedback visuel
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    addLog('info', `Copié dans le presse-papier : "${text}"`);
  };

  // Régénérer un identifiant de test
  const handleRegenerateId = () => {
    const newId = `IZIFACTURE-TEST-${Date.now()}`;
    setCurrentTransactionId(newId);
    setPaymentUrl(null);
    setPaymentToken(null);
    setVerificationResult(null);
    addLog('info', `Nouvel identifiant de transaction généré : ${newId}`);
  };

  // 1. Initialiser le paiement auprès de CinetPay
  const handleInitPayment = async () => {
    setIsInitializing(true);
    setVerificationResult(null);
    addLog('info', `Initialisation du paiement de ${TEST_AMOUNT} FCFA (ID: ${currentTransactionId})...`);

    try {
      const res = await fetch('/api/pay/cinetpay/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: currentTransactionId,
          amount: TEST_AMOUNT,
          currency: 'XOF',
          customer_phone: TEST_PHONE,
          description: `Test Certification Sandbox IziFacture (${currentTransactionId})`,
        }),
      });

      const data = await res.json();
      addLog(res.ok ? 'success' : 'error', `Réponse API Init (HTTP ${res.status})`, data);

      if (data.success && data.payment_url) {
        setPaymentUrl(data.payment_url);
        setPaymentToken(data.payment_token || null);
        addLog('success', `Guichet de paiement prêt : ${data.payment_url}`);

        if (displayMode === 'redirect') {
          window.location.href = data.payment_url;
        } else if (displayMode === 'new_tab') {
          window.open(data.payment_url, '_blank', 'noopener,noreferrer');
        }
      } else {
        addLog('error', `Erreur initialisation : ${data.error || 'Échec API'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog('error', `Erreur réseau lors de l'appel d'init : ${msg}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // 2. Vérifier le statut de la transaction auprès de CinetPay
  const handleVerifyStatus = useCallback(async (transId?: string) => {
    const idToVerify = transId || currentTransactionId;
    if (!idToVerify) return;

    setIsVerifying(true);
    addLog('info', `Vérification du statut officiel CinetPay pour : ${idToVerify}...`);

    try {
      const res = await fetch(`/api/pay/cinetpay/verify?transaction_id=${encodeURIComponent(idToVerify)}`);
      const data = await res.json();

      addLog(res.ok ? 'success' : 'warn', `Statut vérifié pour ${idToVerify} : ${data.status || 'INCONNU'}`, data);

      setVerificationResult({
        status: data.status || 'UNKNOWN',
        message: data.message || data.status || '',
        operator_id: data.operator_id,
        raw: data.raw,
      });

      // Si le paiement est accepté, l'ajouter aux 5 transactions réussies s'il n'y est pas déjà
      if (data.status === 'ACCEPTED') {
        setTransactions((prev) => {
          const exists = prev.some((t) => t.transaction_id === idToVerify);
          if (!exists) {
            const newTx: CertificationTransaction = {
              id: `cert-${Date.now()}`,
              transaction_id: idToVerify,
              amount: TEST_AMOUNT,
              currency: 'XOF',
              status: 'ACCEPTED',
              operator_id: data.operator_id || 'MTN_CI_SANDBOX',
              payment_method: data.payment_method || 'MTN Mobile Money CI',
              date: new Date().toLocaleString('fr-FR'),
            };
            const updated: CertificationTransaction[] = [newTx, ...prev];
            saveTransactions(updated);
            addLog('success', `🎉 Transaction ${idToVerify} validée avec succès et comptabilisée dans la certification !`);
            return updated;
          }
          return prev;
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog('error', `Erreur lors de la vérification : ${msg}`);
    } finally {
      setIsVerifying(false);
    }
  }, [currentTransactionId, addLog]);

  // Si on revient d'une redirection avec transaction_id dans l'URL, vérifier automatiquement
  useEffect(() => {
    if (urlTransactionId) {
      addLog('info', `Retour de redirection détecté pour la transaction : ${urlTransactionId} (Statut URL: ${urlStatus || 'non précisé'})`);
      handleVerifyStatus(urlTransactionId);
    }
  }, [urlTransactionId, urlStatus, handleVerifyStatus, addLog]);

  const successCount = transactions.filter((t) => t.status === 'ACCEPTED').length;
  const isGoalReached = successCount >= 5;

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 selection:bg-[#D4AF37] selection:text-black">
      {/* En-tête */}
      <header className="border-b border-[#D4AF37]/20 bg-[#12131C]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#D4AF37] transition-colors py-1 px-2.5 rounded-lg hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Tableau de bord</span>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Certification CinetPay Sandbox (Côte d&apos;Ivoire)
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold font-mono rounded-full bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35">
              SANDBOX CI
            </span>
            <a
              href="https://panel.cinetpay.net/izifacture/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#D4AF37] transition-colors"
            >
              <span>panel.cinetpay.net</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Bannière de Progression vers la Certification */}
        <div className="relative overflow-hidden rounded-2xl bg-[#12131C] border border-[#D4AF37]/30 p-5 sm:p-6 shadow-[0_4px_25px_rgba(212,175,55,0.08)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="text-lg font-bold text-white">
                  Passage de la Certification pour obtention du mode LIVE
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Prérequis CinetPay : Effectuer <strong className="text-white">5 paiements réussis de 100 FCFA</strong> avec le numéro test MTN CI (<code className="text-[#F5E6B3]">0700000000</code> / OTP <code className="text-[#F5E6B3]">123456</code>).
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#181926] border border-[#D4AF37]/20 rounded-xl px-4 py-3 shrink-0">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Progression requise</div>
                <div className="text-xl font-bold font-mono text-[#F5E6B3]">
                  {successCount} <span className="text-xs text-slate-500 font-normal">/ 5 validés</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] flex items-center justify-center font-bold text-sm text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]">
                {Math.min(100, Math.round((successCount / 5) * 100))}%
              </div>
            </div>
          </div>

          {/* Jauge visuelle */}
          <div className="mt-4 w-full bg-[#181926] rounded-full h-2.5 overflow-hidden border border-[#D4AF37]/20">
            <div
              className="bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#F5E6B3] h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (successCount / 5) * 100)}%` }}
            ></div>
          </div>

          {isGoalReached && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Objectif de certification atteint !</strong> Vos 5 transactions tests ont été enregistrées avec succès. Elles sont visibles dans votre console CinetPay Sandbox. Vous pouvez soumettre votre dossier pour l&apos;activation des clés LIVE.
              </span>
            </div>
          )}
        </div>

        {/* Grille Principale */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne Gauche : Paramètres de test & Formulaire de déclenchement */}
          <div className="lg:col-span-7 space-y-6">
            {/* Carte des identifiants MTN CI Sandbox */}
            <div className="rounded-2xl bg-[#12131C] border border-[#D4AF37]/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-sm font-bold text-white">Identifiants de Test Officiels CinetPay (CI)</h3>
                </div>
                <span className="text-[11px] text-slate-400">Cliquez pour copier</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Numéro Test */}
                <button
                  type="button"
                  onClick={() => copyToClipboard(TEST_PHONE, 'phone')}
                  className="flex flex-col text-left p-3 rounded-xl bg-[#181926] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all group"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Numéro MTN</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-white text-sm">{TEST_PHONE}</span>
                    {copiedKey === 'phone' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#D4AF37]" />
                    )}
                  </div>
                </button>

                {/* Code OTP */}
                <button
                  type="button"
                  onClick={() => copyToClipboard(TEST_OTP, 'otp')}
                  className="flex flex-col text-left p-3 rounded-xl bg-[#181926] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all group"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Code OTP</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-white text-sm">{TEST_OTP}</span>
                    {copiedKey === 'otp' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#D4AF37]" />
                    )}
                  </div>
                </button>

                {/* Montant Test */}
                <div className="flex flex-col p-3 rounded-xl bg-[#181926] border border-[#D4AF37]/20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Montant imposé</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-[#F5E6B3] text-sm">100 FCFA</span>
                    <Coins className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Carte Déclencheur de Paiement */}
            <div className="rounded-2xl bg-[#12131C] border border-[#D4AF37]/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-sm font-bold text-white">Lancer une Transaction de Test</h3>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="text-[11px] text-slate-400 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Régénérer ID</span>
                </button>
              </div>

              {/* ID Transaction */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Transaction ID (Unique)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentTransactionId}
                    onChange={(e) => setCurrentTransactionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentTransactionId, 'transId')}
                    className="p-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 text-slate-300"
                    title="Copier ID"
                  >
                    {copiedKey === 'transId' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Choix du mode d'affichage */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mode d&apos;ouverture du guichet CinetPay</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('new_tab')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      displayMode === 'new_tab'
                        ? 'bg-[#D4AF37]/20 text-[#F5E6B3] border-[#D4AF37]'
                        : 'bg-[#181926] text-slate-400 border-[#D4AF37]/15 hover:border-[#D4AF37]/35'
                    }`}
                  >
                    Nouvel Onglet
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('iframe')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      displayMode === 'iframe'
                        ? 'bg-[#D4AF37]/20 text-[#F5E6B3] border-[#D4AF37]'
                        : 'bg-[#181926] text-slate-400 border-[#D4AF37]/15 hover:border-[#D4AF37]/35'
                    }`}
                  >
                    Iframe Intégrée
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('redirect')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      displayMode === 'redirect'
                        ? 'bg-[#D4AF37]/20 text-[#F5E6B3] border-[#D4AF37]'
                        : 'bg-[#181926] text-slate-400 border-[#D4AF37]/15 hover:border-[#D4AF37]/35'
                    }`}
                  >
                    Redirection
                  </button>
                </div>
              </div>

              {/* Bouton d'action principal */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleInitPayment}
                  disabled={isInitializing}
                  className="flex-1 bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-sm py-3 px-6 rounded-xl shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isInitializing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Connexion CinetPay en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Payer 100 FCFA TEST</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyStatus()}
                  disabled={isVerifying}
                  className="bg-[#181926] hover:bg-[#202234] text-[#F5E6B3] border border-[#D4AF37]/30 text-xs font-bold py-3 px-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>Vérifier Statut</span>
                </button>
              </div>

              {/* Si le lien de paiement est généré */}
              {paymentUrl && (
                <div className="p-3.5 rounded-xl bg-[#181926] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Guichet CinetPay Prêt
                    </span>
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#F5E6B3] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Ouvrir manuellement</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate bg-black/40 p-2 rounded-lg">
                    {paymentUrl}
                  </div>
                </div>
              )}
            </div>

            {/* Iframe si mode iframe sélectionné et URL disponible */}
            {displayMode === 'iframe' && paymentUrl && (
              <div className="rounded-2xl bg-[#12131C] border border-[#D4AF37]/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Guichet de paiement intégré (Iframe)</span>
                  <button
                    onClick={() => setPaymentUrl(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    Fermer l&apos;iframe
                  </button>
                </div>
                <div className="w-full h-[520px] rounded-xl overflow-hidden border border-[#D4AF37]/15 bg-white">
                  <iframe
                    src={paymentUrl}
                    className="w-full h-full border-0"
                    title="Guichet CinetPay"
                    allow="payment"
                  />
                </div>
              </div>
            )}

            {/* Résultat de vérification en direct */}
            {verificationResult && (
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  verificationResult.status === 'ACCEPTED'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : verificationResult.status === 'PENDING'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-red-950/30 border-red-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {verificationResult.status === 'ACCEPTED' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : verificationResult.status === 'PENDING' ? (
                      <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        Statut CinetPay :{' '}
                        <span
                          className={
                            verificationResult.status === 'ACCEPTED'
                              ? 'text-emerald-400'
                              : verificationResult.status === 'PENDING'
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }
                        >
                          {verificationResult.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">{verificationResult.message}</div>
                    </div>
                  </div>

                  {verificationResult.operator_id && (
                    <div className="text-right font-mono text-xs text-[#F5E6B3]">
                      Ref: {verificationResult.operator_id}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne Droite : Historique des 5 transactions & Console de debug */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tableau des transactions validées */}
            <div className="rounded-2xl bg-[#12131C] border border-[#D4AF37]/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-sm font-bold text-white">
                    Paiements Enregistrés ({transactions.length})
                  </h3>
                </div>
                {transactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Réinitialiser l’historique des tests ?')) {
                        saveTransactions([]);
                        addLog('info', 'Historique des transactions réinitialisé');
                      }
                    }}
                    className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 space-y-1">
                  <div>Aucune transaction enregistrée pour le moment.</div>
                  <div className="text-[11px] text-slate-600">
                    Lancez un paiement de 100 FCFA pour faire monter le compteur.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {transactions.map((tx, idx) => (
                    <div
                      key={tx.id || idx}
                      className="p-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/15 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-white text-[11px] truncate max-w-[170px]">
                          {tx.transaction_id}
                        </div>
                        <div className="text-[10px] text-slate-400">{tx.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[#F5E6B3]">100 FCFA</div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                          ACCEPTED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Console de Debug Intégrée (Logs en direct) */}
            <div className="rounded-2xl bg-[#12131C] border border-[#D4AF37]/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-xs font-bold text-white">Console Logs Certification</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = logs
                      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
                      .join('\n');
                    copyToClipboard(text, 'logs');
                  }}
                  className="text-[10px] text-slate-400 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'logs' ? 'Copié !' : 'Copier logs'}</span>
                </button>
              </div>

              <div className="bg-black/60 rounded-xl p-3 font-mono text-[11px] leading-relaxed h-72 overflow-y-auto space-y-1.5 border border-white/5">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic">En attente d&apos;actions...</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-1.5">
                      <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-emerald-400'
                            : log.type === 'error'
                            ? 'text-red-400'
                            : log.type === 'warn'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TestPaiementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090A0F] flex items-center justify-center text-slate-400 text-xs font-mono">
          Chargement du laboratoire de certification...
        </div>
      }
    >
      <TestPaymentContent />
    </Suspense>
  );
}
