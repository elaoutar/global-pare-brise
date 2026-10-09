'use client';

import React, { useRef, useState } from 'react';
import { DossierSinistre } from '@/types';
import { GARAGE_INFO, AZUR_GLASS_INFO } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { DocumentActionBar } from './DocumentActionBar';
import { Building2, Shield, FileText, CheckCircle2, Calendar, Edit3 } from 'lucide-react';

interface Props {
  dossier: DossierSinistre;
  onClose: () => void;
}

export const DeclarationBrisGlaceModal: React.FC<Props> = ({ dossier, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Valeurs éditables avec pré-remplissage automatique
  const [nomSociete, setNomSociete] = useState(dossier.client.nom || '');
  const [numeroPolice, setNumeroPolice] = useState(dossier.numeroPolice || 'AU 11201500427788');
  const [immatriculation, setImmatriculation] = useState(dossier.vehicule.immatriculation || '');
  const [marqueVehicule, setMarqueVehicule] = useState(
    `${dossier.vehicule.marque} ${dossier.vehicule.modele}`.trim()
  );
  const [typeVitrage, setTypeVitrage] = useState('PARE-BRISE');
  const [circonstances, setCirconstances] = useState('Indéterminées');
  const [villeDate, setVilleDate] = useState(
    `${dossier.client.ville || 'Marrakech'} le, ${formatDate(dossier.dateCreation || new Date().toISOString())}`
  );
  const [isEditing, setIsEditing] = useState(false);

  const cieNom = dossier.assurance?.nom || 'Compagnie d\'Assurance';
  const agenceNom = dossier.agenceAssurance || 'Agence Principale';

  const shareMsg = `Bonjour, voici la Déclaration de Bris de Glaces pour le véhicule ${immatriculation} (${nomSociete}) rattachée au dossier ${dossier.numeroDossier} chez GLOBAL PARE-BRISE.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`DECLARATION-BRIS-GLACE-${immatriculation || dossier.numeroDossier}`}
          documentTitle="Déclaration de Bris de Glaces (Société / Pro)"
          subtitle={`Dossier : ${dossier.numeroDossier} • Société : ${nomSociete} • Immat : ${immatriculation}`}
          clientPhone={dossier.client.telephone}
          shareMessage={shareMsg}
          badgeText="Déclaration Société"
          badgeColor="bg-indigo-600"
          onClose={onClose}
        />

        {/* Barre d'édition rapide (hors impression) */}
        <div className="no-print bg-indigo-50/70 border-b border-indigo-100 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-semibold">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Document obligatoire pour les <strong>Sociétés & Professionnels</strong> à faire signer et cacheter.</span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold transition-colors shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Masquer Options de Saisie' : 'Personnaliser les Mentions'}
          </button>
        </div>

        {/* Panneau de saisie rapide si mode édition activé */}
        {isEditing && (
          <div className="no-print bg-white p-4 sm:p-6 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in slide-in-from-top-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom de la Société :</label>
              <input
                type="text"
                value={nomSociete}
                onChange={(e) => setNomSociete(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">N° de Police d'Assurance :</label>
              <input
                type="text"
                value={numeroPolice}
                onChange={(e) => setNumeroPolice(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Immatriculation :</label>
              <input
                type="text"
                value={immatriculation}
                onChange={(e) => setImmatriculation(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg font-mono text-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Marque / Modèle Véhicule :</label>
              <input
                type="text"
                value={marqueVehicule}
                onChange={(e) => setMarqueVehicule(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Type de Vitrage :</label>
              <input
                type="text"
                value={typeVitrage}
                onChange={(e) => setTypeVitrage(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg font-bold text-slate-800"
                placeholder="Ex: PARE-BRISE, LUNETTE ARRIÈRE..."
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lieu et Date :</label>
              <input
                type="text"
                value={villeDate}
                onChange={(e) => setVilleDate(e.target.value)}
                className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Printable Document Area (Strict A4 Format) */}
        <div className="overflow-x-auto bg-slate-100/60 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-8 sm:p-14 text-slate-900 text-sm sm:text-base leading-relaxed shadow-sm border border-slate-200/80 rounded-xl bg-white w-full max-w-[800px] min-h-[1050px] flex flex-col justify-between"
          >
            <div>
              {/* En-tête des informations Société / Véhicule */}
              <div className="space-y-3.5 font-sans pb-8 border-b border-slate-200">
                <div className="flex items-baseline">
                  <span className="w-48 font-black uppercase text-slate-900 tracking-wider text-sm sm:text-base">
                    NOM
                  </span>
                  <span className="mx-2 text-slate-400 font-bold">*</span>
                  <span className="font-extrabold text-base sm:text-lg text-slate-950 uppercase">
                    {nomSociete || dossier.client.nom}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-48 font-black uppercase text-slate-900 tracking-wider text-sm sm:text-base">
                    N° de police
                  </span>
                  <span className="mx-2 text-slate-400 font-bold">*</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {numeroPolice}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="w-48 font-black uppercase text-slate-900 tracking-wider text-sm sm:text-base">
                    N° d’immatriculation
                  </span>
                  <span className="mx-2 text-slate-400 font-bold">*</span>
                  <span className="font-mono font-black text-slate-950 text-base sm:text-lg bg-slate-100 px-3 py-1 rounded border border-slate-300">
                    {immatriculation}
                  </span>
                </div>
              </div>

              {/* Lieu et Date (aligné à droite avec marge) */}
              <div className="text-right mt-14 mb-14 font-medium text-slate-800 text-base">
                <p className="font-semibold">{villeDate}</p>
                <p className="text-xs text-slate-500 mt-1">
                  À l'attention de la compagnie : <strong className="text-slate-700">{cieNom}</strong> ({agenceNom})
                </p>
              </div>

              {/* Objet du document */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-wide underline underline-offset-8 decoration-2 decoration-slate-900">
                  Objet : Déclaration de bris de glaces
                </h2>
              </div>

              {/* Corps de la lettre (Respect strict du modèle fourni) */}
              <div className="space-y-6 text-slate-900 text-base sm:text-lg leading-loose mt-8">
                <p>
                  Nous avons l’honneur de vous déclarer{' '}
                  <span className="font-black underline decoration-slate-400 decoration-1">
                    {typeVitrage.toUpperCase()}
                  </span>
                </p>

                <p>
                  du véhicule{' '}
                  <strong className="font-extrabold uppercase">
                    {marqueVehicule}
                  </strong>{' '}
                  immatriculé sous le numéro{' '}
                  <strong className="font-mono font-black bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {immatriculation}
                  </strong>
                </p>

                <p className="pt-2">
                  a été endommagé dans des circonstances{' '}
                  <span className="font-bold">{circonstances}</span>.
                </p>

                <p className="font-semibold">
                  Merci de faire le nécessaire.
                </p>
              </div>
            </div>

            {/* Zone Signature & Cachet de la société */}
            <div className="pt-16 pb-8 border-t border-slate-200">
              <div className="flex justify-between items-end">
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Réf Sinistre : <span className="font-mono font-semibold text-slate-600">{dossier.numeroSinistre || dossier.numeroDossier}</span></p>
                  <p>Centre de pose : <span className="font-semibold text-slate-600">{GARAGE_INFO.nom}</span></p>
                  <p>Intermédiaire : <span className="font-semibold text-slate-600">{AZUR_GLASS_INFO.nom}</span></p>
                </div>

                <div className="w-72 sm:w-80 text-left">
                  <p className="font-black text-slate-950 uppercase text-sm sm:text-base mb-3">
                    Signature & Cachet de la Société :
                  </p>
                  <div className="h-32 border-2 border-dashed border-slate-400 rounded-xl bg-slate-50/50 flex flex-col justify-end p-3 text-center">
                    <span className="text-[11px] text-slate-400 italic">
                      (Apposer le cachet commercial officiel et la signature habilitée)
                    </span>
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
