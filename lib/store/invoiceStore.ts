'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'brouillon' | 'envoyee' | 'payee' | 'en_retard';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  totalBilled?: number;
  invoicesCount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: Client;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  serviceType: string;
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  cinetpayTransactionId?: string;
  paidAt?: string;
  paymentToken?: string;
  sentAt?: string;
  sendStatus?: 'draft' | 'pending' | 'sent' | 'failed';
  sendError?: string;
  sendChannel?: string;
  sendRecipient?: string;
}

// ─── Données initiales ────────────────────────────────────────────────────────

export const INITIAL_CLIENTS: Client[] = [
  { id: 'cli-1', name: 'Société Nouvelle de Transit (SNT)', email: 'contact@snt-transit.ci', phone: '+225 27 21 00 11 22', address: 'Zone Portuaire, Boulevard de Vridi', city: 'Abidjan', country: "Côte d'Ivoire", totalBilled: 3850000, invoicesCount: 4 },
  { id: 'cli-2', name: 'Clinique Internationale Pasteur', email: 'direction@cliniquepasteur.sn', phone: '+221 33 821 45 78', address: 'Avenue Pasteur, Plateau', city: 'Dakar', country: 'Sénégal', totalBilled: 2400000, invoicesCount: 3 },
  { id: 'cli-3', name: 'Afrique Agro Industrie SA', email: 'achats@afrique-agro.cm', phone: '+237 233 42 18 90', address: 'Zone Industrielle de Bassa', city: 'Douala', country: 'Cameroun', totalBilled: 5120000, invoicesCount: 6 },
  { id: 'cli-4', name: 'Aïcha Traoré Consulting', email: 'aicha.traore@consulting-mali.ml', phone: '+223 20 22 34 56', address: 'Hamdallaye ACI 2000', city: 'Bamako', country: 'Mali', totalBilled: 750000, invoicesCount: 2 },
  { id: 'cli-5', name: 'Koffi & Associés Architecture', email: 'agence@koffi-associes.tg', phone: '+228 22 21 09 87', address: 'Boulevard du 13 Janvier', city: 'Lomé', country: 'Togo', totalBilled: 1850000, invoicesCount: 2 },
  { id: 'cli-6', name: 'Bénin Logistique Express', email: 'operations@benin-logistics.bj', phone: '+229 21 31 44 55', address: 'Zone Commerciale Ganhi', city: 'Cotonou', country: 'Bénin', totalBilled: 4480000, invoicesCount: 5 },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1', invoiceNumber: 'FAC-2024-0089', clientId: 'cli-1', client: INITIAL_CLIENTS[0],
    issueDate: '2024-10-04', dueDate: '2024-10-18', status: 'payee', serviceType: 'Dédouanement fret maritime',
    items: [
      { id: 'item-1', description: 'Honoraires de dédouanement maritime conteneurs 40 pieds', quantity: 2, unitPrice: 1200000, total: 2400000 },
      { id: 'item-2', description: 'Manutention portuaire & frais de magasinage sous douane', quantity: 1, unitPrice: 862712, total: 862712 },
    ],
    subtotal: 3262712, taxRate: 0.18, taxAmount: 587288, amount: 3850000,
    paymentMethod: 'Wave QR', notes: 'Règlement intégral reçu via Wave Business.',
  },
  {
    id: 'inv-2', invoiceNumber: 'FAC-2024-0088', clientId: 'cli-2', client: INITIAL_CLIENTS[1],
    issueDate: '2024-10-04', dueDate: '2024-10-25', status: 'envoyee', serviceType: 'Maintenance logiciel biomédical',
    items: [
      { id: 'item-3', description: 'Licence trimestrielle système information hospitalier (SIH)', quantity: 1, unitPrice: 1500000, total: 1500000 },
      { id: 'item-4', description: 'Assistance technique sur site et sauvegarde cloud sécurisée', quantity: 1, unitPrice: 533898, total: 533898 },
    ],
    subtotal: 2033898, taxRate: 0.18, taxAmount: 366102, amount: 2400000,
    paymentMethod: 'Virement BOA', notes: 'Échéance à 21 jours net.',
  },
  {
    id: 'inv-3', invoiceNumber: 'FAC-2024-0087', clientId: 'cli-3', client: INITIAL_CLIENTS[2],
    issueDate: '2024-10-03', dueDate: '2024-10-17', status: 'payee', serviceType: 'Fourniture emballages éco',
    items: [
      { id: 'item-5', description: 'Cartons kraft renforcés biodégradables export (Lot de 5 000)', quantity: 4, unitPrice: 850000, total: 3400000 },
      { id: 'item-6', description: 'Film étirable biosourcé & palettes traitées NIMP15', quantity: 2, unitPrice: 469492, total: 938983 },
    ],
    subtotal: 4338983, taxRate: 0.18, taxAmount: 781017, amount: 5120000,
    paymentMethod: 'Orange Money CI', notes: 'Livraison effectuée avec bordereau BL-882.',
  },
  {
    id: 'inv-4', invoiceNumber: 'FAC-2024-0086', clientId: 'cli-4', client: INITIAL_CLIENTS[3],
    issueDate: '2024-09-15', dueDate: '2024-09-30', status: 'en_retard', serviceType: 'Audit comptable trimestriel',
    items: [{ id: 'item-7', description: 'Mission audit procédures et conformité fiscale SYSCOHADA', quantity: 1, unitPrice: 635593, total: 635593 }],
    subtotal: 635593, taxRate: 0.18, taxAmount: 114407, amount: 750000,
    paymentMethod: 'MoMo MTN', notes: 'Relance automatique envoyée le 02/10/2024.',
  },
  {
    id: 'inv-5', invoiceNumber: 'FAC-2024-0085', clientId: 'cli-5', client: INITIAL_CLIENTS[4],
    issueDate: '2024-10-08', dueDate: '2024-10-22', status: 'brouillon', serviceType: 'Études modélisation 3D',
    items: [{ id: 'item-8', description: 'Rendu photoréaliste et maquette numérique BIM complexe hôtelier', quantity: 1, unitPrice: 1567797, total: 1567797 }],
    subtotal: 1567797, taxRate: 0.18, taxAmount: 282203, amount: 1850000,
    notes: 'Brouillon en attente de validation du cahier des charges par le client.',
  },
  {
    id: 'inv-6', invoiceNumber: 'FAC-2024-0084', clientId: 'cli-6', client: INITIAL_CLIENTS[5],
    issueDate: '2024-09-30', dueDate: '2024-10-14', status: 'envoyee', serviceType: 'Transport conteneurs port',
    items: [{ id: 'item-9', description: 'Acheminement convois exceptionnels Cotonou - Parakou', quantity: 2, unitPrice: 1898305, total: 3796610 }],
    subtotal: 3796610, taxRate: 0.18, taxAmount: 683390, amount: 4480000,
    notes: 'Facture transmise avec lettre de voiture.',
  },
];

