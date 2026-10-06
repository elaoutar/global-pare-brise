'use client';

import React, { useState } from 'react';
import { DossierSinistre, Facture, ModePaiement } from '@/types';
import { formatDH } from '@/lib/utils';
import { 
  X, 
  Check, 
  Coins, 
  CreditCard, 
  Building2, 
  FileText, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

interface Props {
  dossier: DossierSinistre;
  facture?: Facture;
  onClose: () => void;
  onConfirmPaiement: (data: {
    modePaiement: ModePaiement;
    montant: number;
    datePaiement: string;
    banque?: string;
    referenceDocument?: string;
    dateEcheance?: string;
    notes?: string;
  }) => void;
}

const BANQUES_MAROC = [
  'Attijariwafa Bank',
  'Banque Populaire (BCP)',
  'Bank of Africa (BMCE)',
  'CIH Bank',
  'Crédit Agricole du Maroc',
  'Société Générale Maroc',
  'BMCI (BNP Paribas)',
  'CFG Bank',
  'Al Barid Bank',
];

export const EncaisserPaiementModal: React.FC<Props> = ({
  dossier,
  facture,
  onClose,
  onConfirmPaiement,
}) => {
  const montantDu = facture 
    ? Math.max(0, facture.totalTTC - (facture.montantRegle || 0))
    : dossier.montantTotalTTC;

  const [modePaiement, setModePaiement] = useState<ModePaiement>('ESPECES');
  const [montant, setMontant] = useState<number>(montantDu || 1800);
  const [datePaiement, setDatePaiement] = useState<string>(new Date().toISOString().split('T')[0]);
  const [banque, setBanque] = useState<string>('Attijariwafa Bank');
  const [referenceDocument, setReferenceDocument] = useState<string>('');
  const [dateEcheance, setDateEcheance] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (montant <= 0) return;

    onConfirmPaiement({
      modePaiement,
      montant: Number(montant),
      datePaiement,
      banque: (modePaiement === 'CHEQUE' || modePaiement === 'EFFET' || modePaiement === 'VIREMENT') ? banque : undefined,
      referenceDocument: referenceDocument.trim() || undefined,
      dateEcheance: (modePaiement === 'CHEQUE' || modePaiement === 'EFFET') ? dateEcheance : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header (Sticky at top) */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-900 text-white shadow-sm">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              Encaisser le Règlement Client / Facture
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Dossier : <span className="font-mono font-bold text-white">{dossier.numeroDossier}</span> • {dossier.client.nom}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Target vehicle reminder */}
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Véhicule & Intervention</p>
              <p className="font-bold text-slate-900">{dossier.vehicule.marque} {dossier.vehicule.modele} ({dossier.vehicule.annee})</p>
              <p className="text-[11px] font-mono font-bold text-amber-800">{dossier.vehicule.immatriculation}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Montant Total Facturé</p>
              <p className="text-lg font-black font-mono text-emerald-700">{formatDH(montantDu)}</p>
            </div>
          </div>

          {/* Payment Mode Selector Grid */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              Sélectionnez le Mode de Règlement *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setModePaiement('ESPECES')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                  modePaiement === 'ESPECES'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <Coins className="w-5 h-5 text-emerald-600" />
                <span>Espèces</span>
              </button>

              <button
                type="button"
                onClick={() => setModePaiement('VIREMENT')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                  modePaiement === 'VIREMENT'
                    ? 'border-brand-500 bg-brand-50 text-brand-950 font-bold ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <Building2 className="w-5 h-5 text-brand-600" />
                <span>Virement</span>
              </button>

              <button
                type="button"
                onClick={() => setModePaiement('CHEQUE')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                  modePaiement === 'CHEQUE'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Chèque</span>
              </button>

              <button
                type="button"
                onClick={() => setModePaiement('EFFET')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                  modePaiement === 'EFFET'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-600" />
                <span>Effet / Traite</span>
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Montant Encaissé (DH TTC) *</label>
              <input
                type="number"
                required
                min="1"
                value={montant}
                onChange={(e) => setMontant(+e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date d'Encaissement *</label>
              <input
                type="date"
                required
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Conditional Fields: Cheque & Effet */}
          {(modePaiement === 'CHEQUE' || modePaiement === 'EFFET') && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-brand-600" />
                Détails du {modePaiement === 'CHEQUE' ? 'Chèque' : 'de l\'Effet / Traite'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Banque Émettrice *</label>
                  <select
                    value={banque}
                    onChange={(e) => setBanque(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-medium focus:ring-2 focus:ring-brand-500"
                  >
                    {BANQUES_MAROC.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    N° {modePaiement === 'CHEQUE' ? 'Chèque (7 chiffres)' : 'Effet'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 8492015"
                    value={referenceDocument}
                    onChange={(e) => setReferenceDocument(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-medium text-slate-600 mb-1">
                    Date d'Échéance / Encaissement prévu *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono bg-white focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Permet le suivi dans l'Échéancier de Trésorerie avant encaissement effectif.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Fields: Virement */}
          {modePaiement === 'VIREMENT' && (
            <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 space-y-2">
              <label className="block font-medium text-brand-900 mb-1">
                Référence ou N° d'Ordre de Virement (Optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: VIR-CLI-2026/890"
                value={referenceDocument}
                onChange={(e) => setReferenceDocument(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarques / Observations (Optionnel)</label>
            <input
              type="text"
              placeholder="Ex: Reçu délivré au comptoir, solde complet..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              Valider l'Encaissement ({formatDH(montant)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
