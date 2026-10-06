'use client';

import React, { useRef } from 'react';
import { BonSortie, DossierSinistre } from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { DocumentActionBar } from './DocumentActionBar';

interface Props {
  bonSortie: BonSortie;
  dossier: DossierSinistre;
  onClose: () => void;
}

export const BonSortieModal: React.FC<Props> = ({ bonSortie, dossier, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const shareMsg = `Bonjour, voici le Bon de Sortie Stock N° ${bonSortie.numeroBS} pour l'intervention sur le dossier ${dossier.numeroDossier} (${dossier.vehicule.immatriculation} - Poseur: ${bonSortie.poseur}) chez GLOBAL PARE-BRISE Marrakech.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8">
        
        {/* Modern Document Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`BON-SORTIE-${bonSortie.numeroBS}`}
          documentTitle={`Bon de Sortie Stock #${bonSortie.numeroBS}`}
          subtitle={`Atelier / Poseur : ${bonSortie.poseur} • Dossier : ${dossier.numeroDossier} (${dossier.vehicule.immatriculation})`}
          clientPhone={dossier.client.telephone}
          shareMessage={shareMsg}
          badgeText="Stock"
          badgeColor="bg-amber-600"
          onClose={onClose}
        />

        {/* Printable Voucher (Strict A4) */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl"
          >
          <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold uppercase text-slate-900">{GARAGE_INFO.nom}</h1>
              <p className="text-xs text-slate-500">Service Magasin & Gestion des Stocks</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-xs uppercase px-2.5 py-1 bg-amber-100 text-amber-900 rounded">
                BON DE SORTIE MATIÈRES
              </span>
              <p className="text-xs text-slate-600 mt-1">N° : <strong className="font-mono">{bonSortie.numeroBS}</strong></p>
              <p className="text-xs text-slate-600">Date : <strong>{formatDate(bonSortie.dateSortie)}</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 my-4 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase">Affectation Dossier</p>
              <p className="text-sm font-semibold text-slate-900">{dossier.numeroDossier}</p>
              <p className="text-slate-600">Client : {dossier.client.nom}</p>
              <p className="text-slate-600">Assurance : {dossier.typeDossier === 'PARTICULIER_COMPTANT' ? 'Particulier Direct (Sans Assurance)' : (dossier.assurance?.nom || 'Assurance')}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase">Véhicule Cible & Poseur</p>
              <p className="text-sm font-bold text-slate-900">
                {dossier.vehicule.marque} {dossier.vehicule.modele} (<span dir="ltr">{formatMatricule(dossier.vehicule.immatriculation, 'LATIN')}</span>)
              </p>
              <p className="text-slate-700 mt-1">Technicien / Poseur : <strong className="text-amber-800">{bonSortie.poseur}</strong></p>
            </div>
          </div>

          <div className="my-6 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-4">Référence</th>
                  <th className="py-2.5 px-4">Désignation de l'article</th>
                  <th className="py-2.5 px-4 text-center">Quantité délivrée</th>
                  <th className="py-2.5 px-4 text-center">Contrôle état</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bonSortie.lignes.map((ligne, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{ligne.reference}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{ligne.designation}</td>
                    <td className="py-3 px-4 text-center font-bold text-base text-slate-900">{ligne.quantite}</td>
                    <td className="py-3 px-4 text-center text-slate-400">☐ Conforme</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bonSortie.notes && (
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-xs text-slate-700 my-4">
              <strong>Remarques / Emplacement :</strong> {bonSortie.notes}
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-12 pt-4 border-t border-slate-300 text-xs">
            <div className="text-center">
              <p className="font-bold text-slate-700 uppercase">Visa Magasinier / Stock</p>
              <div className="h-20 border border-dashed border-slate-300 rounded-lg mt-2 flex items-center justify-center text-slate-400">
                Signature magasinier
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700 uppercase">Visa Technicien Poseur</p>
              <div className="h-20 border border-dashed border-slate-300 rounded-lg mt-2 flex items-center justify-center text-slate-400">
                Signature poseur
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
