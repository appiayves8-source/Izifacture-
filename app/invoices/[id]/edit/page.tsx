'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { useInvoiceStore } from '@/lib/store/invoiceStore';

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = String(params?.id || '');
  const { getInvoice, isLoaded } = useInvoiceStore();

  const invoice = getInvoice(invoiceId);

  if (isLoaded && !invoice) {
    return (
      <DashboardLayout breadcrumb={{ section: 'Opérations', page: 'Facture introuvable' }}>
        <div className="bg-[#12131C] rounded-2xl p-8 border border-[#D4AF37]/20 text-center max-w-lg mx-auto mt-12 space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Facture introuvable</h2>
          <p className="text-xs text-slate-400">
            La facture demandée n&apos;a pas pu être chargée pour modification.
          </p>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] text-black text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste des factures</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout breadcrumb={{ section: 'Opérations', page: 'Chargement...' }}>
        <div className="py-20 text-center text-slate-400 text-xs">
          Chargement de la facture...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumb={{ section: 'Opérations', page: `Modifier ${invoice.invoiceNumber}` }} fullWidth>
      <InvoiceForm initialInvoice={invoice} isEditMode={true} />
    </DashboardLayout>
  );
}
