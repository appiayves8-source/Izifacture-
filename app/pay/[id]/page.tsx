import React from 'react';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase/client';
import CinetPayButton from '@/components/payments/CinetPayButton';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import {
  ShieldCheck,
  Building2,
  Calendar,
  User,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

interface PayPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  return {
    title: `Paiement en ligne sécurisé — Facture ${params.id} | IziFacture`,
    description: 'Réglez votre facture en toute sécurité par Wave, Orange Money, MTN MoMo, Moov ou Carte Bancaire.',
  };
}

export default async function PublicInvoicePaymentPage({ params }: PayPageProps) {
  const { id } = params;

  // 1. Récupération publique de la facture
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, client:clients(*), items:invoice_items(*)')
    .eq('id', id)
    .maybeSingle();

  // 2. Récupération des paramètres d'entreprise
  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#090A0F] text-white">
        <div className="max-w-md w-full bg-[#12131C] border border-[#D4AF37]/30 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Facture introuvable</h1>
          <p className="text-xs text-slate-400">
            Le lien de paiement est invalide ou la facture a été supprimée.
          </p>
          <Link
            href="/"
            className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#181926] text-xs font-semibold text-[#F5E6B3] border border-[#D4AF37]/30"
          >
            Retourner à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const isPaid =
    invoice.payment_status === 'paid' ||
    invoice.status === 'payee' ||
    invoice.status === 'paid';

  const companyName = settings?.company_name || 'IziFacture SARL';
  const companyPhone = settings?.phone || '+225 05 02 62 98 21';
  const companyEmail = settings?.email || 'contact@izifacture.com';

  return (
    <main className="min-h-screen bg-[#090A0F] text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.08),rgba(9,10,15,1))] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand & Security Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFBA55] to-[#B8860B] flex items-center justify-center text-black font-black text-sm shadow-md">
              IZ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-tight text-base font-sans">
                  {companyName}
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#D4AF37]/20 text-[#E5C158] rounded-full border border-[#D4AF37]/40">
                  UEMOA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Portail de Paiement Client Sécurisé</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chiffrement CinetPay V2 SSL 256 bits</span>
            </div>
          </div>
        </header>

        {/* Facture Status Banner */}
        {isPaid ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Facture Acquittée Intégralement</p>
                <p className="text-[11px] text-emerald-300">
                  Règlement reçu le {invoice.paid_at ? formatDate(invoice.paid_at) : 'Récemment'}. Merci pour votre confiance !
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
              Payée
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#12131C] border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Facture en attente de règlement</p>
                <p className="text-[11px] text-slate-400">
                  Échéance : <strong className="text-amber-200">{formatDate(invoice.due_date)}</strong>
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold text-xs">
              À régler
            </span>
          </div>
        )}

        {/* Main Invoice Card */}
        <div className="bg-[#12131C] border border-[#D4AF37]/25 rounded-3xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] space-y-6">
          {/* Top Invoice Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[#D4AF37]/15">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Numéro de Facture
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {invoice.invoice_number || invoice.id}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Émise le {formatDate(invoice.issue_date)}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Facturé à
              </span>
              <p className="text-base font-bold text-white mt-0.5">
                {invoice.client?.name || 'Client Entreprise'}
              </p>
              <p className="text-xs text-slate-400">
                {invoice.client?.city ? `${invoice.client.city}, ` : ''}
                {invoice.client?.country || "Côte d'Ivoire"}
              </p>
              {invoice.client?.phone && (
                <p className="text-xs text-[#D4AF37] font-mono mt-0.5">
                  {invoice.client.phone}
                </p>
              )}
            </div>
          </div>

          {/* Prestation description */}
          {invoice.service_type && (
            <div className="p-3.5 rounded-xl bg-[#181926] border border-[#D4AF37]/15 text-xs text-slate-300">
              <span className="font-semibold text-white">Objet / Prestation : </span>
              {invoice.service_type}
            </div>
          )}

          {/* Invoice Items Table (if any) */}
          {Array.isArray(invoice.items) && invoice.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Qté</th>
                    <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                    <th className="py-2.5 px-3 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/10 font-medium">
                  {invoice.items.map((item: { id: string; description: string; quantity: number; unit_price: number; total: number }) => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 text-white">{item.description}</td>
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatFCFA(item.unit_price)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#F5E6B3] font-bold">
                        {formatFCFA(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Totals */}
          <div className="p-5 rounded-2xl bg-[#181926] border border-[#D4AF37]/25 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Sous-total HT</span>
              <span className="font-mono text-white font-semibold">
                {formatFCFA(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>TVA ({invoice.tax_rate || 18}%)</span>
              <span className="font-mono text-white font-semibold">
                {formatFCFA(invoice.tax_amount)}
              </span>
            </div>
            <div className="pt-3 border-t border-[#D4AF37]/20 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Montant Total TTC
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#F5E6B3] tabular-nums tracking-tight">
                {formatFCFA(invoice.amount)}
              </span>
            </div>
          </div>

          {/* CinetPay Payment Channels */}
          {!isPaid && (
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
                  Moyens de paiement acceptés en direct :
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="px-3 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-[#1DC3F4] text-xs">Wave</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Côte d&apos;Ivoire</span>
                  </div>
                  <div className="px-3 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-[#FF6600] text-xs">Orange Money</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">OM CI</span>
                  </div>
                  <div className="px-3 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-[#FFCC00] text-xs">MTN MoMo</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Mobile Money</span>
                  </div>
                  <div className="px-3 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-[#006699] text-xs">Moov Money</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Flooz</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 flex flex-col items-center justify-center">
                    <span className="font-extrabold text-[#F5E6B3] text-xs flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" /> Carte
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Visa / Master</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <CinetPayButton invoice={invoice} size="lg" />
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Paiement sécurisé et vérifié automatiquement par CinetPay V2</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Support Info */}
        <footer className="text-center text-xs text-slate-500 space-y-2 pt-2">
          <p>
            Une question sur cette facture ? Contactez {companyName} :{' '}
            <a href={`tel:${companyPhone.replace(/\s+/g, '')}`} className="text-[#D4AF37] hover:underline font-mono">
              {companyPhone}
            </a>{' '}
            ·{' '}
            <a href={`mailto:${companyEmail}`} className="text-[#D4AF37] hover:underline">
              {companyEmail}
            </a>
          </p>
          <p className="text-[11px]">
            Propulsé par <strong className="text-slate-400">IziFacture</strong> · Solution de Facturation B2B & Encaissement OHADA
          </p>
        </footer>
      </div>
    </main>
  );
}
