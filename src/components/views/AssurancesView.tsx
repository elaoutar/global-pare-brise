'use client';

import React, { useState } from 'react';
import { Assurance, DossierSinistre, Facture } from '@/types';
import { formatDH, formatDate } from '@/lib/utils';
import { GARAGE_INFO } from '@/lib/data';
import { 
  Shield, 
  Clock, 
  Printer, 
  FileSpreadsheet, 
  X, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface Props {
  assurances: Assurance[];
  dossiers: DossierSinistre[];
  factures: Facture[];
  onAddAssurance: (assurance: Assurance) => void;
  onUpdateAssurance: (assurance: Assurance) => void;
  onDeleteAssurance: (assuranceId: string) => void;
}

export const AssurancesView: React.FC<Props> = ({
  assurances,
  dossiers,
  factures,
  onAddAssurance,
  onUpdateAssurance,
  onDeleteAssurance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssuranceForBordereau, setSelectedAssuranceForBordereau] = useState<Assurance | null>(null);

  // Modal Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingAssurance, setEditingAssurance] = useState<Assurance | null>(null);

  // Form Fields
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [delai, setDelai] = useState<number>(30);

  // Confirmation Delete Modal
  const [assuranceToDelete, setAssuranceToDelete] = useState<Assurance | null>(null);

  const openAddModal = () => {
    setEditingAssurance(null);
    setNom('');
    setCode('');
    setTelephone('');
    setEmail('');
    setAdresse('Marrakech, Maroc');
    setDelai(30);
    setShowModal(true);
  };

  const openEditModal = (ass: Assurance) => {
    setEditingAssurance(ass);
    setNom(ass.nom);
    setCode(ass.code);
    setTelephone(ass.telephone);
    setEmail(ass.email);
    setAdresse(ass.adresse);
    setDelai(ass.delaiReglementMoyenJours);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    if (editingAssurance) {
      onUpdateAssurance({
        ...editingAssurance,
        nom,
        code: code || nom.slice(0, 4).toUpperCase(),
        telephone,
        email,
        adresse,
        delaiReglementMoyenJours: Number(delai) || 30,
      });
    } else {
      const newAss: Assurance = {
        id: `ass-${Date.now()}`,
        nom,
        code: code || nom.slice(0, 4).toUpperCase(),
        telephone,
        email,
        adresse,
        delaiReglementMoyenJours: Number(delai) || 30,
      };
      onAddAssurance(newAss);
    }

    setShowModal(false);
  };

  const confirmDelete = () => {
    if (assuranceToDelete) {
      onDeleteAssurance(assuranceToDelete.id);
      setAssuranceToDelete(null);
    }
  };

  // Filtered assurances
  const filteredAssurances = assurances.filter((ass) => {
    const term = searchTerm.toLowerCase();
    return (
      ass.nom.toLowerCase().includes(term) ||
      ass.code.toLowerCase().includes(term) ||
      ass.adresse.toLowerCase().includes(term) ||
      ass.telephone.toLowerCase().includes(term)
    );
  });

  // Group stats per insurance
  const statsAssurances = filteredAssurances.map((ass) => {
    const dossiersAss = dossiers.filter((d) => d.typeDossier === 'ASSURANCE' && d.assurance?.id === ass.id);
    const dossiersDeposes = dossiersAss.filter((d) => d.statut === 'DEPOSE_ASSURANCE');
    const dossiersRegles = dossiersAss.filter((d) => d.statut === 'VALIDE_REGLE');

    const totalFacture = dossiersAss.reduce((acc, d) => acc + d.montantPriseEnChargeAssurance, 0);
    const totalRegle = dossiersRegles.reduce((acc, d) => acc + d.montantPriseEnChargeAssurance, 0);
    const resteEnAttente = Math.max(0, totalFacture - totalRegle);

    return {
      assurance: ass,
      totalDossiers: dossiersAss.length,
      dossiersDeposes: dossiersDeposes.length,
      dossiersRegles: dossiersRegles.length,
      totalFacture,
      totalRegle,
      resteEnAttente,
      dossiersList: dossiersAss,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            Compagnies d'Assurance & Conventions Tiers-Payant
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez les conventions d'assurances partenaires, les délais de règlement et éditez les bordereaux de transmission
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher assurance..."
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
            Nouvelle Assurance
          </button>
        </div>
      </div>

      {/* Grid of Insurance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statsAssurances.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200">
            Aucune compagnie d'assurance ne correspond à votre recherche.
          </div>
        ) : (
          statsAssurances.map(({ assurance, totalDossiers, dossiersDeposes, totalFacture, totalRegle, resteEnAttente }) => (
            <div
              key={assurance.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{assurance.nom}</h3>
                      <p className="text-[11px] text-slate-400">Code : <span className="font-mono font-bold text-slate-600">{assurance.code}</span> • Délai : {assurance.delaiReglementMoyenJours}j</p>
                    </div>
                  </div>

                  {/* Edit / Delete quick buttons */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                    <button
                      onClick={() => openEditModal(assurance)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Modifier les coordonnées"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAssuranceToDelete(assurance)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer la compagnie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact info */}
                <div className="my-3 space-y-1 text-slate-500 text-[11px]">
                  <p className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" /> {assurance.telephone || 'Non renseigné'}
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" /> {assurance.email || 'Non renseigné'}
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" /> {assurance.adresse || 'Marrakech'}
                  </p>
                </div>

                {/* Balances */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Facturé :</span>
                    <span className="font-mono font-semibold text-slate-900">{formatDH(totalFacture)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Règlements reçus :</span>
                    <span className="font-mono font-semibold">{formatDH(totalRegle)}</span>
                  </div>
                  <div className="flex justify-between text-brand-800 font-bold pt-1.5 border-t border-slate-200">
                    <span>En attente virement :</span>
                    <span className="font-mono text-sm">{formatDH(resteEnAttente)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  <strong>{totalDossiers}</strong> dossier(s) ({dossiersDeposes} en cours)
                </span>
                <button
                  onClick={() => setSelectedAssuranceForBordereau(assurance)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Bordereau
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Assurance */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                {editingAssurance ? "Modifier la Compagnie d'Assurance" : "Ajouter une Nouvelle Assurance"}
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
                  <label className="block font-semibold text-slate-700 mb-1">Nom de la Compagnie *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Wafa Assurance, Sanlam, AXA..."
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code / Abréviation</label>
                  <input
                    type="text"
                    placeholder="Ex: WAFA, AXA"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono uppercase focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Délai Moyen Règlement (Jours)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={delai}
                    onChange={(e) => setDelai(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone Sinistres / Agence</label>
                  <input
                    type="text"
                    placeholder="Ex: 05 24 30 75 00"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Prise en Charge</label>
                  <input
                    type="email"
                    placeholder="sinistre@compagnie.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Adresse Siège / Agence Régionale</label>
                  <input
                    type="text"
                    placeholder="Ex: Boulevard Mohamed V, Marrakech"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
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
                  {editingAssurance ? 'Enregistrer les Modifications' : 'Créer l\'Assurance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {assuranceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Supprimer cette assurance ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer <strong>{assuranceToDelete.nom}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setAssuranceToDelete(null)}
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

      {/* Bordereau Modal (Printable) */}
      {selectedAssuranceForBordereau && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="no-print sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-md backdrop-blur-md">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-brand-600 rounded-lg shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">Bordereau d'Envoi des Dossiers Sinistres</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Compagnie : {selectedAssuranceForBordereau.nom}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Imprimer</span>
                </button>
                <button
                  onClick={() => setSelectedAssuranceForBordereau(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 md:p-12 text-slate-800 text-xs leading-relaxed print-page bg-white">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold uppercase">{GARAGE_INFO.nom}</h1>
                  <p className="text-[11px] text-slate-500">{GARAGE_INFO.adresse}</p>
                  <p className="text-[11px] text-slate-500">ICE : {GARAGE_INFO.ice} | IF : {GARAGE_INFO.ifiscal}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm uppercase text-brand-900">BORDEREAU DE TRANSMISSION</p>
                  <p className="text-slate-600">Destinataire : <strong>{selectedAssuranceForBordereau.nom}</strong></p>
                  <p className="text-slate-600">Date : {formatDate(new Date().toISOString())}</p>
                </div>
              </div>

              <p className="mb-4 text-slate-700">
                Nous vous prions de bien vouloir trouver ci-dessous la liste des dossiers de bris de glace clôturés par notre centre avec factures et quittances subrogatives correspondantes :
              </p>

              <table className="w-full text-left border border-slate-300 rounded mb-6 text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="p-2">N° Sinistre</th>
                    <th className="p-2">N° Police</th>
                    <th className="p-2">Assuré / Client</th>
                    <th className="p-2">Véhicule (Matricule)</th>
                    <th className="p-2">Réf Facture</th>
                    <th className="p-2 text-right">Montant Prise en Charge (TTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dossiers
                    .filter((d) => d.typeDossier === 'ASSURANCE' && d.assurance?.id === selectedAssuranceForBordereau.id)
                    .map((d, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono font-semibold">{d.numeroSinistre || '-'}</td>
                        <td className="p-2 font-mono">{d.numeroPolice || '-'}</td>
                        <td className="p-2">{d.client.nom}</td>
                        <td className="p-2">{d.vehicule.marque} ({d.vehicule.immatriculation})</td>
                        <td className="p-2 font-mono">{d.factureAssuranceId ? 'FA-2026-...' : '-'}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatDH(d.montantPriseEnChargeAssurance)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 mt-12 pt-4 border-t border-slate-300">
                <div className="text-center">
                  <p className="font-bold uppercase">Émetteur ({GARAGE_INFO.nom})</p>
                  <p className="text-[10px] text-slate-400 mt-1">Signature & Cachet</p>
                  <div className="h-20 border border-dashed border-slate-300 rounded mt-2"></div>
                </div>
                <div className="text-center">
                  <p className="font-bold uppercase">Accusé de Réception Compagnie ({selectedAssuranceForBordereau.nom})</p>
                  <p className="text-[10px] text-slate-400 mt-1">Date, Nom & Cachet de réception</p>
                  <div className="h-20 border border-dashed border-slate-300 rounded mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
