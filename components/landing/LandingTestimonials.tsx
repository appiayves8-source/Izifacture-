'use client';

import React from 'react';

export default function LandingTestimonials() {
  const testimonials = [
    {
      stars: 5,
      quote:
        "Avant iziFacture, je passais mes dimanches à faire des devis sous Word. Aujourd'hui, j'envoie mes factures certifiées en 2 minutes depuis mon téléphone. Mes clients me paient deux fois plus vite.",
      name: "Mamadou Diop",
      role: "Fondateur, Teranga Studio (Dakar)",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAMxY44lkXwd1mt2pPA2jYF3q4iqd2Ap6DvPXiXtZD4ux0EQF7HHY-Gmcc1SP_6JUkqKvIHQX4D04J2yo4cHOQyPdwfNu4FAhisHNs0ZNZlOgujbvaZHQHEp_Lyc6W_vjZCaK9fzzyxmnieqd6kJQsg0p4JOArZolts65KyybA2DoGuTen2iLQcR5WA_7pZxjNzFXMq9ipFK7BXN0vHIo8r7vh7iTxO04ules3E4ijH00BAgbrzMeWi",
    },
    {
      stars: 5,
      quote:
        "Le calcul automatique de la TVA 18% nous a sauvé des heures de réconciliation comptable. Un outil pensé exactement pour la réalité fiscale de nos entreprises en Afrique de l'Ouest.",
      name: "Marie-Josée Kouamé",
      role: "Directrice, Ivoire Conseil (Abidjan)",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCmFD-0rZMSvTKpZoU8__GMFFBYpjghssi26sjeRjl-9Ph2tcH-n8CrdCgKHweRAjA7TimjSn53CDjrpijCw5heAyD7g-ZOCQf_NOHWBeSzU-IOr-9esoPm3OCsT5zvo2puofgTOmphY6SoUWWPW25tHoEVUBt5fc0f07jzheG5kqvuIlRyacAK1pZ_msLjnOjaMhFZ439R-6VBtGsA2CU9sWyf5HeiDTILicP1WUnycGkX36Dzaa81",
    },
    {
      stars: 5,
      quote:
        "Le suivi des relances automatiques a réduit nos impayés de 40% dès le premier trimestre. La gestion des bordereaux en FCFA est impeccable. Indispensable pour tout entrepreneur sérieux.",
      name: "Rodrigue Tchakounté",
      role: "Gérant, Kmer Logistique (Douala)",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAFJEYYfYU6fU6qMpHrefKmUQOrvJ7ZRMBJgeroINu2x-rV1GMWM7nkYXdDd6HzyBFzxYIVJOIXqf9FU4UPGrx-g8zSRlJMBGdPX1jXsl62uADgPOIvG2rgcHs4gX23vYIvbkHMTGeAHQCVPlEJoeiMTFM7ogsoj04gov6BCgkwTXMm_FkY4mgURaiFBk4URtTTVDz9afOBPb-b1LBKLUA5irf2oL6LMlLw27PsPFW4QidWRpwoTGDL",
    },
  ];

  return (
    <section id="temoignages" className="w-full bg-surface-container-low/50 py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-margin flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm font-bold mb-4">
          <span>RETOURS D&apos;EXPÉRIENCE</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg md:text-4xl text-on-surface text-center font-bold max-w-2xl mb-16">
          Ils accélèrent leur croissance avec{" "}
          <span className="italic font-serif font-normal text-primary">iziFacture</span>.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-white hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: t.stars }).map((_, sIdx) => (
                    <span
                      key={sIdx}
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-12 h-12 rounded-full object-cover shadow-xs border border-surface-container"
                  alt={`Portrait de ${t.name}`}
                  src={t.image}
                  loading="lazy"
                />
                <div>
                  <h4 className="font-title-md text-title-md font-bold text-on-surface">{t.name}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
