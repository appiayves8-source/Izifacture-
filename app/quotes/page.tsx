'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  Search,
  AlertCircle,
  ChevronRight,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  X,
  Trash2,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';
import { useInvoiceStore, INITIAL_CLIENTS, Client } from '@/lib/store/invoiceStore';
import { supabase } from '@/lib/supabase/client';

// ─── Types ───────────────────────────────────────────────
type QuoteStatus = 'brouillon' | 'envoye' | 'accepte' | 'expire';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  client: Client;
  issueDate: string;
  validUntil: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  taxAmount: number;
  amount: number;
  notes?: string;
}

// ─── Mock Initial Quotes ──────────────────────────────────
const INITIAL_QUOTES: Quote[] = [
  {
    id: 'q-1',
    quoteNumber: 'DEV-2024-0012',
    client: INITIAL_CLIENTS[0],
    issueDate: '2024-10-01',
    validUntil: '2024-10-31',
    status: 'accepte',
    items: [
      { id: 'qi-1', description: 'Prestation conseil supply chain', quantity: 1, unitPrice: 2500000, total: 2500000 },
    ],
    subtotal: 2500000,
    taxAmount: 450000,
    amount: 2950000,
  },
  {
    id: 'q-2',
    quoteNumber: 'DEV-2024-0011',
    client: INITIAL_CLIENTS[1],
    issueDate: '2024-09-28',
    validUntil: '2024-10-28',
    status: 'envoye',
    items: [
      { id: 'qi-2', description: 'Audit système informatique', quantity: 2, unitPrice: 800000, total: 1600000 },
    ],
    subtotal: 1600000,
    taxAmount: 288000,
    amount: 1888000,
  },
  {
    id: 'q-3',
    quoteNumber: 'DEV-2024-0010',
    client: INITIAL_CLIENTS[2],
    issueDate: '2024-09-20',
    validUntil: '2024-10-20',
    status: 'expire',
    items: [
      { id: 'qi-3', description: 'Formation gestion des stocks', quantity: 5, unitPrice: 150000, total: 750000 },
    ],
    subtotal: 750000,
    taxAmount: 135000,
    amount: 885000,
  },
  {
    id: 'q-4',
    quoteNumber: 'DEV-2024-0009',
    client: INITIAL_CLIENTS[3],
    issueDate: '2024-10-05',
    validUntil: '2024-11-05',
    status: 'brouillon',
    items: [
      { id: 'qi-4', description: 'Conseil stratégique développement', quantity: 1, unitPrice: 1200000, total: 1200000 },
    ],
    subtotal: 1200000,
    taxAmount: 216000,
    amount: 1416000,
  },
];

