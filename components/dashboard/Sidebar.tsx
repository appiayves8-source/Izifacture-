'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  FileText,
  FileSpreadsheet,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useInvoiceStore } from '@/lib/store/invoiceStore';
import { useAuth } from '@/lib/context/AuthContext';
import { useSubscription } from '@/lib/hooks/useSubscription';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const navigationGroups = [
  {
    title: 'OPÉRATIONS',
    items: [
      {
        name: "Vue d'ensemble",
        href: '/',
        icon: LayoutGrid,
      },
      {
        name: 'Factures',
        href: '/invoices',
        icon: FileText,
        badge: '24',
      },
      {
        name: 'Devis',
        href: '/quotes',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    title: 'GESTION',
    items: [
      {
        name: 'Clients',
        href: '/clients',
        icon: Users,
      },
      {
        name: 'Paiements & Mobile Money',
        href: '/payments',
        icon: CreditCard,
      },
    ],
  },
  {
    title: 'SYSTÈME',
    items: [
      {
        name: 'Paramètres',
        href: '/settings',
        icon: Settings,
      },
      {
        name: 'Support & Aide',
        href: '/support',
        icon: HelpCircle,
      },
    ],
  },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { invoices } = useInvoiceStore();
  const { isActive } = useSubscription();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutSuccessToast, setLogoutSuccessToast] = useState(false);

  const handleConfirmLogout = async () => {
    setLogoutModalOpen(false);
    if (onClose) onClose();
    try {
      await signOut();
      router.push('/login');
    } catch (e) {
      console.warn('Logout error:', e);
      router.push('/login');
    }
  };

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Shared Navigation list renderer
  const renderNavList = (isMobile: boolean = false) => (
    <nav className={`space-y-6 ${isMobile ? 'px-1' : 'px-1'}`}>
      {navigationGroups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <h3 className="px-3.5 text-[10px] font-bold tracking-wider text-[#D4AF37]/70 uppercase font-sans">
            {group.title}
          </h3>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose && onClose()}
                  className={`group flex items-center justify-between rounded-xl font-medium transition-all duration-200 ${
                    isMobile
                      ? 'px-3.5 py-3 text-sm'
                      : 'px-3 py-2 text-xs'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent text-[#F5E6B3] border-l-2 border-[#D4AF37] shadow-[inset_0_1px_0_0_rgba(212,175,55,0.2)] font-semibold'
                      : 'text-slate-400 hover:text-amber-100 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`flex-shrink-0 transition-colors ${
                        isMobile ? 'w-5 h-5' : 'w-4 h-4'
                      } ${
                        isActive
                          ? 'text-[#E5C158]'
                          : 'text-slate-500 group-hover:text-[#D4AF37]'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.name === 'Factures' ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37]/20 text-[#F5E6B3] rounded-full border border-[#D4AF37]/40 shadow-sm">
                        {invoices.length}
                      </span>
                    ) : item.badge ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37]/20 text-[#F5E6B3] rounded-full border border-[#D4AF37]/40 shadow-sm">
                        {item.badge}
                      </span>
                    ) : null}
                    {isMobile && !isActive && (
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  // User Profile Card renderer
  const renderUserProfile = (isMobile: boolean = false) => {
    const rawName = (user?.user_metadata?.full_name as string) || (user?.email ? user.email.split('@')[0] : 'Utilisateur');
    const displayName = rawName;
    const userEmail = user?.email || '';
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

    return (
      <div className="space-y-2">
        {/* Pro Status Pill (Only for Pro accounts like cbonano056 and appiayves8) */}
        {isActive && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-transparent border border-[#D4AF37]/30 text-[11px] shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-[#F5E6B3]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
              <span>Licence Pro Illimitée</span>
            </div>
            <span className="text-[10px] font-mono text-[#D4AF37] font-bold px-1.5 py-0.5 rounded bg-[#D4AF37]/15">
              Actif
            </span>
          </div>
        )}

        <div className={`rounded-xl bg-[#12131C] hover:bg-[#181926] border border-[#D4AF37]/20 transition-all duration-200 shadow-sm ${
          isMobile ? 'p-3' : 'p-2.5'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-[#B8860B] via-[#D4AF37] to-[#F5E6B3] flex items-center justify-center text-black font-extrabold text-xs shadow-md flex-shrink-0">
                <span>{initials}</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#D4AF37] rounded-full ring-2 ring-[#12131C]"></span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[10px] text-[#D4AF37] truncate font-mono font-medium" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              title="Se déconnecter"
              className="p-2 text-slate-400 hover:text-[#E5C158] hover:bg-[#D4AF37]/15 rounded-lg transition-all flex-shrink-0 active:scale-95 border border-transparent hover:border-[#D4AF37]/30"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-col justify-between p-4 bg-[#0D0E15]/95 backdrop-blur-xl border-r border-[#D4AF37]/20 flex-shrink-0 z-30">
        <div className="space-y-6">
          {/* Brand / Logo */}
          <div className="px-2 pt-1 pb-2">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFBA55] via-[#D4AF37] to-[#8C6709] flex items-center justify-center shadow-[0_2px_12px_rgba(212,175,55,0.3)] group-hover:scale-105 transition-transform duration-200">
                <div className="grid grid-cols-2 gap-1 p-1">
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-100"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-100"></span>
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white tracking-tight text-base font-sans">
                    IziFacture
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#D4AF37]/20 text-[#E5C158] rounded-full border border-[#D4AF37]/40">
                    UEMOA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Facturation & Gestion
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation items */}
          {renderNavList(false)}
        </div>

        {/* Desktop User Profile Footer */}
        <div className="pt-4 border-t border-[#D4AF37]/15 px-1">
          {renderUserProfile(false)}
        </div>
      </aside>

      {/* ================= MOBILE DRAWER MENU ================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop with smooth blur */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sliding Drawer Panel with comfortable width and proper scroll */}
          <div className="fixed inset-y-0 left-0 w-[84vw] max-w-[340px] h-[100dvh] bg-[#0D0E15] shadow-2xl z-50 flex flex-col justify-between overflow-hidden animate-slide-in-left border-r border-[#D4AF37]/30">
            {/* Mobile Header: Logo + Spacious Close Button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4AF37]/15 flex-shrink-0 bg-[#0D0E15]">
              <Link href="/" onClick={onClose} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFBA55] via-[#D4AF37] to-[#8C6709] flex items-center justify-center shadow-md">
                  <div className="grid grid-cols-2 gap-1 p-1">
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-100"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-100"></span>
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white tracking-tight text-base font-sans">
                      IziFacture
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#D4AF37]/20 text-[#E5C158] rounded-full border border-[#D4AF37]/40">
                      UEMOA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Facturation B2B
                  </p>
                </div>
              </Link>

              {/* Spacious Close Button for Touch */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/5"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Area with generous mobile touch targets */}
            <div className="flex-1 overflow-y-auto px-4 py-5 overscroll-contain">
              {renderNavList(true)}
            </div>

            {/* Mobile Footer: User Info & Safe Padding */}
            <div className="p-4 border-t border-[#D4AF37]/15 bg-[#090A0F] flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              {renderUserProfile(true)}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALE D'ALERTE DE CONFIRMATION DE DÉCONNEXION (OUI / NON) ================= */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop avec flou sombre */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setLogoutModalOpen(false)}
          />

          {/* Boîte d'alerte Noir & Or */}
          <div className="relative bg-[#12131C] rounded-2xl p-6 border border-[#D4AF37]/40 shadow-[0_8px_40px_rgba(0,0,0,0.85)] max-w-md w-full z-10 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DFBA55]/20 via-[#D4AF37]/15 to-[#B8860B]/10 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 text-[#DFBA55] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <LogOut className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight font-sans">
                  Confirmation de déconnexion
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Souhaitez-vous vraiment vous déconnecter de la session <strong className="text-[#F5E6B3]">IziFacture</strong> ?
                </p>
              </div>
            </div>

            {/* Boutons d'action : Non / Oui */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#181926] hover:bg-[#202234] text-slate-300 hover:text-white border border-[#D4AF37]/25 text-xs font-semibold transition-all active:scale-95"
              >
                Non, annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all"
              >
                Oui, me déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast d'information suite à la déconnexion */}
      {logoutSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12131C] border border-[#D4AF37]/60 shadow-[0_4px_25px_rgba(212,175,55,0.3)] rounded-2xl p-4 flex items-center gap-3 text-white max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#DFBA55] flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Session fermée</p>
            <p className="text-[11px] text-slate-300">Vous avez été déconnecté avec succès. À bientôt !</p>
          </div>
        </div>
      )}
    </>
  );
}
