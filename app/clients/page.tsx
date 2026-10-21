'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useInvoiceStore, Client } from '@/lib/store/invoiceStore';
import { formatFCFA } from '@/lib/utils/formatters';

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useInvoiceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Côte d’Ivoire');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setCountry("Côte d'Ivoire");
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setAddress(client.address);
    setCity(client.city);
    setCountry(client.country);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Le nom du client / raison sociale est obligatoire.');
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim() || 'Abidjan',
        country: country.trim() || "Côte d'Ivoire",
      });
      showToast(`Client ${name} mis à jour avec succès.`);
    } else {
      addClient({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim() || 'Abidjan',
        country: country.trim() || "Côte d'Ivoire",
      });
      showToast(`Client ${name} ajouté avec succès.`);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteClient(id);
    setDeleteConfirmId(null);
    showToast('Client supprimé avec succès.');
  };

  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout breadcrumb={{ section: 'Gestion', page: 'Clients' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-[#12131C] border border-[#D4AF37]/50 text-[#F5E6B3] text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-amber-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Annuaire Clients B2B
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Gérez vos comptes clients d&apos;Afrique de l&apos;Ouest & Centrale, coordonnées et facturations.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200 self-start sm:self-center"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nouveau client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom de société, ville, pays, téléphone ou email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12131C] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-white"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Clients Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-[#12131C] rounded-2xl border border-[#D4AF37]/20 p-8">
            <AlertCircle className="w-8 h-8 text-[#D4AF37]/60 mx-auto mb-2" />
            <p className="font-semibold text-sm text-slate-300">Aucun client trouvé.</p>
            <p className="text-xs text-slate-500 mt-1">Cliquez sur « Nouveau client » pour en enregistrer un.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-[#12131C] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-[#D4AF37]/50 hover:shadow-[0_4px_25px_rgba(212,175,55,0.12)] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header card with avatar & badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFBA55]/20 to-[#B8860B]/10 text-[#E5C158] border border-[#D4AF37]/35 flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#181926] text-amber-200 rounded-full border border-[#D4AF37]/30 shadow-sm">
                    {client.invoicesCount || 0} {(client.invoicesCount || 0) > 1 ? 'factures' : 'facture'}
                  </span>
                </div>

                {/* Company Name & Location */}
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {client.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                  <span>{client.address ? `${client.address}, ` : ''}{client.city}, {client.country}</span>
                </p>

                {/* Contact info */}
                <div className="space-y-1 pt-3 text-xs text-slate-300 font-mono">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Financial Metric & Action Buttons */}
              <div className="mt-4 pt-3.5 border-t border-[#D4AF37]/15">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-slate-400 font-medium text-[11px]">Total Facturé TTC</span>
                  <span className="font-bold text-[#F5E6B3] font-mono tabular-nums text-xs">
                    {formatFCFA(client.totalBilled || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    href="/invoices/new"
                    className="text-[11px] font-semibold text-[#E5C158] hover:text-amber-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Facturer</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(client)}
                      title="Modifier les coordonnées du client"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#D4AF37]/30 transition-all"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(client.id)}
                      title="Supprimer ce client"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Add / Edit Client Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative bg-[#12131C] rounded-2xl p-6 border border-[#D4AF37]/35 shadow-2xl max-w-lg w-full z-10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DFBA55] to-[#B8860B] text-black font-bold flex items-center justify-center shadow-md">
                  <Building2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingClient ? 'Modifier le Client' : 'Ajouter un Nouveau Client B2B'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveClient} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Nom de l&apos;entreprise / Raison sociale <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Société Ivoirienne de Négoce (SIN SARL)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Email professionnel</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Numéro de téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Adresse géographique</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Zone Industrielle de Yopougon, Rue des Brasseries"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Abidjan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Pays (Zone UEMOA / CEMAC)</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-[#D4AF37]/20 text-white font-medium focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  >
                    <option value="Côte d'Ivoire">Côte d&apos;Ivoire</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Cameroun">Cameroun</option>
                    <option value="Mali">Mali</option>
                    <option value="Togo">Togo</option>
                    <option value="Bénin">Bénin</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Niger">Niger</option>
                    <option value="Gabon">Gabon</option>
                    <option value="Guinée">Guinée</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4AF37]/15">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181926] text-slate-300 hover:text-white text-xs font-semibold border border-[#D4AF37]/20 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#DFBA55] via-[#D4AF37] to-[#B8860B] hover:from-[#E8C86A] hover:to-[#C69214] text-black text-xs font-bold shadow-[0_2px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_22px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-200"
                >
                  {editingClient ? 'Enregistrer les modifications' : 'Ajouter le Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setDeleteConfirmId(null)}
          />

          <div className="relative bg-[#12131C] rounded-2xl p-6 border border-red-500/40 shadow-2xl max-w-md w-full z-10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/50 text-red-400 border border-red-800/50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supprimer ce client ?</h3>
                <p className="text-xs text-slate-400">
                  Cette action retirera le client de votre annuaire. Ses factures historiques resteront conservées.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-[#181926] text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all active:scale-95"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
