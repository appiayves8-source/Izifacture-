'use client';

import React from 'react';
import Link from 'next/link';
import { useInvoiceStore } from '@/lib/store/invoiceStore';
import { useAuth } from '@/lib/context/AuthContext';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { DS } from '@/lib/constants/designSystem';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';

function UserStatCard({
  title,
  value,
  sub,
  icon: Icon,
  variant,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  variant: 'gold' | 'emerald' | 'amber' | 'red';
}) {
  const iconColors = {
    gold: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30',
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-700/40',
    amber: 'text-amber-400 bg-amber-950/40 border-amber-700/40',
    red: 'text-red-400 bg-red-950/40 border-red-700/40',
  };

  return (
    <div className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${iconColors[variant]}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="font-mono text-2xl font-black text-[#F5E6B3] tabular-nums">
        {value}
      </p>
      <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>
    </div>
  );
}

function UserStatusBadge({ status }: { status: string }) {
  if (status === 'payee') {
    return (
      <span className={DS.badge.paid}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
        Payée
      </span>
    );
  }
  if (status === 'envoyee') {
    return (
      <span className={DS.badge.sent}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Envoyée
      </span>
    );
  }
  if (status === 'en_retard') {
    return (
      <span className={DS.badge.overdue}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        En retard
      </span>
    );
  }
  return (
    <span className={DS.badge.pending}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Brouillon
    </span>
  );
}

export default function UserDashboardOverview() {
  const { invoices, clients } = useInvoiceStore();
  const { firstName } = useAuth();

  const totalBilled = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const paid = invoices.filter((i) => i.status === 'payee');
  const totalPaid = paid.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const pending = invoices.filter((i) => i.status === 'envoyee' || i.status === 'brouillon');
  const totalPending = pending.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const overdue = invoices.filter((i) => i.status === 'en_retard');
  const totalOverdue = overdue.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const recentInvoices = [...invoices].slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans">Mon Espace</span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-xs text-slate-300 font-medium">Tableau de bord</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
            <span>Bonjour, {firstName || 'bienvenue'}</span>
            <span className="text-xl sm:text-2xl animate-pulse">✨</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Gérez vos factures OHADA, suivez vos encaissements et développez votre activité.
          </p>
        </div>

        <Link
          href="/invoices/new"
          prefetch={true}
          className={DS.button.primary}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nouvelle Facture</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UserStatCard
          title="TOTAL FACTURÉ"
          value={formatFCFA(totalBilled)}
          sub={`${invoices.length} facture${invoices.length !== 1 ? 's' : ''} émise${invoices.length !== 1 ? 's' : ''}`}
          icon={FileText}
          variant="gold"
        />
        <UserStatCard
          title="TOTAL ENCAISSÉ"
          value={formatFCFA(totalPaid)}
          sub={`${paid.length} facture${paid.length !== 1 ? 's' : ''} soldée${paid.length !== 1 ? 's' : ''}`}
          icon={CheckCircle2}
          variant="emerald"
        />
        <UserStatCard
          title="EN ATTENTE"
          value={formatFCFA(totalPending)}
          sub={`${pending.length} facture${pending.length !== 1 ? 's' : ''} en cours`}
          icon={Clock}
          variant="amber"
        />
        <UserStatCard
          title="EN RETARD (IMPAYÉ)"
          value={formatFCFA(totalOverdue)}
          sub={overdue.length > 0 ? `${overdue.length} relance${overdue.length > 1 ? 's' : ''} exigée${overdue.length > 1 ? 's' : ''}` : 'Aucun impayé'}
          icon={AlertTriangle}
          variant="red"
        />
      </section>

      {/* Quick Action Shortcuts */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/invoices/new"
          className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all duration-300 flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DFBA55]/20 to-[#B8860B]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white group-hover:text-[#F5E6B3] transition-colors">Créer une facture</p>
            <p className="text-xs text-slate-400 mt-0.5">TVA 18% automatique & mentions OHADA</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 ml-auto group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/clients"
          className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all duration-300 flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white group-hover:text-[#F5E6B3] transition-colors">Mes clients B2B</p>
            <p className="text-xs text-slate-400 mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 ml-auto group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/settings"
          className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all duration-300 flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white group-hover:text-[#F5E6B3] transition-colors">Coordonnées & RIB</p>
            <p className="text-xs text-slate-400 mt-0.5">NIF, RCCM, Wave & banques</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 ml-auto group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
        </Link>
      </section>

      {/* Recent Invoices Card */}
      <section className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-[#D4AF37]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">Factures Récentes</h2>
          </div>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#F5E6B3] font-semibold transition-colors"
          >
            <span>Voir tout l&apos;annuaire</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#181926] border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Aucune facture émise pour le moment</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Créez votre première facture professionnelle en quelques clics avec calcul automatique de la TVA 18% et mentions légales OHADA.
            </p>
            <Link
              href="/invoices/new"
              className={DS.button.primary}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Créer ma première facture</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#D4AF37]/15 bg-[#090A0F]/70 text-[11px] font-semibold text-[#D4AF37]/80 uppercase tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-5">Référence</th>
                  <th className="py-3 px-5">Client</th>
                  <th className="py-3 px-5">Émission</th>
                  <th className="py-3 px-5 text-right">Montant TTC</th>
                  <th className="py-3 px-5 text-center">Statut</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10">
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="group transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="py-3.5 px-5 font-mono text-[#F5E6B3] font-bold">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-white">
                      {inv.client?.name || 'Client B2B'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-[#F5E6B3] tabular-nums">
                      {formatFCFA(inv.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <UserStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181926] hover:bg-[#202234] text-[#F5E6B3] border border-[#D4AF37]/25 text-[11px] font-semibold transition-colors"
                      >
                        <span>Consulter</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Activity Summary Bar */}
      {invoices.length > 0 && (
        <section className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">Performance & Synthèse</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-[#181926] border border-[#D4AF37]/15">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-sans mb-1">Taux de recouvrement</p>
              <p className="text-xl font-bold font-mono text-[#D4AF37] tabular-nums">
                {totalBilled > 0 ? `${((totalPaid / totalBilled) * 100).toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#181926] border border-[#D4AF37]/15">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-sans mb-1">Factures soldées</p>
              <p className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {paid.length}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#181926] border border-[#D4AF37]/15">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-sans mb-1">En cours de règlement</p>
              <p className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                {pending.length}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#181926] border border-[#D4AF37]/15">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-sans mb-1">Portefeuille clients</p>
              <p className="text-xl font-bold font-mono text-[#F5E6B3] tabular-nums">
                {clients.length}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
