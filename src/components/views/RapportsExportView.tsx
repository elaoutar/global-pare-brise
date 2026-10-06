'use client';

import React, { useState } from 'react';
import { DossierSinistre, Assurance, ReglementRecette } from '@/types';
import { formatDH, formatDate } from '@/lib/utils';
import { GARAGE_INFO } from '@/lib/data';
import { 
  exportEtatMensuelExcel, 
  exportEtatAssuranceExcel, 
  exportEtatClientExcel, 
  exportEtatRecettesExcel 
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
  CheckCircle2
} from 'lucide-react';

interface Props {
  dossiers: DossierSinistre[];
  assurances: Assurance[];
  recettes: ReglementRecette[];
}

export const RapportsExportView: React.FC<Props> = ({
  dossiers,
  assurances,
  recettes,
}) => {
  const [typeRapport, setTypeRapport] = useState<'MENSUEL' | 'ASSURANCE' | 'CLIENT' | 'RECETTES'>('MENSUEL');
  const [selectedAssuranceId, setSelectedAssuranceId] = useState<string>('ALL');
  const [selectedClientNom, setSelectedClientNom] = useState<string>('ALL');
  const [selectedMois, setSelectedMois] = useState<string>('2026-10'); // YYYY-MM

  // Unique list of client names
  const clientNames = Array.from(new Set(dossiers.map((d) => d.client.nom)));

  // Filter dossiers according to selected report settings
  const filteredDossiers = dossiers.filter((d) => {
    if (typeRapport === 'MENSUEL') {
      return d.dateCreation.startsWith(selectedMois);
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
    if (typeRapport === 'RECETTES') {
      return r.datePaiement.startsWith(selectedMois);
    }
    return true;
  });

  // Financial totals
  const totalTTC = filteredDossiers.reduce((acc, d) => acc + d.montantTotalTTC, 0);
  const totalAssurance = filteredDossiers.reduce((acc, d) => acc + d.montantPriseEnChargeAssurance, 0);
  const totalFranchise = filteredDossiers.reduce((acc, d) => acc + d.montantFranchise, 0);

  const totalRecettesMois = filteredRecettes.reduce((acc, r) => acc + r.montant, 0);

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (typeRapport === 'MENSUEL') {
      exportEtatMensuelExcel(filteredDossiers, selectedMois);
    } else if (typeRapport === 'ASSURANCE') {
      const assNom = assurances.find((a) => a.id === selectedAssuranceId)?.nom || 'Toutes_Assurances';
      exportEtatAssuranceExcel(filteredDossiers, assNom);
    } else if (typeRapport === 'CLIENT') {
      exportEtatClientExcel(filteredDossiers, selectedClientNom);
    } else if (typeRapport === 'RECETTES') {
      exportEtatRecettesExcel(filteredRecettes, selectedMois);
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
              Générez des états mensuels, des situations par compagnie d'assurance ou par client au format Excel (.xlsx) et PDF
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
            onClick={() => setTypeRapport('MENSUEL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              typeRapport === 'MENSUEL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            1. État Mensuel Global
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
            2. État par Assurance
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
            3. État par Client / Flotte
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
            4. Journal des Recettes
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtres applicables :
          </span>

          {(typeRapport === 'MENSUEL' || typeRapport === 'RECETTES') && (
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-semibold">Mois sélectionné :</label>
              <input
                type="month"
                value={selectedMois}
                onChange={(e) => setSelectedMois(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
              />
            </div>
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
              {typeRapport === 'MENSUEL' && `ÉTAT MENSUEL D'ACTIVITÉ - ${selectedMois}`}
              {typeRapport === 'ASSURANCE' && `SITUATION BRIS DE GLACE PAR ASSURANCE`}
              {typeRapport === 'CLIENT' && `RELEVÉ DE FACTURATION CLIENT`}
              {typeRapport === 'RECETTES' && `JOURNAL DES RECETTES & ENCAISSEMENTS - ${selectedMois}`}
            </span>
            <p className="text-[11px] text-slate-500">Date d'édition : {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Summary Metric Ribbon */}
        {typeRapport !== 'RECETTES' ? (
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
        {typeRapport !== 'RECETTES' ? (
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
