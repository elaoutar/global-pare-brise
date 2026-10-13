'use client';

import React, { useRef, useState } from 'react';
import { Facture, DossierSinistre } from '@/types';
import { GARAGE_INFO, AZUR_GLASS_INFO } from '@/lib/data';
import { formatDH, formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { FileText, Save, Check } from 'lucide-react';
import { DocumentActionBar } from './DocumentActionBar';

interface Props {
  facture: Facture;
  dossier: DossierSinistre;
  onClose: () => void;
  onUpdateObservations?: (newObservations: string) => void;
}

export const FactureModal: React.FC<Props> = ({
  facture,
  dossier,
  onClose,
  onUpdateObservations,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const isAssuranceOrAzur =
    facture.destinataire === 'AZUR_GLASS' ||
    facture.destinataire === 'ASSURANCE' ||
    dossier.typeDossier === 'ASSURANCE';

  // Calcul du cash (franchise non offerte + TVA exclue éventuelle) et du reste en virement
  const effectiveFranchise = dossier.franchiseOfferte ? 0 : (dossier.montantFranchise || 0);
  const effectiveTvaExclue = Number(dossier.tvaExclueParAssurance) || 0;
  const montantCash =
    facture.montantRegleEspeces !== undefined
      ? facture.montantRegleEspeces
      : effectiveFranchise + effectiveTvaExclue;

  const resteVirement =
    facture.montantSoldeVirement !== undefined
      ? facture.montantSoldeVirement
      : Math.max(0, +(facture.totalTTC - montantCash).toFixed(2));

  // Observation par défaut ou personnalisée
  const defaultObservation = isAssuranceOrAzur
    ? montantCash > 0
      ? `Règlement : ${formatDH(montantCash)} réglé en espèces et le solde de ${formatDH(resteVirement)} par virement bancaire.`
      : `Règlement : ${formatDH(facture.totalTTC)} par virement bancaire.`
    : facture.observations || '';

  const [observations, setObservations] = useState(facture.observations || defaultObservation);
  const [hasSavedObs, setHasSavedObs] = useState(false);

  const handleSaveObs = () => {
    onUpdateObservations?.(observations);
    setHasSavedObs(true);
    setTimeout(() => setHasSavedObs(false), 2500);
  };

  const destinataireNom = isAssuranceOrAzur
    ? `${AZUR_GLASS_INFO.nom} (Intermédiaire Assurances)`
    : dossier.client.nom;

  const shareMsg = `Bonjour ${dossier.client.nom}, voici votre Facture N° ${facture.numeroFacture} d'un montant de ${formatDH(facture.totalTTC)} pour l'intervention sur votre véhicule ${dossier.vehicule.immatriculation} chez GLOBAL PARE-BRISE.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Modern Document Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`FACTURE-${facture.numeroFacture}`}
          documentTitle={`Facture Officielle #${facture.numeroFacture}`}
          subtitle={`Destinataire : ${destinataireNom} • Véhicule : ${dossier.vehicule.immatriculation}`}
          clientPhone={dossier.client.telephone}
          shareMessage={shareMsg}
          badgeText={isAssuranceOrAzur ? 'Facture AZUR GLASS' : 'Facture Client'}
          badgeColor="bg-emerald-600"
          onClose={onClose}
        />

        {/* Barre d'édition d'observations (visible à l'écran uniquement) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 no-print">
          <div className="flex-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Observation Facture :</span>
            <input
              type="text"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              onBlur={handleSaveObs}
              placeholder="Ajouter une observation ou mention particulière sur la facture..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveObs}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
          >
            {hasSavedObs ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>

        {/* Printable Invoice Page (Strict A4) */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl bg-white"
          >
            {/* Top Bar with Logo & Legal Identifiers */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
              <div>
                <img
                  src={GARAGE_INFO.logoUrl}
                  alt={GARAGE_INFO.nom}
                  className="h-14 w-auto max-w-[260px] object-contain mb-2"
                />
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                  Remplacement & Réparation de Pare-Brise et Vitrage Automobile
                </p>
                <p className="text-xs text-slate-600">{GARAGE_INFO.adresse}</p>
                <p className="text-xs text-slate-600">Tél : {GARAGE_INFO.telephone}</p>
                <p className="text-xs text-slate-600">Email : {GARAGE_INFO.email}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase tracking-wider mb-2">
                  FACTURE N° {facture.numeroFacture}
                </span>
                <p className="text-xs text-slate-600">
                  Date émission : <span className="font-medium text-slate-900">{formatDate(facture.dateEmission)}</span>
                </p>
                <p className="text-xs text-slate-600">
                  Date échéance : <span className="font-medium text-slate-900">{formatDate(facture.dateEcheance)}</span>
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Dossier Réf : <span className="font-mono font-semibold">{dossier.numeroDossier}</span>
                </p>
              </div>
            </div>

            {/* Client & Insurance Block */}
            <div className="grid grid-cols-2 gap-6 my-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Facturé à :</p>
                {isAssuranceOrAzur ? (
                  <>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                        Partenaire Déclarant
                      </span>
                    </div>
                    <p className="text-base font-black text-slate-900">{AZUR_GLASS_INFO.nom} SARL</p>
                    <p className="text-xs text-slate-600">{AZUR_GLASS_INFO.designationComplete}</p>
                    <p className="text-xs text-slate-600">{AZUR_GLASS_INFO.adresse}</p>
                    <p className="text-xs text-slate-600">Tél : {AZUR_GLASS_INFO.telephone} • {AZUR_GLASS_INFO.email}</p>
                    <p className="text-xs text-slate-700 font-mono mt-1">
                      <strong>ICE :</strong> {AZUR_GLASS_INFO.ice}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-700 space-y-0.5">
                      <p>
                        <strong>Cie Assurance :</strong> {dossier.assurance?.nom || 'Assurance'}{' '}
                        {dossier.agenceAssurance ? `(${dossier.agenceAssurance})` : ''}
                      </p>
                      <p className="font-mono"><strong>N° Sinistre :</strong> {dossier.numeroSinistre || '-'}</p>
                      <p className="font-mono"><strong>N° Police :</strong> {dossier.numeroPolice || '-'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-slate-900">{dossier.client.nom}</p>
                    <p className="text-xs text-slate-600">Tél : {dossier.client.telephone}</p>
                    <p className="text-xs text-slate-600">CIN : {dossier.client.cin || 'Particulier'}</p>
                    <p className="text-xs text-slate-600">Ville : {dossier.client.ville}</p>
                  </>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Véhicule & Travaux Réalisés :
                </p>
                <p className="font-semibold text-slate-900">
                  {dossier.vehicule.marque} {dossier.vehicule.modele} ({dossier.vehicule.annee})
                </p>
                <div className="mt-2 inline-flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 text-xs">
                  <span className="font-medium text-slate-500">Immatriculation :</span>
                  <span className="font-mono font-bold text-slate-900" dir="ltr">
                    {formatMatricule(dossier.vehicule.immatriculation, 'LATIN')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  N° Châssis : <span className="font-mono">{dossier.vehicule.chassisVin || 'Conforme'}</span>
                </p>
                <p className="text-xs text-slate-600">Souscripteur : {dossier.client.nom}</p>
              </div>
            </div>

            {/* Table of items */}
            <div className="my-6 border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Désignation</th>
                    <th className="py-3 px-4 text-center">Réf / Eurocode</th>
                    <th className="py-3 px-4 text-center">Qté</th>
                    <th className="py-3 px-4 text-right">P.U HT (DH)</th>
                    <th className="py-3 px-4 text-center">TVA</th>
                    <th className="py-3 px-4 text-right">Total HT (DH)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facture.lignes.map((ligne, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-900">{ligne.designation}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{ligne.codeEurocode || '-'}</td>
                      <td className="py-3 px-4 text-center font-medium">{ligne.quantite}</td>
                      <td className="py-3 px-4 text-right font-mono">{ligne.prixUnitaireHT.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{ligne.tauxTva}%</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">{ligne.totalHT.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Lignes Franchise & TVA (si dossier Assurance / AZUR GLASS) */}
                  {isAssuranceOrAzur && (
                    <>
                      {(dossier.montantFranchise || 0) > 0 && (
                        <tr className="bg-slate-50/70 border-t border-slate-200">
                          <td colSpan={5} className="py-2.5 px-4 font-semibold text-slate-800">
                            Franchise
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatDH(dossier.montantFranchise)}
                          </td>
                        </tr>
                      )}

                      {effectiveTvaExclue > 0 && (
                        <tr className="bg-slate-50/70 border-t border-slate-200">
                          <td colSpan={5} className="py-2.5 px-4 font-semibold text-slate-800">
                            TVA
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatDH(effectiveTvaExclue)}
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals & Observations */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 my-6 pt-2">
              {/* Bloc Observations imprimable */}
              <div className="flex-1 w-full sm:max-w-md text-xs text-slate-600">
                {observations && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 uppercase text-[10px] block">Observations & Remarques :</span>
                    <p className="italic text-slate-800 whitespace-pre-wrap">{observations}</p>
                  </div>
                )}
              </div>

              {/* Totaux */}
              <div className="w-full sm:w-72 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Hors Taxes (HT) :</span>
                  <span className="font-mono font-semibold">{formatDH(facture.totalHT)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>T.V.A (20.00%) :</span>
                  <span className="font-mono font-semibold">{formatDH(facture.totalTVA)}</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total T.T.C :</span>
                  <span className="font-mono text-emerald-800 text-base">{formatDH(facture.totalTTC)}</span>
                </div>
              </div>
            </div>

            {/* Legal Moroccan Mentions Footer */}
            <div className="mt-10 pt-6 border-t-2 border-slate-800 grid grid-cols-2 gap-4 text-[10px] text-slate-600">
              <div>
                <p className="font-bold text-slate-800 uppercase mb-1">{GARAGE_INFO.nom} {GARAGE_INFO.formeJuridique}</p>
                <p>ICE : <span className="font-mono font-semibold text-slate-800">{GARAGE_INFO.ice}</span> | IF : <span className="font-mono font-semibold text-slate-800">{GARAGE_INFO.ifiscal}</span></p>
                <p>RC : <span className="font-mono">{GARAGE_INFO.rc}</span> | Patente : <span className="font-mono">{GARAGE_INFO.patente}</span> | CNSS : <span className="font-mono">{GARAGE_INFO.cnss}</span></p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">Cachet & Signature habilitée</p>
                <div className="h-16 mt-1 flex items-end justify-end">
                  <span className="text-[10px] text-slate-400 italic">Signature autorisée</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
