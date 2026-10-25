import type { Metadata } from 'next';
import LandingView from '@/components/landing/LandingView';

export const metadata: Metadata = {
  title: 'iziFacture — Facturation & Conformité Fiscale OHADA en FCFA',
  description:
    "Toute votre facturation d'entrepreneur réunie en un seul endroit. Devis certifiés, calcul automatique de la TVA 18%, suivi des règlements en FCFA (Wave, Orange Money, MTN MoMo, virement UEMOA).",
  keywords: [
    'iziFacture',
    'facturation Afrique',
    'facture OHADA',
    'facture UEMOA',
    'TVA 18%',
    'facture FCFA',
    'Wave Money',
    'Orange Money',
    'MTN MoMo',
    'SaaS facturation PME',
    'Abidjan Côte d Ivoire',
    'Dakar Sénégal',
    'Douala Cameroun',
  ],
  openGraph: {
    title: 'iziFacture — Facturation & Conformité Fiscale OHADA en FCFA',
    description:
      "Automatisez vos devis et factures, calculez la TVA 18% et encaissez rapidement en FCFA via Mobile Money et virement bancaire.",
    type: 'website',
    locale: 'fr_FR',
    siteName: 'iziFacture',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iziFacture — Facturation B2B en FCFA pour entrepreneurs africains',
    description:
      'Facturation professionnelle conforme OHADA, TVA 18% automatique et encaissement Mobile Money simplifié.',
  },
};

export default function HomePage() {
  return <LandingView />;
}
