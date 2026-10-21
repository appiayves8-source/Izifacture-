'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  firstName: string;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsConfirmation?: boolean; alreadyExists?: boolean }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  displayName: 'Cyrille',
  firstName: 'Cyrille',
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false, alreadyExists: false }),
  verifyOtp: async () => ({ error: null }),
  resendConfirmation: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Récupérer la session active
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: (err as Error).message || 'Erreur de connexion' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/confirm`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: 'Directeur Général',
          },
        },
      });
      if (error) {
        return { error: error.message, needsConfirmation: false };
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        return { error: null, needsConfirmation: false };
      }

      // Supabase renvoie un tableau identities vide quand le compte existe déjà
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        return {
          error: "Cette adresse email possède déjà un compte actif et validé ! Veuillez vous connecter directement avec votre mot de passe.",
          needsConfirmation: false,
          alreadyExists: true,
        };
      }

      // Si l'utilisateur est créé mais sans session immédiate, une confirmation par email est requise
      return { error: null, needsConfirmation: true };
    } catch (err: unknown) {
      return { error: (err as Error).message || 'Erreur lors de la création du compte', needsConfirmation: false };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const cleanedEmail = email.trim().toLowerCase();
      const cleanedToken = token.replace(/[\s-]/g, '').trim();

      // 1. Tenter la vérification avec type 'signup'
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanedEmail,
        token: cleanedToken,
        type: 'signup',
      });

      if (!error && data.session) {
        setSession(data.session);
        setUser(data.user);
        return { error: null };
      }

      // 2. Si échec, tenter avec type 'email' (format universel Supabase)
      if (error) {
        const { data: d2, error: e2 } = await supabase.auth.verifyOtp({
          email: cleanedEmail,
          token: cleanedToken,
          type: 'email',
        });

        if (!e2 && d2.session) {
          setSession(d2.session);
          setUser(d2.user);
          return { error: null };
        }

        const rawMsg = e2?.message || error.message;
        if (rawMsg.toLowerCase().includes('expired') || rawMsg.toLowerCase().includes('invalid')) {
          return {
            error: "Ce code a expiré ou a déjà été utilisé. Si vous avez déjà cliqué sur le lien dans votre boîte Gmail, votre compte est déjà actif : connectez-vous directement.",
          };
        }
        return { error: rawMsg };
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: (err as Error).message || 'Code de confirmation invalide' };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) {
        if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('confirmed')) {
          return { error: "Ce compte a déjà été confirmé ! Connectez-vous directement." };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: (err as Error).message || 'Erreur lors du renvoi du code' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/update-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: redirectUrl,
        }
      );
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: (err as Error).message || 'Erreur lors de la demande de réinitialisation' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: (err as Error).message || 'Erreur lors de la mise à jour du mot de passe' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erreur déconnexion:', err);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  // Calcul automatisé du nom de l'utilisateur connecté
  const rawName =
    (user?.user_metadata?.full_name as string) ||
    (user?.email ? user.email.split('@')[0] : 'Cyrille');
  const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Cyrille';
  const firstName = displayName.split(/\s+/)[0] || 'Cyrille';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        displayName,
        firstName,
        signIn,
        signUp,
        verifyOtp,
        resendConfirmation,
        resetPassword,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
