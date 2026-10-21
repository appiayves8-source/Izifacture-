'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Search,
  Send,
  CheckCircle2,
  BookOpen,
  Video,
  FileText,
  Zap,
  X,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// ─── FAQ Data ─────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    id: 'f1',
    category: 'Facturation',
    q: 'Comment créer une facture en FCFA ?',
    a: "Rendez-vous dans Factures → Créer une facture. Sélectionnez votre client, ajoutez vos lignes de prestation, puis cliquez sur 'Envoyer'. La TVA 18% est calculée automatiquement et le montant est arrondi à l'entier en FCFA.",
  },
  {
    id: 'f2',
    category: 'Facturation',
    q: 'Comment convertir un devis en facture ?',
    a: "Dans la page Devis & Proformas, cliquez sur un devis ayant le statut 'Accepté', puis cliquez sur le bouton 'Facturer'. Un formulaire de facture sera pré-rempli avec les données du devis.",
  },
  {
    id: 'f3',
    category: 'Paiements',
    q: 'Comment ajouter mon numéro MTN MoMo ?',
    a: "Rendez-vous dans Paiements & Mobile Money, puis cliquez sur l'icône d'édition (✏️) sur la carte MTN MoMo. Entrez votre numéro de téléphone et le nom du compte, puis activez le compte. Il apparaîtra automatiquement sur vos futures factures.",
  },
  {
    id: 'f4',
    category: 'Paiements',
    q: 'Quels opérateurs Mobile Money sont supportés ?',
    a: "IziFacture supporte Wave (Sénégal / Côte d'Ivoire), Orange Money CI, MTN MoMo CI, et Moov Money CI. Vous pouvez activer ou désactiver chaque méthode selon votre situation.",
  },
  {
    id: 'f5',
    category: 'Clients',
    q: "Comment gérer ma base de clients B2B ?",
    a: "Dans la section Clients, vous pouvez ajouter, modifier et consulter vos clients B2B. Chaque fiche client affiche l'historique des factures et le total facturé.",
  },
  {
    id: 'f6',
    category: 'Compte',
    q: 'Comment modifier les informations de mon entreprise ?',
    a: "Rendez-vous dans Paramètres → Mon Entreprise pour mettre à jour votre raison sociale, adresse, numéro de contribuable et logo.",
  },
  {
    id: 'f7',
    category: 'Compte',
    q: 'Comment me déconnecter de IziFacture ?',
    a: "Cliquez sur l'icône de déconnexion (⬡) en bas de la barre latérale, à côté de votre nom. Une confirmation vous sera demandée avant la déconnexion.",
  },
];

const FAQ_CATEGORIES = ['Tous', 'Facturation', 'Paiements', 'Clients', 'Compte'];

