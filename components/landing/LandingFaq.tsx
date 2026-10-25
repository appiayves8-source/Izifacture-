'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'IziFacture est-il conforme aux normes OHADA ?',
    a: "Oui. Chaque facture generee inclut automatiquement les mentions legales obligatoires : raison sociale, RCCM, NIF/Compte Contribuable, adresse du siege, taux de TVA applicable (18% UEMOA par defaut) et les penalites de retard conformes au droit OHADA.",
  },
  {
    q: 'Comment puis-je encaisser via Wave ou Orange Money ?',
    a: "En activant votre compte marchand dans les Parametres > Mobile Money, vos numeros Wave, Orange Money, MTN MoMo ou Moov Money sont automatiquement inseres dans chaque facture. Vos clients voient ces details directement sur leur lien de paiement.",
  },
  {
    q: 'Mes donnees sont-elles securisees ?',
    a: "Absolument. Toutes les donnees sont hebergees sur Supabase avec des politiques de securite RLS (Row Level Security) : chaque entreprise accede uniquement a ses propres factures, clients et parametres. Les communications sont chiffrees en TLS 1.3.",
  },
  {
    q: 'Puis-je convertir un devis en facture ?',
    a: "Oui. Depuis la liste des devis, un clic sur Convertir en facture transforme automatiquement votre devis accepte en facture officielle, avec conservation du numero de reference et du client.",
  },
  {
    q: 'Quelle est la devise utilisee ?',
    a: "Par defaut, IziFacture utilise le Franc CFA (FCFA / XOF pour l'UEMOA, XAF pour la CEMAC). Vous pouvez configurer d'autres devises (EUR, USD, GNF) dans les parametres de votre entreprise.",
  },
  {
    q: 'Comment fonctionne le plan gratuit ?',
    a: "Vous beneficiez de 14 jours d'essai gratuit avec acces complet aux fonctionnalites du plan Pro. Apres cette periode, vous passez automatiquement au plan Starter (limite a 5 factures/mois) ou vous pouvez souscrire au plan Pro.",
  },
];

export default function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 px-4 bg-[#090A0F]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/8 mb-4">
            <HelpCircle className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Questions frequentes
          </h2>
          <p className="text-slate-400 text-base">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                open === i
                  ? 'border-[#D4AF37]/40 bg-[#12131C] shadow-[0_4px_20px_rgba(212,175,55,0.08)]'
                  : 'border-[#D4AF37]/15 bg-[#0D0E18] hover:border-[#D4AF37]/25'
              }`}
            >
              <button
                id={`faq-toggle-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
              >
                <span className={`text-sm font-semibold transition-colors ${open === i ? 'text-[#F5E6B3]' : 'text-slate-200'}`}>
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#D4AF37] flex-shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}