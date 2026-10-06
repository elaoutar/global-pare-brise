'use client';

import React, { useRef } from 'react';
import { DossierSinistre } from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { formatDH, formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { DocumentActionBar } from './DocumentActionBar';

interface Props {
  dossier: DossierSinistre;
  onClose: () => void;
}

export const QuittanceModal: React.FC<Props> = ({ dossier, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const cieNom = dossier.assurance?.nom || 'Assurance';

  const shareMsg = `Bonjour ${dossier.client.nom}, voici votre Quittance Subrogative d'Assurance pour le dossier N° ${dossier.numeroDossier} (${cieNom}) concernant votre véhicule ${dossier.vehicule.immatriculation} chez GLOBAL PARE-BRISE Marrakech.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Modern Document Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`QUITTANCE-${dossier.numeroDossier}`}
          documentTitle="Quittance Subrogative d'Assurance"
          subtitle={`Dossier : ${dossier.numeroDossier} • Compagnie : ${cieNom} • Client : ${dossier.client.nom}`}
          clientPhone={dossier.client.telephone}
          shareMessage={shareMsg}
          badgeText="Quittance"
          badgeColor="bg-blue-600"
          onClose={onClose}
        />

        {/* Printable Document Area (Strict A4) */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl"
          >
          {/* Header Garage & Compagnie */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                {GARAGE_INFO.nom}
              </h1>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
                Centre Spécialisé de Remplacement & Réparation de Vitrage Automobile
              </p>
              <p className="text-xs text-slate-600">{GARAGE_INFO.adresse}</p>
              <p className="text-xs text-slate-600">Tél: {GARAGE_INFO.telephone}</p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                ICE: {GARAGE_INFO.ice} | IF: {GARAGE_INFO.ifiscal} | RC: {GARAGE_INFO.rc}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-100 border border-slate-300 rounded-lg p-3 text-left min-w-[220px]">
                <p className="text-xs font-semibold text-slate-500 uppercase">Compagnie d'Assurance</p>
                <p className="text-base font-bold text-slate-900">{dossier.assurance?.nom || 'Assurance'}</p>
                <p className="text-xs text-slate-600 mt-1">Police N°: <span className="font-mono font-semibold">{dossier.numeroPolice || '-'}</span></p>
                <p className="text-xs text-slate-600">Sinistre N°: <span className="font-mono font-semibold">{dossier.numeroSinistre || '-'}</span></p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900 border-2 border-slate-900 inline-block px-6 py-2 rounded">
              QUITTANCE SUBROGATIVE DE BRIS DE GLACE
            </h2>
            <p className="text-xs text-slate-500 mt-2 italic">
              Conforme aux dispositions du Code des Assurances et conventions de prise en charge directe
            </p>
          </div>

          {/* Identification de l'assuré et véhicule */}
          <div className="grid grid-cols-2 gap-4 my-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Souscripteur / Assuré</p>
              <p className="font-semibold text-slate-900">{dossier.client.nom}</p>
              <p className="text-xs text-slate-600">CIN / Identifiant: <span className="font-mono font-semibold">{dossier.client.cin || 'N/A'}</span></p>
              <p className="text-xs text-slate-600">Tél: {dossier.client.telephone}</p>
              <p className="text-xs text-slate-600">Ville: {dossier.client.ville}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Véhicule Concerne</p>
              <p className="font-semibold text-slate-900">{dossier.vehicule.marque} {dossier.vehicule.modele} ({dossier.vehicule.annee})</p>
              <p className="text-xs text-slate-600">
                Immatriculation : <span className="font-mono font-bold text-slate-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300" dir="ltr">
                  {formatMatricule(dossier.vehicule.immatriculation, 'LATIN')}
                </span>
              </p>
              <p className="text-xs text-slate-600 mt-1">N° Châssis (VIN): <span className="font-mono">{dossier.vehicule.chassisVin || 'Conforme carte grise'}</span></p>
              <p className="text-xs text-slate-600">Kilométrage au compteur: <span className="font-mono">{dossier.vehicule.kilometrage ? `${dossier.vehicule.kilometrage} km` : '-'}</span></p>
            </div>
          </div>

          {/* Déclaration et Subrogation */}
          <div className="space-y-3 text-justify my-6 text-xs text-slate-700 leading-relaxed border-l-4 border-brand-600 pl-4">
            <p>
              Je soussigné(e), <strong>{dossier.client.nom}</strong>, propriétaire ou conducteur autorisé du véhicule ci-dessus désigné, déclare avoir constaté le bris du vitrage survenu le <strong>{formatDate(dossier.dateSinistre)}</strong> et certifie que les travaux de remplacement ont été réalisés avec succès et entière satisfaction par <strong>{GARAGE_INFO.nom}</strong>.
            </p>
            <p>
              En contrepartie de la dispense de faire l'avance des frais relatifs à cette intervention, je subroge expressément le garage <strong>{GARAGE_INFO.nom}</strong> dans tous mes droits et actions contre la compagnie d'assurance <strong>{dossier.assurance?.nom || "l'assurance"}</strong> à concurrence du montant de la prise en charge agréée.
            </p>
            <p>
              J'autorise par la présente la compagnie d'assurance à verser directement le règlement des prestations fournies entre les mains du garage susnommé.
            </p>
          </div>

          {/* Décompte Financier */}
          <div className="my-6 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-4 font-bold text-slate-700">Désignation des prestations</th>
                  <th className="py-2.5 px-4 font-bold text-slate-700 text-right">Montant (TTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-4">
                    Remplacement pare-brise / vitrage conforme normes d'origine + Pose & Consommables
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">{formatDH(dossier.montantTotalTTC)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-600">
                    Franchise contractuelle 
                    {dossier.franchiseOfferte && <span className="ml-2 text-emerald-600 font-semibold">(Offerte par Globale Pare-Brise)</span>}
                    {dossier.franchisePayeeParClient && <span className="ml-2 text-blue-600 font-semibold">(Réglée par le client)</span>}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">
                    {dossier.montantFranchise > 0 ? formatDH(dossier.montantFranchise) : 'Néant (0.00 DH)'}
                  </td>
                </tr>
                <tr className="bg-brand-50/50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-4 text-sm text-brand-900">
                    MONTANT TOTAL PRIS EN CHARGE PAR L'ASSURANCE :
                  </td>
                  <td className="py-3 px-4 text-right text-base text-brand-900 font-mono">
                    {formatDH(dossier.montantPriseEnChargeAssurance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-4 border-t border-slate-300">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700 uppercase">
                Signature du Souscripteur / Assuré
              </p>
              <p className="text-[10px] text-slate-500 italic mt-0.5">(Précédée de la mention manuscrite "Bon pour accord et subrogation")</p>
              <div className="h-28 border border-dashed border-slate-300 rounded-lg mt-3 flex items-end justify-center pb-2">
                <span className="text-xs text-slate-400">Date & Signature de l'assuré</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700 uppercase">
                Cachet & Signature du Centre
              </p>
              <p className="text-[10px] text-slate-500 italic mt-0.5">{GARAGE_INFO.nom}</p>
              <div className="h-28 border border-dashed border-slate-300 rounded-lg mt-3 flex items-center justify-center p-2">
                <div className="text-[10px] text-slate-400 border border-slate-200 p-2 rounded">
                  Fait à Marrakech, le {formatDate(dossier.dateCreation)}
                  <br />Cachet de l'établissement
                </div>
              </div>
            </div>
          </div>

          {/* Footer légal */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            {GARAGE_INFO.nom} - {GARAGE_INFO.formeJuridique} au Capital social de 100.000 DH - {GARAGE_INFO.adresse} - RIB: {GARAGE_INFO.rib}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
