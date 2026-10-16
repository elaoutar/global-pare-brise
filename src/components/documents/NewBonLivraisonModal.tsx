'use client';

import React, { useState, useEffect } from 'react';
import { BonLivraison, BonLivraisonLigne, ArticleStock, Partenaire, DossierSinistre } from '@/types';
import { formatDH } from '@/lib/utils';
import { Truck, Plus, Trash2, X, Package, Layers, Car, Building2, User } from 'lucide-react';

interface Props {
  stockArticles?: ArticleStock[];
  partenaires?: Partenaire[];
  dossiers?: DossierSinistre[];
  onClose: () => void;
  onSubmit: (newBL: BonLivraison) => void;
}

export const NewBonLivraisonModal: React.FC<Props> = ({
  stockArticles = [],
  partenaires = [],
  dossiers = [],
  onClose,
  onSubmit,
}) => {
  // Fermeture par touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Mode de livraison : Multi-véhicules / sans matricule par défaut !
  const [isMultiVehicules, setIsMultiVehicules] = useState(true);

  // Client
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientCin, setClientCin] = useState('');
  const [clientVille, setClientVille] = useState('Marrakech');
  const [clientAdresse, setClientAdresse] = useState('');

  // Véhicule (si mode véhicule spécifique)
  const [vehiculeMarque, setVehiculeMarque] = useState('');
  const [vehiculeModele, setVehiculeModele] = useState('');
  const [vehiculeImmatriculation, setVehiculeImmatriculation] = useState('');

  // Détails livraison
  const [dateLivraison, setDateLivraison] = useState(new Date().toISOString().split('T')[0]);
  const [livreurPoseur, setLivreurPoseur] = useState('Équipe Atelier');
  const [observations, setObservations] = useState('Fournitures et vitrages livrés en parfait état de conformité.');

  // Lignes d'articles / vitrages livrés
  const [lignes, setLignes] = useState<
    { id: string; designation: string; reference: string; quantite: number; prixTTC: number }[]
  >([
    {
      id: 'l-1',
      designation: 'Pare-Brise Dacia Logan II / Sandero II',
      reference: '7288AGS',
      quantite: 1,
      prixTTC: 900,
    },
    {
      id: 'l-2',
      designation: 'Pare-Brise Renault Clio IV (Capteur)',
      reference: '7285AGS',
      quantite: 1,
      prixTTC: 1100,
    },
  ]);

  // Article rapide depuis le stock
  const [selectedStockId, setSelectedStockId] = useState('');

  const handleAddFromStock = () => {
    if (!selectedStockId) return;
    const art = stockArticles.find((s) => s.id === selectedStockId);
    if (!art) return;

    setLignes([
      ...lignes,
      {
        id: `l-${Date.now()}`,
        designation: art.designation,
        reference: art.codeEurocode || art.reference,
        quantite: 1,
        prixTTC: +(art.prixVenteHT * 1.20).toFixed(2),
      },
    ]);
    setSelectedStockId('');
  };

  const handleAddCustomLine = () => {
    setLignes([
      ...lignes,
      {
        id: `l-${Date.now()}`,
        designation: '',
        reference: '',
        quantite: 1,
        prixTTC: 0,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lignes.length <= 1) {
      alert('Le bon de livraison doit comporter au moins un article.');
      return;
    }
    setLignes(lignes.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (idx: number, field: string, val: any) => {
    setLignes(
      lignes.map((l, i) => {
        if (i === idx) {
          return { ...l, [field]: val };
        }
        return l;
      })
    );
  };

  // Remplissage rapide si choix partenaire
  const handleSelectPartenaire = (partId: string) => {
    const part = partenaires.find((p) => p.id === partId);
    if (part) {
      setClientNom(part.nom);
      setClientTelephone(part.telephone || '');
      setClientVille(part.ville || 'Marrakech');
    }
  };

  // Totaux calculés
  const totalArticles = lignes.reduce((acc, l) => acc + (Number(l.quantite) || 0), 0);
  const totalTTC = +lignes.reduce((acc, l) => acc + ((Number(l.prixTTC) || 0) * (Number(l.quantite) || 0)), 0).toFixed(2);
  const totalHT = +(totalTTC / 1.20).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientNom.trim()) {
      alert('Veuillez renseigner le nom du client ou de la société.');
      return;
    }

    if (lignes.length === 0 || lignes.some((l) => !l.designation.trim())) {
      alert('Veuillez renseigner la désignation de tous les articles.');
      return;
    }

    const seq = Math.floor(1000 + Math.random() * 9000);
    const newBL: BonLivraison = {
      id: `bl-direct-${Date.now()}`,
      numeroBL: `BL-2026-${seq}`,
      clientNom: clientNom.trim(),
      clientTelephone: clientTelephone.trim() || undefined,
      clientCin: clientCin.trim() || undefined,
      clientVille: clientVille.trim() || 'Marrakech',
      clientAdresse: clientAdresse.trim() || undefined,
      receptionnaireNom: clientNom.trim(),
      receptionnaireCin: clientCin.trim() || undefined,
      isMultiVehicules: isMultiVehicules,
      vehiculeInfo: !isMultiVehicules && vehiculeMarque ? `${vehiculeMarque} ${vehiculeModele}`.trim() : undefined,
      immatriculation: !isMultiVehicules && vehiculeImmatriculation ? vehiculeImmatriculation.trim() : undefined,
      dateLivraison: dateLivraison || new Date().toISOString().split('T')[0],
      livreurPoseur: livreurPoseur.trim() || 'Équipe Atelier',
      lignes: lignes.map((l) => {
        const lineTotalTTC = +(Number(l.prixTTC) * Number(l.quantite)).toFixed(2);
        const lineTotalHT = +(lineTotalTTC / 1.20).toFixed(2);
        const puHT = +(Number(l.prixTTC) / 1.20).toFixed(2);
        return {
          designation: l.designation.trim(),
          codeEurocode: l.reference.trim() || undefined,
          quantite: Number(l.quantite) || 1,
          prixUnitaireTTC: Number(l.prixTTC) || 0,
          prixUnitaireHT: puHT,
          totalHT: lineTotalHT,
          totalTTC: lineTotalTTC,
        };
      }),
      totalHT: totalHT,
      totalTTC: totalTTC,
      observations: observations.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    onSubmit(newBL);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Créer un Bon de Livraison (Multi-Vitrages & Pièces)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Livraison de plusieurs pare-brises pour un client sans forcer un seul matricule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs">
          
          {/* Mode de Livraison Toggle */}
          <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl">
            <label className="block font-bold text-indigo-950 uppercase text-[11px] mb-2 tracking-wide">
              Type de Bon de Livraison :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  isMultiVehicules 
                    ? 'bg-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20' 
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="typeBL"
                  checked={isMultiVehicules}
                  onChange={() => setIsMultiVehicules(true)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Multi-Vitrages (Sans matricule unique)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Idéal pour livrer plusieurs pare-brises de différentes voitures pour le même client.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  !isMultiVehicules 
                    ? 'bg-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20' 
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="typeBL"
                  checked={!isMultiVehicules}
                  onChange={() => setIsMultiVehicules(false)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-indigo-600" />
                    Véhicule Spécifique (Avec matricule)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Mentionne une marque, un modèle et un numéro d'immatriculation précis.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 1 : Client / Destinataire */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" /> Coordonnées du Client / Réceptionnaire
              </span>
              {partenaires.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Choisir partenaire :</span>
                  <select
                    onChange={(e) => handleSelectPartenaire(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-medium"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Partenaire / Garage --</option>
                    {partenaires.map((p) => (
                      <option key={p.id} value={p.id}>{p.nom} ({p.ville})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nom du Client / Société *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Société Al Massira Transport / Garage Moderne"
                  value={clientNom}
                  onChange={(e) => setClientNom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  placeholder="Ex: 06 61 23 45 67"
                  value={clientTelephone}
                  onChange={(e) => setClientTelephone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CIN / ICE (Entreprise)</label>
                <input
                  type="text"
                  placeholder="Ex: EE123456 ou ICE 001234..."
                  value={clientCin}
                  onChange={(e) => setClientCin(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={clientVille}
                  onChange={(e) => setClientVille(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Zone Industrielle Sidi Ghanem"
                  value={clientAdresse}
                  onChange={(e) => setClientAdresse(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                />
              </div>
            </div>

            {/* Champs optionnels véhicule si non multi-véhicules */}
            {!isMultiVehicules && (
              <div className="pt-2 border-t border-slate-200 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marque</label>
                  <input
                    type="text"
                    placeholder="Ex: Dacia"
                    value={vehiculeMarque}
                    onChange={(e) => setVehiculeMarque(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modèle</label>
                  <input
                    type="text"
                    placeholder="Ex: Logan II"
                    value={vehiculeModele}
                    onChange={(e) => setVehiculeModele(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Matricule</label>
                  <input
                    type="text"
                    placeholder="Ex: 12345-A-26"
                    value={vehiculeImmatriculation}
                    onChange={(e) => setVehiculeImmatriculation(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2 : Vitrages & Fournitures Livrées */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                Vitrages & Produits Livrés ({lignes.length}) :
              </label>

              {/* Sélection rapide depuis stock */}
              {stockArticles.length > 0 && (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="flex-1 sm:flex-none px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Choisir depuis le stock atelier --</option>
                    {stockArticles.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.designation} (Réf: {art.codeEurocode || art.reference} - En stock: {art.quantiteEnStock})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddFromStock}
                    disabled={!selectedStockId}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 font-semibold rounded-lg text-xs transition border border-indigo-200"
                  >
                    + Ajouter
                  </button>
                </div>
              )}
            </div>

            {/* Table des lignes */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Désignation de l'article / Vitrage *</th>
                    <th className="py-2.5 px-3 w-32">Réf / Eurocode</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qté *</th>
                    <th className="py-2.5 px-3 w-28 text-right">P.U TTC (DH)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total TTC (DH)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {lignes.map((ligne, idx) => {
                    const rowTotalTTC = ((Number(ligne.prixTTC) || 0) * (Number(ligne.quantite) || 0)).toFixed(2);
                    return (
                      <tr key={ligne.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            required
                            placeholder="Ex: Pare-Brise Dacia Logan 2018"
                            value={ligne.designation}
                            onChange={(e) => handleUpdateLine(idx, 'designation', e.target.value)}
                            className="w-full px-2.5 py-1.5 border rounded-lg font-medium text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Ex: 7288AGS"
                            value={ligne.reference}
                            onChange={(e) => handleUpdateLine(idx, 'reference', e.target.value)}
                            className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-slate-700"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            required
                            value={ligne.quantite}
                            onChange={(e) => handleUpdateLine(idx, 'quantite', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 border rounded-lg text-center font-bold font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={ligne.prixTTC}
                            onChange={(e) => handleUpdateLine(idx, 'prixTTC', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border rounded-lg text-right font-mono text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatDH(Number(rowTotalTTC))}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddCustomLine}
              className="mt-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition border border-dashed border-indigo-300"
            >
              <Plus className="w-3.5 h-3.5" /> + Ajouter une autre ligne d'article
            </button>
          </div>

          {/* Section 3 : Détails Livraison & Totaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date de Livraison *</label>
                <input
                  type="date"
                  required
                  value={dateLivraison}
                  onChange={(e) => setDateLivraison(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Livreur / Poseur *</label>
                <input
                  type="text"
                  required
                  value={livreurPoseur}
                  onChange={(e) => setLivreurPoseur(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observations</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Récapitulatif Financier */}
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider block mb-2">
                  Récapitulatif de la Livraison
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 text-slate-600 border-b border-indigo-200/60">
                    <span>Nombre total de pièces :</span>
                    <strong className="text-slate-900 font-mono text-sm">{totalArticles} pièce(s)</strong>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 border-b border-indigo-200/60">
                    <span>Total Hors Taxes (HT) :</span>
                    <span className="font-mono font-bold text-slate-800">{formatDH(totalHT)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 border-b border-indigo-200/60">
                    <span>TVA Maroc (20%) :</span>
                    <span className="font-mono font-bold text-slate-800">{formatDH(+(totalTTC - totalHT).toFixed(2))}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900 bg-white px-2.5 rounded-lg mt-2">
                    <span>TOTAL TTC :</span>
                    <span className="font-mono text-indigo-700 text-base">{formatDH(totalTTC)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Valider & Générer le Bon de Livraison
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
