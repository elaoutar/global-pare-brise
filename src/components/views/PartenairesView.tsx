'use client';

import React, { useState } from 'react';
import { Partenaire, DossierSinistre } from '@/types';
import { formatDH } from '@/lib/utils';
import { 
  Users, 
  Briefcase, 
  Phone, 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  Check, 
  AlertCircle,
  Percent
} from 'lucide-react';

interface Props {
  partenaires: Partenaire[];
  dossiers: DossierSinistre[];
  onAddPartenaire: (partenaire: Partenaire) => void;
  onUpdatePartenaire: (partenaire: Partenaire) => void;
  onDeletePartenaire: (partenaireId: string) => void;
}

export const PartenairesView: React.FC<Props> = ({ 
  partenaires, 
  dossiers,
  onAddPartenaire,
  onUpdatePartenaire,
  onDeletePartenaire
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingPartenaire, setEditingPartenaire] = useState<Partenaire | null>(null);

  // Form Fields
  const [nom, setNom] = useState('');
  const [type, setType] = useState<Partenaire['type']>('COURTIER');
  const [telephone, setTelephone] = useState('');
  const [ville, setVille] = useState('Marrakech');
  const [tauxCommission, setTauxCommission] = useState<number>(8);

  // Delete Confirmation
  const [partenaireToDelete, setPartenaireToDelete] = useState<Partenaire | null>(null);

  const openAddModal = () => {
    setEditingPartenaire(null);
    setNom('');
    setType('COURTIER');
    setTelephone('');
    setVille('Marrakech');
    setTauxCommission(8);
    setShowModal(true);
  };

  const openEditModal = (part: Partenaire) => {
    setEditingPartenaire(part);
    setNom(part.nom);
    setType(part.type);
    setTelephone(part.telephone);
    setVille(part.ville);
    setTauxCommission(part.tauxCommissionPourcent);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    if (editingPartenaire) {
      onUpdatePartenaire({
        ...editingPartenaire,
        nom,
        type,
        telephone,
        ville,
        tauxCommissionPourcent: Number(tauxCommission) || 0,
      });
    } else {
      const newPart: Partenaire = {
        id: `part-${Date.now()}`,
        nom,
        type,
        telephone,
        ville,
        tauxCommissionPourcent: Number(tauxCommission) || 0,
      };
      onAddPartenaire(newPart);
    }

    setShowModal(false);
  };

  const confirmDelete = () => {
    if (partenaireToDelete) {
      onDeletePartenaire(partenaireToDelete.id);
      setPartenaireToDelete(null);
    }
  };

  // Filtered list
  const filteredPartenaires = partenaires.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.nom.toLowerCase().includes(term) ||
      p.telephone.toLowerCase().includes(term) ||
      p.ville.toLowerCase().includes(term);

    const matchType = filterType === 'ALL' || p.type === filterType;

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Partenaires & Apporteurs d'Affaires
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des cabinets de courtage d'assurance, carrossiers, dépanneurs et agences de location
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher partenaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="ALL">Tous les types</option>
              <option value="COURTIER">Cabinets Courtage</option>
              <option value="CARROSSIER">Carrossiers</option>
              <option value="DEPANNEUR">Dépanneurs / Remorquage</option>
              <option value="AGENCE_LOCATION">Agences Location</option>
            </select>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nouveau Partenaire
          </button>
        </div>
      </div>

      {/* Grid of Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPartenaires.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200">
            Aucun partenaire ne correspond à votre recherche.
          </div>
        ) : (
          filteredPartenaires.map((partenaire) => {
            const dossiersPartenaire = dossiers.filter((d) => d.partenaire?.id === partenaire.id);
            const caGenere = dossiersPartenaire.reduce((acc, d) => acc + d.montantTotalTTC, 0);
            const commissionEstimee = (caGenere * partenaire.tauxCommissionPourcent) / 100;

            return (
              <div
                key={partenaire.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                        {partenaire.type.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1.5">{partenaire.nom}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {partenaire.telephone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {partenaire.ville}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-400">Commission</span>
                        <p className="text-base font-black text-brand-600 font-mono">{partenaire.tauxCommissionPourcent}%</p>
                      </div>

                      {/* Edit & Delete actions */}
                      <div className="flex items-center gap-1 pt-1 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => openEditModal(partenaire)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Modifier le partenaire"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPartenaireToDelete(partenaire)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer le partenaire"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Box */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-center mt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Dossiers</span>
                      <p className="font-black text-slate-900 text-sm mt-0.5">{dossiersPartenaire.length}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">CA Généré</span>
                      <p className="font-bold text-slate-900 font-mono mt-0.5">{formatDH(caGenere)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Commissions</span>
                      <p className="font-bold text-emerald-700 font-mono mt-0.5">{formatDH(commissionEstimee)}</p>
                    </div>
                  </div>
                </div>

                {/* Dossiers list preview */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Derniers dossiers apportés :
                  </p>
                  {dossiersPartenaire.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Aucun dossier apporté pour le moment.</p>
                  ) : (
                    <div className="space-y-1">
                      {dossiersPartenaire.slice(0, 3).map((d) => (
                        <div
                          key={d.id}
                          className="text-xs p-2 bg-slate-50 rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <strong className="text-slate-800">{d.vehicule.marque} {d.vehicule.modele}</strong>
                            <span className="text-slate-500 text-[11px] ml-2 font-mono">({d.vehicule.immatriculation})</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">{formatDH(d.montantTotalTTC)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Partenaire */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                {editingPartenaire ? "Modifier le Partenaire" : "Nouveau Partenaire / Apporteur d'Affaires"}
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
                  <label className="block font-semibold text-slate-700 mb-1">Nom du Partenaire / Agence *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cabinet d'Assurance Al Baraka, Carrosserie Moderne..."
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type d'Apporteur *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Partenaire['type'])}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="COURTIER">Courtier d'Assurance</option>
                    <option value="CARROSSIER">Carrossier Partenaire</option>
                    <option value="DEPANNEUR">Dépanneur / Remorqueur</option>
                    <option value="AGENCE_LOCATION">Agence de Location Voitures</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Taux de Commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={tauxCommission}
                    onChange={(e) => setTauxCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone de Contact</label>
                  <input
                    type="text"
                    placeholder="Ex: 06 61 40 50 60"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    placeholder="Ex: Marrakech"
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
                  {editingPartenaire ? 'Enregistrer les Modifications' : 'Ajouter le Partenaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {partenaireToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Supprimer ce partenaire ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer <strong>{partenaireToDelete.nom}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setPartenaireToDelete(null)}
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
