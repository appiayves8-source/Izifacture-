'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InvoiceForm from '@/components/invoices/InvoiceForm';

export default function NewInvoicePage() {
  return (
    <DashboardLayout breadcrumb={{ section: 'Opérations', page: 'Nouvelle Facture' }} fullWidth>
      <InvoiceForm />
    </DashboardLayout>
  );
}
