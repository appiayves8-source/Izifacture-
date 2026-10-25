'use client';

import React from 'react';

export default function LandingProblem() {
  return (
    <section className="w-full bg-surface-container-low/60 py-24 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-margin flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm font-bold mb-4">
          <span>LE CONSTAT</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg md:text-4xl text-on-surface text-center font-bold max-w-2xl mb-4">
          Facturer ne devrait pas être <span className="italic font-serif font-normal">votre pire corvée.</span>
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-xl mb-16">
          Les outils occidentaux ne gèrent pas le franc CFA, ni les acomptes mobiles, et Word/Excel vous expose à des erreurs de calcul dramatiques.
        </p>

        {/* 3 Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group border border-white">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-error-container/30 flex items-center justify-center text-error mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">description</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-3">
                Factures Word &amp; Excel bricolées
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Mises en page cassées lors de l&apos;export PDF, fautes de frappe et manque total de crédibilité face à vos clients corporatifs exigeants.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-surface-container flex items-center gap-2 text-error font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-base">close</span>
              Perte de 3h chaque fin de mois
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group border border-white">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">calculate</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-3">
                Erreurs de calcul TVA (18%)
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Casse-tête fiscal sur les montants Hors Taxes et TTC. Risques de redressements et de frictions inutiles avec vos comptables et les impôts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-surface-container flex items-center gap-2 text-amber-700 font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-base">warning</span>
              Risque d&apos;amendes et pénalités
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-surface-container-lowest shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group border border-white">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">hourglass_disabled</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-3">
                Impayés et relances oubliées
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Aucune vision claire sur les délais de règlement. Chèques égarés, virements en attente non réclamés et trésorerie asphyxiée.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-surface-container flex items-center gap-2 text-secondary font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-base">priority_high</span>
              Jusqu&apos;à 45 jours de retard moyen
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
