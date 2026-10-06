'use client';

import React, { useRef } from 'react';
import { BonLivraison, DossierSinistre } from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { CheckCircle2 } from 'lucide-react';
import { DocumentActionBar } from './DocumentActionBar';

interface Props {
  bonLivraison: BonLivraison;
  dossier: DossierSinistre;
  onClose: () => void;
}

export const BonLivraisonModal: React.FC<Props> = ({
  bonLivraison,
  dossier,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const shareMsg = `Bonjour ${dossier.client.nom}, voici votre Bon de Livraison N° ${bonLivraison.numeroBL} attestant de la pose et réception conforme du vitrage sur votre véhicule ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.immatriculation}) chez GLOBAL PARE-BRISE Marrakech.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Modern Document Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`BON-LIVRAISON-${bonLivraison.numeroBL}`}
          documentTitle={`Bon de Livraison #${bonLivraison.numeroBL}`}
          subtitle={`Client : ${dossier.client.nom} • Véhicule : ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.immatriculation})`}
          clientPhone={dossier.client.telephone}
          shareMessage={shareMsg}
          badgeText="Livraison"
          badgeColor="bg-indigo-600"
          onClose={onClose}
        />

        {/* Printable Delivery Note Area (Strict A4) */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl"
          >
          {/* Top Bar with Real Marrakech Coordinates */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {GARAGE_INFO.nom}
              </h1>
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                Centre Spécialisé Vitrage Auto & Bris de Glace
              </p>
              <p className="text-xs text-slate-700 font-medium">{GARAGE_INFO.adresse}</p>
              <p className="text-xs text-slate-700">Tél: <strong>{GARAGE_INFO.telephone}</strong></p>
              <p className="text-xs text-slate-700">Email: <strong>{GARAGE_INFO.email}</strong></p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                ICE: {GARAGE_INFO.ice} | IF: {GARAGE_INFO.ifiscal} | PT: {GARAGE_INFO.patente}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-950 border border-indigo-300 rounded font-black text-xs uppercase tracking-wider mb-2">
                BON DE LIVRAISON N° {bonLivraison.numeroBL}
              </span>
              <p className="text-xs text-slate-600">
                Date : <span className="font-bold text-slate-900">{formatDate(bonLivraison.dateLivraison)}</span>
              </p>
              <p className="text-xs text-slate-600">
                Dossier Réf : <span className="font-mono font-semibold">{dossier.numeroDossier}</span>
              </p>
              <p className="text-xs text-slate-600">
                Compagnie : <strong>{dossier.typeDossier === 'PARTICULIER_COMPTANT' ? 'Client Particulier (Sans Assurance)' : (dossier.assurance?.nom || 'Assurance')}</strong>
              </p>
            </div>
          </div>

          {/* Client & Vehicle Blocks */}
          <div className="grid grid-cols-2 gap-6 my-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Client / Réceptionnaire
              </p>
              <p className="text-base font-bold text-slate-900">{bonLivraison.receptionnaireNom}</p>
              <p className="text-xs text-slate-600 mt-1">
                CIN / Identifiant : <span className="font-mono font-semibold">{bonLivraison.receptionnaireCin || dossier.client.cin || 'N/A'}</span>
              </p>
              <p className="text-xs text-slate-600">Téléphone : {dossier.client.telephone}</p>
              <p className="text-xs text-slate-600">Ville : {dossier.client.ville}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Véhicule & Travaux Réalisés
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {dossier.vehicule.marque} {dossier.vehicule.modele} ({dossier.vehicule.annee})
              </p>
              <div className="mt-2 inline-flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-300 text-xs">
                <span className="font-medium text-slate-500">Matricule :</span>
                <span className="font-mono font-black text-slate-900" dir="ltr">
                  {formatMatricule(dossier.vehicule.immatriculation, 'LATIN')}
                </span>
              </div>
              {dossier.typeDossier === 'ASSURANCE' && (
                <p className="text-xs text-slate-600 mt-2 font-mono">
                  N° Sinistre : <strong>{dossier.numeroSinistre || '-'}</strong>
                </p>
              )}
              <p className="text-xs text-slate-600">
                Technicien Poseur : <strong>{bonLivraison.livreurPoseur}</strong>
              </p>
            </div>
          </div>

          {/* Table of items delivered */}
          <div className="my-6 border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Désignation du vitrage & fournitures livrées</th>
                  <th className="py-3 px-4 text-center">Code Eurocode</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4 text-center">État & Contrôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bonLivraison.lignes.map((ligne, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{ligne.designation}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{ligne.codeEurocode || '-'}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono text-sm">{ligne.quantite}</td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-medium">
                      ✓ Conforme & Neuf
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observations and warranty */}
          <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Garantie Pose & Étanchéité :
            </p>
            <p className="text-slate-600">
              Le vitrage ci-dessus a été installé selon les règles de l'art avec colle polyuréthane certifiée première monte. 
              Garantie d'étanchéité assurée par {GARAGE_INFO.nom}.
            </p>
            {bonLivraison.observations && (
              <p className="text-slate-800 pt-1 font-medium">
                <strong>Remarques :</strong> {bonLivraison.observations}
              </p>
            )}
          </div>

          {/* Signatures & Discharges */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t-2 border-slate-800 text-xs">
            <div className="text-center">
              <p className="font-bold uppercase text-slate-900">Visa / Signature du Client / Réceptionnaire</p>
              <p className="text-[10px] text-slate-500 italic mt-0.5">
                (Mention manuscrite "Bon pour réception conforme sans réserves")
              </p>
              <div className="h-28 border border-dashed border-slate-300 rounded-xl mt-3 flex items-end justify-center pb-2">
                <span className="text-xs text-slate-400">Date & Signature</span>
              </div>
            </div>

            <div className="text-center">
              <p className="font-bold uppercase text-slate-900">Cachet & Visa de l'Établissement</p>
              <p className="text-[10px] text-slate-500 italic mt-0.5">{GARAGE_INFO.nom}</p>
              <div className="h-28 border border-dashed border-slate-300 rounded-xl mt-3 flex items-center justify-center">
                <div className="text-[10px] text-slate-500 border border-slate-200 p-2 rounded">
                  Fait à Marrakech, le {formatDate(bonLivraison.dateLivraison)}
                  <br />Cachet & Signature
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
