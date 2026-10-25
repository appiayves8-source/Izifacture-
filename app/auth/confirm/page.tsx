'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type ConfirmStatus = 'loading' | 'success' | 'error';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ConfirmStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Écouter les changements d'état (si Supabase client détecte la session automatiquement via le hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        setStatus('success');
      }
    });

    const handleConfirmation = async () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

      // 0. Vérifier si une erreur est signalée dans l'URL ou le hash (ex: token expiré)
      const errorDesc =
        urlParams.get('error_description') ||
        hashParams.get('error_description') ||
        urlParams.get('error') ||
        hashParams.get('error');

      if (errorDesc) {
        const decoded = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
        if (decoded.toLowerCase().includes('expired') || decoded.toLowerCase().includes('expir')) {
          setErrorMsg('Ce lien de confirmation a expiré. Veuillez vous reconnecter pour demander un nouveau code.');
        } else {
          setErrorMsg(decoded);
        }
        setStatus('error');
        return;
      }

      // 1. Vérifier si une session est déjà valide
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setStatus('success');
        return;
      }

      // --- Paramètres possibles dans l'URL / hash ---
      const code = urlParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const tokenHash = urlParams.get('token_hash');
      const type = urlParams.get('type') || 'email';
      const confirmed = urlParams.get('confirmed') === 'true';

      try {
        if (code) {
          // PKCE : échange le code contre une session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setStatus('success');

        } else if (tokenHash) {
          // Vérification via token_hash (lien personnalisé)
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'email' | 'signup' | 'invite' | 'recovery' | 'email_change',
          });
          if (error) throw error;
          setStatus('success');

        } else if (accessToken && refreshToken) {
          // Implicit flow : session complète dans le hash
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          setStatus('success');

        } else if (confirmed) {
          // Redirection depuis confirmed=true — vérifier si la session arrive avec délai
          await new Promise<void>((resolve) => setTimeout(resolve, 1200));
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2) {
            setStatus('success');
          } else {
            setErrorMsg('Session introuvable. Votre compte a peut-être déjà été confirmé. Connectez-vous normalement.');
            setStatus('error');
          }

        } else {
          // Attendre un bref délai au cas où Supabase traite le hash en asynchrone
          await new Promise<void>((resolve) => setTimeout(resolve, 1500));
          const { data: { session: s3 } } = await supabase.auth.getSession();
          if (s3) {
            setStatus('success');
          } else {
            setErrorMsg('Lien de confirmation invalide ou expiré. Veuillez demander un nouveau code.');
            setStatus('error');
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur de confirmation';
        if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('expir')) {
          setErrorMsg('Ce lien de confirmation a expiré. Veuillez vous reconnecter pour en recevoir un nouveau.');
        } else if (message.toLowerCase().includes('already')) {
          setErrorMsg('Ce compte a déjà été validé. Vous pouvez vous connecter directement.');
        } else {
          setErrorMsg(message);
        }
        setStatus('error');
      }
    };

    handleConfirmation();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Compte à rebours et redirection vers le dashboard après succès
  useEffect(() => {
    if (status !== 'success') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, router]);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: '#090A0F',
        backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(212,175,55,0.10), rgba(9,10,15,1))',
      }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.4)]">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              Izi<span className="text-[#D4AF37]">Facture</span>
            </span>
          </div>
        </div>

        {/* Card principale */}
        <div className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden">

          {/* Header de la card */}
          <div className="px-8 pt-8 pb-6 border-b border-[#D4AF37]/15">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Vérification de votre compte
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Finalisation de la création de votre espace IziFacture
            </p>
          </div>

          {/* Corps de la card */}
          <div className="px-8 py-10 flex flex-col items-center text-center gap-6">

            {/* === État : CHARGEMENT === */}
            {status === 'loading' && (
              <>
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 flex items-center justify-center">
                  <Loader2 className="w-9 h-9 text-[#D4AF37] animate-spin" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Confirmation en cours…</p>
                  <p className="text-slate-400 text-xs mt-1.5">
                    Nous vérifions votre adresse email.<br />Veuillez patienter quelques instants.
                  </p>
                </div>
                {/* Barre de progression animée */}
                <div className="w-full h-1.5 bg-[#181926] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#DFBA55] to-[#B8860B] rounded-full animate-progress" style={{ width: '50%' }} />
                </div>
              </>
            )}

            {/* === État : SUCCÈS === */}
            {status === 'success' && (
              <>
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/15 border-2 border-[#D4AF37]/50 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                  <CheckCircle2 className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-extrabold text-lg">Compte confirmé ! 🎉</p>
                  <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                    Votre adresse email a été vérifiée avec succès.<br />
                    Votre espace IziFacture est prêt.
                  </p>
                </div>

                {/* Badge de succès */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
                  <span className="text-[#F5E6B3] text-xs font-semibold">Compte actif et sécurisé</span>
                </div>

                {/* Redirection automatique */}
                <div className="w-full">
                  <div className="text-slate-400 text-xs mb-3">
                    Redirection automatique vers le tableau de bord dans{' '}
                    <span className="text-[#D4AF37] font-bold font-mono">{countdown}s</span>
                  </div>
                  {/* Barre de progression du countdown */}
                  <div className="w-full h-1.5 bg-[#181926] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#DFBA55] to-[#B8860B] rounded-full transition-all duration-1000"
                      style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-sm shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all"
                >
                  Accéder à l&apos;application maintenant →
                </button>
              </>
            )}

            {/* === État : ERREUR === */}
            {status === 'error' && (
              <>
                <div className="w-20 h-20 rounded-full bg-red-950/40 border-2 border-red-700/40 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Confirmation échouée</p>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed max-w-xs">
                    {errorMsg || 'Une erreur est survenue lors de la confirmation de votre compte.'}
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-sm shadow-[0_2px_15px_rgba(212,175,55,0.3)] active:scale-95 transition-all"
                  >
                    Retourner à la connexion
                  </button>
                  <button
                    onClick={() => router.push('/login?mode=signup')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-[#F5E6B3] font-semibold text-xs hover:bg-[#202234] active:scale-95 transition-all"
                  >
                    Demander un nouveau lien de confirmation
                  </button>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600 mt-6">
          © 2026 IziFacture · Solution de Facturation B2B OHADA
        </p>
      </div>
    </main>
  );
}
