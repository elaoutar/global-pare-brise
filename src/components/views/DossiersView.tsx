'use client';

import React, { useState } from 'react';
import { DossierSinistre, StatutDossier } from '@/types';
import { formatDH, formatDate, getStatutDossierBadge } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  FileText, 
  ShieldCheck, 
  PackageMinus, 
  Camera, 
  ChevronRight,
  Car,
  CheckCircle2,
  AlertCircle,
  Truck,
  Paperclip,
  Upload,
  FileCheck2,
  Eye,
  Download,
  FileSpreadsheet,
  Coins,
  MapPin,
  Building,
  Mail,
  Send
} from 'lucide-react';
import { DocumentAttache } from '@/types';
import { exportEtatMensuelExcel } from '@/lib/exportUtils';
import { MatriculeBadge } from '@/components/ui/MatriculeBadge';
import { formatMatricule } from '@/lib/matriculeMaroc';

interface Props {
  dossiers: DossierSinistre[];
  onOpenNewDossier: () => void;
  onOpenQuittance: (dossier: DossierSinistre) => void;
  onOpenFacture: (dossier: DossierSinistre) => void;
  onOpenBonSortie: (dossier: DossierSinistre) => void;
  onOpenBonLivraison: (dossier: DossierSinistre) => void;
  onOpenDevis?: (dossier: DossierSinistre) => void;
  onOpenTransmettreAzurGlass?: (dossier: DossierSinistre) => void;
  onAddDocumentToDossier: (dossierId: string, doc: DocumentAttache) => void;
  onUpdateStatut: (dossierId: string, newStatut: StatutDossier) => void;
  onOpenEncaisserModal?: (dossier: DossierSinistre) => void;
}