// ─── New Quote Form ───────────────────────────────────────
function NewQuoteModal({
  clients,
  onClose,
  onSave,
}: {
  clients: Client[];
  onClose: () => void;
  onSave: (q: Quote) => void;
}) {
  const availableClients = clients.length > 0 ? clients : INITIAL_CLIENTS;
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [clientId, setClientId] = useState(availableClients[0].id);
  const [issueDate, setIssueDate] = useState(today);
  const [validUntil, setValidUntil] = useState(in30);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([
    { id: 'new-1', description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const TAX = 0.18;

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        updated.total = Number(updated.quantity) * Number(updated.unitPrice);
        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = Math.round(subtotal * TAX);
  const total = subtotal + taxAmount;

  const selectedClient = availableClients.find((c) => c.id === clientId) || availableClients[0];

  const handleSave = (asDraft: boolean) => {
    const count = Math.floor(Math.random() * 900 + 100);
    const newQ: Quote = {
      id: `q-${Date.now()}`,
      quoteNumber: `DEV-2024-${count}`,
      client: selectedClient,
      issueDate,
      validUntil,
      status: asDraft ? 'brouillon' : 'envoye',
      items,
      subtotal,
      taxAmount,
      amount: total,
      notes,
    };
    onSave(newQ);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#12131C] rounded-2xl border border-[#D4AF37]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/15 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DFBA55] to-[#B8860B] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Nouveau Devis</h2>
              <p className="text-[11px] text-slate-400">Enregistré dans le Cloud Supabase</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Client + Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-1.5">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs"
              >
                {availableClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-1.5">Date d&apos;émission</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-1.5">Valide jusqu&apos;au</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider">Prestations / Articles</label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-[11px] text-[#D4AF37] hover:text-amber-300 font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 rounded-xl bg-[#181926] border border-[#D4AF37]/15 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-[#D4AF37] font-bold">LIGNE #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Description de la prestation…"
                    className="w-full px-3 py-2 rounded-lg bg-[#12131C] border border-[#D4AF37]/20 text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] text-xs font-medium"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Quantité</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#12131C] border border-[#D4AF37]/20 text-white font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Prix Unit. HT (FCFA)</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#12131C] border border-[#D4AF37]/20 text-white font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] text-slate-400 mb-1">Total Ligne HT</label>
                      <div className="px-3 py-1.5 rounded-lg bg-[#090A0F] border border-white/5 text-[#F5E6B3] font-mono text-xs font-bold tabular-nums">
                        {formatFCFA(item.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-4 rounded-xl bg-[#181926] border border-[#D4AF37]/20 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Sous-total HT</span>
              <span className="font-mono text-white font-semibold">{formatFCFA(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>TVA (18%)</span>
              <span className="font-mono text-white font-semibold">{formatFCFA(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#D4AF37]/15">
              <span className="text-white">Total Estimé TTC</span>
              <span className="font-mono text-[#F5E6B3] text-base">{formatFCFA(total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-[#D4AF37]/80 uppercase tracking-wider mb-1.5">Notes / Conditions (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Délais de réponse, conditions particulières…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs resize-none"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-[#D4AF37]/15 flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          <button
            onClick={() => handleSave(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/30 text-[#F5E6B3] text-xs font-bold hover:bg-[#202234] hover:border-[#D4AF37]/60 active:scale-95 transition-all"
          >
            Sauvegarder comme Brouillon
          </button>
          <button
            onClick={() => handleSave(false)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            Envoyer au client
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────
function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  switch (status) {
    case 'accepte':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]"></span>
          Accepté
        </span>
      );
    case 'envoye':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/30 text-amber-300 border border-amber-600/35">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Envoyé
        </span>
      );
    case 'expire':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/40 text-red-300 border border-red-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          Expiré
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Brouillon
        </span>
      );
  }
}

// ─── Main Page ────────────────────────────────────────────
export default function QuotesPage() {
  const router = useRouter();
  const { clients } = useInvoiceStore();
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  // Charger les devis depuis Supabase
  const loadQuotesFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, client:clients(*), items:quote_items(*)')
        .order('issue_date', { ascending: false });

      if (!error && Array.isArray(data)) {
        const loaded: Quote[] = data.map((q: { id: string; quote_number: string; client?: Client; client_id?: string; issue_date: string; valid_until: string; status: string; subtotal?: number; tax_amount?: number; amount?: number; notes?: string; items?: Array<{ id: string; description?: string; quantity?: number; unit_price?: number; total?: number }> }) => ({
          id: q.id,
          quoteNumber: q.quote_number,
          client: q.client || clients.find((c) => c.id === q.client_id) || {
            id: q.client_id || 'cli-unknown',
            name: 'Client Entreprise',
            email: '',
            phone: '',
            address: '',
            city: 'Abidjan',
            country: "Côte d'Ivoire",
          },
          issueDate: q.issue_date,
          validUntil: q.valid_until,
          status: q.status as QuoteStatus,
          subtotal: Number(q.subtotal || 0),
          taxAmount: Number(q.tax_amount || 0),
          amount: Number(q.amount || 0),
          notes: q.notes || undefined,
          items: (q.items || []).map((it) => ({
            id: it.id,
            description: it.description || '',
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unit_price || 0),
            total: Number(it.total || 0),
          })),
        }));
        setQuotes(loaded);
      }
    } catch (err) {
      console.warn('Erreur chargement quotes Supabase:', err);
    }
  }, [clients]);

  useEffect(() => {
    loadQuotesFromSupabase();

    const channelId = `quotes_rt_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => {
        loadQuotesFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadQuotesFromSupabase]);

  const filterTabs = [
    { key: 'all', label: 'Tous', count: quotes.length },
    { key: 'brouillon', label: 'Brouillons', count: quotes.filter((q) => q.status === 'brouillon').length },
    { key: 'envoye', label: 'Envoyés', count: quotes.filter((q) => q.status === 'envoye').length },
    { key: 'accepte', label: 'Acceptés', count: quotes.filter((q) => q.status === 'accepte').length },
    { key: 'expire', label: 'Expirés', count: quotes.filter((q) => q.status === 'expire').length },
  ];

  const filtered = quotes.filter((q) => {
    if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      return q.client?.name?.toLowerCase().includes(s) || q.quoteNumber?.toLowerCase().includes(s);
    }
    return true;
  });

  const handleSaveQuote = async (q: Quote) => {
    setQuotes((prev) => [q, ...prev]);

    // Persistance Supabase
    try {
      await supabase.from('quotes').insert({
        id: q.id,
        quote_number: q.quoteNumber,
        client_id: q.client.id,
        issue_date: q.issueDate,
        valid_until: q.validUntil,
        status: q.status,
        subtotal: q.subtotal,
        tax_amount: q.taxAmount,
        amount: q.amount,
        notes: q.notes || null,
      });

      if (q.items && q.items.length > 0) {
        await supabase.from('quote_items').insert(
          q.items.map((it, idx) => ({
            id: it.id || `qi-${Date.now()}-${idx}`,
            quote_id: q.id,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            total: it.total,
            sort_order: idx + 1,
          }))
        );
      }
    } catch (err) {
      console.error('Erreur Supabase insert quote:', err);
    }
  };

  const convertToInvoice = (q: Quote) => {
    router.push(`/invoices/new?from=quote&quoteId=${q.id}`);
  };

  return (
    <DashboardLayout breadcrumb={{ section: 'Opérations', page: 'Devis & Proformas' }}>
      {showModal && (
        <NewQuoteModal
          clients={clients}
          onClose={() => setShowModal(false)}
          onSave={handleSaveQuote}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-amber-200 transition-colors font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Devis &amp; Factures Proforma
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Émettez vos propositions commerciales convertibles en factures en 1 clic. Sauvegardés dans Supabase.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200 self-start sm:self-center"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Créer un devis</span>
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {[
          { label: 'Total devis', value: quotes.length, icon: FileSpreadsheet, color: 'text-[#D4AF37]' },
          { label: 'Acceptés', value: quotes.filter((q) => q.status === 'accepte').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'En attente', value: quotes.filter((q) => q.status === 'envoye').length, icon: Clock, color: 'text-amber-300' },
          {
            label: 'Valeur totale',
            value: formatFCFA(quotes.reduce((s, q) => s + q.amount, 0)),
            icon: FileText,
            color: 'text-[#F5E6B3]',
            isMoney: true,
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#12131C] rounded-2xl p-4 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              <span className="text-[11px] text-slate-400 font-medium">{kpi.label}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedStatus === tab.key
                  ? 'bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black font-bold border-transparent shadow-[0_2px_10px_rgba(212,175,55,0.3)]'
                  : 'bg-[#12131C] text-slate-300 border-[#D4AF37]/15 hover:border-[#D4AF37]/40 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedStatus === tab.key ? 'bg-black/20 text-black' : 'bg-[#181926] text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par client ou numéro de devis…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12131C] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs"
          />
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#D4AF37]/15 flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            {filtered.length} devis{filtered.length > 1 ? '' : ''}
          </span>
          <span className="text-[11px] text-slate-400">Synchronisé en temps réel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#D4AF37]/15 bg-[#090A0F]/70 text-[11px] font-semibold text-[#D4AF37]/80 uppercase tracking-wider">
                <th className="py-3 px-5">Numéro</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Émission</th>
                <th className="py-3 px-4">Valide jusqu&apos;au</th>
                <th className="py-3 px-4 text-right">Montant TTC</th>
                <th className="py-3 px-5 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-[#D4AF37]/60 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">Aucun devis trouvé.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="group hover:bg-white/[0.04] transition-colors cursor-pointer">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#181926] border border-[#D4AF37]/20 flex items-center justify-center text-[#E5C158] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors flex-shrink-0">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white font-mono group-hover:text-[#F5E6B3] transition-colors">
                          {q.quoteNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-[#F5E6B3] transition-colors">{q.client?.name}</div>
                      <div className="text-[11px] text-slate-400">{q.client?.city}, {q.client?.country}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums">{formatDate(q.issueDate)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums">{formatDate(q.validUntil)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-[#F5E6B3] font-mono text-sm tabular-nums">{formatFCFA(q.amount)}</span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {q.status === 'accepte' && (
                          <button
                            onClick={() => convertToInvoice(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#DFBA55] to-[#B8860B] text-black text-[10px] font-bold hover:shadow-[0_2px_10px_rgba(212,175,55,0.4)] active:scale-95 transition-all"
                          >
                            <FileText className="w-3 h-3" />
                            Facturer
                          </button>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E5C158]">
                          Détails <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
