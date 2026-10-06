'use client';

import React, { useState } from 'react';
import { Facture, DossierSinistre } from '@/types';
import { formatDH, formatDate, getStatutPaiementBadge } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { FileText, Printer, Search, CheckCircle2, Clock, AlertCircle, Coins } from 'lucide-react';

interface Props {
  factures: Facture[];
  dossiers: DossierSinistre[];
  onOpenFactureModal: (facture: Facture, dossier: DossierSinistre) => void;
  onMarquerPayee: (factureId: string) => void;
  onOpenEncaisserModal?: (facture: Facture, dossier: DossierSinistre) => void;
}

export const FacturationView: React.FC<Props> = ({
  factures,
  dossiers,
  onOpenFactureModal,
  onMarquerPayee,
  onOpenEncaisserModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaiement, setFilterPaiement] = useState<string>('ALL');

  const filteredFactures = factures.filter((f) => {
    const matchedDossier = dossiers.find((d) => d.id === f.dossierId);
    const imm = matchedDossier?.vehicule.immatriculation || '';
    const searchString = `
      ${f.numeroFacture} 
      ${matchedDossier?.client.nom || ''} 
      ${matchedDossier?.assurance?.nom || ''} 
      ${imm}
      ${formatMatricule(imm, 'LATIN')}
      ${formatMatricule(imm, 'ARABE')}
    `.toLowerCase();

    const matchSearch = searchString.includes(searchTerm.toLowerCase());
    const matchFilter = filterPaiement === 'ALL' || f.statutPaiement === filterPaiement;
    return matchSearch && matchFilter;
  });

  const totalFacture = factures.reduce((acc, f) => acc + f.totalTTC, 0);
  const totalEncaisse = factures.reduce((acc, f) => acc + f.montantRegle, 0);
  const totalReste = Math.max(0, totalFacture - totalEncaisse);

  return (
    <div className="space-y-6">
      {/* Top Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Facturé TTC</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatDH(totalFacture)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">TVA 20% incluse</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Total Encaissé</span>
          <p className="text-2xl font-black text-emerald-700 font-mono mt-1">{formatDH(totalEncaisse)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Virements reçus des assurances</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-brand-600 uppercase">Reste à Recouvrer</span>
          <p className="text-2xl font-black text-brand-700 font-mono mt-1">{formatDH(totalReste)}</p>
          <p className="text-[11px] text-brand-600 mt-0.5">Créances clients & assurances</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher facture, client, matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={filterPaiement}
            onChange={(e) => setFilterPaiement(e.target.value)}
            className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">Tous les statuts de paiement</option>
            <option value="REGLE">Réglées</option>
            <option value="EN_ATTENTE">En attente de paiement</option>
            <option value="PARTIEL">Partiel</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">N° Facture</th>
                <th className="py-3 px-4">Date Émission</th>
                <th className="py-3 px-4">Destinataire (Assurance / Client)</th>
                <th className="py-3 px-4">Véhicule Concerne</th>
                <th className="py-3 px-4 text-right">Total HT</th>
                <th className="py-3 px-4 text-right">Total TTC</th>
                <th className="py-3 px-4 text-center">Statut Paiement</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFactures.map((fac) => {
                const matchedDossier = dossiers.find((d) => d.id === fac.dossierId) || dossiers[0];
                const badge = getStatutPaiementBadge(fac.statutPaiement);

                return (
                  <tr key={fac.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {fac.numeroFacture}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(fac.dateEmission)}
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900">
                        {fac.destinataire === 'ASSURANCE' ? (matchedDossier?.assurance?.nom || 'Assurance') : matchedDossier?.client.nom}
                      </strong>
                      <span className="block text-[11px] text-slate-500">
                        Client : {matchedDossier?.client.nom}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">
                        {matchedDossier?.vehicule.marque} {matchedDossier?.vehicule.modele}
                      </span>
                      <span className="block font-mono text-[11px] text-slate-500" dir="ltr">
                        {matchedDossier ? formatMatricule(matchedDossier.vehicule.immatriculation, 'LATIN') : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatDH(fac.totalHT)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatDH(fac.totalTTC)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {fac.statutPaiement !== 'REGLE' && (
                          <button
                            onClick={() => {
                              if (onOpenEncaisserModal && matchedDossier) {
                                onOpenEncaisserModal(fac, matchedDossier);
                              } else {
                                onMarquerPayee(fac.id);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors shadow-sm"
                            title="Encaisser le paiement (Espèces, Chèque, Virement, Effet)"
                          >
                            <Coins className="w-3.5 h-3.5" /> Encaisser
                          </button>
                        )}
                        <button
                          onClick={() => onOpenFactureModal(fac, matchedDossier)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" /> Voir / Imprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
