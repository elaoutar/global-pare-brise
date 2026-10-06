'use client';

import React, { useState } from 'react';
import { Fournisseur } from '@/types';
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
  AlertCircle 
} from 'lucide-react';

interface Props {
  fournisseurs: Fournisseur[];
  onAddFournisseur: (fournisseur: Fournisseur) => void;
  onUpdateFournisseur: (fournisseur: Fournisseur) => void;
  onDeleteFournisseur: (fournisseurId: string) => void;
}

export const FournisseursView: React.FC<Props> = ({ 
  fournisseurs,
  onAddFournisseur,
  onUpdateFournisseur,
  onDeleteFournisseur
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);

  // Form Fields
  const [nom, setNom] = useState('');
  const [ice, setIce] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('Casablanca');

  // Delete Confirmation
  const [fournisseurToDelete, setFournisseurToDelete] = useState<Fournisseur | null>(null);

  const openAddModal = () => {
    setEditingFournisseur(null);
    setNom('');
    setIce('');
    setSpecialite('Pare-brise et vitrage première monte');
    setTelephone('');
    setEmail('');
    setVille('Casablanca');
    setShowModal(true);
  };

  const openEditModal = (fourn: Fournisseur) => {
    setEditingFournisseur(fourn);
    setNom(fourn.nom);
    setIce(fourn.ice || '');
    setSpecialite(fourn.specialite);
    setTelephone(fourn.telephone);
    setEmail(fourn.email || '');
    setVille(fourn.ville);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    if (editingFournisseur) {
      onUpdateFournisseur({
        ...editingFournisseur,
        nom,
        ice: ice || undefined,
        specialite: specialite || 'Vitrage automobile',
        telephone,
        email: email || undefined,
        ville,
      });
    } else {
      const newFourn: Fournisseur = {
        id: `fourn-${Date.now()}`,
        nom,
        ice: ice || undefined,
        specialite: specialite || 'Vitrage automobile',
        telephone,
        email: email || undefined,
        ville,
      };
      onAddFournisseur(newFourn);
    }

    setShowModal(false);
  };

  const confirmDelete = () => {
    if (fournisseurToDelete) {
      onDeleteFournisseur(fournisseurToDelete.id);
      setFournisseurToDelete(null);
    }
  };

  // Filtered list
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
      {/* Top action bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-600" />
            Fournisseurs & Distributeurs de Vitrage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fabricants première monte, distributeurs de pare-brise, colles polyuréthane, joints et outillage atelier
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher fournisseur, ICE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nouveau Fournisseur
          </button>
        </div>
      </div>

      {/* Grid of Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredFournisseurs.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200">
            Aucun fournisseur ne correspond à votre recherche.
          </div>
        ) : (
          filteredFournisseurs.map((fourn) => (
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
                      onClick={() => openEditModal(fourn)}
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
              </div>

              {fourn.ice && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    ICE : <strong>{fourn.ice}</strong>
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Fournisseur */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-400" />
                {editingFournisseur ? "Modifier le Fournisseur" : "Ajouter un Nouveau Fournisseur"}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Raison Sociale / Nom du Fournisseur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Saint-Gobain Sekurit, Pilkington, Sika Maroc..."
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Identifiant Commun (ICE)</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="15 chiffres (ex: 001569483000078)"
                    value={ice}
                    onChange={(e) => setIce(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Spécialité / Produits *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vitrages, Colles PU, Outillage"
                    value={specialite}
                    onChange={(e) => setSpecialite(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone Commandes</label>
                  <input
                    type="text"
                    placeholder="Ex: 05 22 66 12 00"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Commandes</label>
                  <input
                    type="email"
                    placeholder="commandes@fournisseur.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Ville / Emplacement Dépôt</label>
                  <input
                    type="text"
                    placeholder="Ex: Marrakech, Casablanca, Tanger..."
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {editingFournisseur ? 'Enregistrer les Modifications' : 'Ajouter le Fournisseur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fournisseurToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
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
