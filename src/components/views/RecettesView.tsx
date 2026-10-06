'use client';

import React, { useState } from 'react';
import { ReglementRecette, ModePaiement, StatutEncaissement, DossierSinistre } from '@/types';
import { formatDH, formatDate } from '@/lib/utils';
import { BordereauRemiseBancaireModal } from '@/components/documents/BordereauRemiseBancaireModal';
import { 
  CreditCard, 
  Coins, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Building,
  Check,
  TrendingUp,
  Receipt,
  FileCheck2
} from 'lucide-react';

interface Props {
  recettes: ReglementRecette[];
  dossiers: DossierSinistre[];
  onAddRecette: (newRecette: ReglementRecette) => void;
  onUpdateStatutRecette: (recetteId: string, statut: StatutEncaissement) => void;
}

export const RecettesView: React.FC<Props> = ({
  recettes,
  dossiers,
  onAddRecette,
  onUpdateStatutRecette,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterStatut, setFilterStatut] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBordereauModal, setShowBordereauModal] = useState(false);

  // Form State for new payment
  const [payeurNom, setPayeurNom] = useState('');
  const [sourceType, setSourceType] = useState<'ASSURANCE' | 'CLIENT' | 'PARTENAIRE'>('ASSURANCE');
  const [selectedDossierId, setSelectedDossierId] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('CHEQUE');
  const [montant, setMontant] = useState(1500);
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]);
  const [dateEcheance, setDateEcheance] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [refDoc, setRefDoc] = useState('');
  const [banque, setBanque] = useState('Attijariwafa Bank');
  const [notes, setNotes] = useState('');

  // Calculations
  const totalEncaisse = recettes
    .filter((r) => r.statut === 'ENCAISSE')
    .reduce((acc, r) => acc + r.montant, 0);

  const totalChequesEnAttente = recettes
    .filter((r) => r.modePaiement === 'CHEQUE' && r.statut === 'EN_ATTENTE_ECHEANCE')
    .reduce((acc, r) => acc + r.montant, 0);

  const totalEffetsEnAttente = recettes
    .filter((r) => r.modePaiement === 'EFFET' && r.statut === 'EN_ATTENTE_ECHEANCE')
    .reduce((acc, r) => acc + r.montant, 0);

  const totalEspeces = recettes
    .filter((r) => r.modePaiement === 'ESPECES')
    .reduce((acc, r) => acc + r.montant, 0);

  const totalVirements = recettes
    .filter((r) => r.modePaiement === 'VIREMENT')
    .reduce((acc, r) => acc + r.montant, 0);

  // Filtered list
  const filteredRecettes = recettes.filter((r) => {
    const matchSearch =
      r.payeurNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.numeroRecu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.referenceDocument && r.referenceDocument.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.banque && r.banque.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchMode = filterMode === 'ALL' || r.modePaiement === filterMode;
    const matchStatut = filterStatut === 'ALL' || r.statut === filterStatut;

    return matchSearch && matchMode && matchStatut;
  });

  const handleSaveRecette = (e: React.FormEvent) => {
    e.preventDefault();
    const seq = Math.floor(1000 + Math.random() * 9000);
    const newR: ReglementRecette = {
      id: `rec-${Date.now()}`,
      numeroRecu: `REC-2026-${seq}`,
      dossierId: selectedDossierId || undefined,
      payeurNom: payeurNom || 'Client Comptoir',
      sourceType,
      modePaiement,
      montant,
      datePaiement,
      dateEcheance: (modePaiement === 'CHEQUE' || modePaiement === 'EFFET') ? dateEcheance : undefined,
      referenceDocument: refDoc || `${modePaiement}-${seq}`,
      banque: (modePaiement !== 'ESPECES') ? banque : undefined,
      statut: (modePaiement === 'ESPECES' || modePaiement === 'VIREMENT') ? 'ENCAISSE' : 'EN_ATTENTE_ECHEANCE',
      dateEncaissementEffectif: (modePaiement === 'ESPECES' || modePaiement === 'VIREMENT') ? datePaiement : undefined,
      notes,
    };

    onAddRecette(newR);
    setShowAddModal(false);
    setPayeurNom('');
    setRefDoc('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            État des Recettes & Trésorerie
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des encaissements : Espèces, Chèques en coffre, Virements bancaires et Traites (Effets) à échéance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBordereauModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <FileCheck2 className="w-4 h-4" />
            Bordereau de Remise Bancaire
            {(totalChequesEnAttente > 0 || totalEffetsEnAttente > 0) && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-800 text-blue-100 rounded-full text-[10px]">
                {recettes.filter(r => (r.modePaiement === 'CHEQUE' || r.modePaiement === 'EFFET') && r.statut === 'EN_ATTENTE_ECHEANCE').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Enregistrer un Règlement
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Encaissé Réel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase">Encaissé Réellement</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-700 font-mono mt-2">{formatDH(totalEncaisse)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Fonds disponibles en caisse & banque</p>
        </div>

        {/* Chèques en coffre / En attente d'échéance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-blue-600 uppercase">Chèques en Attente</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-blue-700 font-mono mt-2">{formatDH(totalChequesEnAttente)}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Chèques en portefeuille à remettre</p>
          </div>
          <button
            onClick={() => setShowBordereauModal(true)}
            className="mt-3 text-left text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
          >
            <FileCheck2 className="w-3.5 h-3.5" /> Établir Bordereau Chèques →
          </button>
        </div>

        {/* Effets de commerce / Traites */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-amber-600 uppercase">Effets / Traites</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-amber-700 font-mono mt-2">{formatDH(totalEffetsEnAttente)}</h3>
            <p className="text-[11px] text-slate-500 mt-1">À échéance 30j / 60j / 90j</p>
          </div>
          <button
            onClick={() => setShowBordereauModal(true)}
            className="mt-3 text-left text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 hover:underline"
          >
            <FileCheck2 className="w-3.5 h-3.5" /> Établir Bordereau Traites →
          </button>
        </div>

        {/* Total Caisse Espèces */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-purple-600 uppercase">Caisse Espèces</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-700 font-mono mt-2">{formatDH(totalEspeces)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Franchises & acomptes payés cash</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher payeur, N° reçu, N° chèque, banque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tous les modes</option>
              <option value="CHEQUE">Chèque</option>
              <option value="ESPECES">Espèces</option>
              <option value="VIREMENT">Virement</option>
              <option value="EFFET">Effet (Traite)</option>
            </select>

            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ENCAISSE">Encaissé</option>
              <option value="EN_ATTENTE_ECHEANCE">En attente d'échéance</option>
              <option value="IMPAYE_REJETE">Rejeté / Impayé</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">N° Reçu</th>
                <th className="py-3 px-4">Payeur / Source</th>
                <th className="py-3 px-4 text-center">Mode de Paiement</th>
                <th className="py-3 px-4">Référence & Banque</th>
                <th className="py-3 px-4">Date Paiement</th>
                <th className="py-3 px-4">Date Échéance</th>
                <th className="py-3 px-4 text-right">Montant (DH)</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecettes.map((rec) => {
                const isEnAttente = rec.statut === 'EN_ATTENTE_ECHEANCE';
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {rec.numeroRecu}
                    </td>

                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{rec.payeurNom}</strong>
                      <span className="text-[11px] text-slate-500">Source: {rec.sourceType}</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          rec.modePaiement === 'CHEQUE'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : rec.modePaiement === 'ESPECES'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : rec.modePaiement === 'VIREMENT'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {rec.modePaiement}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-slate-800 block">
                        {rec.referenceDocument || '-'}
                      </span>
                      {rec.banque && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" /> {rec.banque}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(rec.datePaiement)}
                    </td>

                    <td className="py-3 px-4">
                      {rec.dateEcheance ? (
                        <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                          {formatDate(rec.dateEcheance)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      {formatDH(rec.montant)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {rec.statut === 'ENCAISSE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" /> Encaissé
                        </span>
                      )}
                      {rec.statut === 'EN_ATTENTE_ECHEANCE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> En attente échéance
                        </span>
                      )}
                      {rec.statut === 'IMPAYE_REJETE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> Rejeté / Impayé
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEnAttente && (
                        <button
                          onClick={() => onUpdateStatutRecette(rec.id, 'ENCAISSE')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors"
                        >
                          Valider Encaissement
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Payment / Receipt */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Enregistrer un Règlement / Recette</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRecette} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source / Origine *</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="ASSURANCE">Compagnie d'Assurance</option>
                    <option value="CLIENT">Client direct (Franchise / Comptant)</option>
                    <option value="PARTENAIRE">Partenaire apporteur</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payeur (Nom / Société) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Wafa Assurance ou Nom Client"
                    value={payeurNom}
                    onChange={(e) => setPayeurNom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dossier Sinistre Lié (Optionnel)</label>
                <select
                  value={selectedDossierId}
                  onChange={(e) => setSelectedDossierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner un dossier...</option>
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.numeroDossier} - {d.client.nom} ({d.vehicule.immatriculation}) - {d.typeDossier === 'PARTICULIER_COMPTANT' ? 'Particulier (Comptant)' : (d.assurance?.nom || 'Assurance')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mode de Paiement *</label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                    className="w-full px-3 py-2 border rounded-lg font-bold text-slate-900"
                  >
                    <option value="CHEQUE">Chèque bancaire</option>
                    <option value="ESPECES">Espèces (Cash)</option>
                    <option value="VIREMENT">Virement bancaire</option>
                    <option value="EFFET">Effet de commerce (Traite)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant (DH) *</label>
                  <input
                    type="number"
                    required
                    value={montant}
                    onChange={(e) => setMontant(+e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-black text-sm text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Paiement *</label>
                  <input
                    type="date"
                    required
                    value={datePaiement}
                    onChange={(e) => setDatePaiement(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date Échéance {(modePaiement === 'CHEQUE' || modePaiement === 'EFFET') && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="date"
                    disabled={modePaiement === 'ESPECES' || modePaiement === 'VIREMENT'}
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg disabled:bg-slate-100 disabled:text-slate-400 font-mono font-semibold"
                  />
                </div>
              </div>

              {modePaiement !== 'ESPECES' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      N° Chèque / N° Effet / Réf Virement
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CHQ 849201 ou VIR-99"
                      value={refDoc}
                      onChange={(e) => setRefDoc(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Banque émettrice</label>
                    <select
                      value={banque}
                      onChange={(e) => setBanque(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                      <option value="Banque Populaire (BCP)">Banque Populaire (BCP)</option>
                      <option value="BMCE Bank of Africa">BMCE Bank of Africa</option>
                      <option value="CIH Bank">CIH Bank</option>
                      <option value="Société Générale Maroc">Société Générale Maroc</option>
                      <option value="Crédit Agricole du Maroc">Crédit Agricole du Maroc</option>
                      <option value="Crédit du Maroc">Crédit du Maroc</option>
                      <option value="Al Barid Bank">Al Barid Bank</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Observations</label>
                <input
                  type="text"
                  placeholder="Remarques éventuelles..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Enregistrer l'Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bordereau de Remise Bancaire de Chèques & Effets */}
      {showBordereauModal && (
        <BordereauRemiseBancaireModal
          recettes={recettes}
          onClose={() => setShowBordereauModal(false)}
          onValiderDepot={(selectedIds) => {
            selectedIds.forEach((id) => {
              onUpdateStatutRecette(id, 'ENCAISSE');
            });
          }}
        />
      )}
    </div>
  );
};
