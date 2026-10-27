'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export type UserRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
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
  role: 'user',
  isAdmin: false,
  displayName: 'Cyrille',
  firstName: 'Cyrille',
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false, alreadyExists: false }),
  verifyOtp: async () => ({ error: null }),
  resendConfirmation: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('user');

  // Fetch role from profiles table — called after every auth state change
  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!data) {
        // Profil manquant : auto-création pour éviter les erreurs de clé étrangère
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            is_subscribed: true,
            role: 'user',
          }, { onConflict: 'id' });
        }
      }

      if (data?.role === 'admin') {
        setRole('admin');
      } else {
        setRole('user');
      }
    } catch {
      setRole('user');
    }
  }, []);

  useEffect(() => {
    // Timeout de sécurité : si Supabase ne répond pas en 5s, on débloque l'UI
    const authTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // 1. Récupérer la session active
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(authTimeout);
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchRole(u.id);
      setLoading(false);
    }).catch(() => {
      clearTimeout(authTimeout);
      setLoading(false);
    });

    // 2. Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(authTimeout);
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchRole(u.id);
      } else {
        setRole('user');
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [fetchRole]);

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
    // 1. Réinitialiser immédiatement l'état React pour une transition instantanée (0 ms)
    setUser(null);
    setSession(null);
    setRole('user');

    // 2. Nettoyage immédiat des caches locaux
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('izifacture_sub_cache_v1');
        localStorage.removeItem('izifacture_invoices_v1');
        localStorage.removeItem('izifacture_clients_v1');
      } catch { }
    }

    // 3. Déconnexion locale immédiate et révocation distante en tâche de fond (non bloquante)
    try {
      supabase.auth.signOut({ scope: 'local' }).catch(() => { });
    } catch (err) {
      console.warn('Erreur déconnexion:', err);
    }
  };

  // Calcul automatisé du nom de l'utilisateur connecté
  const rawName =
    (user?.user_metadata?.full_name as string) ||
    (user?.email ? user.email.split('@')[0] : 'Cyrille');
  const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Cyrille';
  const firstName = displayName.split(/\s+/)[0] || 'Cyrille';

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        isAdmin,
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
