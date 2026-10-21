'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, X, FileText, Users, TrendingUp, Clock, AlertCircle, ChevronRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInvoiceStore } from '@/lib/store/invoiceStore';
import { useAuth } from '@/lib/context/AuthContext';
import { formatFCFA } from '@/lib/utils/formatters';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  breadcrumb?: { section: string; page: string };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  desc: string;
  amount: number;
  time: string;
  read: boolean;
  hidden?: boolean;
  url?: string;
}

const STORAGE_KEY_NOTIFS = 'izifacture_notifications_v1';

// ─── Mock Notifications ───
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'overdue',
    title: 'Facture en retard',
    desc: 'FAC-2024-0086 · Aïcha Traoré Consulting',
    amount: 750000,
    time: 'Il y a 2h',
    read: false,
    hidden: false,
    url: '/invoices/inv-4',
  },
  {
    id: 'n2',
    type: 'paid',
    title: 'Paiement reçu',
    desc: 'FAC-2024-0089 · SNT Abidjan — Wave',
    amount: 3850000,
    time: 'Il y a 4h',
    read: false,
    hidden: false,
    url: '/invoices/inv-1',
  },
  {
    id: 'n3',
    type: 'sent',
    title: 'Facture envoyée',
    desc: 'FAC-2024-0088 · Clinique Pasteur Dakar',
    amount: 2400000,
    time: 'Hier, 14:30',
    read: true,
    hidden: false,
    url: '/invoices/inv-2',
  },
  {
    id: 'n4',
    type: 'due_soon',
    title: 'Échéance dans 3 jours',
    desc: 'FAC-2024-0085 · Koffi & Associés Lomé',
    amount: 1850000,
    time: 'Hier, 09:00',
    read: true,
    hidden: false,
    url: '/invoices/inv-5',
  },
];

