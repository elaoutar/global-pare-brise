'use client';

import React, { useState } from 'react';
import { ArticleStock, BonSortie, TypeArticle, DossierSinistre } from '@/types';
import { formatDH, formatDate } from '@/lib/utils';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  PackageMinus, 
  Layers, 
  Printer, 
  ArrowDownLeft,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface Props {
  stock: ArticleStock[];
  bonsSortie: BonSortie[];
  dossiers: DossierSinistre[];
  onAddStock: (article: ArticleStock) => void;
  onUpdateStock: (article: ArticleStock) => void;
  onDeleteStock: (articleId: string) => void;
  onOpenBonSortie: (bonSortie: BonSortie, dossier: DossierSinistre) => void;
}

export const StockView: React.FC<Props> = ({
  stock,
  bonsSortie,
  dossiers,
  onAddStock,
  onUpdateStock,
  onDeleteStock,
  onOpenBonSortie,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'STOCK' | 'BONS_SORTIE'>('STOCK');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleStock | null>(null);

  // Form state
  const [newRef, setNewRef] = useState('');
  const [newEurocode, setNewEurocode] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newType, setNewType] = useState<TypeArticle>('PARE_BRISE');
  const [newQte, setNewQte] = useState(5);
  const [newSeuil, setNewSeuil] = useState(2);
  const [newAchatHT, setNewAchatHT] = useState(800);
  const [newVenteHT, setNewVenteHT] = useState(1500);

  // Delete Confirmation
  const [articleToDelete, setArticleToDelete] = useState<ArticleStock | null>(null);

  const openAddModal = () => {
    setEditingArticle(null);
    setNewRef(`PB-2026-${Math.floor(100 + Math.random() * 900)}`);
    setNewEurocode('');
    setNewDesignation('');
    setNewType('PARE_BRISE');
    setNewQte(5);
    setNewSeuil(2);
    setNewAchatHT(800);
    setNewVenteHT(1500);
    setShowModal(true);
  };

  const openEditModal = (art: ArticleStock) => {
    setEditingArticle(art);
    setNewRef(art.reference);
    setNewEurocode(art.codeEurocode || '');
    setNewDesignation(art.designation);
    setNewType(art.type);
    setNewQte(art.quantiteEnStock);
    setNewSeuil(art.stockMinimumAlerte);
    setNewAchatHT(art.prixAchatHT);
    setNewVenteHT(art.prixVenteHT);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesignation.trim()) return;

    if (editingArticle) {
      onUpdateStock({
        ...editingArticle,
        reference: newRef || editingArticle.reference,
        codeEurocode: newEurocode || undefined,
        designation: newDesignation,
        type: newType,
        quantiteEnStock: Number(newQte) || 0,
        stockMinimumAlerte: Number(newSeuil) || 0,
        prixAchatHT: Number(newAchatHT) || 0,
        prixVenteHT: Number(newVenteHT) || 0,
      });
    } else {
      const created: ArticleStock = {
        id: `art-${Date.now()}`,
        reference: newRef || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        codeEurocode: newEurocode || undefined,
        designation: newDesignation,
        type: newType,
        quantiteEnStock: Number(newQte) || 0,
        stockMinimumAlerte: Number(newSeuil) || 0,
        prixAchatHT: Number(newAchatHT) || 0,
        prixVenteHT: Number(newVenteHT) || 0,
      };
      onAddStock(created);
    }

    setShowModal(false);
  };

  const confirmDelete = () => {
    if (articleToDelete) {
      onDeleteStock(articleToDelete.id);
      setArticleToDelete(null);
    }
  };

  const filteredStock = stock.filter((art) => {
    const matchSearch =
      art.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (art.codeEurocode && art.codeEurocode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = filterType === 'ALL' || art.type === filterType;
    return matchSearch && matchType;
  });

  const totalValeurStock = stock.reduce((acc, a) => acc + a.quantiteEnStock * a.prixAchatHT, 0);
  const totalArticlesStock = stock.reduce((acc, a) => acc + a.quantiteEnStock, 0);
  const totalAlertes = stock.filter((a) => a.quantiteEnStock <= a.stockMinimumAlerte).length;

  return (
    <div className="space-y-6">
      {/* Sub tabs: Stock vs Bons de sortie */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('STOCK')}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-all ${
              activeSubTab === 'STOCK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-brand-600" />
            Articles & Vitrage ({stock.length})
          </button>
          <button
            onClick={() => setActiveSubTab('BONS_SORTIE')}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-all ${
              activeSubTab === 'BONS_SORTIE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageMinus className="w-4 h-4 text-amber-600" />
            Bons de Sortie Atelier ({bonsSortie.length})
          </button>
        </div>

        {activeSubTab === 'STOCK' && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nouvel Article / Vitrage
          </button>
        )}
      </div>

      {/* VIEW 1 : ARTICLES STOCK */}
      {activeSubTab === 'STOCK' && (
        <div className="space-y-5">
          {/* Stock Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Valeur Totale Stock (Achat)</p>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{formatDH(totalValeurStock)}</p>
              </div>
              <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Unités Physiques</p>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalArticlesStock} vitrages / pièces</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Alertes Rupture / Min</p>
                <p className="text-xl font-black text-rose-600 font-mono mt-0.5">{totalAlertes} référence(s)</p>
              </div>
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher référence, eurocode, marque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">Tous les types de vitrages</option>
                <option value="PARE_BRISE">Pare-brise</option>
                <option value="LUNETTE_AR">Lunette arrière</option>
                <option value="VITRE_LATERALE">Vitre latérale</option>
                <option value="COLLE">Colles & Mastiques</option>
                <option value="ACCESSOIRE">Accessoires & Joints</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">Référence & Eurocode</th>
                    <th className="py-3 px-4">Désignation</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-center">Stock Actuel</th>
                    <th className="py-3 px-4 text-right">P. Achat TTC</th>
                    <th className="py-3 px-4 text-right">P. Vente TTC</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Aucun article ne correspond à votre recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((art) => {
                      const isAlerte = art.quantiteEnStock <= art.stockMinimumAlerte;
                      return (
                        <tr key={art.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-800">{art.reference}</span>
                            {art.codeEurocode && (
                              <span className="block text-[11px] font-mono text-brand-600">
                                Eurocode: {art.codeEurocode}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">{art.designation}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              {art.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-sm font-mono">
                            {art.quantiteEnStock}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">{formatDH(art.prixAchatHT)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatDH(art.prixVenteHT)}</td>
                          <td className="py-3 px-4 text-center">
                            {isAlerte ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Stock Bas (Min: {art.stockMinimumAlerte})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> En Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(art)}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                title="Modifier l'article"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setArticleToDelete(art)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Supprimer du stock"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* VIEW 2 : BONS DE SORTIE */}
      {activeSubTab === 'BONS_SORTIE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Historique des Bons de Sortie Délivrés à l'Atelier
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {bonsSortie.map((bs) => {
              const matchedDossier = dossiers.find((d) => d.id === bs.dossierId) || dossiers[0];
              return (
                <div key={bs.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {bs.numeroBS}
                      </span>
                      <span className="text-xs text-slate-500">• Délivré le {formatDate(bs.dateSortie)}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Affecté au dossier : <strong>{matchedDossier.numeroDossier}</strong> ({matchedDossier.vehicule.marque} {matchedDossier.vehicule.modele} - {matchedDossier.vehicule.immatriculation})
                    </p>
                    <p className="text-[11px] text-slate-500">Poseur : {bs.poseur}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-900">{bs.lignes.length} article(s)</span>
                      <p className="text-[11px] text-slate-500">{bs.lignes.map((l) => l.designation).join(', ').slice(0, 45)}...</p>
                    </div>

                    <button
                      onClick={() => onOpenBonSortie(bs, matchedDossier)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold transition-colors border border-amber-200"
                    >
                      <Printer className="w-3.5 h-3.5" /> Voir / Imprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Add / Edit Stock Article */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-400" />
                {editingArticle ? "Modifier l'Article de Stock" : "Ajouter un Nouvel Article / Vitrage"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Référence Interne *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PB-DAC-001"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code Eurocode (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: 7288AGS"
                    value={newEurocode}
                    onChange={(e) => setNewEurocode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Désignation complète *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pare-Brise acoustique et capteur - Dacia Sandero Stepway"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TypeArticle)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="PARE_BRISE">Pare-brise</option>
                    <option value="LUNETTE_AR">Lunette AR</option>
                    <option value="VITRE_LATERALE">Vitre latérale</option>
                    <option value="COLLE">Colle / Mastic</option>
                    <option value="ACCESSOIRE">Accessoire</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantité En Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newQte}
                    onChange={(e) => setNewQte(+e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seuil Alerte Min</label>
                  <input
                    type="number"
                    min="1"
                    value={newSeuil}
                    onChange={(e) => setNewSeuil(+e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prix Achat TTC (DH)</label>
                  <input
                    type="number"
                    min="0"
                    value={newAchatHT}
                    onChange={(e) => setNewAchatHT(+e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prix Vente TTC (DH)</label>
                  <input
                    type="number"
                    min="0"
                    value={newVenteHT}
                    onChange={(e) => setNewVenteHT(+e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-brand-700 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {editingArticle ? 'Enregistrer les Modifications' : 'Enregistrer en Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Supprimer cet article ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer <strong>{articleToDelete.designation}</strong> ({articleToDelete.reference}) ?
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
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
