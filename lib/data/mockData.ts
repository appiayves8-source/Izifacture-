export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: {
    name: string;
    city: string;
    country: string;
    avatar?: string;
  };
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'payee' | 'envoyee' | 'en_attente';
  serviceType: string;
}

export interface StatKpi {
  id: string;
  title: string;
  amount: number;
  change: string;
  isPositive: boolean;
  subtext: string;
  icon: string;
}

export const mockKpis: StatKpi[] = [
  {
    id: 'total_facture',
    title: 'Total Facturé',
    amount: 18450000,
    change: '+14.2%',
    isPositive: true,
    subtext: 'vs mois précédent',
    icon: 'FileText',
  },
  {
    id: 'total_encaisse',
    title: 'Total Encaissé',
    amount: 14200000,
    change: '77.0%',
    isPositive: true,
    subtext: 'taux de recouvrement',
    icon: 'CheckCircle2',
  },
  {
    id: 'en_attente',
    title: 'En Attente',
    amount: 3150000,
    change: '5 factures',
    isPositive: true,
    subtext: 'échéances sous 15 jours',
    icon: 'Clock',
  },
  {
    id: 'en_retard',
    title: 'En Retard (Impayé)',
    amount: 1100000,
    change: '2 factures',
    isPositive: false,
    subtext: 'relances automatiques actives',
    icon: 'AlertTriangle',
  },
];

export const mockChartData = [
  { day: 'Lun', label: 'Lundi', amount: 1420000, invoices: 3 },
  { day: 'Mar', label: 'Mardi', amount: 2150000, invoices: 4 },
  { day: 'Mer', label: 'Mercredi', amount: 1980000, invoices: 3 },
  { day: 'Jeu', label: 'Jeudi', amount: 3200000, invoices: 6 },
  { day: 'Ven', label: 'Vendredi', amount: 2850000, invoices: 5 },
  { day: 'Sam', label: 'Samedi', amount: 4100000, invoices: 7 },
  { day: 'Dim', label: 'Dimanche', amount: 2750000, invoices: 4 },
];

export const mockStatusBreakdown = {
  totalCount: 24,
  label: 'factures suivies ce mois',
  statuses: [
    {
      key: 'payee',
      label: 'Payée',
      count: 17,
      percentage: 71,
      color: '#D4AF37', // Royal gold
      dotClass: 'bg-[#D4AF37]',
      badgeClass: 'bg-[#D4AF37]/15 text-[#E5C158] border-[#D4AF37]/30',
    },
    {
      key: 'envoyee',
      label: 'Envoyée',
      count: 5,
      percentage: 21,
      color: '#E5C158', // Champagne gold
      dotClass: 'bg-[#E5C158]',
      badgeClass: 'bg-amber-950/30 text-amber-300 border-amber-600/30',
    },
    {
      key: 'en_attente',
      label: 'En attente',
      count: 2,
      percentage: 8,
      color: '#475569', // Muted slate / carbon
      dotClass: 'bg-slate-500',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    },
  ],
};

export const mockRecentInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'FAC-2024-0089',
    client: {
      name: 'Société Nouvelle de Transit (SNT)',
      city: 'Abidjan',
      country: "Côte d'Ivoire",
    },
    issueDate: '2024-10-04',
    dueDate: '2024-10-18',
    amount: 3850000,
    status: 'payee',
    serviceType: 'Dédouanement fret maritime',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'FAC-2024-0088',
    client: {
      name: 'Clinique Internationale Pasteur',
      city: 'Dakar',
      country: 'Sénégal',
    },
    issueDate: '2024-10-04',
    dueDate: '2024-10-25',
    amount: 2400000,
    status: 'envoyee',
    serviceType: 'Maintenance logiciel biomédical',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'FAC-2024-0087',
    client: {
      name: 'Afrique Agro Industrie SA',
      city: 'Douala',
      country: 'Cameroun',
    },
    issueDate: '2024-10-03',
    dueDate: '2024-10-17',
    amount: 5120000,
    status: 'payee',
    serviceType: 'Fourniture emballages éco',
  },
  {
    id: 'inv-4',
    invoiceNumber: 'FAC-2024-0086',
    client: {
      name: 'Aïcha Traoré Consulting',
      city: 'Bamako',
      country: 'Mali',
    },
    issueDate: '2024-10-02',
    dueDate: '2024-10-16',
    amount: 750000,
    status: 'en_attente',
    serviceType: 'Audit comptable trimestriel',
  },
  {
    id: 'inv-5',
    invoiceNumber: 'FAC-2024-0085',
    client: {
      name: 'Koffi & Associés Architecture',
      city: 'Lomé',
      country: 'Togo',
    },
    issueDate: '2024-10-01',
    dueDate: '2024-10-15',
    amount: 1850000,
    status: 'payee',
    serviceType: 'Études modélisation 3D',
  },
  {
    id: 'inv-6',
    invoiceNumber: 'FAC-2024-0084',
    client: {
      name: 'Bénin Logistique Express',
      city: 'Cotonou',
      country: 'Bénin',
    },
    issueDate: '2024-09-30',
    dueDate: '2024-10-14',
    amount: 4480000,
    status: 'envoyee',
    serviceType: 'Transport conteneurs port',
  },
];
