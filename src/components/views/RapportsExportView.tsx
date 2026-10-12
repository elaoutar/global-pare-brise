'use client';

import React, { useState } from 'react';
import { DossierSinistre, Assurance, ReglementRecette, BonSortie, Facture } from '@/types';
import { formatDH, formatDate } from '@/lib/utils';
import { GARAGE_INFO, AZUR_GLASS_INFO } from '@/lib/data';
import { 
  exportEtatMensuelExcel, 
  exportEtatAssuranceExcel, 
  exportEtatClientExcel, 
  exportEtatRecettesExcel,
  exportEtatAzurGlassExcel,
  exportEtatParticuliersExcel,
  getProduitPrincipal
} from '@/lib/exportUtils';
import { 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Shield, 
  Users, 
  Coins, 
  Download, 
  Filter, 
  CheckCircle2, 
  Building2, 
  UserCheck 
} from 'lucide-react';
import { formatMatricule } from '@/lib/matriculeMaroc';

interface Props {
  dossiers: DossierSinistre[];
  assurances: Assurance[];
  recettes: ReglementRecette[];
  bonsSortie?: BonSortie[];
  factures?: Facture[];
}

export const RapportsExportView: React.FC<Props> = ({
  dossiers,
  assurances,
  recettes,
  bonsSortie,
  factures,
}) => {
  const [typeRapport, setTypeRapport] = useState<'AZUR_GLASS' | 'PARTICULIERS' | 'MENSUEL' | 'ASSURANCE' | 'CLIENT' | 'RECETTES'>('AZUR_GLASS');
  const [selectedAssuranceId, setSelectedAssuranceId] = useState<string>('ALL');
  const [selectedClientNom, setSelectedClientNom] = useState<string>('ALL');
  const [dateDebut, setDateDebut] = useState<string>(''); // YYYY-MM-DD
  const [dateFin, setDateFin] = useState<string>(''); // YYYY-MM-DD
  const [selectedMois, setSelectedMois] = useState<string>('ALL'); // 'ALL' ou 'YYYY-MM'
  const [selectedTypeClientAzur, setSelectedTypeClientAzur] = useState<string>('ALL'); // 'ALL', 'PARTICULIER', 'PROFESSIONNEL', 'AGENCE_LOCATION'
  const [selectedStatutAzur, setSelectedStatutAzur] = useState<string>('ALL'); // 'ALL', 'TRANSMIS', 'EN_COURS', 'REGLE'

  // Unique list of client names
  const clientNames = Array.from(new Set(dossiers.map((d) => d.client.nom)));

  // Helper de filtrage par date universel (date début, date fin, et/ou mois)
  const matchDateRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const cleanDate = dateStr.slice(0, 10);
    if (dateDebut && cleanDate < dateDebut) return false;
    if (dateFin && cleanDate > dateFin) return false;
    if (selectedMois !== 'ALL' && !cleanDate.startsWith(selectedMois)) return false;
    return true;
  };

  // Libellé de la période filtrée pour affichage et export
  const getPeriodeLibelle = () => {
    if (dateDebut && dateFin) {
      return `Du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`;
    }
    if (dateDebut) {
      return `À partir du ${formatDate(dateDebut)}`;
    }
    if (dateFin) {
      return `Jusqu'au ${formatDate(dateFin)}`;
    }
    if (selectedMois !== 'ALL') {
      return `Mois : ${selectedMois}`;
    }
    return 'Historique Global';
  };

  // Filter dossiers according to selected report settings
  const filteredDossiers = dossiers.filter((d) => {
    // Exclure les dossiers archivés / corbeille
    if (d.isArchive || d.statut === 'ARCHIVE') return false;

    // 1. Filtre par date universel
    const dateToTest = d.dateCreation || d.dateSinistre || '';
    if (!matchDateRange(dateToTest)) return false;

    // 2. Filtres spécifiques par type d'état
    if (typeRapport === 'AZUR_GLASS') {
      if (d.typeDossier !== 'ASSURANCE') return false;

      // Filtre Type Client
      if (selectedTypeClientAzur === 'PARTICULIER' && d.typeClientAssurance && d.typeClientAssurance !== 'PARTICULIER') return false;
      if (selectedTypeClientAzur === 'PROFESSIONNEL' && d.typeClientAssurance !== 'PROFESSIONNEL') return false;
      if (selectedTypeClientAzur === 'AGENCE_LOCATION' && d.typeClientAssurance !== 'AGENCE_LOCATION') return false;

      // Filtre Compagnie
      if (selectedAssuranceId !== 'ALL' && d.assurance?.id !== selectedAssuranceId) return false;

      // Filtre Statut
      if (selectedStatutAzur === 'TRANSMIS' && d.statut !== 'ENVOYE_AZUR_GLASS' && d.statut !== 'DEPOSE_ASSURANCE') return false;
      if (selectedStatutAzur === 'REGLE' && d.statut !== 'VALIDE_REGLE') return false;

      return true;
    }
    if (typeRapport === 'PARTICULIERS') {
      // Uniquement les dossiers de clients particuliers sans assurance (direct / comptant)
      return d.typeDossier !== 'ASSURANCE';
    }
    if (typeRapport === 'MENSUEL') {
      return true;
    }
    if (typeRapport === 'ASSURANCE') {
      if (selectedAssuranceId === 'ALL') return d.typeDossier === 'ASSURANCE';
      return d.typeDossier === 'ASSURANCE' && d.assurance?.id === selectedAssuranceId;
    }
    if (typeRapport === 'CLIENT') {
      if (selectedClientNom === 'ALL') return true;
      return d.client.nom === selectedClientNom;
    }
    return true;
  });

  // Filtered recettes
  const filteredRecettes = recettes.filter((r) => {
    return matchDateRange(r.datePaiement);
  });

  // Financial totals
  const totalTTC = filteredDossiers.reduce((acc, d) => acc + (d.montantTotalTTC || 0), 0);
  const totalAssurance = filteredDossiers.reduce((acc, d) => acc + (d.montantPriseEnChargeAssurance || 0), 0);
  const totalFranchise = filteredDossiers.reduce((acc, d) => acc + (!d.franchiseOfferte ? (d.montantFranchise || 0) : 0), 0);
  const totalTvaExclue = filteredDossiers.reduce((acc, d) => acc + (d.tvaExclueParAssurance || 0), 0);
  const totalNetReversementAzur = filteredDossiers.reduce((acc, d) => {
    const montantTTC = d.montantTotalTTC || 0;
    const franchiseDeduite = !d.franchiseOfferte ? (d.montantFranchise || 0) : 0;
    const tva = d.tvaExclueParAssurance || 0;
    return acc + (d.montantReversementAzurGlass || Math.max(0, montantTTC - franchiseDeduite - tva));
  }, 0);

  const totalRecettesMois = filteredRecettes.reduce((acc, r) => acc + r.montant, 0);

  // Handle Export to Excel
  const handleExportExcel = () => {
    const periodeLabel = getPeriodeLibelle();
    if (typeRapport === 'AZUR_GLASS') {
      const filtreLabel = selectedAssuranceId !== 'ALL' 
        ? assurances.find((a) => a.id === selectedAssuranceId)?.nom || 'Compagnie' 
        : selectedTypeClientAzur;
      exportEtatAzurGlassExcel(filteredDossiers, `${filtreLabel}_${periodeLabel}`);
    } else if (typeRapport === 'PARTICULIERS') {
      exportEtatParticuliersExcel(filteredDossiers, periodeLabel, bonsSortie, factures);
    } else if (typeRapport === 'MENSUEL') {
      exportEtatMensuelExcel(filteredDossiers, periodeLabel);
    } else if (typeRapport === 'ASSURANCE') {
      const assNom = assurances.find((a) => a.id === selectedAssuranceId)?.nom || 'Toutes_Assurances';
      exportEtatAssuranceExcel(filteredDossiers, `${assNom}_${periodeLabel}`);
    } else if (typeRapport === 'CLIENT') {
      exportEtatClientExcel(filteredDossiers, `${selectedClientNom}_${periodeLabel}`);
    } else if (typeRapport === 'RECETTES') {
      exportEtatRecettesExcel(filteredRecettes, periodeLabel);
    }
  };

  // Handle Print / PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header (no-print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              Exports & Rapports (Excel / PDF)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Générez et téléchargez les états AZUR GLASS, les situations assurances, mensuelles et comptables au format Excel (.xlsx) et PDF
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              Exporter Excel (.xlsx)
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Imprimer / Sauvegarder PDF
            </button>
          </div>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setTypeRapport('AZUR_GLASS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              typeRapport === 'AZUR_GLASS'
                ? 'bg-indigo-900 text-white shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            1. État AZUR GLASS (Assurances)
          </button>

          <button
            onClick={() => setTypeRapport('PARTICULIERS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              typeRapport === 'PARTICULIERS'
                ? 'bg-amber-800 text-white shadow-sm ring-2 ring-amber-500/20'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-amber-600" />
            2. État Particuliers (Sans Assurance)
          </button>

          <button
            onClick={() => setTypeRapport('MENSUEL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              typeRapport === 'MENSUEL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            3. État Mensuel Global
          </button>

          <button
            onClick={() => setTypeRapport('ASSURANCE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              typeRapport === 'ASSURANCE'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            4. État par Compagnie
          </button>

          <button
            onClick={() => setTypeRapport('CLIENT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              typeRapport === 'CLIENT'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            5. État par Client / Flotte
          </button>

          <button
            onClick={() => setTypeRapport('RECETTES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              typeRapport === 'RECETTES'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            6. Journal des Recettes
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtrer par date :
          </span>

          {/* Filtre par Plage de Dates (Du ... Au ...) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-slate-700 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Du :
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => {
                  setDateDebut(e.target.value);
                  if (selectedMois !== 'ALL') setSelectedMois('ALL');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-700 font-bold">Au :</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => {
                  setDateFin(e.target.value);
                  if (selectedMois !== 'ALL') setSelectedMois('ALL');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Ou sélection rapide par mois */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300">
              <label className="text-slate-500 font-medium">Ou Mois :</label>
              <input
                type="month"
                value={selectedMois === 'ALL' ? '' : selectedMois}
                onChange={(e) => {
                  setSelectedMois(e.target.value || 'ALL');
                  setDateDebut('');
                  setDateFin('');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Raccourcis Aujourd'hui / Ce mois / Effacer */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-300">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setDateDebut(today);
                  setDateFin(today);
                  setSelectedMois('ALL');
                }}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold transition"
              >
                Aujourd'hui
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = String(now.getMonth() + 1).padStart(2, '0');
                  setSelectedMois(`${year}-${month}`);
                  setDateDebut('');
                  setDateFin('');
                }}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold transition"
              >
                Ce mois
              </button>
              {(dateDebut || dateFin || selectedMois !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setDateDebut('');
                    setDateFin('');
                    setSelectedMois('ALL');
                  }}
                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-bold border border-rose-200 transition"
                  title="Afficher tout l'historique sans filtre de date"
                >
                  Tous (Sans filtre)
                </button>
              )}
            </div>
          </div>

          {typeRapport === 'AZUR_GLASS' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-semibold">Catégorie Client :</label>
                <select
                  value={selectedTypeClientAzur}
                  onChange={(e) => setSelectedTypeClientAzur(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="ALL">Tous (Particuliers & Pros)</option>
                  <option value="PARTICULIER">Particuliers (100% Remboursé)</option>
                  <option value="PROFESSIONNEL">Professionnels (TVA Exclue)</option>
                  <option value="AGENCE_LOCATION">Agences de Location</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-semibold">Compagnie d'Assurance :</label>
                <select
                  value={selectedAssuranceId}
                  onChange={(e) => setSelectedAssuranceId(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="ALL">Toutes les compagnies</option>
                  {assurances.map((a) => (
                    <option key={a.id} value={a.id}>{a.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-semibold">Statut Dossier :</label>
                <select
                  value={selectedStatutAzur}
                  onChange={(e) => setSelectedStatutAzur(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="TRANSMIS">Transmis à AZUR GLASS</option>
                  <option value="REGLE">Virement Reçu & Réglé</option>
                </select>
              </div>
            </>
          )}

          {typeRapport === 'ASSURANCE' && (
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-semibold">Compagnie d'Assurance :</label>
              <select
                value={selectedAssuranceId}
                onChange={(e) => setSelectedAssuranceId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                <option value="ALL">Toutes les compagnies</option>
                {assurances.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom}</option>
                ))}
              </select>
            </div>
          )}

          {typeRapport === 'CLIENT' && (
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-semibold">Client sélectionné :</label>
              <select
                value={selectedClientNom}
                onChange={(e) => setSelectedClientNom(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                <option value="ALL">Tous les clients</option>
                {clientNames.map((nom, i) => (
                  <option key={i} value={nom}>{nom}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Document Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 print-page text-slate-800 text-xs">
        {/* Official Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
          <div>
            <h1 className="text-xl font-black uppercase text-slate-900">{GARAGE_INFO.nom}</h1>
            <p className="text-[11px] font-semibold text-brand-600 uppercase">
              Centre Agréé Bris de Glace & Pare-Brise
            </p>
            <p className="text-[11px] text-slate-600">{GARAGE_INFO.adresse}</p>
            <p className="text-[11px] text-slate-600">Tél: {GARAGE_INFO.telephone}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              ICE: {GARAGE_INFO.ice} | IF: {GARAGE_INFO.ifiscal} | PT: {GARAGE_INFO.patente}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase rounded mb-1">
              {typeRapport === 'AZUR_GLASS' && `BORDEREAU AZUR GLASS (${getPeriodeLibelle()})`}
              {typeRapport === 'PARTICULIERS' && `SITUATION PARTICULIERS SANS ASSURANCE (${getPeriodeLibelle()})`}
              {typeRapport === 'MENSUEL' && `ÉTAT MENSUEL GLOBAL (${getPeriodeLibelle()})`}
              {typeRapport === 'ASSURANCE' && `SITUATION PAR COMPAGNIE (${getPeriodeLibelle()})`}
              {typeRapport === 'CLIENT' && `RELEVÉ CLIENT (${getPeriodeLibelle()})`}
              {typeRapport === 'RECETTES' && `JOURNAL DES RECETTES (${getPeriodeLibelle()})`}
            </span>
            {typeRapport === 'AZUR_GLASS' && (
              <p className="text-[11px] font-bold text-indigo-700">
                Intermédiaire Conventionné : {AZUR_GLASS_INFO.designationComplete}
              </p>
            )}
            <p className="text-[11px] text-slate-500">Date d'édition : {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Summary Metric Ribbon */}
        {typeRapport === 'AZUR_GLASS' ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 mb-5 text-center">
            <div>
              <span className="text-[10px] text-indigo-800 font-bold uppercase">Dossiers Sinistre</span>
              <p className="font-black text-slate-900 text-base">{filteredDossiers.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-indigo-800 font-bold uppercase">Total Prestations (TTC)</span>
              <p className="font-black text-slate-900 text-sm font-mono">{formatDH(totalTTC)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Franchises Déduites</span>
              <p className="font-bold text-slate-700 text-sm font-mono">{formatDH(totalFranchise)}</p>
            </div>
            <div>
              <span className="text-[10px] text-amber-800 font-bold uppercase">TVA Pro Exclue</span>
              <p className="font-bold text-amber-700 text-sm font-mono">{formatDH(totalTvaExclue)}</p>
            </div>
            <div className="bg-indigo-900 text-white p-2 rounded-lg">
              <span className="text-[9px] uppercase tracking-wider text-indigo-200 font-bold block">
                Net Attendu AZUR GLASS
              </span>
              <p className="font-black text-emerald-400 text-sm font-mono">{formatDH(totalNetReversementAzur)}</p>
            </div>
          </div>
        ) : typeRapport === 'PARTICULIERS' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200 mb-5 text-center">
            <div>
              <span className="text-[10px] text-amber-900 font-bold uppercase">Dossiers Particuliers</span>
              <p className="font-black text-slate-900 text-base">{filteredDossiers.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-amber-900 font-bold uppercase">Total TTC Encaissé</span>
              <p className="font-black text-amber-950 text-sm font-mono">{formatDH(totalTTC)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase">Total HT Estimé</span>
              <p className="font-bold text-slate-800 text-sm font-mono">{formatDH(+(totalTTC / 1.20).toFixed(2))}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase">TVA Collectée (20%)</span>
              <p className="font-bold text-slate-800 text-sm font-mono">{formatDH(+(totalTTC - totalTTC / 1.20).toFixed(2))}</p>
            </div>
          </div>
        ) : typeRapport !== 'RECETTES' ? (
          <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Dossiers</span>
              <p className="font-black text-slate-900 text-base">{filteredDossiers.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Prestations (TTC)</span>
              <p className="font-black text-slate-900 text-sm font-mono">{formatDH(totalTTC)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Part Assurances</span>
              <p className="font-black text-brand-700 text-sm font-mono">{formatDH(totalAssurance)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Franchises Clients</span>
              <p className="font-bold text-slate-700 text-sm font-mono">{formatDH(totalFranchise)}</p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-5 flex justify-between items-center">
            <span className="font-bold text-emerald-900">Total Encaissé sur la période :</span>
            <span className="font-black text-emerald-950 font-mono text-base">{formatDH(totalRecettesMois)}</span>
          </div>
        )}

        {/* Main Data Table */}
        {typeRapport === 'AZUR_GLASS' ? (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[11px]">
                <tr>
                  <th className="p-2.5">Dossier / Réf Azur</th>
                  <th className="p-2.5">Client & Véhicule</th>
                  <th className="p-2.5">Compagnie & Agence Locale</th>
                  <th className="p-2.5 text-center">Catégorie</th>
                  <th className="p-2.5 text-right">Total TTC</th>
                  <th className="p-2.5 text-right">Franchise</th>
                  <th className="p-2.5 text-right">TVA Pro</th>
                  <th className="p-2.5 text-right text-indigo-950 font-black">Net Reversement</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDossiers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                      Aucun dossier assurance AZUR GLASS enregistré.
                    </td>
                  </tr>
                ) : (
                  filteredDossiers.map((d) => {
                    const montantTTC = d.montantTotalTTC || 0;
                    const franchiseDeduite = !d.franchiseOfferte ? (d.montantFranchise || 0) : 0;
                    const tva = d.tvaExclueParAssurance || 0;
                    const net = d.montantReversementAzurGlass || Math.max(0, montantTTC - franchiseDeduite - tva);

                    return (
                      <tr key={d.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="p-2.5">
                          <span className="font-mono font-bold text-slate-900 block">{d.numeroDossier}</span>
                          <span className="text-[10px] text-indigo-700 font-semibold">
                            {d.referenceDossierAzurGlass || `AZUR-${d.numeroDossier.slice(-4)}`}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <strong className="text-slate-900 block">{d.client.nom}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {d.vehicule.marque} {d.vehicule.modele} ({formatMatricule(d.vehicule.immatriculation, 'LATIN')})
                          </span>
                        </td>
                        <td className="p-2.5">
                          <strong className="text-slate-900 block">{d.assurance?.nom}</strong>
                          <span className="text-[10px] text-slate-600 block">
                            {d.agenceAssurance || 'Agence Principale'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Sinistre : {d.numeroSinistre || '-'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          {d.typeClientAssurance === 'PROFESSIONNEL' ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              Pro (TVA Exclue)
                            </span>
                          ) : d.typeClientAssurance === 'AGENCE_LOCATION' ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                              Location
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              Particulier
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono">{formatDH(montantTTC)}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          {franchiseDeduite > 0 ? `-${formatDH(franchiseDeduite)}` : '0 DH'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-amber-700">
                          {tva > 0 ? `-${formatDH(tva)}` : '0 DH'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-indigo-950 bg-indigo-50/50">
                          {formatDH(net)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            {d.statut}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : typeRapport === 'PARTICULIERS' ? (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/70 border-b border-amber-200 font-bold text-amber-950 uppercase text-[11px]">
                <tr>
                  <th className="p-2.5">Date & Dossier</th>
                  <th className="p-2.5">Client Particulier</th>
                  <th className="p-2.5">Véhicule (Matricule)</th>
                  <th className="p-2.5">Produit Principal Posé</th>
                  <th className="p-2.5">N° Châssis (VIN)</th>
                  <th className="p-2.5">Technicien Poseur</th>
                  <th className="p-2.5 text-right">Montant TTC (DH)</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDossiers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      Aucun dossier particulier (sans assurance) enregistré sur cette période.
                    </td>
                  </tr>
                ) : (
                  filteredDossiers.map((d) => {
                    const produitPose = getProduitPrincipal(d, bonsSortie, factures);

                    return (
                      <tr key={d.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-2.5">
                          <span className="font-mono font-bold text-slate-900 block">{d.numeroDossier}</span>
                          <span className="text-[10px] text-slate-500">{formatDate(d.dateCreation)}</span>
                        </td>
                        <td className="p-2.5">
                          <strong className="text-slate-900 block">{d.client.nom}</strong>
                          <span className="text-[11px] text-slate-500 block">Tél: {d.client.telephone}</span>
                          {d.client.cin && <span className="text-[10px] text-slate-400 font-mono">CIN: {d.client.cin}</span>}
                        </td>
                        <td className="p-2.5">
                          <strong className="text-slate-900 block">{d.vehicule.marque} {d.vehicule.modele} ({d.vehicule.annee})</strong>
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            {formatMatricule(d.vehicule.immatriculation, 'LATIN')}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <strong className="text-slate-900 block font-semibold">{produitPose}</strong>
                          <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 inline-block mt-0.5">
                            Vitrage principal posé
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          {d.vehicule.chassisVin || '-'}
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {d.poseur || 'Chef d\'atelier'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-950 text-xs">
                          {formatDH(d.montantTotalTTC)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            {d.statut}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : typeRapport !== 'RECETTES' ? (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">N° Dossier</th>
                  <th className="p-2.5">Client</th>
                  <th className="p-2.5">Véhicule (Matricule)</th>
                  <th className="p-2.5">Compagnie & N° Sinistre</th>
                  <th className="p-2.5 text-right">Prise en Charge (TTC)</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDossiers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      Aucun dossier ne correspond aux critères sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredDossiers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-600">{formatDate(d.dateCreation)}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">{d.numeroDossier}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{d.client.nom}</td>
                      <td className="p-2.5">
                        {d.vehicule.marque} {d.vehicule.modele}
                        <span className="block font-mono text-[11px] font-bold text-slate-900">
                          {d.vehicule.immatriculation}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {d.typeDossier === 'PARTICULIER_COMPTANT' ? (
                          <span className="inline-block text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            👤 Particulier (Comptant)
                          </span>
                        ) : (
                          <>
                            <strong className="text-slate-900">{d.assurance?.nom}</strong>
                            <span className="block font-mono text-[11px] text-slate-500">
                              {d.numeroSinistre || '-'}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatDH(d.typeDossier === 'PARTICULIER_COMPTANT' ? d.montantTotalTTC : d.montantPriseEnChargeAssurance)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {d.statut}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">N° Reçu</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Payeur / Origine</th>
                  <th className="p-2.5 text-center">Mode</th>
                  <th className="p-2.5">Réf & Banque</th>
                  <th className="p-2.5">Échéance</th>
                  <th className="p-2.5 text-right">Montant (DH)</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecettes.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{r.numeroRecu}</td>
                    <td className="p-2.5 text-slate-600">{formatDate(r.datePaiement)}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{r.payeurNom}</td>
                    <td className="p-2.5 text-center font-bold text-[10px]">{r.modePaiement}</td>
                    <td className="p-2.5 font-mono text-[11px]">
                      {r.referenceDocument || '-'} {r.banque ? `(${r.banque})` : ''}
                    </td>
                    <td className="p-2.5 font-mono">{r.dateEcheance ? formatDate(r.dateEcheance) : '-'}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{formatDH(r.montant)}</td>
                    <td className="p-2.5 text-center font-bold text-[10px]">{r.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with stamp area */}
        <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
          <p>{GARAGE_INFO.nom} - ICE : {GARAGE_INFO.ice} - {GARAGE_INFO.adresse}</p>
          <p className="font-semibold text-slate-700">Direction & Comptabilité</p>
        </div>
      </div>
    </div>
  );
};