// ─── Constantes & Types internes ──────────────────────────────────────────────

const STORAGE_KEY_INVOICES = 'izifacture_invoices_v1';
const STORAGE_KEY_CLIENTS = 'izifacture_clients_v1';

interface DbRow {
  id: string;
  invoice_number?: string;
  client_id?: string;
  client?: { id: string; name: string; email?: string; phone?: string; address?: string; city?: string; country?: string };
  issue_date?: string;
  due_date?: string;
  status?: string;
  service_type?: string;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  amount?: number;
  payment_method?: string;
  notes?: string;
  payment_status?: string;
  cinetpay_transaction_id?: string;
  paid_at?: string;
  payment_token?: string;
  sent_at?: string;
  send_status?: string;
  send_error?: string;
  send_channel?: string;
  send_recipient?: string;
  items?: Array<{ id: string; description?: string; quantity?: number; unit_price?: number; total?: number }>;
}

function mapDbToInvoice(row: DbRow, clientsList: Client[]): Invoice {
  let clientObj: Client;
  if (row.client) {
    clientObj = {
      id: row.client.id, name: row.client.name,
      email: row.client.email || '', phone: row.client.phone || '',
      address: row.client.address || '', city: row.client.city || '', country: row.client.country || '',
    };
  } else {
    clientObj = clientsList.find((c) => c.id === row.client_id) || {
      id: row.client_id || 'cli-unknown', name: 'Client Inconnu',
      email: '', phone: '', address: '', city: '', country: '',
    };
  }

  const items: InvoiceItem[] = Array.isArray(row.items)
    ? row.items.map((it) => ({
        id: it.id, description: it.description || '',
        quantity: Number(it.quantity || 1), unitPrice: Number(it.unit_price || 0), total: Number(it.total || 0),
      }))
    : [];

  return {
    id: row.id,
    invoiceNumber: row.invoice_number || `FAC-${Date.now()}`,
    clientId: row.client_id || clientObj.id,
    client: clientObj,
    issueDate: row.issue_date || new Date().toISOString().slice(0, 10),
    dueDate: row.due_date || new Date().toISOString().slice(0, 10),
    status: (row.status as InvoiceStatus) || 'brouillon',
    serviceType: row.service_type || 'Services & Prestations',
    subtotal: Number(row.subtotal || 0),
    taxRate: Number(row.tax_rate || 0.18),
    taxAmount: Number(row.tax_amount || 0),
    amount: Number(row.amount || 0),
    paymentMethod: row.payment_method || undefined,
    paymentStatus: (row.payment_status as string) || undefined,
    cinetpayTransactionId: (row.cinetpay_transaction_id as string) || undefined,
    paidAt: (row.paid_at as string) || undefined,
    paymentToken: (row.payment_token as string) || undefined,
    sentAt: (row.sent_at as string) || undefined,
    sendStatus: (row.send_status as 'draft' | 'pending' | 'sent' | 'failed') || undefined,
    sendError: (row.send_error as string) || undefined,
    sendChannel: (row.send_channel as string) || undefined,
    sendRecipient: (row.send_recipient as string) || undefined,
    notes: row.notes || undefined,
    items,
  };
}

