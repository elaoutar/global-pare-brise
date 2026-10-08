'use client';

import React, { useState } from 'react';
import { 
  Fournisseur, 
  BonCommandeFournisseur, 
  ArticleStock, 
  StatutCommandeFournisseur, 
  StatutPaiementFournisseur, 
  ModePaiement,
  LigneCommandeFournisseur
} from '@/types';
import { 
  formatDH, 
  formatDate, 
  getStatutCommandeFournisseurBadge, 
  getStatutPaiementFournisseurBadge 
} from '@/lib/utils';
import { 
  Truck, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Check, 
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Printer,
  ChevronRight,
  CreditCard,
  PlusCircle,
  Filter,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

interface Props {
  fournisseurs: Fournisseur[];
  commandes: BonCommandeFournisseur[];
  stockArticles?: ArticleStock[];
  onAddFournisseur: (fournisseur: Fournisseur) => void;
  onUpdateFournisseur: (fournisseur: Fournisseur) => void;
  onDeleteFournisseur: (fournisseurId: string) => void;
  onCreateCommande: (commande: BonCommandeFournisseur) => void;
  onUpdateCommande: (commande: BonCommandeFournisseur) => void;
  onOpenCommandeModal: (commande: BonCommandeFournisseur, fournisseur: Fournisseur) => void;
}

export const FournisseursView: React.FC<Props> = ({ 
  fournisseurs,
  commandes,
  stockArticles = [],
  onAddFournisseur,
  onUpdateFournisseur,
  onDeleteFournisseur,
  onCreateCommande,
  onUpdateCommande,
  onOpenCommandeModal
}) => {
  // Navigation tabs within Fournisseurs view
  const [activeTab, setActiveTab] = useState<'ANNUAIRE' | 'COMMANDES'>('COMMANDES');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFournisseurId, setSelectedFournisseurId] = useState<string>('ALL');
  const [filterStatutCommande, setFilterStatutCommande] = useState<string>('ALL');
  const [filterStatutPaiement, setFilterStatutPaiement] = useState<string>('ALL');
  const [filterAgence, setFilterAgence] = useState<string>('ALL');

  // Supplier Add / Edit Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [fournNom, setFournNom] = useState('');
  const [fournIce, setFournIce] = useState('');
  const [fournSpecialite, setFournSpecialite] = useState('');
  const [fournTelephone, setFournTelephone] = useState('');
  const [fournEmail, setFournEmail] = useState('');
  const [fournVille, setFournVille] = useState('Casablanca');
  const [fournisseurToDelete, setFournisseurToDelete] = useState<Fournisseur | null>(null);

  // New Command Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [orderFournisseurId, setOrderFournisseurId] = useState(fournisseurs[0]?.id || '');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderDateLivraison, setOrderDateLivraison] = useState('');
  const [orderAgence, setOrderAgence] = useState<'Marrakech' | 'El Jadida'>('Marrakech');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderStatutCommande, setOrderStatutCommande] = useState<StatutCommandeFournisseur>('ENVOYEE');
  const [orderStatutPaiement, setOrderStatutPaiement] = useState<StatutPaiementFournisseur>('NON_PAYE');
  const [orderMontantPaye, setOrderMontantPaye] = useState<number>(0);
  const [orderModePaiement, setOrderModePaiement] = useState<ModePaiement>('CHEQUE');
  const [orderRefPaiement, setOrderRefPaiement] = useState('');
  const [orderEcheancePaiement, setOrderEcheancePaiement] = useState('');

  // Items lines in order creation (Saisie des articles en TTC)
  const [orderLines, setOrderLines] = useState<
    { id: string; designation: string; reference: string; quantite: number; prixTTC: number }[]
  >([
    { id: '1', designation: 'Pare-Brise Dacia Logan II / Sandero II', reference: '7288AGS', quantite: 5, prixTTC: 780 },
    { id: '2', designation: 'Cartouche Mastic Polyuréthane SikaTack Drive', reference: 'COLLE-SIKA', quantite: 20, prixTTC: 100 }
  ]);

  // Quick item addition (Saisie en TTC)
  const [newItemDesignation, setNewItemDesignation] = useState('');
  const [newItemRef, setNewItemRef] = useState('');
  const [newItemQte, setNewItemQte] = useState(1);
  const [newItemPrixTTC, setNewItemPrixTTC] = useState(600);

  // Modal Update Payment / Reception Status
  const [orderToUpdate, setOrderToUpdate] = useState<BonCommandeFournisseur | null>(null);
  const [updateStatutCommande, setUpdateStatutCommande] = useState<StatutCommandeFournisseur>('ENVOYEE');
  const [updateStatutPaiement, setUpdateStatutPaiement] = useState<StatutPaiementFournisseur>('NON_PAYE');
  const [updateMontantPaye, setUpdateMontantPaye] = useState<number>(0);
  const [updateModePaiement, setUpdateModePaiement] = useState<ModePaiement>('CHEQUE');
  const [updateRefPaiement, setUpdateRefPaiement] = useState('');
  const [updateEcheance, setUpdateEcheance] = useState('');
  const [updateBLFournisseur, setUpdateBLFournisseur] = useState('');
  const [updateFactureFournisseur, setUpdateFactureFournisseur] = useState('');

  // Suppliers actions
  const openAddSupplier = () => {
    setEditingFournisseur(null);
    setFournNom('');
    setFournIce('');
    setFournSpecialite('Pare-brise et vitrage première monte');
    setFournTelephone('');
    setFournEmail('');
    setFournVille('Casablanca');
    setShowSupplierModal(true);
  };

  const openEditSupplier = (fourn: Fournisseur) => {
    setEditingFournisseur(fourn);
    setFournNom(fourn.nom);
    setFournIce(fourn.ice || '');
    setFournSpecialite(fourn.specialite);
    setFournTelephone(fourn.telephone);
    setFournEmail(fourn.email || '');
    setFournVille(fourn.ville);
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fournNom.trim()) return;

    if (editingFournisseur) {
      onUpdateFournisseur({
        ...editingFournisseur,
        nom: fournNom,
        ice: fournIce || undefined,
        specialite: fournSpecialite || 'Vitrage automobile',
        telephone: fournTelephone,
        email: fournEmail || undefined,
        ville: fournVille,
      });
    } else {
      const newFourn: Fournisseur = {
        id: `fourn-${Date.now()}`,
        nom: fournNom,
        ice: fournIce || undefined,
        specialite: fournSpecialite || 'Vitrage automobile',
        telephone: fournTelephone,
        email: fournEmail || undefined,
        ville: fournVille,
      };
      onAddFournisseur(newFourn);
    }
    setShowSupplierModal(false);
  };

  // Add line to order
  const handleAddLine = () => {
    if (!newItemDesignation.trim()) return;
    setOrderLines([
      ...orderLines,
      {
        id: `line-${Date.now()}`,
        designation: newItemDesignation,
        reference: newItemRef,
        quantite: newItemQte,
        prixTTC: newItemPrixTTC
      }
    ]);
    setNewItemDesignation('');
    setNewItemRef('');
    setNewItemQte(1);
    setNewItemPrixTTC(600);
  };

  const handleRemoveLine = (idx: number) => {
    setOrderLines(orderLines.filter((_, i) => i !== idx));
  };

  // Select item from existing stock (Stock prixAchatHT is now treated as TTC)
  const handleSelectFromStock = (artId: string) => {
    const art = stockArticles.find((a) => a.id === artId);
    if (!art) return;
    setNewItemDesignation(art.designation);
    setNewItemRef(art.codeEurocode || art.reference);
    setNewItemPrixTTC(art.prixAchatHT);
  };

  // Computations for new order (Total TTC -> Calcul automatique du HT et TVA 20%)
  const orderTotalTTC = orderLines.reduce((acc, l) => acc + (l.prixTTC * l.quantite), 0);
  const orderTotalHT = +(orderTotalTTC / 1.20).toFixed(2);
  const orderTotalTVA = +(orderTotalTTC - orderTotalHT).toFixed(2);

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderLines.length === 0) {
      alert('Veuillez ajouter au moins un article au bon de commande.');
      return;
    }

    const seq = Math.floor(1000 + Math.random() * 9000);
    const newBC: BonCommandeFournisseur = {
      id: `bc-${Date.now()}`,
      numeroBC: `BC-2026-${seq}`,
      fournisseurId: orderFournisseurId,
      dateCommande: orderDate,
      dateLivraisonPrevue: orderDateLivraison || undefined,
      agenceVille: orderAgence,
      lignes: orderLines.map((l, index) => {
        const lineTotalTTC = l.prixTTC * l.quantite;
        const lineTotalHT = +(lineTotalTTC / 1.20).toFixed(2);
        const puHT = +(l.prixTTC / 1.20).toFixed(2);
        return {
          id: `lbc-${index}-${Date.now()}`,
          designation: l.designation,
          reference: l.reference,
          codeEurocode: l.reference,
          quantite: l.quantite,
          prixUnitaireAchatHT: puHT,
          totalHT: lineTotalHT,
        };
      }),
      totalHT: orderTotalHT,
      tauxTva: 20,
      totalTVA: orderTotalTVA,
      totalTTC: orderTotalTTC,
      statutCommande: orderStatutCommande,
      statutPaiement: orderStatutPaiement,
      montantPaye: orderStatutPaiement === 'PAYE_TOTAL' ? orderTotalTTC : (orderStatutPaiement === 'NON_PAYE' ? 0 : orderMontantPaye),
      modePaiement: orderStatutPaiement !== 'NON_PAYE' ? orderModePaiement : undefined,
      referencePaiement: orderRefPaiement || undefined,
      dateEcheancePaiement: orderEcheancePaiement || undefined,
      notes: orderNotes || undefined,
    };

    onCreateCommande(newBC);
    setShowNewOrderModal(false);
  };

  // Quick update of status / payment
  const openUpdateModal = (cmd: BonCommandeFournisseur) => {
    setOrderToUpdate(cmd);
    setUpdateStatutCommande(cmd.statutCommande);
    setUpdateStatutPaiement(cmd.statutPaiement);
    setUpdateMontantPaye(cmd.montantPaye);
    setUpdateModePaiement(cmd.modePaiement || 'CHEQUE');
    setUpdateRefPaiement(cmd.referencePaiement || '');
    setUpdateEcheance(cmd.dateEcheancePaiement || '');
    setUpdateBLFournisseur(cmd.numeroBLFournisseur || '');
    setUpdateFactureFournisseur(cmd.numeroFactureFournisseur || '');
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToUpdate) return;

    let finalMontantPaye = updateMontantPaye;
    if (updateStatutPaiement === 'PAYE_TOTAL') {
      finalMontantPaye = orderToUpdate.totalTTC;
    } else if (updateStatutPaiement === 'NON_PAYE') {
      finalMontantPaye = 0;
    }

    const updated: BonCommandeFournisseur = {
      ...orderToUpdate,
      statutCommande: updateStatutCommande,
      statutPaiement: updateStatutPaiement,
      montantPaye: finalMontantPaye,
      modePaiement: updateModePaiement,
      referencePaiement: updateRefPaiement || undefined,
      dateEcheancePaiement: updateEcheance || undefined,
      numeroBLFournisseur: updateBLFournisseur || undefined,
      numeroFactureFournisseur: updateFactureFournisseur || undefined,
      dateReceptionReelle: (updateStatutCommande === 'RECUE_CONFORME' && !orderToUpdate.dateReceptionReelle) 
        ? new Date().toISOString().split('T')[0] 
        : orderToUpdate.dateReceptionReelle,
    };

    onUpdateCommande(updated);
    setOrderToUpdate(null);
  };

  // Filtered orders
  const filteredCommandes = commandes.filter((c) => {
    const fourn = fournisseurs.find((f) => f.id === c.fournisseurId);
    const fournNom = fourn?.nom.toLowerCase() || '';
    const term = searchTerm.toLowerCase();

    const matchSearch =
      c.numeroBC.toLowerCase().includes(term) ||
      fournNom.includes(term) ||
      (c.numeroBLFournisseur || '').toLowerCase().includes(term) ||
      (c.referencePaiement || '').toLowerCase().includes(term) ||
      c.lignes.some((l) => l.designation.toLowerCase().includes(term) || (l.reference || '').toLowerCase().includes(term));

    const matchFournisseur = selectedFournisseurId === 'ALL' || c.fournisseurId === selectedFournisseurId;
    const matchStatutCmd = filterStatutCommande === 'ALL' || c.statutCommande === filterStatutCommande;
    const matchStatutPay = filterStatutPaiement === 'ALL' || c.statutPaiement === filterStatutPaiement;
    const matchAg = filterAgence === 'ALL' || (c.agenceVille || 'Marrakech').toLowerCase() === filterAgence.toLowerCase();

    return matchSearch && matchFournisseur && matchStatutCmd && matchStatutPay && matchAg;
  });

  // Global totals for orders
  const totalCommandesTTC = filteredCommandes.reduce((acc, c) => acc + c.totalTTC, 0);
  const totalPayeTTC = filteredCommandes.reduce((acc, c) => acc + c.montantPaye, 0);
  const totalResteAPayer = Math.max(0, totalCommandesTTC - totalPayeTTC);

  // Filtered suppliers
  const filteredFournisseurs = fournisseurs.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      f.nom.toLowerCase().includes(term) ||
      f.specialite.toLowerCase().includes(term) ||
      f.ville.toLowerCase().includes(term) ||
      (f.ice && f.ice.toLowerCase().includes(term)) ||
      f.telephone.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Navigation Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Approvisionnement & Fournisseurs Vitrage
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bons de commande officiels, gestion des réceptions et suivi des paiements (Chèques, Traites, Virements)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Sub tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('COMMANDES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'COMMANDES'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Bons de Commande ({commandes.length})
            </button>
            <button
              onClick={() => setActiveTab('ANNUAIRE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ANNUAIRE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Annuaire Fournisseurs ({fournisseurs.length})
            </button>
          </div>

          {activeTab === 'COMMANDES' ? (
            <button
              onClick={() => {
                setOrderFournisseurId(fournisseurs[0]?.id || '');
                setShowNewOrderModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nouveau Bon de Commande
            </button>
          ) : (
            <button
              onClick={openAddSupplier}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nouveau Fournisseur
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: BONS DE COMMANDE ET SUIVI DES PAIEMENTS   */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'COMMANDES' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Commandé TTC</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">{formatDH(totalCommandesTTC)}</p>
              <p className="text-[11px] text-slate-500 mt-1">{filteredCommandes.length} commande(s) active(s)</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Montant Réglé aux Fournisseurs</span>
              <p className="text-xl font-black text-emerald-700 font-mono mt-1">{formatDH(totalPayeTTC)}</p>
              <p className="text-[11px] text-emerald-600 mt-1">Virements / Chèques encaissés</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Reste à Payer Fournisseurs</span>
              <p className="text-xl font-black text-rose-700 font-mono mt-1">{formatDH(totalResteAPayer)}</p>
              <p className="text-[11px] text-rose-600 mt-1">Dettes en cours & échéances</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Chèques & Traites en attente</span>
              <p className="text-xl font-black text-purple-700 font-mono mt-1">
                {formatDH(
                  filteredCommandes
                    .filter((c) => c.statutPaiement === 'EN_ATTENTE_ECHEANCE')
                    .reduce((acc, c) => acc + c.totalTTC, 0)
                )}
              </p>
              <p className="text-[11px] text-purple-600 mt-1">Échéances futures fournisseurs</p>
            </div>
          </div>

          {/* Filters Bar for Orders */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="N° BC, fournisseur, article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Fournisseur filter */}
              <div className="flex items-center gap-1">
                <select
                  value={selectedFournisseurId}
                  onChange={(e) => setSelectedFournisseurId(e.target.value)}
                  className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">🏢 Tous les fournisseurs</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>

              {/* Agency City filter */}
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterAgence}
                  onChange={(e) => setFilterAgence(e.target.value)}
                  className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">📍 Toutes agences</option>
                  <option value="Marrakech">Marrakech</option>
                  <option value="El Jadida">El Jadida</option>
                </select>
              </div>

              {/* Status Commande */}
              <select
                value={filterStatutCommande}
                onChange={(e) => setFilterStatutCommande(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">📦 Tout état commande</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYEE">Envoyée au Fournisseur</option>
                <option value="RECUE_PARTIELLE">Reçue Partiellement</option>
                <option value="RECUE_CONFORME">Reçue & Conforme</option>
                <option value="ANNULEE">Annulée</option>
              </select>

              {/* Status Paiement */}
              <select
                value={filterStatutPaiement}
                onChange={(e) => setFilterStatutPaiement(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">💳 Tout état paiement</option>
                <option value="NON_PAYE">Non Payé</option>
                <option value="ACOMPTE_VERSE">Acompte Versé</option>
                <option value="EN_ATTENTE_ECHEANCE">Chèque / Traite en attente</option>
                <option value="PAYE_TOTAL">Payé Intégralement</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">N° BC & Date</th>
                    <th className="py-3 px-4">Fournisseur & Agence</th>
                    <th className="py-3 px-4">Articles & Quantité</th>
                    <th className="py-3 px-4 text-right">Total TTC</th>
                    <th className="py-3 px-4 text-center">État Commande</th>
                    <th className="py-3 px-4 text-center">État Règlement</th>
                    <th className="py-3 px-4 text-right">Reste à Payer</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCommandes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        Aucun bon de commande ne correspond aux filtres sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    filteredCommandes.map((cmd) => {
                      const fourn = fournisseurs.find((f) => f.id === cmd.fournisseurId);
                      const badgeCmd = getStatutCommandeFournisseurBadge(cmd.statutCommande);
                      const badgePaiement = getStatutPaiementFournisseurBadge(cmd.statutPaiement);
                      const reste = Math.max(0, cmd.totalTTC - cmd.montantPaye);

                      return (
                        <tr key={cmd.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                              {cmd.numeroBC}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {formatDate(cmd.dateCommande)}
                            </p>
                            {cmd.dateLivraisonPrevue && (
                              <p className="text-[10px] text-slate-400">
                                Livr. prévue : {formatDate(cmd.dateLivraisonPrevue)}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{fourn?.nom || 'Fournisseur Inconnu'}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                <MapPin className="w-2.5 h-2.5 text-brand-600" />
                                {cmd.agenceVille || 'Marrakech'}
                              </span>
                              {cmd.numeroBLFournisseur && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  BL: {cmd.numeroBLFournisseur}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-medium text-slate-800 line-clamp-1">
                              {cmd.lignes.map((l) => `${l.designation} (x${l.quantite})`).join(', ')}
                            </p>
                            <span className="text-[11px] text-slate-500">
                              {cmd.lignes.reduce((acc, l) => acc + l.quantite, 0)} pièce(s) au total
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="font-bold font-mono text-sm text-slate-900">
                              {formatDH(cmd.totalTTC)}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              HT : {formatDH(cmd.totalHT)}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeCmd.bg}`}>
                              {badgeCmd.label}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgePaiement.bg}`}>
                              {badgePaiement.label}
                            </span>
                            {cmd.referencePaiement && (
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[140px] mx-auto">
                                {cmd.referencePaiement}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className={`font-mono font-bold text-xs ${reste > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatDH(reste)}
                            </span>
                            {cmd.montantPaye > 0 && reste > 0 && (
                              <p className="text-[10px] text-emerald-600">
                                Réglé : {formatDH(cmd.montantPaye)}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Open Printable Bon de Commande Modal */}
                              <button
                                onClick={() => fourn && onOpenCommandeModal(cmd, fourn)}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                                title="Voir & Imprimer le Bon de Commande"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Update Status & Payment Modal */}
                              <button
                                onClick={() => openUpdateModal(cmd)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                                title="Mettre à jour l'état de réception ou le paiement"
                              >
                                <CreditCard className="w-3 h-3 text-slate-500" />
                                État
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: ANNUAIRE FOURNISSEURS & DISTRIBUTEURS     */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'ANNUAIRE' && (
        <div className="space-y-6">
          {/* Search box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher fournisseur, ICE, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <button
              onClick={openAddSupplier}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Ajouter un Fournisseur
            </button>
          </div>

          {/* Grid of Supplier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredFournisseurs.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200">
                Aucun fournisseur ne correspond à votre recherche.
              </div>
            ) : (
              filteredFournisseurs.map((fourn) => {
                const commandesFourn = commandes.filter((c) => c.fournisseurId === fourn.id);
                const totalAchete = commandesFourn.reduce((acc, c) => acc + c.totalTTC, 0);
                const totalResteFourn = commandesFourn.reduce((acc, c) => acc + Math.max(0, c.totalTTC - c.montantPaye), 0);

                return (
                  <div
                    key={fourn.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{fourn.nom}</h3>
                            <span className="text-[11px] text-brand-600 font-semibold">{fourn.specialite}</span>
                          </div>
                        </div>

                        {/* Edit & Delete actions */}
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => openEditSupplier(fourn)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Modifier le fournisseur"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setFournisseurToDelete(fourn)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer le fournisseur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 mt-3">
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /> {fourn.telephone || 'Non renseigné'}
                        </p>
                        {fourn.email && (
                          <p className="flex items-center gap-2 truncate">
                            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" /> {fourn.email}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" /> {fourn.ville}
                        </p>
                      </div>

                      {/* Financial summary for supplier */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Commandes</span>
                          <p className="font-bold text-slate-900 mt-0.5">{commandesFourn.length} commande(s)</p>
                          <p className="text-[10px] text-slate-500 font-mono">{formatDH(totalAchete)} TTC</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Reste Dû</span>
                          <p className={`font-black font-mono mt-0.5 ${totalResteFourn > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatDH(totalResteFourn)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {totalResteFourn > 0 ? 'À régler' : 'À jour'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {fourn.ice ? (
                        <p className="text-[11px] font-mono text-slate-500">
                          ICE : <strong>{fourn.ice}</strong>
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-400">ICE non renseigné</span>
                      )}

                      <button
                        onClick={() => {
                          setOrderFournisseurId(fourn.id);
                          setShowNewOrderModal(true);
                        }}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Passer Commande
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NOUVEAU BON DE COMMANDE FOURNISSEUR           */}
      {/* ---------------------------------------------------- */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-400" />
                Créer un Nouveau Bon de Commande Fournisseur
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Order Meta details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fournisseur *</label>
                  <select
                    value={orderFournisseurId}
                    onChange={(e) => setOrderFournisseurId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-900"
                    required
                  >
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom} ({f.ville})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Agence de Réception *</label>
                  <select
                    value={orderAgence}
                    onChange={(e) => setOrderAgence(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  >
                    <option value="Marrakech">📍 Marrakech (Atelier Central)</option>
                    <option value="El Jadida">📍 El Jadida (Agence)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Commande *</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  />
                </div>
              </div>

              {/* Order Lines Builder */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Articles & Vitrages à Commander ({orderLines.length}) :
                  </label>
                  {stockArticles.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Choisir du stock :</span>
                      <select
                        onChange={(e) => handleSelectFromStock(e.target.value)}
                        className="text-[11px] py-1 px-2 border rounded-lg bg-slate-50"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Sélectionner article --</option>
                        {stockArticles.map((art) => (
                          <option key={art.id} value={art.id}>
                            {art.reference} - {art.designation} (Achat: {art.prixAchatHT} DH)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Add Item Row Inputs */}
                <div className="grid grid-cols-12 gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200/60 mb-3 items-end">
                  <div className="col-span-5">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Désignation de l'article *</label>
                    <input
                      type="text"
                      placeholder="Ex: Pare-Brise Renault Clio V avec capteur"
                      value={newItemDesignation}
                      onChange={(e) => setNewItemDesignation(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Réf / Eurocode</label>
                    <input
                      type="text"
                      placeholder="Ex: 7295AGS"
                      value={newItemRef}
                      onChange={(e) => setNewItemRef(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-mono"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Qté</label>
                    <input
                      type="number"
                      min={1}
                      value={newItemQte}
                      onChange={(e) => setNewItemQte(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">P.U Achat TTC</label>
                    <input
                      type="number"
                      min={0}
                      value={newItemPrixTTC}
                      onChange={(e) => setNewItemPrixTTC(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-right font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center shadow-xs"
                      title="Ajouter au bon"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items List Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">Désignation</th>
                        <th className="py-2 px-3">Réf / Eurocode</th>
                        <th className="py-2 px-3 text-center">Qté</th>
                        <th className="py-2 px-3 text-right">P.U Achat TTC</th>
                        <th className="py-2 px-3 text-right">Total TTC</th>
                        <th className="py-2 px-3 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {orderLines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                            Aucun article ajouté. Utilisez le formulaire ci-dessus pour ajouter des articles.
                          </td>
                        </tr>
                      ) : (
                        orderLines.map((line, idx) => (
                          <tr key={line.id || idx}>
                            <td className="py-2 px-3 font-semibold text-slate-800">{line.designation}</td>
                            <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{line.reference || '-'}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-900">{line.quantite}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">{formatDH(line.prixTTC)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatDH(line.prixTTC * line.quantite)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status and Initial Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut Commande</label>
                  <select
                    value={orderStatutCommande}
                    onChange={(e) => setOrderStatutCommande(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  >
                    <option value="ENVOYEE">Envoyée au Fournisseur</option>
                    <option value="BROUILLON">Brouillon interne</option>
                    <option value="RECUE_CONFORME">Reçue & Conforme</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut Paiement Initial</label>
                  <select
                    value={orderStatutPaiement}
                    onChange={(e) => setOrderStatutPaiement(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  >
                    <option value="NON_PAYE">Non Payé (En attente)</option>
                    <option value="ACOMPTE_VERSE">Acompte versé</option>
                    <option value="EN_ATTENTE_ECHEANCE">Chèque / Traite remis</option>
                    <option value="PAYE_TOTAL">Payé Totalement</option>
                  </select>
                </div>

                {orderStatutPaiement !== 'NON_PAYE' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mode de Paiement</label>
                    <select
                      value={orderModePaiement}
                      onChange={(e) => setOrderModePaiement(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                    >
                      <option value="CHEQUE">Chèque bancaire</option>
                      <option value="EFFET">Effet de commerce (Traite)</option>
                      <option value="VIREMENT">Virement bancaire</option>
                      <option value="ESPECES">Espèces</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Details if payment is partial or check/draft */}
              {orderStatutPaiement !== 'NON_PAYE' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                  {orderStatutPaiement === 'ACOMPTE_VERSE' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Montant Acompte Versé (DH) *</label>
                      <input
                        type="number"
                        required
                        value={orderMontantPaye}
                        onChange={(e) => setOrderMontantPaye(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg bg-white font-bold text-amber-900"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Réf Paiement (N° Chèque / Traite / Vir)</label>
                    <input
                      type="text"
                      placeholder="Ex: CHQ N° 0491823"
                      value={orderRefPaiement}
                      onChange={(e) => setOrderRefPaiement(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date d'Échéance (si Chèque/Effet)</label>
                    <input
                      type="date"
                      value={orderEcheancePaiement}
                      onChange={(e) => setOrderEcheancePaiement(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl">
                <div>
                  <p className="text-[11px] text-slate-400">Total Hors Taxes : <strong className="font-mono text-slate-200">{formatDH(orderTotalHT)}</strong></p>
                  <p className="text-[11px] text-slate-400">TVA (20%) : <strong className="font-mono text-slate-200">{formatDH(orderTotalTVA)}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total TTC à Payer</span>
                  <span className="text-xl font-black font-mono text-emerald-400">{formatDH(orderTotalTTC)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                >
                  Valider & Générer le Bon de Commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: MISE À JOUR STATUT COMMANDE & PAIEMENT        */}
      {/* ---------------------------------------------------- */}
      {orderToUpdate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Mettre à jour Commande & Paiement #{orderToUpdate.numeroBC}
              </h3>
              <button
                onClick={() => setOrderToUpdate(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Commande TTC</span>
                  <p className="font-black font-mono text-base text-slate-900">{formatDH(orderToUpdate.totalTTC)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Reste Actuel Dû</span>
                  <p className="font-black font-mono text-base text-rose-600">
                    {formatDH(Math.max(0, orderToUpdate.totalTTC - orderToUpdate.montantPaye))}
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">État de Livraison / Réception *</label>
                <select
                  value={updateStatutCommande}
                  onChange={(e) => setUpdateStatutCommande(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-900"
                >
                  <option value="ENVOYEE">Envoyée au Fournisseur (En transit)</option>
                  <option value="RECUE_PARTIELLE">Reçue Partiellement (Reliquat en attente)</option>
                  <option value="RECUE_CONFORME">Reçue & Conforme (Stock entré)</option>
                  <option value="ANNULEE">Annulée</option>
                  <option value="BROUILLON">Brouillon</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Réf BL Fournisseur</label>
                  <input
                    type="text"
                    placeholder="Ex: BL-SG-88412"
                    value={updateBLFournisseur}
                    onChange={(e) => setUpdateBLFournisseur(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Réf Facture Fournisseur</label>
                  <input
                    type="text"
                    placeholder="Ex: FA-SG-2026/04"
                    value={updateFactureFournisseur}
                    onChange={(e) => setUpdateFactureFournisseur(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <label className="block font-semibold text-slate-700 mb-1">État du Paiement *</label>
                <select
                  value={updateStatutPaiement}
                  onChange={(e) => setUpdateStatutPaiement(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-bold text-slate-900"
                >
                  <option value="NON_PAYE">Non Payé (Aucun règlement versé)</option>
                  <option value="ACOMPTE_VERSE">Acompte Versé (Paiement Partiel)</option>
                  <option value="EN_ATTENTE_ECHEANCE">Chèque / Traite remis (En attente d'échéance)</option>
                  <option value="PAYE_TOTAL">Payé Intégralement (Totalité soldée)</option>
                </select>
              </div>

              {updateStatutPaiement === 'ACOMPTE_VERSE' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant Réglé à ce jour (DH) *</label>
                  <input
                    type="number"
                    required
                    value={updateMontantPaye}
                    onChange={(e) => setUpdateMontantPaye(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg font-bold font-mono text-emerald-800"
                  />
                </div>
              )}

              {updateStatutPaiement !== 'NON_PAYE' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mode de Paiement</label>
                    <select
                      value={updateModePaiement}
                      onChange={(e) => setUpdateModePaiement(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="CHEQUE">Chèque bancaire</option>
                      <option value="EFFET">Effet de commerce (Traite)</option>
                      <option value="VIREMENT">Virement bancaire</option>
                      <option value="ESPECES">Espèces</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Réf Chèque / Traite</label>
                    <input
                      type="text"
                      placeholder="Ex: CHQ N° 098412"
                      value={updateRefPaiement}
                      onChange={(e) => setUpdateRefPaiement(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Date d'Échéance du Paiement</label>
                    <input
                      type="date"
                      value={updateEcheance}
                      onChange={(e) => setUpdateEcheance(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOrderToUpdate(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: AJOUTER / MODIFIER FOURNISSEUR                */}
      {/* ---------------------------------------------------- */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-400" />
                {editingFournisseur ? "Modifier le Fournisseur" : "Ajouter un Nouveau Fournisseur"}
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Raison Sociale / Nom du Fournisseur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Saint-Gobain Sekurit, Pilkington, Sika Maroc..."
                    value={fournNom}
                    onChange={(e) => setFournNom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ICE (15 chiffres)</label>
                  <input
                    type="text"
                    placeholder="000123456000089"
                    value={fournIce}
                    onChange={(e) => setFournIce(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ville du Siège / Dépôt *</label>
                  <input
                    type="text"
                    required
                    value={fournVille}
                    onChange={(e) => setFournVille(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Spécialité / Produits Fournis *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pare-brise athermiques, colles polyuréthane, joints..."
                    value={fournSpecialite}
                    onChange={(e) => setFournSpecialite(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone Commandes *</label>
                  <input
                    type="tel"
                    required
                    placeholder="05 22 00 00 00"
                    value={fournTelephone}
                    onChange={(e) => setFournTelephone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Commandes</label>
                  <input
                    type="email"
                    placeholder="commandes@fournisseur.ma"
                    value={fournEmail}
                    onChange={(e) => setFournEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                >
                  {editingFournisseur ? "Enregistrer les modifications" : "Ajouter le Fournisseur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fournisseurToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4 my-2 sm:my-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Supprimer ce fournisseur ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer <strong>{fournisseurToDelete.nom}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setFournisseurToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteFournisseur(fournisseurToDelete.id);
                  setFournisseurToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