export default function Topbar({
  onOpenMobileMenu,
  breadcrumb = { section: 'Opérations', page: "Vue d'ensemble" },
}: TopbarProps) {
  const router = useRouter();
  const { invoices } = useInvoiceStore();
  const { firstName } = useAuth();

  const [time, setTime] = useState<string>('00:00 GMT');

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sync notifications from real database invoices
  useEffect(() => {
    if (!invoices || invoices.length === 0) return;

    const realNotifs: NotificationItem[] = invoices.slice(0, 6).map((inv) => {
      let type = 'sent';
      let title = 'Facture transmise';
      if (inv.status === 'payee') {
        type = 'paid';
        title = 'Paiement validé';
      } else if (inv.status === 'en_retard') {
        type = 'overdue';
        title = 'Facture en retard';
      } else if (inv.status === 'brouillon') {
        type = 'due_soon';
        title = 'Brouillon en attente';
      }

      return {
        id: `notif-${inv.id}`,
        type,
        title,
        desc: `${inv.invoiceNumber} · ${inv.client?.name || 'Client'}`,
        amount: inv.amount,
        time: inv.issueDate,
        read: inv.status === 'payee',
        hidden: false,
        url: `/invoices/${inv.id}`,
      };
    });

    setNotifications(realNotifs);
  }, [invoices]);

  const saveNotifications = (newList: NotificationItem[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage error writing notifications:', e);
    }
  };

  const visibleNotifications = showHidden
    ? notifications
    : notifications.filter((n) => !n.hidden);

  const unreadCount = notifications.filter((n) => !n.hidden && !n.read).length;

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      setTime(`${h}:${m} GMT`);
    };
    update();
    const iv = setInterval(update, 10000);
    return () => clearInterval(iv);
  }, []);

  // Focus search input when panel opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Close panels on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Escape key closes panels
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Search results — filter from store
  const searchResults = searchQuery.trim().length >= 2
    ? invoices.filter((inv) => {
        const q = searchQuery.toLowerCase();
        return (
          inv.client?.name?.toLowerCase().includes(q) ||
          inv.invoiceNumber?.toLowerCase().includes(q) ||
          inv.serviceType?.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  const markAllMasked = () => {
    const updated = notifications.map((n) => ({ ...n, read: true, hidden: true }));
    saveNotifications(updated);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    // 1. Marquer comme lue et masquée (devient masquée une fois regardée)
    const updated = notifications.map((x) =>
      x.id === n.id ? { ...x, read: true, hidden: true } : x
    );
    saveNotifications(updated);

    // 2. Fermer le panneau de notification
    setNotifOpen(false);

    // 3. Rediriger vers la page ciblée
    if (n.url) {
      router.push(n.url);
      return;
    }

    const match = invoices.find((inv) => n.desc.includes(inv.invoiceNumber));
    if (match) {
      router.push(`/invoices/${match.id}`);
    } else {
      router.push('/invoices');
    }
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case 'overdue': return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'paid': return <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />;
      case 'sent': return <FileText className="w-3.5 h-3.5 text-amber-300" />;
      case 'due_soon': return <Clock className="w-3.5 h-3.5 text-sky-300" />;
      default: return <Bell className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#D4AF37]/20 bg-[#090A0F]/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
      {/* Left: Mobile Menu + Breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 bg-[#13141F] border border-[#D4AF37]/30 shadow-sm hover:text-white hover:border-[#D4AF37] active:scale-95 transition-all flex-shrink-0"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs truncate">
          <span className="font-extrabold text-[#F5E6B3] text-xs sm:text-sm tracking-tight flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse"></span>
            Bonjour, {firstName || 'Cyrille'}
          </span>
          <span className="text-[#D4AF37]/40 font-light">|</span>
          <span className="hidden sm:inline text-slate-400 font-medium">{breadcrumb.section}</span>
          <span className="hidden sm:inline text-[#D4AF37]/40 font-light">/</span>
          <span className="text-white font-bold tracking-tight truncate">{breadcrumb.page}</span>
        </div>
      </div>

      {/* Right: Clock + Search + Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Live Clock */}
        <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#13141F] border border-[#D4AF37]/30 shadow-sm text-[10px] sm:text-[11px] font-mono font-medium text-[#F5E6B3]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
          </span>
          <span className="tabular-nums font-semibold">{time}</span>
        </div>

        {/* ── SEARCH ── */}
        <div ref={searchRef} className="relative">
          <button
            id="topbar-search-btn"
            onClick={() => { setSearchOpen((o) => !o); setNotifOpen(false); }}
            title="Rechercher (Ctrl+K)"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm border ${
              searchOpen
                ? 'bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#F5E6B3]'
                : 'bg-[#13141F] border-[#D4AF37]/20 text-slate-400 hover:text-[#E5C158] hover:bg-[#181926] hover:border-[#D4AF37]/50'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {searchOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-[380px] rounded-2xl bg-[#12131C] border border-[#D4AF37]/30 shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
              {/* Search input */}
              <div className="p-3 border-b border-[#D4AF37]/15 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher facture, client, prestation…"
                  className="flex-1 bg-transparent text-white text-xs placeholder-slate-500 outline-none font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto py-1">
                {searchQuery.trim().length < 2 ? (
                  <div className="px-4 py-6 text-center">
                    <Search className="w-6 h-6 text-[#D4AF37]/40 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Tapez au moins 2 caractères…</p>
                    <p className="text-[11px] text-slate-600 mt-1">Factures, clients, prestations</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-slate-400">Aucun résultat pour <span className="text-white font-semibold">"{searchQuery}"</span></p>
                  </div>
                ) : (
                  <>
                    <p className="px-3.5 pt-2 pb-1 text-[10px] text-[#D4AF37]/70 font-bold uppercase tracking-wider">
                      {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                    </p>
                    {searchResults.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => { router.push(`/invoices/${inv.id}`); setSearchOpen(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#181926] border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-white text-xs">{inv.invoiceNumber}</span>
                            <span className="font-mono text-[#F5E6B3] font-bold text-xs tabular-nums">{formatFCFA(inv.amount)}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{inv.client?.name} · {inv.serviceType}</p>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-[#D4AF37]/10 p-2">
                      <button
                        onClick={() => { router.push('/invoices'); setSearchOpen(false); setSearchQuery(''); }}
                        className="w-full text-center text-[11px] text-[#D4AF37] hover:text-amber-200 font-semibold py-1 transition-colors"
                      >
                        Voir toutes les factures →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── NOTIFICATIONS ── */}
        <div ref={notifRef} className="relative">
          <button
            id="topbar-notif-btn"
            onClick={() => { setNotifOpen((o) => !o); setSearchOpen(false); }}
            title="Notifications"
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm border ${
              notifOpen
                ? 'bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#F5E6B3]'
                : 'bg-[#13141F] border-[#D4AF37]/20 text-slate-400 hover:text-[#E5C158] hover:bg-[#181926] hover:border-[#D4AF37]/50'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[#D4AF37] text-black text-[9px] font-black rounded-full ring-2 ring-[#090A0F]">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-[380px] rounded-2xl bg-[#12131C] border border-[#D4AF37]/30 shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[#D4AF37]/15 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">Notifications</h3>
                  {unreadCount > 0 ? (
                    <p className="text-[11px] text-[#D4AF37] font-semibold">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium">Toutes à jour</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllMasked}
                      className="text-[10px] text-[#D4AF37] hover:text-amber-200 font-bold transition-colors"
                      title="Masquer toutes les notifications"
                    >
                      Tout masquer
                    </button>
                  )}
                  {notifications.some((n) => n.hidden) && (
                    <button
                      onClick={() => setShowHidden(!showHidden)}
                      className="text-[10px] text-slate-400 hover:text-[#F5E6B3] font-medium transition-colors flex items-center gap-1"
                      title={showHidden ? "Masquer les notifications déjà lues" : "Afficher l'historique masqué"}
                    >
                      {showHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showHidden ? 'Filtrer' : 'Historique'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Show Hidden Banner */}
              {showHidden && (
                <div className="px-4 py-1.5 bg-[#181926] border-b border-[#D4AF37]/15 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Affichage de l&apos;historique complet ({notifications.length})</span>
                  <button
                    onClick={() => setShowHidden(false)}
                    className="text-[#D4AF37] hover:underline"
                  >
                    Masquer les lues
                  </button>
                </div>
              )}

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#D4AF37]/10">
                {visibleNotifications.length === 0 ? (
                  <div className="py-8 px-4 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#DFBA55]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white">Aucune notification en attente</p>
                    <p className="text-[11px] text-slate-400 max-w-[260px] mx-auto">
                      Les notifications consultées sont automatiquement masquées.
                    </p>
                    {notifications.some((n) => n.hidden) && (
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setShowHidden(true)}
                          className="text-[11px] text-[#D4AF37] hover:underline font-semibold"
                        >
                          Voir l&apos;historique ({notifications.filter((n) => n.hidden).length})
                        </button>
                        <span className="text-slate-600">·</span>
                        <button
                          onClick={() => {
                            const reset = MOCK_NOTIFICATIONS.map((m) => ({ ...m, read: false, hidden: false }));
                            saveNotifications(reset);
                            setShowHidden(false);
                          }}
                          className="text-[11px] text-slate-400 hover:text-white transition-colors"
                        >
                          Réinitialiser
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  visibleNotifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 cursor-pointer group hover:bg-[#181926] transition-all ${
                        !n.read && !n.hidden ? 'bg-[#D4AF37]/[0.06]' : 'opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${
                          n.type === 'overdue'
                            ? 'bg-red-950/50 border border-red-800/40'
                            : n.type === 'paid'
                            ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/35'
                            : n.type === 'sent'
                            ? 'bg-amber-950/40 border border-amber-700/35'
                            : 'bg-sky-950/40 border border-sky-700/35'
                        }`}
                      >
                        {notifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs font-bold transition-colors ${
                              n.read ? 'text-slate-300' : 'text-white group-hover:text-[#F5E6B3]'
                            }`}
                          >
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {n.hidden ? (
                              <span className="text-[9px] text-slate-500 font-semibold bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                                Masquée
                              </span>
                            ) : !n.read ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]"></span>
                            ) : null}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{n.desc}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] font-mono font-bold text-[#F5E6B3]">
                            {formatFCFA(n.amount)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">{n.time}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#D4AF37]/10 p-2">
                <button
                  onClick={() => { router.push('/invoices'); setNotifOpen(false); }}
                  className="w-full text-center text-[11px] text-[#D4AF37] hover:text-amber-200 font-semibold py-1 transition-colors"
                >
                  Voir toutes les factures →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