export const DossiersView: React.FC<Props> = ({
  dossiers,
  onOpenNewDossier,
  onOpenQuittance,
  onOpenFacture,
  onOpenBonSortie,
  onOpenBonLivraison,
  onOpenDevis,
  onOpenTransmettreAzurGlass,
  onAddDocumentToDossier,
  onUpdateStatut,
  onOpenEncaisserModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('ALL');
  const [filterVille, setFilterVille] = useState<string>('ALL');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(dossiers[0]?.id || null);
  const selectedDossier = dossiers.find((d) => d.id === (selectedDossierId || dossiers[0]?.id)) || dossiers[0] || null;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocNom, setNewDocNom] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentAttache['typeDocument']>('PRISE_EN_CHARGE_ASSURANCE');

  // Extraire les villes uniques pour la liste de filtrage
  const villesDisponibles = Array.from(
    new Set(dossiers.map((d) => d.client.ville).filter(Boolean))
  ).sort();

  const filteredDossiers = dossiers.filter((d) => {
    const matchSearch =
      d.vehicule.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatMatricule(d.vehicule.immatriculation, 'LATIN').toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatMatricule(d.vehicule.immatriculation, 'ARABE').includes(searchTerm) ||
      d.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.client.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.numeroSinistre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.assurance?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.numeroDossier.toLowerCase().includes(searchTerm.toLowerCase());

    let matchStatut = true;
    if (filterStatut === 'ALL') {
      matchStatut = true;
    } else if (filterStatut === 'TYPE_ASSURANCE') {
      matchStatut = d.typeDossier === 'ASSURANCE';
    } else if (filterStatut === 'TYPE_PARTICULIER') {
      matchStatut = d.typeDossier === 'PARTICULIER_COMPTANT';
    } else {
      matchStatut = d.statut === filterStatut;
    }

    let matchVille = true;
    if (filterVille !== 'ALL') {
      matchVille = (d.client.ville || '').toLowerCase() === filterVille.toLowerCase();
    }

    return matchSearch && matchStatut && matchVille;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher matricule, client, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          {/* City / Agency Filter */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <select
              value={filterVille}
              onChange={(e) => setFilterVille(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">📍 Toutes les villes / agences</option>
              <option value="Marrakech">📍 Marrakech (Agence)</option>
              <option value="El Jadida">📍 El Jadida (Agence)</option>
              {villesDisponibles
                .filter((v) => v.toLowerCase() !== 'marrakech' && v.toLowerCase() !== 'el jadida')
                .map((v) => (
                  <option key={v} value={v}>
                    📍 {v}
                  </option>
                ))}
            </select>
          </div>

          {/* Status and Type filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tous les statuts</option>
              <optgroup label="Par Type de Client">
                <option value="TYPE_ASSURANCE">🛡️ Dossiers Assurances</option>
                <option value="TYPE_PARTICULIER">👤 Clients Particuliers (Comptant)</option>
              </optgroup>
              <optgroup label="Par Statut de Pose / Traitement">
                <option value="NOUVEAU">Nouveau</option>
                <option value="EN_COURS_POSE">En cours de pose</option>
                <option value="DEPOSE_ASSURANCE">Déposé Assurance</option>
                <option value="VALIDE_REGLE">Validé & Réglé</option>
                <option value="REJETE">Rejeté / Litige</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportEtatMensuelExcel(filteredDossiers, 'Liste')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
            title="Exporter la liste actuelle en Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exporter Excel
          </button>

          <button
            onClick={onOpenNewDossier}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Dossier
          </button>
        </div>
      </div>

      {/* Two Column Layout: List on Left, Active Dossier Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column : Dossiers List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {filteredDossiers.length} Dossier(s) Référencé(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[750px] overflow-y-auto custom-scrollbar">
            {filteredDossiers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Aucun dossier ne correspond à votre recherche.
              </div>
            ) : (
              filteredDossiers.map((dossier) => {
                const badge = getStatutDossierBadge(dossier.statut);
                const isSelected = selectedDossier?.id === dossier.id;

                return (
                  <div
                    key={dossier.id}
                    onClick={() => setSelectedDossierId(dossier.id)}
                    className={`p-4 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-brand-50/70 border-l-4 border-brand-600' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {dossier.vehicule.marque} {dossier.vehicule.modele}
                        </span>
                        <MatriculeBadge immatriculation={dossier.vehicule.immatriculation} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>{dossier.client.nom} ({dossier.client.telephone})</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <MapPin className="w-3 h-3 text-brand-600" />
                          {dossier.client.ville}
                        </span>
                      </div>
                      {dossier.typeDossier === 'PARTICULIER_COMPTANT' ? (
                        <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Client Particulier (Prestation Comptant • Sans Assurance)
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                          <span>Assurance : <strong className="text-slate-800">{dossier.assurance?.nom}</strong></span>
                          <span>• Sinistre : <span className="font-mono">{dossier.numeroSinistre || '-'}</span></span>
                          {dossier.dateEnvoiAzurGlass && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-semibold">
                              ✉️ Envoyé AZUR
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1.5 flex-shrink-0">
                      <div className="font-bold text-sm font-mono text-slate-900">
                        {formatDH(dossier.montantTotalTTC)}
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column : Detail & Action Sheet (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedDossier ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5 sticky top-6">
              {/* Top Banner of Selected Dossier */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase">
                      {selectedDossier.numeroDossier}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <h2 className="text-lg font-black text-slate-900">
                        {selectedDossier.vehicule.marque} {selectedDossier.vehicule.modele}
                      </h2>
                      <MatriculeBadge immatriculation={selectedDossier.vehicule.immatriculation} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>Créé le {formatDate(selectedDossier.dateCreation)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        <MapPin className="w-3 h-3 text-brand-600" />
                        {selectedDossier.client.ville}
                      </span>
                      <span>•</span>
                      <span>Poseur : {selectedDossier.poseur || 'Non affecté'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {selectedDossier.typeDossier === 'PARTICULIER_COMPTANT' ? (
                      <>
                        <p className="text-xs text-slate-500">Total Client Direct :</p>
                        <p className="text-lg font-black text-amber-600 font-mono">
                          {formatDH(selectedDossier.montantTotalTTC)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-slate-500">Prise en charge :</p>
                        <p className="text-lg font-black text-brand-700 font-mono">
                          {formatDH(selectedDossier.montantPriseEnChargeAssurance)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Selector Dropdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Changer Statut :</span>
                  <select
                    value={selectedDossier.statut}
                    onChange={(e) => onUpdateStatut(selectedDossier.id, e.target.value as StatutDossier)}
                    className="text-xs py-1.5 px-3 bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="NOUVEAU">Nouveau dossier</option>
                    <option value="EN_COURS_POSE">En cours de pose</option>
                    <option value="POSE_TERMINEE">Pose terminée</option>
                    <option value="ENVOYE_AZUR_GLASS">Envoyé à AZUR GLASS</option>
                    <option value="ACCORD_RECUE_AZUR_GLASS">Accord reçu (AZUR GLASS)</option>
                    <option value="EN_ATTENTE_REGLEMENT_AZUR">En attente reversement AZUR GLASS</option>
                    <option value="VALIDE_REGLE">Soldé & Réglé par AZUR GLASS</option>
                    <option value="REJETE">Rejeté / Litige</option>
                  </select>
                </div>
              </div>

              {/* Transmission Dossier Complet AZUR GLASS (1-Clic) */}
              {selectedDossier.typeDossier === 'ASSURANCE' && onOpenTransmettreAzurGlass && (
                <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-3.5 rounded-xl border border-indigo-700/60 text-white shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-500/30 rounded-lg text-indigo-300 border border-indigo-400/30">
                        <Mail className="w-4 h-4 text-brand-300" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          Transmission AZUR GLASS
                          {selectedDossier.statut === 'ENVOYE_AZUR_GLASS' && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                              ✓ Déjà Envoyé
                            </span>
                          )}
                        </span>
                        <p className="text-[10px] text-slate-300">
                          Pack complet : Facture, Quittance signée, Bon de sortie, Photos
                        </p>
                      </div>
                    </div>

                    {selectedDossier.dateEnvoiAzurGlass && (
                      <span className="text-[10px] font-mono text-indigo-200 bg-white/10 px-2 py-0.5 rounded">
                        Envoyé le {formatDate(selectedDossier.dateEnvoiAzurGlass)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenTransmettreAzurGlass(selectedDossier)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black shadow-sm transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {selectedDossier.statut === 'ENVOYE_AZUR_GLASS'
                      ? 'Renvoyer / Consulter Transmission Email (AZUR GLASS)'
                      : '✉️ Envoyer Dossier Complet à AZUR GLASS (1-Clic)'}
                  </button>
                </div>
              )}

              {/* Encaissement Rapide */}
              {selectedDossier.statut !== 'VALIDE_REGLE' && onOpenEncaisserModal && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-600" /> Règlement & Encaissement
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      {formatDH(selectedDossier.montantTotalTTC)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenEncaisserModal(selectedDossier)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  >
                    <Coins className="w-4 h-4" /> Encaisser Règlement (Espèces, Chèque, Effet...)
                  </button>
                </div>
              )}

              {/* Action Buttons: Essential Documents */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Documents Prêts pour Impression / Signature :
                </p>

                {/* 1. Quittance Subrogative (Uniquement pour Dossier avec Assurance) */}
                {selectedDossier.typeDossier === 'ASSURANCE' ? (
                  <button
                    onClick={() => onOpenQuittance(selectedDossier)}
                    className="w-full flex items-center justify-between p-3 bg-brand-50 hover:bg-brand-100/80 text-brand-900 rounded-xl border border-brand-200 text-xs font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-brand-600" />
                      <span>Quittance Subrogative d'Assurance</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-400" />
                  </button>
                ) : (
                  <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-center gap-2">
                    <span className="font-bold text-[11px] bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded">Particulier Direct</span>
                    <span className="text-[11px] text-amber-800">Facturation au comptant directe (sans subrogation).</span>
                  </div>
                )}

                {/* 2. Facture Officielle (Adressée à AZUR GLASS si dossier assurance) */}
                <button
                  onClick={() => onOpenFacture(selectedDossier)}
                  className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 rounded-xl border border-emerald-200 text-xs font-semibold transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>
                      {selectedDossier.typeDossier === 'ASSURANCE' 
                        ? 'Facture Officielle AZUR GLASS (TVA 20% / ICE)' 
                        : 'Facture Client Officielle (TVA 20% / ICE)'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>

                {/* 3. Bon de Sortie Stock */}
                <button
                  onClick={() => onOpenBonSortie(selectedDossier)}
                  className="w-full flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100/80 text-amber-900 rounded-xl border border-amber-200 text-xs font-semibold transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <PackageMinus className="w-4 h-4 text-amber-600" />
                    <span>Bon de Sortie Stock (Atelier / Poseur)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>

                {/* 4. Bon de Livraison */}
                <button
                  onClick={() => onOpenBonLivraison(selectedDossier)}
                  className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-900 rounded-xl border border-indigo-200 text-xs font-semibold transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>Bon de Livraison (Décharge Client / Pose)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                </button>

                {/* 5. Devis Client */}
                {onOpenDevis && (
                  <button
                    onClick={() => onOpenDevis(selectedDossier)}
                    className="w-full flex items-center justify-between p-3 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 rounded-xl border border-amber-200 text-xs font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>Devis Client / Estimation (Imprimer / A4)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                )}
              </div>

              {/* Client & Insurance Specs (Détails AZUR GLASS, Agence & TVA Pro) */}
              {selectedDossier.typeDossier === 'ASSURANCE' ? (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  {/* Intermédiaire AZUR GLASS banner */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-[11px]">
                    <span className="font-bold text-indigo-950 flex items-center gap-1">
                      🏛️ Intermédiaire : <strong>AZUR GLASS</strong>
                    </span>
                    <span className="text-slate-500 font-mono">
                      Réf: {selectedDossier.referenceDossierAzurGlass || `AZUR-${selectedDossier.numeroDossier.slice(-4)}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Compagnie & Agence</p>
                      <p className="font-semibold text-slate-800">{selectedDossier.assurance?.nom}</p>
                      <p className="text-indigo-700 font-medium">{selectedDossier.agenceAssurance || 'Agence locale'}</p>
                      <p className="text-slate-500 font-mono mt-0.5">Police: {selectedDossier.numeroPolice || '-'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Franchise & Régime</p>
                      {selectedDossier.franchiseOfferte ? (
                        <span className="text-emerald-700 font-bold block">Franchise Offerte</span>
                      ) : (
                        <span className="text-slate-800 font-semibold block">{formatDH(selectedDossier.montantFranchise)}</span>
                      )}
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-200 rounded text-[10px] font-semibold text-slate-700">
                        {selectedDossier.typeClientAssurance === 'PROFESSIONNEL' ? 'Client Professionnel' : (selectedDossier.typeClientAssurance === 'AGENCE_LOCATION' ? 'Agence Location' : 'Particulier')}
                      </span>
                    </div>
                  </div>

                  {/* Reversement Net AZUR GLASS Box */}
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-900 block">
                        Reversement Net AZUR GLASS :
                      </span>
                      {Number(selectedDossier.tvaExclueParAssurance || 0) > 0 && (
                        <span className="text-[10px] text-amber-700 block">
                          (TVA exclue déduite : {formatDH(selectedDossier.tvaExclueParAssurance || 0)})
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-sm text-indigo-900">
                      {formatDH(selectedDossier.montantReversementAzurGlass || selectedDossier.montantPriseEnChargeAssurance || selectedDossier.montantTotalTTC)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase">Type Dossier</p>
                    <p className="font-semibold text-slate-800">Particulier Direct (Comptant)</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Prestation sans assurance</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase">Facturation Client</p>
                    <p className="text-amber-800 font-bold font-mono">{formatDH(selectedDossier.montantTotalTTC)} TTC</p>
                    <p className="text-emerald-700 text-[10px] font-semibold">Règlement à la livraison</p>
                  </div>
                </div>
              )}

              {/* Fichiers & Pièces Jointes Assurance */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-brand-600" /> Documents Assurance & Fichiers
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-lg"
                  >
                    <Upload className="w-3 h-3" /> + Joindre Fichier
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(!selectedDossier.documents || selectedDossier.documents.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic py-1">
                      Aucun document joint (ex: Accord de prise en charge, rapport d'expertise).
                    </p>
                  ) : (
                    selectedDossier.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs hover:bg-slate-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileCheck2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-slate-800 truncate">{doc.nom}</p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {doc.typeDocument} {doc.taille ? `• ${doc.taille}` : ''} • {formatDate(doc.dateAjout)}
                            </span>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          download={doc.nom}
                          className="p-1 text-slate-400 hover:text-brand-600 transition-colors flex-shrink-0"
                          title="Télécharger / Voir document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Photos Gallery */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Photos Expert & Contrôle ({Object.values(selectedDossier.photos).filter(Boolean).length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDossier.photos.avantSinistreUrl && (
                    <div className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                      <img
                        src={selectedDossier.photos.avantSinistreUrl}
                        alt="Avant pose"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] p-0.5 text-center">
                        Avant (Sinistre)
                      </span>
                    </div>
                  )}
                  {selectedDossier.photos.apresPoseUrl && (
                    <div className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                      <img
                        src={selectedDossier.photos.apresPoseUrl}
                        alt="Après pose"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-emerald-900/80 text-white text-[9px] p-0.5 text-center">
                        Après (Posé)
                      </span>
                    </div>
                  )}
                  {selectedDossier.photos.carteGriseUrl && (
                    <div className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                      <img
                        src={selectedDossier.photos.carteGriseUrl}
                        alt="Carte grise"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] p-0.5 text-center">
                        Carte Grise
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Sélectionnez un dossier pour consulter les détails et imprimer les pièces.
            </div>
          )}
        </div>
      </div>

      {/* Modal Upload Fichier / Document Assurance */}
      {showUploadModal && selectedDossier && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="sticky top-0 z-30 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm">Joindre Document Sinistre</h3>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newDoc: DocumentAttache = {
                  id: `doc-${Date.now()}`,
                  nom: newDocNom || 'Document_Assurance.pdf',
                  typeDocument: newDocType,
                  url: '#',
                  taille: '850 Ko',
                  dateAjout: new Date().toISOString().split('T')[0],
                };
                onAddDocumentToDossier(selectedDossier.id, newDoc);
                setShowUploadModal(false);
                setNewDocNom('');
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Type de Document *</label>
                <select
                  value={newDocType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setNewDocType(val);
                    if (val === 'QUITTANCE_SIGNEE') {
                      setNewDocNom(`Quittance_Signee_${selectedDossier.numeroDossier}.pdf`);
                    } else if (val === 'DEVIS_SIGNE') {
                      setNewDocNom(`Ordre_Reparation_Signe_${selectedDossier.numeroDossier}.pdf`);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg font-medium"
                >
                  <option value="QUITTANCE_SIGNEE">✍️ Quittance Subrogative Signée par le Client</option>
                  <option value="DEVIS_SIGNE">✍️ Devis / Ordre de Réparation Signé</option>
                  <option value="PRISE_EN_CHARGE_ASSURANCE">Accord de Prise en Charge Assurance / Azur Glass</option>
                  <option value="RAPPORT_EXPERTISE">Rapport d'Expertise Automobile</option>
                  <option value="CARTE_GRISE">Copie Carte Grise / CIN / Permis</option>
                  <option value="AUTRE">Autre Document Sinistre</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Fichier / Titre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Quittance_Signee_DOS-2026-0042.pdf"
                  value={newDocNom}
                  onChange={(e) => setNewDocNom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              {/* Upload Dropzone with real file input */}
              <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl p-4 text-center bg-indigo-50/40 hover:bg-indigo-50 transition-colors cursor-pointer block">
                <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                <p className="font-semibold text-slate-800">
                  {newDocNom ? `Fichier prêt : ${newDocNom}` : 'Cliquez pour choisir ou glisser la photo/scan signé'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Formats acceptés : PDF, JPG, PNG (Max 15 Mo)</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewDocNom(file.name);
                    }
                  }}
                />
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold"
                >
                  Ajouter au Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
