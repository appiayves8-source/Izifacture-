'use client';

import React from 'react';

export default function LandingFeatures() {
  return (
    <section id="fonctionnalites" className="w-full max-w-7xl mx-auto px-4 md:px-margin py-24 flex flex-col items-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm font-bold mb-4">
        <span>PUISSANCE &amp; SIMPLICITÉ</span>
      </div>
      <h2 className="font-headline-lg text-headline-lg md:text-4xl text-on-surface text-center font-bold max-w-3xl mb-4">
        Conçu sur-mesure pour les réalités du{" "}
        <span className="italic font-serif font-normal text-primary">commerce africain</span>.
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-2xl mb-16">
        Chaque fonctionnalité répond directement aux spécificités de vos échanges : multi-devises régionales, validation fiscale et réconciliation mobile money.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Feature 1 */}
        <div className="p-8 md:p-10 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
              <span className="material-symbols-outlined text-3xl">receipt</span>
            </div>
            <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-surface-container-lowest font-semibold text-on-surface">
              Standard OHADA
            </span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-3">
              Factures professionnelles en 2 clics
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
              Modèles certifiés prêts à l&apos;emploi. Ajoutez votre logo, votre numéro RCCM, votre NIF/IFU et vos canaux d&apos;encaissement préférés (Wave, Orange Money, MTN MoMo ou RIB bancaire UEMOA/CEMAC).
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-container-lowest flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
            <span className="font-body-sm text-body-sm text-on-surface font-medium">
              Export direct en PDF inviolable avec QR code de traçabilité.
            </span>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="p-8 md:p-10 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-3xl">percent</span>
            </div>
            <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-surface-container-lowest font-semibold text-primary">
              Automatique 18%
            </span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-3">
              TVA 18% calculée automatiquement
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
              Fini les incertitudes mathématiques. Indiquez simplement vos montants HT : la taxe à la valeur ajoutée (18%) et les centimes additionnels sont instantanément dissociés et synthétisés.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-container-lowest flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">folder_zip</span>
            <span className="font-body-sm text-body-sm text-on-surface font-medium">
              Liasse récapitulative mensuelle téléchargeable pour votre expert-comptable.
            </span>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="p-8 md:p-10 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-tertiary-container text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-3xl">notifications_active</span>
            </div>
            <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-surface-container-lowest font-semibold text-tertiary">
              Relances WhatsApp
            </span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-3">
              Suivi des paiements &amp; relances en 1 clic
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
              Visualisez immédiatement qui est à jour et qui traîne à payer. Déclenchez des messages de rappel polis et professionnels directement sur le WhatsApp ou par email de votre client.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-container-lowest flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">speed</span>
            <span className="font-body-sm text-body-sm text-on-surface font-medium">
              Réduction prouvée des délais d&apos;encaissement de 12 jours en moyenne.
            </span>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="p-8 md:p-10 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-inverse-surface text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-3xl">contacts</span>
            </div>
            <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-surface-container-lowest font-semibold text-on-surface">
              CRM Léger Intégré
            </span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-3">
              Répertoire &amp; Historique Client Intégré
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
              Conservez l&apos;intégralité des coordonnées fiscales de vos clients. En un clic, consultez le volume d&apos;affaires réalisé, le panier moyen et les factures non soldées par entreprise.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-container-lowest flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">analytics</span>
            <span className="font-body-sm text-body-sm text-on-surface font-medium">
              Tableau de bord financier clair sans jargon technique.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
