'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  User,
  Building2,
  CheckCircle,
  Send,
  Save,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useInvoiceStore, Invoice, InvoiceItem } from '@/lib/store/invoiceStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { supabase } from '@/lib/supabase/client';
import { formatFCFA } from '@/lib/utils/formatters';

interface InvoiceFormProps {
  initialInvoice?: Invoice;
  isEditMode?: boolean;
}

export default function InvoiceForm({ initialInvoice, isEditMode = false }: InvoiceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const fromQuote = searchParams.get('from') === 'quote';

  const { clients, addInvoice, updateInvoice } = useInvoiceStore();
  const { settings } = useSettingsStore();
  const {
    isActive,
    hasReachedLimit,
    incrementInvoiceCount,
  } = useSubscription();

  // Today's date as default YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Default due date from company settings
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.paymentTermsDays || 14));
    return d.toISOString().split('T')[0];
  };

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialInvoice?.clientId || ''
  );
  const [issueDate, setIssueDate] = useState<string>(
    initialInvoice?.issueDate || todayStr
  );
  const [dueDate, setDueDate] = useState<string>(
    initialInvoice?.dueDate || defaultDueDate()
  );
  const [serviceType, setServiceType] = useState<string>(
    initialInvoice?.serviceType || 'Prestation de services B2B'
  );
  const [notes, setNotes] = useState<string>(
    initialInvoice?.notes || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialInvoice?.paymentMethod || 'Wave'
  );

  // Invoice Items
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items || [
      {
        id: 'item-1',
        description: '',
        quantity: 0,
        unitPrice: 0,
        total: 0,
      },
    ]
  );

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // If no client selected and clients are loaded, default to the first client
  useEffect(() => {
    if (!selectedClientId && clients.length > 0 && !initialInvoice && !quoteId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId, initialInvoice, quoteId]);

  // Prefill from quote when converting a quote
  useEffect(() => {
    if (fromQuote && quoteId && !initialInvoice) {
      (async () => {
        try {
          const { data: quote, error } = await supabase
            .from('quotes')
            .select('*, client:clients(*), items:quote_items(*)')
            .eq('id', quoteId)
            .maybeSingle();

          if (!error && quote) {
            if (quote.client_id) setSelectedClientId(quote.client_id);
            if (quote.notes) setNotes(quote.notes);
            if (quote.items && quote.items.length > 0) {
              setItems(
                quote.items.map((it: { id: string; description?: string; quantity?: number; unit_price?: number; total?: number }) => ({
                  id: it.id || `item-${Date.now()}`,
                  description: it.description || '',
                  quantity: Number(it.quantity || 1),
                  unitPrice: Number(it.unit_price || 0),
                  total: Number(it.total || 0),
                }))
              );
            }
          }
        } catch (e) {
          console.warn('Erreur chargement devis pour pré-remplissage:', e);
        }
      })();
    }
  }, [fromQuote, quoteId, initialInvoice]);

  // Handle item change & auto calculate line total
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'description') {
      current.description = String(value);
    } else if (field === 'quantity') {
      const q = Math.max(0, parseInt(String(value), 10) || 0);
      current.quantity = q;
      current.total = Math.round(q * current.unitPrice);
    } else if (field === 'unitPrice') {
      const price = Math.max(0, parseInt(String(value), 10) || 0);
      current.unitPrice = price;
      current.total = Math.round(current.quantity * price);
    }

    updated[index] = current;
    setItems(updated);
  };

  // Add line item
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 0,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove line item
  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('Une facture doit comporter au moins une ligne.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const filtered = items.filter((_, i) => i !== index);
    setItems(filtered);
  };

  // Calculations basés sur les paramètres dynamiques Supabase
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0));
  const taxRate = (Number(settings.vatRate ?? 18)) / 100;
  const taxAmount = Math.round(subtotal * taxRate);
  const totalAmount = Math.round(subtotal + taxAmount);

  // Selected client object
  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (targetStatus: 'brouillon' | 'envoyee') => {
    if (!selectedClientId) {
      setErrorMsg('Veuillez sélectionner un client.');
      return;
    }

    if (!isEditMode && hasReachedLimit) {
      setErrorMsg('Félicitations pour vos 5 premières factures ! Vous avez atteint la limite de l\'offre Découverte. Activez IziFacture Pro pour continuer à facturer en illimité.');
      return;
    }

    if (items.some((it) => !it.description.trim())) {
      setErrorMsg('Veuillez renseigner le nom du produit pour toutes les lignes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      clientId: selectedClientId,
      client: selectedClient,
      issueDate,
      dueDate,
      status: targetStatus,
      items,
      subtotal,
      taxRate,
      taxAmount,
      amount: totalAmount,
      serviceType: serviceType.trim() || 'Services & Prestations',
      notes,
      paymentMethod,
    };

    if (fromQuote && quoteId) {
      supabase
        .from('quotes')
        .update({ status: 'accepte', updated_at: new Date().toISOString() })
        .eq('id', quoteId)
        .then();
    }

    try {
      if (isEditMode && initialInvoice) {
        updateInvoice(initialInvoice.id, payload);
        if (targetStatus === 'envoyee') {
          try {
            const sendRes = await fetch(`/api/invoices/${initialInvoice.id}/issue-and-send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resend: true, phone: selectedClient?.phone }),
            });
            const sendData = await sendRes.json().catch(() => ({}));
            if (sendData?.whatsappUrl) {
              window.open(sendData.whatsappUrl, '_blank', 'noopener,noreferrer');
            }
          } catch (sendErr) {
            console.warn('Erreur transmission WhatsApp:', sendErr);
          }
        }
        setSuccessMsg('Facture mise à jour avec succès.');
        setTimeout(() => {
          router.push(`/invoices/${initialInvoice.id}`);
        }, 1200);
      } else {
        // ⬇️ Await : on attend que Supabase confirme l'insertion avant d'émettre
        const created = await addInvoice(payload);
        incrementInvoiceCount();

        if (targetStatus === 'envoyee') {
          setSuccessMsg(`Facture ${created.invoiceNumber} enregistrée. Préparation de l'envoi WhatsApp...`);
          try {
            const sendRes = await fetch(`/api/invoices/${created.id}/issue-and-send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: selectedClient?.phone }),
            });
            const sendData = await sendRes.json().catch(() => ({}));
            if (sendData?.whatsappUrl) {
              // Ouverture automatique de WhatsApp (fonctionne pour WhatsApp standard et Business)
              window.open(sendData.whatsappUrl, '_blank', 'noopener,noreferrer');
            }
          } catch (sendErr) {
            console.warn('Erreur transmission WhatsApp:', sendErr);
          }
          setSuccessMsg(`Facture ${created.invoiceNumber} émise ! WhatsApp ouvert avec le message prêt à envoyer.`);
        } else {
          setSuccessMsg(`Brouillon de la facture ${created.invoiceNumber} enregistré avec succès.`);
        }

        setTimeout(() => {
          router.push(`/invoices/${created.id}`);
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Erreur lors de la sauvegarde en base de données : ${msg}. Veuillez réessayer.`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Back */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-amber-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour aux factures</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            {isEditMode ? `Modifier la Facture ${initialInvoice?.invoiceNumber}` : 'Créer une Nouvelle Facture'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Renseignez les détails commerciaux, lignes de facturation et conditions de règlement.
          </p>

          {isActive && (
            <div className="flex items-center gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#F5E6B3] border border-[#D4AF37]/35 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Licence Pro — Facturation Illimitée
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleSubmit('brouillon')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13141F] border border-[#D4AF37]/30 text-xs font-semibold text-[#F5E6B3] hover:bg-[#181926] hover:border-[#D4AF37]/60 active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <svg className="w-4 h-4 animate-spin text-[#D4AF37]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            ) : (
              <Save className="w-4 h-4 text-[#D4AF37]" />
            )}
            <span>{isSubmitting ? 'Enregistrement...' : 'Sauvegarder Brouillon'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('envoyee')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            ) : (
              <Send className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isSubmitting ? 'Enregistrement en cours...' : (isEditMode ? 'Enregistrer & Envoyer' : 'Émettre & Envoyer')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F5E6B3] text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Grid: Information Client & Dates — Pleine Largeur */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {/* Client Selection Card — Occupe 2 colonnes (lg) ou 3 colonnes (xl) */}
        <div className="lg:col-span-2 xl:col-span-3 bg-[#12131C] rounded-2xl p-6 sm:p-7 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 text-[#E5C158] border border-[#D4AF37]/40 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Destinataire & Client B2B
              </h2>
            </div>
            <Link
              href="/clients"
              className="text-xs font-semibold text-[#E5C158] hover:text-amber-200 hover:underline"
            >
              + Gérer les clients
            </Link>
          </div>

          <div className="space-y-5 text-sm">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-1.5">
                Sélectionner le Client B2B <span className="text-[#D4AF37]">*</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#12131C] text-white py-1">
                    {c.name} — {c.city}, {c.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Client info preview banner */}
            {selectedClient && (
              <div className="p-3.5 rounded-xl bg-[#181926]/80 border border-[#D4AF37]/15 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  <div>
                    <span className="font-bold text-white block">{selectedClient.name}</span>
                    <span className="text-slate-400">{selectedClient.address}, {selectedClient.city} ({selectedClient.country})</span>
                  </div>
                </div>
                <div className="text-slate-300 font-mono">
                  <span>{selectedClient.phone}</span> • <span>{selectedClient.email}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Objet */}
              <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Intitulé commercial / Objet de la facture
              </label>
              <input
                type="text"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Ex : Prestation de conseil logistique ou Vente matériel..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
              </div>

              {/* Moyen de paiement — inline avec Objet */}
              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Moyen de paiement <span className="text-[#D4AF37]">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/25 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all cursor-pointer text-sm"
                >
                  <option value="Wave" className="bg-[#12131C] text-white">🌊 Wave</option>
                  <option value="Orange Money" className="bg-[#12131C] text-white">🟠 Orange Money</option>
                  <option value="MTN MoMo" className="bg-[#12131C] text-white">💛 MTN MoMo</option>
                  <option value="Moov Money" className="bg-[#12131C] text-white">🟣 Moov Money</option>
                  <option value="Virement Bancaire" className="bg-[#12131C] text-white">🏦 Virement Bancaire</option>
                  <option value="Wave / Virement Bancaire" className="bg-[#12131C] text-white">🌊🏦 Wave + Virement Bancaire</option>
                  <option value="Orange Money / Virement Bancaire" className="bg-[#12131C] text-white">🟠🏦 Orange Money + Virement Bancaire</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Affiché sur la facture imprimée.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dates & Reference Card — 1 colonne */}
        <div className="lg:col-span-2 xl:col-span-2 bg-[#12131C] rounded-2xl p-6 sm:p-7 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#D4AF37]/15 pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 text-[#E5C158] border border-[#D4AF37]/40 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Dates & Validité
            </h2>
          </div>

          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-1.5">
                  Date d&apos;émission <span className="text-[#D4AF37]">*</span>
                </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-1.5">
                  Date d&apos;échéance <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181926] border border-[#D4AF37]/15 text-xs text-slate-400">
              <span className="text-amber-200 font-semibold block mb-0.5">Devise fiscale UEMOA :</span>
              Tous les montants sont en <span className="text-white font-bold">Francs CFA (XOF / XAF)</span> arrondis à l&apos;entier FCFA.
            </div>
          </div>
        </div>
      </div>

      {/* Lignes de Facture (Items Section) */}
      <div className="bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-[#D4AF37]/15 bg-[#12131C]">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight font-sans">
              Lignes de la Facture
            </h2>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              Articles, prestations, quantités et calcul automatique du total par ligne
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#13141F] border border-[#D4AF37]/35 hover:bg-[#181926] text-[#F5E6B3] text-xs font-semibold transition-all hover:border-[#D4AF37]/70 active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Ajouter une ligne</span>
          </button>
        </div>

        {/* Lines Table — Pleine largeur, min-w supprimé */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D4AF37]/15 bg-[#090A0F]/70 text-xs font-semibold text-[#D4AF37]/80 uppercase tracking-wider font-sans">
                <th className="py-4 px-6 w-14 text-center">#</th>
                <th className="py-4 px-5">Nom du produit</th>
                <th className="py-4 px-5 w-32 text-center">Quantité</th>
                <th className="py-4 px-5 w-52 text-right">Prix Unitaire HT (FCFA)</th>
                <th className="py-4 px-5 w-52 text-right">Total HT (FCFA)</th>
                <th className="py-4 px-5 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  {/* Number */}
                  <td className="py-4 px-6 text-center font-mono text-slate-500 font-bold text-sm">
                    {index + 1}
                  </td>

                  {/* Description Input */}
                  <td className="py-4 px-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Nom du produit"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-400/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                    />
                  </td>

                  {/* Quantity Input */}
                  <td className="py-4 px-5">
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-bold text-center focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                    />
                  </td>

                  {/* Unit Price Input */}
                  <td className="py-4 px-5 text-right">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-[#F5E6B3] font-mono font-bold text-right focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm pr-14"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono pointer-events-none">
                        FCFA
                      </span>
                    </div>
                  </td>

                  {/* Total Line (Auto Calculated) */}
                  <td className="py-4 px-5 text-right">
                    <span className="font-bold text-[#F5E6B3] font-mono text-base tabular-nums">
                      {formatFCFA(item.total)}
                    </span>
                  </td>

                  {/* Delete Button */}
                  <td className="py-4 px-5 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      title="Supprimer cette ligne"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Notes & Financial Summary */}
        <div className="p-6 border-t border-[#D4AF37]/15 bg-[#0D0E15]/70 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Notes & Terms */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Conditions de règlement & Mentions particulières
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex : Paiement par virement bancaire ou Mobile Money (Wave / Orange Money). Tout retard entraînera des pénalités conformément au code de commerce."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs"
            />
          </div>

          {/* Totals Summary Card — 1 colonne pleine */}
          <div className="bg-[#12131C] rounded-xl p-6 border border-[#D4AF37]/25 shadow-sm space-y-4">
            {/* Subtotal HT */}
            <div className="flex items-center justify-between text-sm pb-3 border-b border-[#D4AF37]/10">
              <span className="text-slate-400 font-medium">Sous-total Hors Taxes (HT)</span>
              <span className="font-bold text-white font-mono tabular-nums text-base">
                {formatFCFA(subtotal)}
              </span>
            </div>

            {/* TVA 18% */}
            <div className="flex items-center justify-between text-sm pb-3 border-b border-[#D4AF37]/10">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">TVA légale ({settings.vatRate}%)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#D4AF37]/20 text-[#E5C158] font-mono">
                  UEMOA
                </span>
              </div>
              <span className="font-bold text-amber-200/90 font-mono tabular-nums text-base">
                {formatFCFA(taxAmount)}
              </span>
            </div>

            {/* Total TTC */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-sm font-bold text-white block uppercase tracking-wider font-sans">
                  Total Net à Payer (TTC)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Arrondi à l&apos;entier FCFA
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-[#F5E6B3] font-mono tabular-nums">
                {formatFCFA(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-[#D4AF37]/15 bg-[#12131C] flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/invoices"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Annuler et retourner
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit('brouillon')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#13141F] border border-[#D4AF37]/30 text-xs font-semibold text-[#F5E6B3] hover:bg-[#181926] hover:border-[#D4AF37]/60 active:scale-95 transition-all shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Sauvegarder comme Brouillon</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('envoyee')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>{isEditMode ? 'Enregistrer les modifications' : 'Émettre & Envoyer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
