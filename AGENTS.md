# Manuel & Directives Générales — Projet IziFacture

Ce document constitue la référence centrale et la mémoire vivante de l'application **IziFacture**. Il doit être consulté par tout modèle IA ou développeur avant et pendant toute intervention sur la base de code pour garantir la cohérence technique, fonctionnelle et visuelle.

---

## 1. Vision du Projet & Contexte Métier

**IziFacture** est une application SaaS B2B de facturation, gestion de devis et suivi des encaissements, spécialement conçue et optimisée pour l'écosystème économique d'Afrique francophone (zones **UEMOA**, **CEMAC** et espace juridique **OHADA**).

- **Utilisateur principal & Référent projet** : Cyrille M. (Directeur Général).
- **Zone géographique de référence** : Côte d'Ivoire (Abidjan) et Afrique de l'Ouest / Centrale.
- **Monnaie par défaut** : Franc CFA (**FCFA** / XOF / XAF).
- **Règles fiscales & Légales** : Numéro d'Identification Fiscale (NIF / Compte Contribuable CC), Registre du Commerce et du Crédit Mobilier (RCCM), Taux de TVA standard (18% UEMOA, configurable), mentions légales OHADA.
- **Canaux de paiement locaux** : Virement bancaire local (SGCI, Ecobank, etc.) et intégration des solutions Mobile Money prédominantes (**Wave**, **Orange Money**, **MTN MoMo**, **Moov Money**).

---

## 2. Règles Impératives Utilisateur (Directives Absolues)

Ces règles priment sur toute autre instruction et doivent être observées **sans aucune exception** :

1. **Salutation Obligatoire** :
   À chaque prise de parole ou réponse adressée à l'utilisateur, l'assistant IA **DOIT TOUJOURS** inclure la formule :  
   👉 **`salut cyrille`** (en début de réponse ou de façon naturelle).

2. **Règle de Publication / Déploiement** :
   À chaque fois que l'IA envisage ou propose de publier ou déployer le site sur le web (ex: Vercel, Netlify, production externe), elle **DOIT OBLIGATOIREMENT demander au préalable** :  
   👉 *« Est-ce que tu peux le faire? »*  
   *(Ne jamais exécuter de commande de déploiement en ligne sans confirmation explicite).*

3. **Intégrité du Design System "Noir & Or"** :
   Tout ajout de page, modal, composant, formulaire ou tableau doit strictement respecter le design system **Noir & Or (Black & Gold)** décrit dans la Section 6.

---

## 3. Architecture Technique & Stack Technologique

