# Règle de Conception Obligatoire : Système de Design "Noir & Or" (Black & Gold)

Cette règle est STRICTEMENT OBLIGATOIRE pour toutes les nouvelles pages, composants, fenêtres modales, formulaires, cartes, tables et éléments d'interface utilisateur créés dans l'application IziFacture.
Aucun composant ne doit déroger à ce système de design.

---

## 1. Philosophie & Esthétique Visuelle
- **Univers** : SaaS B2B Financier & Facturation de Prestige ("Dark Luxury & Executive Gold").
- **Tonalités Clés** : Noir obsidienne profond (`#090A0F`, `#0B0C10`), surfaces carbone sombre (`#12131C`, `#181926`), accents et reflets or royal & champagne (`#D4AF37`, `#E5C158`, `#F5E6B3`).
- **Règle d'or** : Jamais de fonds clairs ou gris souris standards. Tout conteneur ou surface doit respirer le luxe, la sobriété haut de gamme et la rigueur financière.

---

## 2. Palette de Couleurs & Tokens Tailwind

### 2.1 Arrière-plans (Dark Obsidian & Carbon)
- **Fond de page global** : `bg-[#090A0F]` avec dégradé radial subtil :
  `bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.07),rgba(9,10,15,1))]`
- **Surface de carte standard (Card base)** : `bg-[#12131C]`
- **Surface élevée / Survol / Menu / Dropdown** : `bg-[#181926]`
- **Surface accentuée / Profil / Dark pill** : `bg-[#13141F]`
- **Fond sombre profond / En-têtes de table** : `bg-[#090A0F]/70`

### 2.2 Accents Dorés (Royal Gold & Champagne)
- **Or Royal Principal (Boutons, icônes phares, jauges)** : `#D4AF37`
- **Or Lumineux / Accent clair (Lignes de graphe, texte actif)** : `#E5C158`
- **Or Champagne (Chiffres financiers, texte doré)** : `#F5E6B3`
- **Or Brûlé / Bronze (Fin de dégradés)** : `#B8860B`
- **Dégradé or métallique (Boutons primaires & Badges prestige)** :
  `bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B]`

### 2.3 Bordures & Liserés Dorés
- **Bordure standard de carte** : `border border-[#D4AF37]/20`
- **Bordure au survol (Hover state)** : `hover:border-[#D4AF37]/50`
- **Bordure active / Focus / Sélection** : `border-[#D4AF37]` ou `border-[#D4AF37]/60`
- **Ligne de séparation (Divider)** : `border-t border-[#D4AF37]/15` ou `divide-[#D4AF37]/10`

### 2.4 Ombres & Effets Lumineux (Glows)
- **Ombre de carte standard** : `shadow-[0_4px_20px_rgba(0,0,0,0.4)]`
- **Lueur dorée de carte au survol** : `hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)]`
- **Lueur de bouton CTA principal** : `shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)]`
- **Lueur de pastille / point lumineux** : `shadow-[0_0_6px_rgba(212,175,55,0.8)]`

---

## 3. Typographie & Alignement

- **Police principale (Sans)** : `var(--font-plus-jakarta)` (`Plus Jakarta Sans`, Inter, sans-serif)
- **Police financière & technique (Mono)** : `var(--font-jetbrains-mono)` (`JetBrains Mono`, monospace)
- **Règle financière obligatoire** : Toujours utiliser `font-mono tabular-nums` pour :
  - Les montants en FCFA (`formatFCFA(amount)`)
  - Les numéros de factures, devis, codes clients
  - Les dates et échéances (`formatDate(...)`)
  - Les pourcentages, taux de TVA et coordonnées bancaires/téléphoniques.
- **Titres de pages (H1)** :
  `text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans`
- **Sous-titres descriptifs** :
  `text-xs sm:text-sm text-slate-400 font-medium mt-1`
- **Titres de sections / Cartes (H2, H3)** :
  `text-sm font-bold text-white tracking-tight font-sans`
- **Libellés de métadonnées (Labels)** :
  `text-[11px] font-medium text-slate-400 uppercase tracking-wider`

---

## 4. Composants Types & Directives de Structure

### 4.1 Bouton d'Action Primaire (CTA)
```tsx
<button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200">
  <Icon className="w-4 h-4 stroke-[2.5]" />
  <span>Action Principale</span>
</button>
```

### 4.2 Bouton Secondaire / Sélecteur
```tsx
<button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#13141F] border border-[#D4AF37]/30 text-xs font-semibold text-[#F5E6B3] shadow-sm hover:bg-[#181926] hover:border-[#D4AF37]/60 active:scale-95 transition-all">
  <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
  <span>Option</span>
</button>
```

### 4.3 Bouton Tertiaire / Action Rapide
```tsx
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181926] hover:bg-[#202234] text-slate-200 border border-[#D4AF37]/25 font-semibold text-xs transition-colors">
  <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
  <span>Détail</span>
</button>
```

### 4.4 Carte Métrique / Statistique (StatCard)
- Doit posséder une bordure d'accentuation latérale (`border-l-4 border-l-[#D4AF37]`).
- Doit afficher le montant en `text-xl sm:text-2xl font-black text-white font-mono tabular-nums`.
- Une pastille de tendance avec icône `TrendingUp` / `TrendingDown`.

### 4.5 Tableaux de Données (Data Tables)
- Toujours envelopper la table dans un conteneur `overflow-x-auto` avec `w-full min-w-[720px]`.
- En-tête : `border-b border-[#D4AF37]/15 bg-[#090A0F]/70 text-[11px] font-semibold text-[#D4AF37]/80 uppercase tracking-wider font-sans`.
- Corps : `divide-y divide-[#D4AF37]/10`.
- Lignes au survol : `hover:bg-white/[0.03] transition-colors`.

### 4.6 Badges de Statut (Pills)
- **Payée / Validée / Actif** : `bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35 shadow-sm` avec point lumineux `<span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]"></span>`.
- **Envoyée / En cours** : `bg-amber-950/30 text-amber-300 border border-amber-600/35` avec point `<span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>`.
- **En attente / Brouillon** : `bg-slate-800/80 text-slate-300 border border-slate-700` avec point `<span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>`.
- **En retard / Impayé / Erreur** : `bg-red-950/40 text-red-300 border border-red-800/40` avec point `<span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>`.

### 4.7 Formulaires & Champs de saisie
```tsx
<div>
  <label className="text-xs font-semibold text-slate-300 block mb-1">Libellé</label>
  <input
    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
    placeholder="Exemple..."
  />
</div>
```

---

## 5. Animations & Micro-interactions
- **Hover micro-scale** : `hover:scale-[1.02]` ou `hover:scale-105` sur les éléments interactifs.
- **Active click feedback** : `active:scale-95` sur les boutons.
- **Pulsation en direct** : `animate-ping bg-[#D4AF37]` pour les indicateurs temps réel.
- **Transitions** : `transition-all duration-200 ease-out`.

---

## 6. Responsivité & Structure Mobile-First
- Envelopper chaque page dans `<DashboardLayout breadcrumb={{ section: '...', page: '...' }}>`.
- Layout principal : `max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6`.
- Grilles adaptatives :
  - 4 colonnes : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
  - 3 colonnes : `grid grid-cols-1 md:grid-cols-3 gap-5`.
  - 2 colonnes / asymétrique : `grid grid-cols-1 lg:grid-cols-3 gap-5` (2 col + 1 col).
- Tout menu mobile doit posséder un backdrop flou sombre (`bg-black/75 backdrop-blur-md`) et tiroir coulissant (`animate-slide-in-left`).
