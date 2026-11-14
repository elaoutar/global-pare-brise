'use client';

import React, { useState } from 'react';
import { Facture, DossierSinistre } from '@/types';
import { formatDH, formatDate, getStatutPaiementBadge } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { FileText, Printer, Search, CheckCircle2, Clock, AlertCircle, Coins, Calendar, Pencil, Check, X, Plus, Trash2, FolderKanban, ShoppingBag, Layers } from 'lucide-react';

interface Props {
  factures: Facture[];
  dossiers: DossierSinistre[];
  onOpenFactureModal: (facture: Facture, dossier?: DossierSinistre) => void;
  onMarquerPayee: (factureId: string) => void;
  onOpenEncaisserModal?: (facture: Facture, dossier?: DossierSinistre) => void;
  onUpdateNumeroFacture?: (factureId: string, newNumero: string) => void;
  onDeleteFacture?: (factureId: string) => void;
  onNewDirectFacture?: () => void;
}

export const FacturationView: React.FC<Props> = ({
  factures,
  dossiers,
  onOpenFactureModal,
  onMarquerPayee,
  onOpenEncaisserModal,
  onUpdateNumeroFacture,
  onDeleteFacture,
  onNewDirectFacture,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaiement, setFilterPaiement] = useState<string>('ALL');
  const [filterMois, setFilterMois] = useState<string>('ALL');
  const [filterOrigine, setFilterOrigine] = useState<'ALL' | 'DOSSIER' | 'DIRECT'>('ALL');

  // État édition rapide numéro de facture
  const [editingFactureId, setEditingFactureId] = useState<string | null>(null);
  const [editNumeroValue, setEditNumeroValue] = useState('');

  const handleSaveNumero = (factureId: string) => {
    const cleanNum = editNumeroValue.trim().toUpperCase();
    if (!cleanNum) return;
    onUpdateNumeroFacture?.(factureId, cleanNum);
    setEditingFactureId(null);
  };

  // Factures filtrées par mois pour les compteurs
  const facturesByMois = filterMois === 'ALL'
    ? factures
    : factures.filter((f) => f.dateEmission && f.dateEmission.startsWith(filterMois));

  const countAll = facturesByMois.length;
  const countDossier = facturesByMois.filter((f) => !!f.dossierId).length;
  const countDirect = facturesByMois.filter((f) => !f.dossierId).length;

  const baseFactures = facturesByMois.filter((f) => {
    if (filterOrigine === 'DOSSIER') return !!f.dossierId;
    if (filterOrigine === 'DIRECT') return !f.dossierId;
    return true;
  });

  const filteredFactures = baseFactures.filter((f) => {
    const matchedDossier = dossiers.find((d) => d.id === f.dossierId);
    const imm = matchedDossier?.vehicule.immatriculation || f.immatriculation || '';
    const clientName = matchedDossier?.client.nom || f.clientNom || '';
    const searchString = `
      ${f.numeroFacture} 
      ${clientName} 
      ${matchedDossier?.assurance?.nom || ''} 
      ${imm}
      ${formatMatricule(imm, 'LATIN')}
      ${formatMatricule(imm, 'ARABE')}
    `.toLowerCase();

    const matchSearch = searchString.includes(searchTerm.toLowerCase());
    const matchFilter = filterPaiement === 'ALL' || f.statutPaiement === filterPaiement;
    return matchSearch && matchFilter;
  });

  const totalFacture = baseFactures.reduce((acc, f) => acc + f.totalTTC, 0);
  const totalEncaisse = baseFactures.reduce((acc, f) => acc + f.montantRegle, 0);
  const totalReste = Math.max(0, totalFacture - totalEncaisse);

  return (
    <div className="space-y-6">
      {/* Top Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Facturé TTC</span>
            {filterOrigine !== 'ALL' && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                filterOrigine === 'DOSSIER' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {filterOrigine === 'DOSSIER' ? 'Dossiers Sinistres' : 'Ventes Directes'}
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatDH(totalFacture)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">TVA 20% incluse</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Total Encaissé</span>
            {filterOrigine !== 'ALL' && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                filterOrigine === 'DOSSIER' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {filterOrigine === 'DOSSIER' ? 'Dossiers Sinistres' : 'Ventes Directes'}
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono mt-1">{formatDH(totalEncaisse)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Règlements reçus</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-600 uppercase">Reste à Recouvrer</span>
            {filterOrigine !== 'ALL' && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                filterOrigine === 'DOSSIER' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {filterOrigine === 'DOSSIER' ? 'Dossiers Sinistres' : 'Ventes Directes'}
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-brand-700 font-mono mt-1">{formatDH(totalReste)}</p>
          <p className="text-[11px] text-brand-600 mt-0.5">Créances en attente</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Onglets Filtre Origine */}
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-0 border-b border-slate-200 bg-slate-50/60">
          <button
            type="button"
            onClick={() => setFilterOrigine('ALL')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              filterOrigine === 'ALL'
                ? 'border-brand-600 text-brand-700 bg-white rounded-t-lg shadow-2xs -mb-px'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Toutes les Factures
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              filterOrigine === 'ALL' ? 'bg-brand-50 text-brand-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {countAll}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterOrigine('DOSSIER')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              filterOrigine === 'DOSSIER'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg shadow-2xs -mb-px'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-sky-600" />
            Factures Dossiers (Sinistres / Assurances)
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              filterOrigine === 'DOSSIER' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {countDossier}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterOrigine('DIRECT')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              filterOrigine === 'DIRECT'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs -mb-px'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            Factures Directes (Vente Comptoir / Stock)
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              filterOrigine === 'DIRECT' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {countDirect}
            </span>
          </button>
        </div>

        {/* Header bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <div className="relative flex-1 w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher facture, client, matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Filtre par Mois */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
              <input
                type="month"
                value={filterMois === 'ALL' ? '' : filterMois}
                onChange={(e) => setFilterMois(e.target.value || 'ALL')}
                className="text-xs bg-transparent font-mono font-bold text-slate-800 focus:outline-none"
                title="Filtrer par mois"
              />
              {filterMois !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFilterMois('ALL')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-semibold"
                  title="Tous les mois"
                >
                  ✕
                </button>
              )}
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

            {onNewDirectFacture && (
              <button
                type="button"
                onClick={onNewDirectFacture}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                title="Créer une facture directe (vente comptoir, pièces du stock, sans dossier sinistre)"
              >
                <Plus className="w-4 h-4" /> Nouvelle Facture Directe
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">N° Facture</th>
                <th className="py-3 px-4">Date Émission</th>
                <th className="py-3 px-4">Destinataire (Assurance / Client)</th>
                <th className="py-3 px-4">Véhicule / Prestation</th>
                <th className="py-3 px-4 text-right">Total HT</th>
                <th className="py-3 px-4 text-right">Total TTC</th>
                <th className="py-3 px-4 text-center">Statut Paiement</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFactures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    Aucune facture trouvée.
                  </td>
                </tr>
              ) : (
                filteredFactures.map((fac) => {
                  const matchedDossier = dossiers.find((d) => d.id === fac.dossierId);
                  const clientNomAffiche = matchedDossier?.client.nom || fac.clientNom || 'Client Comptoir';
                  const isAssuranceOrAzur = fac.destinataire === 'ASSURANCE' || fac.destinataire === 'AZUR_GLASS';
                  const badge = getStatutPaiementBadge(fac.statutPaiement);

                  return (
                    <tr key={fac.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {editingFactureId === fac.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editNumeroValue}
                              onChange={(e) => setEditNumeroValue(e.target.value.toUpperCase())}
                              className="px-2 py-0.5 text-xs border-2 border-emerald-500 rounded bg-emerald-50/50 font-mono font-bold w-28 focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNumero(fac.id);
                                if (e.key === 'Escape') setEditingFactureId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNumero(fac.id)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition shadow-xs"
                              title="Valider"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFactureId(null)}
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 group">
                              <span className="text-slate-900">{fac.numeroFacture}</span>
                              {onUpdateNumeroFacture && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFactureId(fac.id);
                                    setEditNumeroValue(fac.numeroFacture);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded transition"
                                  title="Modifier le N° de facture"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div>
                              {fac.dossierId ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200" title={matchedDossier ? `Liée au dossier ${matchedDossier.numeroDossier}` : 'Dossier Sinistre'}>
                                  <FolderKanban className="w-2.5 h-2.5" />
                                  {matchedDossier ? matchedDossier.numeroDossier : 'Dossier'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Facture directe sans dossier sinistre">
                                  <ShoppingBag className="w-2.5 h-2.5" />
                                  Vente Directe
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(fac.dateEmission)}
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900">
                          {isAssuranceOrAzur ? (matchedDossier?.assurance?.nom || 'AZUR GLASS') : clientNomAffiche}
                        </strong>
                        <span className="block text-[11px] text-slate-500">
                          {isAssuranceOrAzur ? `Assuré : ${clientNomAffiche}` : (fac.clientIce ? `ICE: ${fac.clientIce}` : 'Vente directe')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {matchedDossier ? (
                          <>
                            <span className="font-semibold text-slate-800">
                              {matchedDossier.vehicule.marque} {matchedDossier.vehicule.modele}
                            </span>
                            <span className="block font-mono text-[11px] text-slate-500" dir="ltr">
                              {formatMatricule(matchedDossier.vehicule.immatriculation, 'LATIN')}
                            </span>
                          </>
                        ) : fac.vehiculeInfo ? (
                          <>
                            <span className="font-semibold text-slate-800">{fac.vehiculeInfo}</span>
                            {fac.immatriculation && (
                              <span className="block font-mono text-[11px] text-slate-500" dir="ltr">
                                {formatMatricule(fac.immatriculation, 'LATIN')}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Vente Comptoir / Stock
                          </span>
                        )}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {fac.statutPaiement !== 'REGLE' && (
                            <button
                              onClick={() => {
                                if (onOpenEncaisserModal) {
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
                          {onDeleteFacture && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la facture ${fac.numeroFacture} ?`)) {
                                  onDeleteFacture(fac.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Supprimer la facture"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
  );
};