| Composant | Technologie | Description |
| :--- | :--- | :--- |
| **Framework Web** | [Next.js 14](https://nextjs.org/) (App Router) | Architecture moderne avec React Server & Client Components (`'use client'`). |
| **Langage** | [TypeScript](https://www.typescriptlang.org/) (v5) | Typage strict de toutes les entités (`Invoice`, `Client`, `Quote`, `CompanySettings`). |
| **Styling & CSS** | [Tailwind CSS](https://tailwindcss.com/) (v3.4) + Vanilla CSS | Design sur mesure sans dépendances UI lourdes externes. |
| **Icônes** | [Lucide React](https://lucide.dev/) | Bibliothèque d'icônes vectorielles cohérente. |
| **Utilitaires** | `clsx`, `tailwind-merge` | Fusion dynamique et sans conflits des classes Tailwind. |
| **Gestion d'État & Persistance** | React Hooks + `localStorage` | Données stockées localement sur le poste client, synchronisées par événements custom (`CustomEvent`). |
| **Serveur Local** | `npm run dev` | Accessible en continu sur `http://localhost:3000`. |

---

## 4. Arborescence Complète du Projet

```text
Izifacturation/
├── app/                                 # Routes Next.js (App Router)
│   ├── clients/                         # Gestion de la clientèle B2B
│   │   └── page.tsx                     # Annuaire, ajout, modification et suppression clients
│   ├── invoices/                        # Gestion des factures
│   │   ├── [id]/                        # Vue détaillée & impression facture
│   │   │   └── page.tsx                 # Facture grand format, téléchargement PDF, statuts
│   │   ├── new/                         # Création de facture
│   │   │   └── page.tsx                 # Page hôte du formulaire de facturation
│   │   └── page.tsx                     # Liste filtrable et paginée des factures
│   ├── payments/                        # Gestion des paiements & Mobile Money
│   │   └── page.tsx                     # Comptes Wave, Orange, MTN, Moov et banques
│   ├── quotes/                          # Gestion des devis & proformas
│   │   └── page.tsx                     # Liste, conversion de devis en facture, statuts
│   ├── settings/                        # Configuration & mentions légales
│   │   └── page.tsx                     # Paramètres éditables avec aperçu en temps réel
│   ├── support/                         # Centre d'aide & assistance
│   │   └── page.tsx                     # FAQ interactive, contact, canaux d'aide
│   ├── favicon.ico                      # Favicon de l'application
│   ├── globals.css                      # Styles globaux, polices, reset et scrollbar
│   ├── layout.tsx                       # Root Layout Next.js (HTML, Body, Métadonnées)
│   └── page.tsx                         # Vue d'ensemble (Tableau de bord principal)
├── components/                          # Composants d'interface modulaires
│   ├── dashboard/                       # Composants du tableau de bord & navigation
│   │   ├── DashboardLayout.tsx          # Layout avec Sidebar et Topbar réutilisable
│   │   ├── InvoiceStatusBreakdown.tsx   # Répartition visuelle des statuts de factures
│   │   ├── LatestInvoiceCard.tsx        # Carte de mise en avant de la dernière facture
│   │   ├── RecentInvoicesTable.tsx      # Tableau des factures récentes sur l'accueil
│   │   ├── RevenueActivityChart.tsx     # Graphique d'activité financière hebdomadaire
│   │   ├── Sidebar.tsx                  # Navigation latérale, profil Cyrille M. & modale déconnexion
│   │   ├── StatCard.tsx                 # Cartes KPI (Total facturé, encaissé, en attente, impayé)
│   │   └── Topbar.tsx                   # Horloge GMT, recherche globale & notifications interactives
│   └── invoices/                        # Composants spécifiques à la facturation
│       └── InvoiceForm.tsx              # Formulaire de saisie dynamique (lignes, TVA, client)
├── lib/                                 # Logique métier, données & utilitaires
│   ├── constants/
│   │   └── designSystem.ts              # Tokens et classes du Design System Noir & Or (DS)
│   ├── data/
│   │   └── mockData.ts                  # Jeux de données d'initialisation OHADA / UEMOA
│   ├── store/                           # Gestion des états et persistance
│   │   ├── invoiceStore.ts              # Store factures & clients (LocalStorage)
│   │   └── settingsStore.ts             # Store paramètres entreprise (LocalStorage + Events)
│   └── utils/
│       └── formatters.ts                # Formatage monétaire formatFCFA() et dates formatDate()
├── GEMINI.md                            # Mémoire vive du projet & instructions IA
├── package.json                         # Dépendances et scripts de build
├── tailwind.config.ts                   # Configuration de Tailwind CSS
└── tsconfig.json                        # Configuration du compilateur TypeScript
```

---

## 5. Fonctionnalités Implémentées par Module

### 5.1. Vue d'ensemble (Tableau de Bord — `app/page.tsx`)
- **4 Cartes KPI Financières** :
  - *Total Facturé* (18 450 000 FCFA, +14.2%).
  - *Total Encaissé* (14 200 000 FCFA, taux de recouvrement 77%).
  - *En Attente* (3 150 000 FCFA, échéances proches).
  - *En Retard / Impayé* (1 100 000 FCFA, relances actives).
- **Sélecteur de Période** : 7 jours, 30 derniers jours, Ce trimestre (T4), Année en cours.
- **Graphique d'Activité** : Comparaison du chiffre d'affaires jour par jour sur 7 jours.
- **Jauge de Répartition des Statuts** : Décomposition dynamique des factures (Payées 71%, Envoyées 21%, En attente 8%).
- **Carte « Dernière Facture Émise »** : Détail express avec statut, client B2B, montant et raccourcis.
- **Tableau des Factures Récentes** : Liste synthétique avec badges luminescents et actions rapides.

### 5.2. Factures Commerciales (`app/invoices/`)
- **Liste des Factures (`/invoices`)** :
  - Onglets de filtrage rapide : *Toutes*, *Payées*, *Envoyées*, *En retard*, *Brouillons*.
  - Recherche instantanée par numéro de facture, nom de client ou type de prestation.
  - Pagination dynamique personnalisable (5, 10, 20, 50 par page).
- **Création de Facture (`/invoices/new`)** :
  - Sélection du client dans la base B2B.
  - Ajout/suppression dynamique de lignes d'articles/prestations.
  - Calcul automatique en temps réel : Sous-total HT, TVA selon le taux d'entreprise, Total TTC arrondi en FCFA.
  - Gestion des dates d'émission et d'échéance (+14 jours par défaut).
- **Détail & Impression (`/invoices/[id]`)** :
  - Mise en page de prestige aux normes OHADA.
  - En-tête dynamique alimenté par les paramètres d'entreprise (Raison sociale, RCCM, NIF, Adresse).
  - Menu déroulant de changement de statut : *Marquer comme Payée*, *Envoyée*, *En retard*, *Brouillon*.
  - Bouton d'impression / téléchargement PDF natif via `window.print()`.
  - Modale de confirmation de suppression sécurisée.

### 5.3. Devis & Proformas (`app/quotes/`)
- Suivi des devis par statut : *Accepté*, *Envoyé*, *En attente*, *Expiré*.
- Fonctionnalité clé de conversion : transformer un devis accepté en facture officielle en un clic.

### 5.4. Gestion des Clients B2B (`app/clients/`)
- Annuaire complet des entreprises clientes (Société Nouvelle de Transit, Clinique Pasteur, etc.).
- Fiches détaillées : Nom, email, téléphone, adresse, ville, pays, chiffre d'affaires cumulé et nombre de factures.
- Création, modification et suppression de clients avec fenêtres modales dédiées.

### 5.5. Paiements & Mobile Money (`app/payments/`)
- Gestion des canaux d'encaissement numériques d'Afrique de l'Ouest : **Wave**, **Orange Money**, **MTN MoMo**, **Moov Money** et comptes bancaires.
- Activation/désactivation des comptes en direct.
- Édition des numéros marchands et des titulaires de comptes avec répercussion sur les factures.

### 5.6. Paramètres de l'Entreprise (`app/settings/`)
- **Édition intégrale sans aucun champ en lecture seule** :
  - *Onglet Entreprise & Légal* : Raison sociale, Activité/Slogan, RCCM, NIF/CC.
  - *Onglet Fiscalité & Devise* : Devise (Franc CFA, EUR, USD, GNF), Taux de TVA (%), Délai de paiement en jours.
  - *Onglet Contact & Siège* : Téléphone officiel, Email commercial, Site Web, Adresse complète, Ville et Pays.
  - *Onglet Banque & Mobile Money* : Nom de la banque, IBAN/RIB, Numéros Wave / Orange Money / MTN.
  - *Onglet Facturation & Mentions* : Préfixes de factures (`FAC-`) et devis (`DEV-`), mentions légales de bas de page (pénalités OHADA).
- **Aperçu en direct (Live Preview)** : Visualisation instantanée de l'en-tête de facture au fur et à mesure de la saisie.
- **Persistance & Notifications** : Sauvegarde dans `localStorage` (`izifacture_settings_v1`) avec alerte de confirmation et possibilité de réinitialisation.

### 5.7. Système de Notifications Avancé (`components/dashboard/Topbar.tsx`)
- Accès via l'icône Cloche dans la barre supérieure avec pastille de compteur non lu.
- **Redirection au clic** : Cliquer sur une notification ouvre directement la facture concernée (`/invoices/[id]`).
- **Masquage automatique** : Dès qu'une notification est consultée/regardée, elle passe en statut masqué (`hidden: true`) et disparaît de la liste active.
- **Bouton « Tout masquer »** : Permet de masquer toutes les notifications en un clic.
- **Persistance LocalStorage** : L'état masqué est conservé (`izifacture_notifications_v1`) même lors de la navigation entre les pages ou du rechargement.
- **Historique & État Vide** : Si toutes les notifications sont masquées, un message propre s'affiche avec un bouton pour afficher l'historique ou réinitialiser.

### 5.8. Sécurité & Déconnexion (`components/dashboard/Sidebar.tsx`)
- Profil utilisateur dédié à **Cyrille M.** (**Directeur Général**).
- Bouton de déconnexion (`LogOut`).
- **Boîte d'alerte de confirmation (Oui / Non)** : Modale élégante avec fond flouté demandant confirmation avant de quitter.
- Toast de confirmation de fin de session en bas d'écran.

---

## 6. Système de Design « Noir & Or » (Black & Gold)

Toute création ou modification d'interface dans l'application **DOIT IMPÉRATIVEMENT** utiliser cette charte graphique :

### 6.1. Couleurs & Dégradés
- **Fond de page principal** :  
  `bg-[#090A0F]` avec `bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.07),rgba(9,10,15,1))]`
- **Surface des Cartes (Cards)** :  
  `bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all`
- **Surfaces Secondaires / Menus / Inputs** :  
  `bg-[#181926] border border-[#D4AF37]/20` ou `bg-[#13141F]`
- **Bordures dorées & Séparateurs** :  
  `border-[#D4AF37]/15` à `border-[#D4AF37]/40`
- **Accents Or (Gold)** :  
  - Or Primaire : `#D4AF37`
  - Or Lumineux : `#DFBA55` / `#E8C86A`
  - Or Champagne / Chiffres : `#F5E6B3`
  - Or Ambré Profond : `#B8860B`

### 6.2. Typographie & Valeurs Financières
- **Titres H1** : `text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans`
- **Sous-titres & Descriptions** : `text-xs sm:text-sm text-slate-400 font-medium mt-1`
- **Montants en FCFA, Numéros de Factures & Dates** :  
  **TOUJOURS** `font-mono tabular-nums text-[#F5E6B3] font-bold`

### 6.3. Boutons
- **CTA Principal (Bouton Or Dégradé)** :  
  `bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold rounded-xl px-4 py-2 shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200`
- **Bouton Secondaire** :  
  `bg-[#13141F] border border-[#D4AF37]/30 text-xs font-semibold text-[#F5E6B3] rounded-xl px-3.5 py-2 hover:bg-[#181926] hover:border-[#D4AF37]/60 active:scale-95 transition-all`
- **Bouton Tertiaire / Action de ligne** :  
  `bg-[#181926] hover:bg-[#202234] text-slate-200 border border-[#D4AF37]/25 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors`

### 6.4. Badges de Statut (Pills)
- **Payée / Validée** :  
  `bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35 shadow-sm` avec pastille :  
  `<span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]"></span>`
- **Envoyée** :  
  `bg-amber-950/30 text-amber-300 border border-amber-600/35` avec pastille ambre.
- **En attente / Brouillon** :  
  `bg-slate-800/80 text-slate-300 border border-slate-700` avec pastille ardoise.
- **En retard / Impayé** :  
  `bg-red-950/40 text-red-300 border border-red-800/40` avec pastille rouge.

### 6.5. Champs de Formulaire (Inputs & Selects)
`w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all`

---

## 7. Directives & Bonnes Pratiques pour les Futurs Modèles IA

1. **Ne pas casser la réactivité des stores** :
   - Pour les factures et clients : passer par [`useInvoiceStore`](file:///c:/Users/HP/.antigravity-ide/Izifacturation/lib/store/invoiceStore.ts).
   - Pour les paramètres d'entreprise : passer par [`useSettingsStore`](file:///c:/Users/HP/.antigravity-ide/Izifacturation/lib/store/settingsStore.ts).
   - Ne jamais réintroduire de valeurs codées en dur pour la raison sociale ou les mentions légales sur les factures : toujours consommer l'objet `settings`.

2. **Formatage monétaire & Dates** :
   - Toujours importer et utiliser [`formatFCFA`](file:///c:/Users/HP/.antigravity-ide/Izifacturation/lib/utils/formatters.ts) et [`formatDate`](file:///c:/Users/HP/.antigravity-ide/Izifacturation/lib/utils/formatters.ts).
   - Ne pas réécrire de fonctions de formatage locales ad-hoc.

3. **Format des Réponses** :
   - Commencer par « salut cyrille ».
   - Fournir des explications concises en français.
   - Insérer des liens GitHub markdown cliquables avec le protocole `file:///` pour tous les fichiers et fonctions mentionnés (ex: `[Topbar.tsx](file:///c:/Users/HP/.antigravity-ide/Izifacturation/components/dashboard/Topbar.tsx)`).

4. **Maintenance du Dev Server** :
   - Le serveur fonctionne en arrière-plan avec `npm run dev`. Ne pas relancer de serveur inutilement s'il est déjà actif sur le port `3000`.
