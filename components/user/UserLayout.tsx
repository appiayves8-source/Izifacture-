'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  FileText,
  FileSpreadsheet,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  Menu,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';

interface UserLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

const navItems = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutGrid,
  },
  {
    id: 'invoices',
    label: 'Mes Factures',
    href: '/invoices',
    icon: FileText,
  },
  {
    id: 'quotes',
    label: 'Mes Devis',
    href: '/quotes',
    icon: FileSpreadsheet,
  },
  {
    id: 'clients',
    label: 'Mes Clients',
    href: '/clients',
    icon: Users,
  },
  {
    id: 'payments',
    label: 'Paiements',
    href: '/payments',
    icon: CreditCard,
  },
  {
    id: 'settings',
    label: 'Mon Profil & Paramètres',
    href: '/settings',
    icon: Settings,
  },
  {
    id: 'support',
    label: 'Aide & Support',
    href: '/support',
    icon: HelpCircle,
  },
];

/**
 * UserLayout — Layout avec identité visuelle de la landing page (Material Design 3 / Blue).
 * Utilisé pour tous les espaces de l'utilisateur non-admin.
 */
export default function UserLayout({ children, activePage }: UserLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName, firstName, user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut();
    router.replace('/');
  };

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const isActive = (item: typeof navItems[0]) => {
    if (activePage) return activePage === item.id;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Logo */}
      <div className="p-5 border-b border-surface-container">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          </div>
          <div>
            <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight block">
              iziFacture
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Espace Personnel
            </span>
          </div>
        </Link>
      </div>

      {/* New Invoice CTA */}
      <div className="px-4 py-4">
        <Link
          href="/invoices/new"
          onClick={() => setMobileOpen(false)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:bg-primary transition-all duration-200 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Facture</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-label-lg text-label-lg transition-all duration-150 group ${
                active
                  ? 'bg-primary-container/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="p-4 border-t border-surface-container">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
              {firstName || 'Mon compte'}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            title="Se déconnecter"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-on-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-surface-container-lowest border-r border-surface-container flex-shrink-0 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 h-full bg-surface-container-lowest border-r border-surface-container animate-slide-in-left">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 xl:ml-72 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-surface-container flex items-center px-4 sm:px-6 gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile brand */}
          <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            </div>
            <span className="font-title-md text-title-md text-on-surface font-bold">iziFacture</span>
          </Link>

          <div className="flex-1" />

          {/* Notifications placeholder */}
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold cursor-pointer">
            {initials}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
