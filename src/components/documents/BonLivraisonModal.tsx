'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { BonLivraison, DossierSinistre, Facture } from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { formatDate, formatDH } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { FileText, Save, Check, Truck, Layers } from 'lucide-react';
import { DocumentActionBar } from './DocumentActionBar';

interface Props {
  bonLivraison: BonLivraison;
  dossier?: DossierSinistre;
  facture?: Facture;
  onClose: () => void;
  onUpdateObservations?: (newObservations: string) => void;
}

export const BonLivraisonModal: React.FC<Props> = ({
  bonLivraison,
  dossier,
  facture,
  onClose,
  onUpdateObservations,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Fermeture par touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Mode multi-véhicules / sans matricule unique
  const [hideVehicleInfo, setHideVehicleInfo] = useState<boolean>(() => {
    return Boolean(
      bonLivraison.isMultiVehicules ||
      (!dossier?.vehicule?.immatriculation && !bonLivraison.immatriculation)
    );
  });

  // Identité du client / réceptionnaire
  const clientNom = bonLivraison.receptionnaireNom || bonLivraison.clientNom || dossier?.client.nom || 'Client';
  const clientTel = bonLivraison.clientTelephone || dossier?.client.telephone || '';
  const clientCin = bonLivraison.receptionnaireCin || bonLivraison.clientCin || dossier?.client.cin || '';
  const clientVille = bonLivraison.clientVille || dossier?.client.ville || 'Marrakech';

  // Infos véhicule (si présent)
  const vehiculeMarque = dossier?.vehicule?.marque || bonLivraison.vehiculeInfo || '';
  const vehiculeModele = dossier?.vehicule?.modele || '';
  const vehiculeAnnee = dossier?.vehicule?.annee;
  const vehiculeImmatriculation = dossier?.vehicule?.immatriculation || bonLivraison.immatriculation || '';

  // État observation éditable
  const defaultObs = (hideVehicleInfo || !vehiculeImmatriculation)
    ? 'Fournitures et vitrages livrés en parfait état de conformité.'
    : `Véhicule ${vehiculeMarque} ${vehiculeModele} (${vehiculeImmatriculation}) remis en parfait état de conformité.`;

  const [observations, setObservations] = useState(bonLivraison.observations || defaultObs);
  const [hasSavedObs, setHasSavedObs] = useState(false);

  const handleSaveObs = () => {
    onUpdateObservations?.(observations);
    setHasSavedObs(true);
    setTimeout(() => setHasSavedObs(false), 2500);
  };

  // Récupérer toutes les prestations et vitrages livrés avec leurs prix en TTC
  const prestationsLignes = useMemo(() => {
    // 1. Si le bon de livraison a déjà ses lignes enregistrées
    if (bonLivraison.lignes && bonLivraison.lignes.length > 0) {
      return bonLivraison.lignes.map((l) => {
        const qte = l.quantite || 1;
        const puTTC = Number(l.prixUnitaireTTC) || (l.totalTTC ? +(Number(l.totalTTC) / qte).toFixed(2) : (l.prixUnitaireHT ? +(Number(l.prixUnitaireHT) * 1.20).toFixed(2) : 0));
        const totTTC = Number(l.totalTTC) || +(puTTC * qte).toFixed(2);
        return {
          designation: l.designation,
          codeEurocode: l.codeEurocode || '-',
          quantite: qte,
          prixUnitaireTTC: puTTC,
          totalTTC: totTTC,
        };
      });
    }

    // 2. Si la facture liée existe avec ses prestations complètes
    if (facture && facture.lignes && facture.lignes.length > 0) {
      return facture.lignes.map((l) => ({
        designation: l.designation,
        codeEurocode: l.codeEurocode || '-',
        quantite: l.quantite || 1,
        prixUnitaireTTC: +(l.prixUnitaireHT * 1.20).toFixed(2),
        totalTTC: +(l.totalHT * 1.20).toFixed(2),
      }));
    }

    // 3. Reconstitution des prestations depuis le dossier
    if (dossier) {
      const totalDossierTTC = dossier.montantTotalTTC || 1100;
      const colleTTC = 180;
      const moTTC = 120;
      const vitrageTTC = Math.max(0, +(totalDossierTTC - colleTTC - moTTC).toFixed(2));

      return [
        {
          designation: `Vitrage ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
          codeEurocode: bonLivraison.lignes[0]?.codeEurocode || `PB-${dossier.vehicule.marque.slice(0, 3).toUpperCase()}`,
          quantite: 1,
          prixUnitaireTTC: vitrageTTC,
          totalTTC: vitrageTTC,
        },
        {
          designation: 'Kit colle polyuréthane & primaire d\'adhérence haute résistance',
          codeEurocode: 'COLLE-PU',
          quantite: 1,
          prixUnitaireTTC: colleTTC,
          totalTTC: colleTTC,
        },
        {
          designation: 'Main d\'œuvre spécialisée pose & dépose vitrage',
          codeEurocode: 'MO-POSE',
          quantite: 1,
          prixUnitaireTTC: moTTC,
          totalTTC: moTTC,
        },
      ];
    }

    return [];
  }, [bonLivraison, facture, dossier]);

  // Total pièces
  const totalQuantiteArticles = useMemo(() => {
    return prestationsLignes.reduce((sum, l) => sum + (l.quantite || 1), 0);
  }, [prestationsLignes]);

  // Total dans le BL en TTC
  const totalPrestationsTTC = useMemo(() => {
    if (bonLivraison.totalTTC && bonLivraison.totalTTC > 0) return Number(bonLivraison.totalTTC);
    return +(prestationsLignes.reduce((sum, l) => sum + (l.totalTTC || 0), 0)).toFixed(2);
  }, [prestationsLignes, bonLivraison]);

  // Décompte Assurance / AZUR GLASS (si dossier assurance)
  const isAssurance = dossier?.typeDossier === 'ASSURANCE';
  const franchiseMontant = dossier?.montantFranchise || 0;
  const franchiseOfferte = Boolean(dossier?.franchiseOfferte);
  const effectiveFranchise = franchiseOfferte ? 0 : franchiseMontant;
  const effectiveTvaExclue = Number(dossier?.tvaExclueParAssurance) || 0;
  const netPriseEnCharge = isAssurance
    ? Math.max(0, +(totalPrestationsTTC - effectiveFranchise - effectiveTvaExclue).toFixed(2))
    : totalPrestationsTTC;

  const isMulti = hideVehicleInfo || !vehiculeImmatriculation;

  const docSubtitle = isMulti
    ? `Client : ${clientNom} • Livraison Multi-Vitrages (${totalQuantiteArticles} article${totalQuantiteArticles > 1 ? 's' : ''}) • Total : ${formatDH(totalPrestationsTTC)} TTC`
    : `Client : ${clientNom} • Véhicule : ${vehiculeMarque} ${vehiculeModele} (${vehiculeImmatriculation})`;

  const shareMsg = isMulti
    ? `Bonjour ${clientNom}, voici votre Bon de Livraison N° ${bonLivraison.numeroBL} d'un montant de ${formatDH(totalPrestationsTTC)} TTC attestant de la livraison conforme de ${totalQuantiteArticles} vitrage(s) chez GLOBAL PARE-BRISE.`
    : `Bonjour ${clientNom}, voici votre Bon de Livraison N° ${bonLivraison.numeroBL} d'un montant de ${formatDH(totalPrestationsTTC)} attestant de la pose et réception conforme du vitrage sur votre véhicule ${vehiculeMarque} ${vehiculeModele} (${vehiculeImmatriculation}) chez GLOBAL PARE-BRISE.`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`BON-LIVRAISON-${bonLivraison.numeroBL}`}
          documentTitle={`Bon de Livraison #${bonLivraison.numeroBL}`}
          subtitle={docSubtitle}
          clientPhone={clientTel}
          shareMessage={shareMsg}
          badgeText={isMulti ? "Multi-Vitrages" : "Livraison avec Prix"}
          badgeColor="bg-indigo-600"
          onClose={onClose}
        />

        {/* Barre d'édition d'observations & options (visible à l'écran uniquement) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
          <div className="flex-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Observation :</span>
            <input
              type="text"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              onBlur={handleSaveObs}
              placeholder="Ajouter une observation ou mention particulière..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveObs}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
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

          {/* Toggle Multi-véhicules */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-50 transition whitespace-nowrap">
            <input
              type="checkbox"
              checked={hideVehicleInfo}
              onChange={(e) => setHideVehicleInfo(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Livraison Multi-Vitrages (Sans matricule)
            </span>
          </label>
        </div>

        {/* Printable Delivery Note Area (Strict A4) */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl bg-white"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
              <div>
                <img
                  src={GARAGE_INFO.logoUrl}
                  alt={GARAGE_INFO.nom}
                  className="h-14 w-auto max-w-[260px] object-contain mb-2"
                />
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                  Centre Spécialisé Vitrage Auto & Bris de Glace
                </p>
                <p className="text-xs text-slate-700 font-medium">{GARAGE_INFO.adresse}</p>
                <p className="text-xs text-slate-700">Tél : <strong>{GARAGE_INFO.telephone}</strong></p>
                <p className="text-xs text-slate-700">Email : <strong>{GARAGE_INFO.email}</strong></p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-950 border border-indigo-300 rounded font-black text-xs uppercase tracking-wider mb-2">
                  BON DE LIVRAISON N° {bonLivraison.numeroBL}
                </span>
                <p className="text-xs text-slate-600">
                  Date : <span className="font-bold text-slate-900">{formatDate(bonLivraison.dateLivraison)}</span>
                </p>
                {dossier?.numeroDossier ? (
                  <p className="text-xs text-slate-600">
                    Dossier Réf : <span className="font-mono font-semibold">{dossier.numeroDossier}</span>
                  </p>
                ) : (
                  <p className="text-xs text-indigo-700 font-semibold">
                    Type : <span>Livraison Directe / Client</span>
                  </p>
                )}
                <p className="text-xs text-slate-600">
                  Régime : <strong>{isAssurance ? (dossier?.assurance?.nom || 'Assurance via AZUR GLASS') : 'Client Direct (Comptant)'}</strong>
                </p>
              </div>
            </div>

            {/* Client & Vehicle / Delivery Blocks */}
            <div className="grid grid-cols-2 gap-6 my-6">
              {/* Client Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                  Client / Destinataire
                </p>
                <p className="text-sm font-bold text-slate-900">{clientNom}</p>
                <p className="text-slate-600 mt-1">
                  CIN / ICE : <span className="font-mono font-semibold text-slate-800">{clientCin || 'N/A'}</span>
                </p>
                <p className="text-slate-600 mt-0.5">Téléphone : <strong>{clientTel || '-'}</strong></p>
                <p className="text-slate-600 mt-0.5">Ville : <strong>{clientVille}</strong></p>
                {bonLivraison.clientAdresse && (
                  <p className="text-slate-600 mt-0.5 text-[11px]">Adresse : {bonLivraison.clientAdresse}</p>
                )}
              </div>

              {/* Right Box : IF multi-véhicules -> Affiche Détails de Livraison sans aucun véhicule ni matricule */}
              {hideVehicleInfo || !vehiculeImmatriculation ? (
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs">
                  <p className="font-bold text-[10px] text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" /> Détails de la Livraison
                  </p>
                  <p className="font-bold text-slate-900 text-sm">
                    Livraison Multi-Vitrages & Pare-brise
                  </p>
                  <p className="text-slate-600 mt-1.5">
                    Articles livrés : <strong className="font-bold text-indigo-950 font-mono text-sm">{totalQuantiteArticles}</strong> pièce(s)
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Date livraison : <strong>{formatDate(bonLivraison.dateLivraison)}</strong>
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Livreur / Technicien : <strong>{bonLivraison.livreurPoseur || 'Équipe Atelier'}</strong>
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                    Véhicule & Travaux Réalisés
                  </p>
                  <p className="font-bold text-slate-900 text-sm">
                    {vehiculeMarque} {vehiculeModele} {vehiculeAnnee ? `(${vehiculeAnnee})` : ''}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-300 text-xs">
                    <span className="font-medium text-slate-500">Matricule :</span>
                    <span className="font-mono font-black text-slate-900" dir="ltr">
                      {formatMatricule(vehiculeImmatriculation, 'LATIN')}
                    </span>
                  </div>
                  {isAssurance && (
                    <p className="text-slate-600 mt-2 font-mono text-[11px]">
                      N° Sinistre : <strong>{dossier?.numeroSinistre || '-'}</strong>
                    </p>
                  )}
                  <p className="text-slate-600 mt-1">
                    Technicien Poseur : <strong>{bonLivraison.livreurPoseur}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Table of items & prestations with prices */}
            <div className="my-6 border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">Prestations & Fournitures Livrées</th>
                    <th className="py-3 px-4 text-center">Réf / Eurocode</th>
                    <th className="py-3 px-4 text-center">Qté</th>
                    <th className="py-3 px-4 text-right">P.U TTC (DH)</th>
                    <th className="py-3 px-4 text-right">Total TTC (DH)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {prestationsLignes.map((ligne, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{ligne.designation}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">{ligne.codeEurocode || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono">{ligne.quantite}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {ligne.prixUnitaireTTC ? ligne.prixUnitaireTTC.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {ligne.totalTTC ? ligne.totalTTC.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 my-6">
              {/* Franchise & TVA (si assurance) */}
              <div className="flex-1 w-full sm:max-w-md">
                {isAssurance ? (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                      Détail Prise en Charge Assurance :
                    </p>
                    <div className="space-y-1 text-slate-700 pt-1">
                      <div className="flex justify-between">
                        <span>Franchise {franchiseOfferte ? '(Offerte)' : '(À régler par le client)'} :</span>
                        <span className={`font-mono font-bold ${franchiseOfferte ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {formatDH(franchiseMontant)}
                        </span>
                      </div>
                      {effectiveTvaExclue > 0 && (
                        <div className="flex justify-between">
                          <span>TVA exclue (Régime Pro / Location) :</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatDH(effectiveTvaExclue)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold text-indigo-950">
                        <span>Prise en charge nette assurance :</span>
                        <span className="font-mono font-bold">
                          {formatDH(netPriseEnCharge)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    Règlement comptant direct par le client.
                  </div>
                )}
              </div>

              {/* Total BL en TTC (Prestations uniquement) */}
              <div className="w-full sm:w-72 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Prestations (TTC) :</span>
                  <span className="font-mono text-emerald-800 text-base">{formatDH(totalPrestationsTTC)}</span>
                </div>
                <p className="text-[10px] text-slate-500 italic text-right">
                  Total TTC incluant l'ensemble des prestations réalisées
                </p>
              </div>
            </div>

            {/* Observations */}
            {observations && (
              <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900 text-[11px] uppercase block">Observations & Remarques :</span>
                <p className="text-slate-800 font-medium italic mt-1 whitespace-pre-wrap">
                  {observations}
                </p>
              </div>
            )}

            {/* Signatures & Discharges */}
            <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t-2 border-slate-800 text-xs">
              <div className="text-center">
                <p className="font-bold uppercase text-slate-900">Visa / Signature du Client / Réceptionnaire</p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  (Mention manuscrite "Bon pour réception conforme sans réserves")
                </p>
                <div className="h-24 border border-dashed border-slate-300 rounded-xl mt-3 flex items-end justify-center pb-2">
                  <span className="text-xs text-slate-400">Date & Signature</span>
                </div>
              </div>

              <div className="text-center">
                <p className="font-bold uppercase text-slate-900">Cachet & Visa de l'Établissement</p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">{GARAGE_INFO.nom}</p>
                <div className="h-24 border border-dashed border-slate-300 rounded-xl mt-3 flex items-center justify-center">
                  <div className="text-[10px] text-slate-500 border border-slate-200 p-2 rounded">
                    Fait à Marrakech, le {formatDate(bonLivraison.dateLivraison)}
                    <br />Cachet & Signature
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer (Visible on screen only) */}
        <div className="no-print p-3 sm:px-6 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] shadow-2xs">Échap</kbd> ou cliquez en dehors pour fermer
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition active:scale-95"
          >
            Fermer le document
          </button>
        </div>
      </div>
    </div>
  );
};
