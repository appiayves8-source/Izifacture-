'use client';

import React from 'react';

export default function LandingHowItWorks() {
  return (
    <section id="comment-ca-marche" className="w-full bg-surface-container-lowest py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-margin flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm font-bold mb-4">
          <span>PROCESSUS FLUIDE</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg md:text-4xl text-on-surface text-center font-bold max-w-2xl mb-4">
          Prêt en moins de <span className="italic font-serif font-normal text-primary">3 minutes chrono</span>.
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-xl mb-16">
          Aucune configuration lourde. Pas besoin de formation comptable.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full relative">
          {/* Step 1 */}
          <div className="flex flex-col items-start p-8 rounded-3xl bg-surface hover:bg-surface-container-low transition-all duration-300 relative group">
            <div className="w-12 h-12 rounded-full bg-primary-container/15 text-primary font-bold flex items-center justify-center font-title-lg text-title-lg mb-6 group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
              01
            </div>
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-3">
              Inscrivez-vous en 30 secondes
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Renseignez simplement le nom de votre structure, votre pays (Sénégal, Côte d&apos;Ivoire, Cameroun...) et vos identifiants fiscaux. Pas de carte bancaire demandée.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-start p-8 rounded-3xl bg-surface hover:bg-surface-container-low transition-all duration-300 relative group">
            <div className="w-12 h-12 rounded-full bg-primary-container/15 text-primary font-bold flex items-center justify-center font-title-lg text-title-lg mb-6 group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
              02
            </div>
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-3">
              Créez votre première facture
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Choisissez vos prestations, insérez le tarif unitaire en FCFA. Le système applique la TVA 18% automatiquement et formalise votre document avec élégance.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-start p-8 rounded-3xl bg-surface hover:bg-surface-container-low transition-all duration-300 relative group">
            <div className="w-12 h-12 rounded-full bg-primary-container/15 text-primary font-bold flex items-center justify-center font-title-lg text-title-lg mb-6 group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
              03
            </div>
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-3">
              Envoyez et encaissez
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Partagez le lien interactif ou le PDF par WhatsApp ou Email. Votre client paie via son moyen de prédilection et le statut se met à jour en direct.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
