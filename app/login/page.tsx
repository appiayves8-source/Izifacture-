'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    signIn,
    signUp,
    verifyOtp,
    resendConfirmation,
    resetPassword,
    updatePassword,
    signOut,
    loading: authLoading,
  } = useAuth();

  const [mode, setMode] = useState<
    'signin' | 'signup' | 'confirm_otp' | 'forgot_password' | 'update_password'
  >('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Écouter l'événement de récupération de mot de passe Supabase
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update_password');
        setSuccessMessage('Lien de réinitialisation validé ! Veuillez définir votre nouveau mot de passe.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Détecter si l'utilisateur arrive via un lien de confirmation ou avec un code dans l'URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    // Détection réinitialisation mot de passe
    if (urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery') {
      setMode('update_password');
      setSuccessMessage('Lien de réinitialisation validé ! Veuillez saisir votre nouveau mot de passe.');
      return;
    }

    const code =
      urlParams.get('code') ||
      urlParams.get('token') ||
      urlParams.get('otp') ||
      urlParams.get('token_hash');
    const paramEmail = urlParams.get('email');
    const isConfirmed = urlParams.get('confirmed') === 'true';

    if (paramEmail) {
      setEmail(paramEmail);
    }

    if (code) {
      setOtpCode(code);
      setMode('confirm_otp');
      setSuccessMessage('Code de confirmation détecté depuis le lien !');

      if (paramEmail) {
        verifyOtp(paramEmail, code).then((res) => {
          if (!res.error) {
            setSuccessMessage('Compte validé avec succès ! Redirection en cours...');
            setTimeout(() => router.push('/'), 1200);
          } else {
            setErrorMessage(res.error);
          }
        });
      }
    } else if (isConfirmed || hashParams.get('access_token')) {
      if (hashParams.get('type') !== 'recovery') {
        setSuccessMessage('Votre compte a été confirmé avec succès par le lien email ! Redirection...');
        setTimeout(() => router.push('/'), 1200);
      }
    }
  }, [router, verifyOtp]);

  // Synchronisation automatique cross-device
  useEffect(() => {
    if (mode !== 'confirm_otp' || !email) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        if (password) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

          if (!error && data.session && isMounted) {
            clearInterval(pollInterval);
            setSuccessMessage('🎉 Confirmation détectée depuis votre autre appareil ! Accès autorisé...');
            setTimeout(() => {
              router.push('/');
            }, 1000);
          }
        }
      } catch {
        // En attente
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [mode, email, password, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const res = await signIn(email, password);
      if (res.error) {
        if (res.error.toLowerCase().includes('email not confirmed')) {
          setErrorMessage("Votre adresse email n'a pas encore été confirmée. Entrez le code reçu sur votre boîte Gmail ci-dessous.");
          setMode('confirm_otp');
        } else {
          setErrorMessage(res.error);
        }
        setSubmitting(false);
      } else {
        router.push('/');
      }
    } else if (mode === 'signup') {
      const res = await signUp(email, password, fullName);
      if (res.alreadyExists) {
        setErrorMessage(res.error);
        setMode('signin');
        setSubmitting(false);
      } else if (res.error) {
        setErrorMessage(res.error);
        setSubmitting(false);
      } else if (res.needsConfirmation) {
        setSubmitting(false);
        setSuccessMessage('Un email avec un code de confirmation vient d\'être envoyé sur votre compte Gmail.');
        setMode('confirm_otp');
      } else {
        setSuccessMessage('Compte créé avec succès ! Redirection en cours...');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } else if (mode === 'confirm_otp') {
      if (!otpCode.trim()) {
        setErrorMessage('Veuillez renseigner le code de confirmation reçu par email.');
        setSubmitting(false);
        return;
      }
      const res = await verifyOtp(email, otpCode);
      if (res.error) {
        setErrorMessage(res.error);
        setSubmitting(false);
      } else {
        setSuccessMessage('Compte confirmé avec succès ! Accès en cours...');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    } else if (mode === 'forgot_password') {
      if (!email.trim()) {
        setErrorMessage('Veuillez renseigner votre adresse email.');
        setSubmitting(false);
        return;
      }
      const res = await resetPassword(email);
      setSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(
          'Un lien de réinitialisation vous a été envoyé par email ! Cliquez sur le lien reçu dans votre boîte de réception ou dossier Spam.'
        );
      }
    } else if (mode === 'update_password') {
      if (newPassword.length < 6) {
        setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
        setSubmitting(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Les deux mots de passe ne correspondent pas.');
        setSubmitting(false);
        return;
      }
      const res = await updatePassword(newPassword);
      setSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Mot de passe mis à jour avec succès ! Redirection vers votre tableau de bord...');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setResending(true);
    setErrorMessage(null);
    const res = await resendConfirmation(email);
    setResending(false);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('Un nouveau code de confirmation a été envoyé sur votre adresse Gmail !');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#090A0F] text-white relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.12),rgba(9,10,15,1))]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DFBA55] via-[#D4AF37] to-[#8C6709] shadow-[0_4px_25px_rgba(212,175,55,0.4)] mb-3">
            <div className="grid grid-cols-2 gap-1.5 p-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-100"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-100"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              IziFacture
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37]/20 text-[#E5C158] rounded-full border border-[#D4AF37]/40">
              UEMOA
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Plateforme SaaS de Facturation B2B & Gestion OHADA
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/30 shadow-[0_8px_40px_rgba(0,0,0,0.6)] p-6 sm:p-8 backdrop-blur-xl">
          {/* Header contextuel selon le mode */}
          {mode === 'confirm_otp' ? (
            <div className="mb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DFBA55]/20 via-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#DFBA55] mx-auto shadow-[0_0_20px_rgba(212,175,55,0.2)] mb-3">
                <Mail className="w-7 h-7 stroke-[2]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">Vérification de votre compte</h2>
              <p className="text-xs text-slate-300 mt-1">
                Un code de confirmation a été envoyé sur votre adresse :
              </p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181926] border border-[#D4AF37]/30 text-[#F5E6B3] font-mono text-xs font-bold">
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{email || 'votre-email@gmail.com'}</span>
              </div>

              {/* Synchronisation multi-appareils active */}
              <div className="mt-3.5 mx-auto max-w-sm p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center gap-3 text-left shadow-[0_0_15px_rgba(212,175,55,0.08)]">
                <span className="relative flex h-3 w-3 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DFBA55]"></span>
                </span>
                <p className="text-[11px] text-[#F5E6B3] leading-snug">
                  <strong className="text-white font-semibold">Synchronisation multi-appareils active :</strong> Dès que vous confirmez le compte depuis votre téléphone ou boîte Gmail, cet écran s&apos;ouvrira automatiquement sans rien taper.
                </p>
              </div>
            </div>
          ) : mode === 'forgot_password' ? (
            <div className="mb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DFBA55]/20 via-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#DFBA55] mx-auto shadow-[0_0_20px_rgba(212,175,55,0.2)] mb-3">
                <KeyRound className="w-7 h-7 stroke-[2]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">Mot de passe oublié ?</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                Saisissez votre adresse email. Vous recevrez un lien sécurisé pour définir un nouveau mot de passe.
              </p>
            </div>
          ) : mode === 'update_password' ? (
            <div className="mb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DFBA55]/20 via-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#DFBA55] mx-auto shadow-[0_0_20px_rgba(212,175,55,0.2)] mb-3">
                <Lock className="w-7 h-7 stroke-[2]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">Nouveau mot de passe</h2>
              <p className="text-xs text-slate-300 mt-1">
                Définissez un nouveau mot de passe sécurisé pour votre compte.
              </p>
            </div>
          ) : (
            <div className="flex p-1 rounded-xl bg-[#090A0F] border border-[#D4AF37]/20 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setFullName('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Créer un compte
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulaires */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode 1: Confirmation OTP */}
            {mode === 'confirm_otp' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                    Code de confirmation (OTP)
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#181926] border border-[#D4AF37]/40 text-center font-mono tracking-[0.35em] text-lg font-bold text-[#F5E6B3] placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-2 leading-relaxed">
                    Consultez vos messages reçus Gmail ou le dossier Spam.<br />
                    Vous pouvez aussi cliquer directement sur le bouton reçu dans l&apos;email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-xs shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Confirmer et accéder à l&apos;application</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#181926] hover:bg-[#202234] border border-[#D4AF37]/25 text-xs font-semibold text-[#F5E6B3] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>{resending ? 'Renvoi en cours...' : 'Renvoyer un nouveau code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors py-1.5"
                  >
                    ← Revenir à la page de connexion
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Mot de passe oublié */}
            {mode === 'forgot_password' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Votre Adresse Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@entreprise.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-xs transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-xs shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Envoyer le lien de réinitialisation</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors py-2"
                >
                  ← Revenir à la page de connexion
                </button>
              </div>
            )}

            {/* Mode 3: Nouveau mot de passe (suite à lien de récupération) */}
            {mode === 'update_password' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-xs transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-xs shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enregistrer mon nouveau mot de passe</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mode 4 & 5: Connexion classique & Inscription */}
            {(mode === 'signin' || mode === 'signup') && (
              <>
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nom & Prénom
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Entrez votre nom et prénom"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-xs transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@entreprise.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-xs transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Mot de passe
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot_password');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-[11px] text-[#D4AF37] hover:text-[#F5E6B3] hover:underline font-semibold transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black font-extrabold text-xs shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Accéder au Dashboard' : 'Créer mon compte'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {/* Security mention */}
          <div className="mt-6 pt-5 border-t border-[#D4AF37]/15 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Sécurisé par Supabase Auth & Chiffrement SSL 256-bit</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          © {new Date().getFullYear()} IziFacture SARL — Conforme aux normes OHADA / UEMOA.
        </p>
      </div>
    </div>
  );
}
