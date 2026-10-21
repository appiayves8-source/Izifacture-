/**
 * Design System "Noir & Or" (Black & Gold) — IziFacture
 * Références et classes utilitaires réutilisables pour tous les composants et pages.
 */

export const DS = {
  // Arrière-plans & Layout
  layout: {
    pageBg: 'bg-[#090A0F] text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.07),rgba(9,10,15,1))]',
    container: 'max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6',
  },

  // Surfaces & Cartes
  card: {
    base: 'bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)]',
    hover: 'hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all duration-300',
    interactive: 'bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all duration-300',
    subtle: 'bg-[#181926] rounded-xl border border-[#D4AF37]/25',
    header: 'p-5 flex items-center justify-between border-b border-[#D4AF37]/15',
  },

  // Typographie
  typography: {
    h1: 'text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans',
    subtitle: 'text-xs sm:text-sm text-slate-400 font-medium mt-1',
    h2: 'text-sm font-bold text-white tracking-tight font-sans',
    h3: 'text-xs font-bold text-white tracking-tight font-sans',
    metaLabel: 'text-[11px] font-medium text-slate-400 uppercase tracking-wider',
    financeAmount: 'font-mono text-[#F5E6B3] font-bold tabular-nums',
    codeTag: 'text-amber-200 font-mono bg-[#090A0F] px-1.5 py-0.5 rounded border border-[#D4AF37]/25',
  },

  // Boutons
  button: {
    primary:
      'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200',
    secondary:
      'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#13141F] border border-[#D4AF37]/30 text-xs font-semibold text-[#F5E6B3] shadow-sm hover:bg-[#181926] hover:border-[#D4AF37]/60 active:scale-95 transition-all',
    tertiary:
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181926] hover:bg-[#202234] text-slate-200 border border-[#D4AF37]/25 font-semibold text-xs transition-colors',
    icon:
      'w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#E5C158] bg-[#13141F] hover:bg-[#181926] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all shadow-sm',
  },

  // Statuts & Badges
  badge: {
    paid: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35 shadow-sm',
    sent: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/30 text-amber-300 border border-amber-600/35',
    pending: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700',
    overdue: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/40 text-red-300 border border-red-800/40',
    goldPill: 'px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37]/20 text-[#F5E6B3] rounded-full border border-[#D4AF37]/40 shadow-sm',
  },

  // Formulaires
  form: {
    label: 'text-xs font-semibold text-slate-300 block mb-1',
    input:
      'w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all',
  },

  // Tableaux
  table: {
    wrapper: 'overflow-x-auto',
    table: 'w-full min-w-[720px] text-left text-xs',
    thead: 'border-b border-[#D4AF37]/15 bg-[#090A0F]/70 text-[11px] font-semibold text-[#D4AF37]/80 uppercase tracking-wider font-sans',
    tbody: 'divide-y divide-[#D4AF37]/10',
    row: 'group transition-colors hover:bg-white/[0.03]',
  },
};
