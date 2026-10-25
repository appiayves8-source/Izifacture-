import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingProblem from '@/components/landing/LandingProblem';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingCta from '@/components/landing/LandingCta';
import LandingFooter from '@/components/landing/LandingFooter';

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
  return (
    <div className="bg-background text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary">
      <LandingNav />
      <main className="w-full flex-1 pt-24">
        <LandingHero />
        <LandingProblem />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingTestimonials />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