// ─── Ticket Form ──────────────────────────────────────────
function TicketModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#12131C] rounded-2xl border border-[#D4AF37]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/15">
          <div>
            <h2 className="text-sm font-extrabold text-white">Ouvrir un ticket de support</h2>
            <p className="text-[11px] text-slate-400">Réponse sous 4h en jours ouvrables</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#D4AF37] mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-white mb-1">Ticket envoyé !</h3>
            <p className="text-xs text-slate-400">Notre équipe vous contactera dans les 4h. Référence : <span className="font-mono text-[#F5E6B3] font-bold">TKT-{Math.floor(Math.random() * 9000 + 1000)}</span></p>
            <button onClick={onClose} className="mt-4 px-4 py-2 rounded-xl bg-[#D4AF37]/20 text-[#F5E6B3] text-xs font-bold border border-[#D4AF37]/40 hover:bg-[#D4AF37]/30 transition-all">
              Fermer
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-1.5">Sujet</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Problème de génération de facture PDF"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Décrivez votre problème en détail…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm resize-none"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!subject.trim() || !message.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              Envoyer le ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function SupportPage() {
  const [faqCategory, setFaqCategory] = useState('Tous');
  const [openFaq, setOpenFaq] = useState<string | null>('f1');
  const [faqSearch, setFaqSearch] = useState('');
  const [showTicket, setShowTicket] = useState(false);

  const filteredFaq = FAQ_ITEMS.filter((f) => {
    if (faqCategory !== 'Tous' && f.category !== faqCategory) return false;
    if (faqSearch.trim()) {
      const s = faqSearch.toLowerCase();
      return f.q.toLowerCase().includes(s) || f.a.toLowerCase().includes(s);
    }
    return true;
  });

  const resources = [
    { icon: BookOpen, label: 'Guide de démarrage', desc: 'Premier pas avec IziFacture', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/15', border: 'border-[#D4AF37]/35' },
    { icon: Video, label: 'Tutoriels vidéo', desc: 'Créer et envoyer une facture', color: 'text-sky-300', bg: 'bg-sky-950/40', border: 'border-sky-700/40' },
    { icon: FileText, label: 'Documentation API', desc: 'Intégration & webhooks', color: 'text-purple-300', bg: 'bg-purple-950/40', border: 'border-purple-700/40' },
    { icon: Zap, label: 'Nouveautés v2', desc: 'MTN MoMo, Moov, Devis PDF', color: 'text-amber-300', bg: 'bg-amber-950/40', border: 'border-amber-700/40' },
  ];

  return (
    <DashboardLayout breadcrumb={{ section: 'Système', page: 'Support & Aide' }}>
      {showTicket && <TicketModal onClose={() => setShowTicket(false)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-amber-200 transition-colors font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Support &amp; Assistance B2B
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Centre d'aide IziFacture — FAQ, tickets, contact direct.
          </p>
        </div>
        <button
          onClick={() => setShowTicket(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all self-start sm:self-center"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          Ouvrir un ticket
        </button>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* WhatsApp */}
        <a
          href="https://wa.me/22507000000"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all group text-center block"
        >
          <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <h3 className="text-sm font-bold text-white">WhatsApp Business</h3>
          <p className="text-[11px] text-slate-400 mt-1">Réponse instantanée · 7j/7</p>
          <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 text-[#F5E6B3] font-bold text-xs border border-[#D4AF37]/40 group-hover:bg-[#D4AF37]/25 transition-all">
            Démarrer le chat →
          </span>
        </a>

        {/* Email */}
        <a
          href="mailto:support@izifacture.com"
          className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-sky-600/50 hover:shadow-[0_4px_25px_rgba(14,165,233,0.1)] transition-all group text-center block"
        >
          <div className="w-11 h-11 rounded-xl bg-sky-950/40 border border-sky-700/40 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Mail className="w-5 h-5 text-sky-300" />
          </div>
          <h3 className="text-sm font-bold text-white">Email Support</h3>
          <p className="text-[11px] text-slate-400 mt-1">support@izifacture.com</p>
          <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-sky-950/40 text-sky-300 font-bold text-xs border border-sky-700/40 group-hover:bg-sky-900/40 transition-all">
            Envoyer un email →
          </span>
        </a>

        {/* Phone */}
        <a
          href="tel:+22527000000"
          className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-amber-700/50 hover:shadow-[0_4px_25px_rgba(245,158,11,0.1)] transition-all group text-center block"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-950/40 border border-amber-700/40 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Phone className="w-5 h-5 text-amber-300" />
          </div>
          <h3 className="text-sm font-bold text-white">Ligne Directe</h3>
          <p className="text-[11px] text-slate-400 mt-1">Lun–Ven · 8h00–18h00 GMT</p>
          <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-amber-950/40 text-amber-300 font-bold text-xs font-mono border border-amber-700/40 group-hover:bg-amber-900/40 transition-all">
            +225 27 00 00 00 →
          </span>
        </a>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-xs font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-3">Ressources utiles</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {resources.map((r, i) => (
            <button
              key={i}
              className={`bg-[#12131C] rounded-xl p-4 border ${r.border} shadow-sm hover:shadow-md hover:scale-[1.02] transition-all text-left group`}
            >
              <div className={`w-8 h-8 rounded-lg ${r.bg} border ${r.border} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <r.icon className={`w-4 h-4 ${r.color}`} />
              </div>
              <p className="text-xs font-bold text-white leading-tight">{r.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xs font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-3 flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5" /> Questions fréquentes
        </h2>

        {/* FAQ Search & Category Filter */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Rechercher dans la FAQ…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12131C] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFaqCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  faqCategory === cat
                    ? 'bg-[#D4AF37]/20 text-[#F5E6B3] border border-[#D4AF37]/50 font-bold'
                    : 'bg-[#12131C] text-slate-400 border border-[#D4AF37]/15 hover:text-white hover:bg-[#181926]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden divide-y divide-[#D4AF37]/10">
          {filteredFaq.length === 0 ? (
            <div className="py-10 text-center">
              <HelpCircle className="w-8 h-8 text-[#D4AF37]/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Aucune question trouvée.</p>
              <p className="text-xs text-slate-500 mt-1">Essayez d'ouvrir un ticket de support.</p>
            </div>
          ) : (
            filteredFaq.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center">
                      <HelpCircle className="w-3 h-3 text-[#D4AF37]" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-[#F5E6B3] transition-colors">{item.q}</span>
                      <span className="block text-[10px] text-[#D4AF37]/60 font-semibold mt-0.5">{item.category}</span>
                    </div>
                  </div>
                  {openFaq === item.id
                    ? <ChevronUp className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-slate-300" />
                  }
                </button>
                {openFaq === item.id && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="ml-8 pl-3 border-l-2 border-[#D4AF37]/30">
                      <p className="text-xs text-slate-300 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