// ─── Interface du store ───────────────────────────────────────────────────────

interface InvoiceStoreValue {
  invoices: Invoice[];
  clients: Client[];
  isLoaded: boolean;
  addInvoice: (data: Omit<Invoice, 'id' | 'invoiceNumber'> & { id?: string; invoiceNumber?: string }) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Invoice | null;
  deleteInvoice: (id: string) => boolean;
  updateInvoiceStatus: (id: string, newStatus: InvoiceStatus) => Invoice | null;
  getInvoice: (id: string) => Invoice | undefined;
  addClient: (data: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Client | null;
  deleteClient: (id: string) => boolean;
  getClient: (id: string) => Client | undefined;
  refreshData: () => Promise<void>;
}

const InvoiceStoreContext = createContext<InvoiceStoreValue | null>(null);

// ─── Provider global — monté une seule fois dans layout.tsx ──────────────────
// Résout la lenteur : 1 seul appel Supabase au login, 0 appel lors des navigations

export function InvoiceStoreProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_INVOICES);
        if (stored) return JSON.parse(stored);
      } catch { /* fallback */ }
    }
    return INITIAL_INVOICES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CLIENTS);
        if (stored) return JSON.parse(stored);
      } catch { /* fallback */ }
    }
    return INITIAL_CLIENTS;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  const fetchDataFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let clientsQuery = supabase.from('clients').select('*').order('name');
      let invoicesQuery = supabase
        .from('invoices')
        .select('*, client:clients(*), items:invoice_items(*)')
        .order('issue_date', { ascending: false });

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        const isAdmin = profile?.role === 'admin';
        if (!isAdmin) {
          clientsQuery = clientsQuery.eq('user_id', user.id);
          invoicesQuery = invoicesQuery.eq('user_id', user.id);
        }
      }

      const { data: dbClients, error: clientsErr } = await clientsQuery;

      let parsedClients: Client[] = [];
      if (!clientsErr && Array.isArray(dbClients)) {
        parsedClients = dbClients.map((c) => ({
          id: c.id, name: c.name, email: c.email || '', phone: c.phone || '',
          address: c.address || '', city: c.city || '', country: c.country || '',
          totalBilled: 0, invoicesCount: 0,
        }));
      } else if (clientsErr) {
        console.warn('Erreur lecture clients Supabase:', clientsErr.message);
      }

      const { data: dbInvoices, error: invErr } = await invoicesQuery;

      if (!invErr && dbInvoices) {
        const parsedInvoices = (dbInvoices as DbRow[]).map((inv) => mapDbToInvoice(inv, parsedClients));
        const clientsWithTotals = parsedClients.map((client) => {
          const clientInvs = parsedInvoices.filter((inv) => inv.clientId === client.id);
          const totalBilled = clientInvs.reduce((sum, inv) => sum + (inv.amount || 0), 0);
          return { ...client, totalBilled, invoicesCount: clientInvs.length };
        });

        setInvoices(parsedInvoices);
        setClients(clientsWithTotals);

        try {
          localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(parsedInvoices));
          localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clientsWithTotals));
        } catch { /* storage unavailable */ }
      } else if (!clientsErr && dbClients) {
        setClients(parsedClients);
      }
    } catch (err) {
      console.warn('Erreur lors du chargement des données Supabase:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchDataFromSupabase();

    // Un seul channel Realtime par Provider (pas par composant/page)
    const channelId = `invoices_rt_global_${Date.now()}`;
    const invoiceChannel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => { fetchDataFromSupabase(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => { fetchDataFromSupabase(); })
      .subscribe();

    return () => { supabase.removeChannel(invoiceChannel); };
  }, [fetchDataFromSupabase]);

  const saveInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    try { localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(newInvoices)); } catch { /* ignore */ }
  };

  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    try { localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(newClients)); } catch { /* ignore */ }
  };

  const addInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'> & { id?: string; invoiceNumber?: string }
  ): Promise<Invoice> => {
    const id = invoiceData.id || `inv-${Date.now()}`;
    const currentYear = new Date().getFullYear();
    const nextSeq = invoices.length + 1;
    const nextNumber = `FAC-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
    const invoiceNumber = invoiceData.invoiceNumber || nextNumber;
    const newInvoice: Invoice = { ...invoiceData, id, invoiceNumber };

    // ⬇️ Insertion SYNCHRONE dans Supabase — on attend la confirmation DB
    // avant de mettre à jour le state local et de retourner
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // ① UPSERT du client en premier pour garantir la contrainte FK
      // (Le client peut exister en localStorage mais pas encore en Supabase)
      const targetClient = invoiceData.client || clients.find((c) => c.id === invoiceData.clientId);
      if (invoiceData.clientId) {
        const clientPayload: Record<string, unknown> = {
          id: invoiceData.clientId,
          name: targetClient?.name || 'Client',
          email: targetClient?.email || null,
          phone: targetClient?.phone || null,
          address: targetClient?.address || null,
          city: targetClient?.city || 'Abidjan',
          country: targetClient?.country || "Côte d'Ivoire",
          user_id: user?.id || null,
        };
        let { error: clientErr } = await supabase
          .from('clients')
          .upsert(clientPayload, { onConflict: 'id', ignoreDuplicates: false });
        if (clientErr) {
          console.warn('Erreur upsert client initial, nouvel essai sans user_id:', clientErr.message);
          const { error: clientRetryErr } = await supabase
            .from('clients')
            .upsert({ ...clientPayload, user_id: null }, { onConflict: 'id', ignoreDuplicates: false });
          if (clientRetryErr) {
            console.error('Erreur finale upsert client:', clientRetryErr.message);
            throw new Error(`Impossible d'enregistrer le client : ${clientRetryErr.message}`);
          }
        }
      }

      // ② Insertion de la facture
      const invPayload: Record<string, unknown> = {
        id, invoice_number: invoiceNumber, client_id: invoiceData.clientId,
        issue_date: invoiceData.issueDate, due_date: invoiceData.dueDate,
        status: invoiceData.status, service_type: invoiceData.serviceType,
        subtotal: invoiceData.subtotal, tax_rate: invoiceData.taxRate,
        tax_amount: invoiceData.taxAmount, amount: invoiceData.amount,
        payment_method: invoiceData.paymentMethod || null, notes: invoiceData.notes || null,
        user_id: user?.id || null,
      };

      let { error: invErr } = await supabase.from('invoices').insert(invPayload);
      if (invErr && invErr.message?.includes('user_id')) {
        console.warn('Erreur insertion facture avec user_id, nouvel essai sans user_id:', invErr.message);
        const { error: invFallbackErr } = await supabase.from('invoices').insert({
          ...invPayload,
          user_id: null,
        });
        invErr = invFallbackErr;
      }
      if (invErr) {
        console.error('Erreur Supabase addInvoice:', invErr.message);
        throw new Error(invErr.message);
      }

      // ③ Insertion des articles
      if (invoiceData.items && invoiceData.items.length > 0) {
        const itemsToInsert = invoiceData.items.map((item, idx) => ({
          id: item.id || `item-${Date.now()}-${idx}`, invoice_id: id,
          description: item.description, quantity: item.quantity,
          unit_price: item.unitPrice, total: item.total, sort_order: idx + 1,
        }));
        const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsToInsert);
        if (itemsErr) console.error('Erreur Supabase insert invoice_items:', itemsErr.message);
      }
    } catch (err) {
      console.error('Erreur addInvoice Supabase:', err);
      throw err; // Remonter l'erreur au formulaire pour afficher un message
    }

    // Mise à jour du state local après confirmation Supabase
    saveInvoices([newInvoice, ...invoices]);
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>): Invoice | null => {
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) return null;
    const updatedInvoice = { ...invoices[index], ...updates };
    const updatedList = [...invoices];
    updatedList[index] = updatedInvoice;
    saveInvoices(updatedList);

    (async () => {
      try {
        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate;
        if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
        if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
        if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
        if (updates.taxRate !== undefined) dbUpdates.tax_rate = updates.taxRate;
        if (updates.taxAmount !== undefined) dbUpdates.tax_amount = updates.taxAmount;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
        if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
        await supabase.from('invoices').update(dbUpdates).eq('id', id);

        if (updates.items) {
          await supabase.from('invoice_items').delete().eq('invoice_id', id);
          if (updates.items.length > 0) {
            const itemsToInsert = updates.items.map((item, idx) => ({
              id: item.id || `item-${Date.now()}-${idx}`, invoice_id: id,
              description: item.description, quantity: item.quantity,
              unit_price: item.unitPrice, total: item.total, sort_order: idx + 1,
            }));
            await supabase.from('invoice_items').insert(itemsToInsert);
          }
        }
      } catch (err) { console.error('Erreur updateInvoice Supabase:', err); }
    })();

    return updatedInvoice;
  };

  const deleteInvoice = (id: string): boolean => {
    saveInvoices(invoices.filter((inv) => inv.id !== id));
    (async () => {
      try { await supabase.from('invoices').delete().eq('id', id); }
      catch (err) { console.error('Erreur deleteInvoice Supabase:', err); }
    })();
    return true;
  };

  const updateInvoiceStatus = (id: string, newStatus: InvoiceStatus): Invoice | null =>
    updateInvoice(id, { status: newStatus });

  const getInvoice = (id: string) => invoices.find((inv) => inv.id === id);

  const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    const id = `cli-${Date.now()}`;
    const newClient: Client = { ...clientData, id, totalBilled: 0, invoicesCount: 0 };

    // ⬇️ Insertion SYNCHRONE dans Supabase — attend la confirmation DB
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const clientPayload: Record<string, unknown> = {
        id, name: clientData.name, email: clientData.email,
        phone: clientData.phone, address: clientData.address,
        city: clientData.city, country: clientData.country,
        user_id: user?.id || null,
      };
      let { error } = await supabase.from('clients').insert(clientPayload);
      if (error && error.message?.includes('user_id')) {
        console.warn('Erreur addClient avec user_id, nouvel essai sans user_id:', error.message);
        delete clientPayload.user_id;
        const { error: retryError } = await supabase.from('clients').insert(clientPayload);
        error = retryError;
      }
      if (error) {
        console.error('Erreur Supabase addClient:', error.message);
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Erreur addClient Supabase:', err);
      throw err;
    }

    saveClients([newClient, ...clients]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>): Client | null => {
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) return null;
    const updatedClient = { ...clients[index], ...updates };
    const updatedList = [...clients];
    updatedList[index] = updatedClient;
    saveClients(updatedList);
    (async () => {
      try {
        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.city !== undefined) dbUpdates.city = updates.city;
        if (updates.country !== undefined) dbUpdates.country = updates.country;
        await supabase.from('clients').update(dbUpdates).eq('id', id);
      } catch (err) { console.error('Erreur updateClient Supabase:', err); }
    })();
    return updatedClient;
  };

  const deleteClient = (id: string): boolean => {
    saveClients(clients.filter((c) => c.id !== id));
    (async () => {
      try { await supabase.from('clients').delete().eq('id', id); }
      catch (err) { console.error('Erreur deleteClient Supabase:', err); }
    })();
    return true;
  };

  const getClient = (id: string) => clients.find((c) => c.id === id);

  const value: InvoiceStoreValue = {
    invoices, clients, isLoaded,
    addInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus, getInvoice,
    addClient, updateClient, deleteClient, getClient,
    refreshData: fetchDataFromSupabase,
  };

  return React.createElement(InvoiceStoreContext.Provider, { value }, children);
}

// ─── Hook d'accès — simple useContext, 0 appel réseau lors des navigations ────

export function useInvoiceStore(): InvoiceStoreValue {
  const ctx = useContext(InvoiceStoreContext);
  if (!ctx) {
    return {
      invoices: INITIAL_INVOICES,
      clients: INITIAL_CLIENTS,
      isLoaded: true,
      addInvoice: async () => INITIAL_INVOICES[0],
      updateInvoice: () => null,
      deleteInvoice: () => false,
      updateInvoiceStatus: () => null,
      getInvoice: (id: string) => INITIAL_INVOICES.find((inv) => inv.id === id),
      addClient: async () => INITIAL_CLIENTS[0],
      updateClient: () => null,
      deleteClient: () => false,
      getClient: (id: string) => INITIAL_CLIENTS.find((cli) => cli.id === id),
      refreshData: async () => {},
    };
  }
  return ctx;
}
