'use client';

import React, { useRef, useState } from 'react';
import { DossierSinistre } from '@/types';
import { formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { DocumentActionBar } from './DocumentActionBar';
import { Edit3, CheckCircle2 } from 'lucide-react';

interface Props {
  dossier: DossierSinistre;
  onClose: () => void;
}

export const QuittanceModal: React.FC<Props> = ({ dossier, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Champs de la quittance personnalisables / modifiables
  const [assuranceNom, setAssuranceNom] = useState(
    dossier.assurance?.nom ? `${dossier.assurance.nom.toUpperCase()} ASSURANCE` : 'Sanlam ASSURANCE'
  );
  const [assuranceAdresse, setAssuranceAdresse] = useState(
    dossier.assurance?.adresse || '2016, Bd Mohamed Zerktouni, Casablanca.\nMaroc'
  );
  const [assureNom, setAssureNom] = useState(dossier.client?.nom || '');
  const [numeroPolice, setNumeroPolice] = useState(dossier.numeroPolice || '');
  const [marqueVehicule, setMarqueVehicule] = useState(
    `${dossier.vehicule?.marque || ''} ${dossier.vehicule?.modele || ''}`.trim()
  );
  const [immatriculation, setImmatriculation] = useState(
    dossier.vehicule?.immatriculation ? formatMatricule(dossier.vehicule.immatriculation, 'LATIN') : ''
  );
  const [numeroSinistre, setNumeroSinistre] = useState(dossier.numeroSinistre || '');
  const [dateSurvenance, setDateSurvenance] = useState(
    dossier.dateSinistre ? formatDate(dossier.dateSinistre) : ''
  );
  const [intermediaire, setIntermediaire] = useState(
    dossier.agenceAssurance || 'ASSURANCE'
  );

  // Montants indemnite & charges
  const [montantIndemnite, setMontantIndemnite] = useState(
    dossier.montantPriseEnChargeAssurance > 0 ? `${dossier.montantPriseEnChargeAssurance.toFixed(2)} DH` : ''
  );
  const [franchiseContractuelle, setFranchiseContractuelle] = useState(
    dossier.montantFranchise > 0 ? `${dossier.montantFranchise.toFixed(2)}` : ''
  );
  const [tvaIndemnite, setTvaIndemnite] = useState(
    dossier.tvaExclueParAssurance && dossier.tvaExclueParAssurance > 0
      ? `${dossier.tvaExclueParAssurance.toFixed(2)}`
      : (dossier.typeClientAssurance === 'PROFESSIONNEL' || dossier.typeClientAssurance === 'AGENCE_LOCATION')
        ? `${((dossier.montantTotalTTC * 0.20) / 1.20).toFixed(2)}`
        : ''
  );
  const [depassementPlafond, setDepassementPlafond] = useState('');

  const [dateFaitA, setDateFaitA] = useState(
    formatDate(dossier.dateCreation || new Date().toISOString())
  );
  const [isEditing, setIsEditing] = useState(false);

  const shareMsg = `Bonjour ${assureNom}, voici votre Quittance d'indemnisation pour le véhicule ${immatriculation} (${assuranceNom}).`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Document Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`QUITTANCE-${dossier.numeroDossier || immatriculation}`}
          documentTitle="Quittance d'indemnisation"
          subtitle={`Police : ${numeroPolice || '-'} • Assurance : ${assuranceNom} • Assuré : ${assureNom}`}
          clientPhone={dossier.client?.telephone}
          shareMessage={shareMsg}
          badgeText="Quittance"
          badgeColor="bg-blue-600"
          onClose={onClose}
        />

        {/* Barre d'édition rapide (hors impression) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Modèle officiel de quittance d'indemnisation <strong>AZUR GLASS</strong>. Vous pouvez ajuster les champs avant impression si nécessaire.
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition shadow-sm"
          >
            {isEditing ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terminer la modification</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Modifier les champs</span>
              </>
            )}
          </button>
        </div>

        {/* Panneau de modification rapide */}
        {isEditing && (
          <div className="no-print bg-amber-50/70 border-b border-amber-200 p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nom Compagnie Assurance :</label>
              <input
                type="text"
                value={assuranceNom}
                onChange={(e) => setAssuranceNom(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Adresse Compagnie :</label>
              <input
                type="text"
                value={assuranceAdresse}
                onChange={(e) => setAssuranceAdresse(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nom de l'assuré :</label>
              <input
                type="text"
                value={assureNom}
                onChange={(e) => setAssureNom(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">N° de police :</label>
              <input
                type="text"
                value={numeroPolice}
                onChange={(e) => setNumeroPolice(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Marque du véhicule :</label>
              <input
                type="text"
                value={marqueVehicule}
                onChange={(e) => setMarqueVehicule(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Immatriculation :</label>
              <input
                type="text"
                value={immatriculation}
                onChange={(e) => setImmatriculation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">N° du sinistre :</label>
              <input
                type="text"
                value={numeroSinistre}
                placeholder="Ex: SIN-2026-..."
                onChange={(e) => setNumeroSinistre(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Date de survenance :</label>
              <input
                type="text"
                value={dateSurvenance}
                placeholder="JJ/MM/AAAA"
                onChange={(e) => setDateSurvenance(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Votre Intermédiaire :</label>
              <input
                type="text"
                value={intermediaire}
                onChange={(e) => setIntermediaire(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Montant net de l'indemnité :</label>
              <input
                type="text"
                value={montantIndemnite}
                placeholder="Ex: 2 400.00 DH"
                onChange={(e) => setMontantIndemnite(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Franchise contractuelle (dhs) :</label>
              <input
                type="text"
                value={franchiseContractuelle}
                placeholder="Ex: 300"
                onChange={(e) => setFranchiseContractuelle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">TVA indemnité (dhs) :</label>
              <input
                type="text"
                value={tvaIndemnite}
                placeholder="Ex: 400"
                onChange={(e) => setTvaIndemnite(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Dépassement plafond (dhs) :</label>
              <input
                type="text"
                value={depassementPlafond}
                placeholder="Laisser vide ou saisir montant"
                onChange={(e) => setDepassementPlafond(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Date d'édition :</label>
              <input
                type="text"
                value={dateFaitA}
                onChange={(e) => setDateFaitA(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
              />
            </div>
          </div>
        )}

        {/* Printable Document Area (Strict Conforme au Modèle Utilisateur) */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-8 sm:p-14 text-slate-900 text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl bg-white max-w-[800px] w-full font-serif"
            style={{ minHeight: '1050px' }}
          >
            
            {/* Header Assurance */}
            <div className="mb-8">
              <h1 className="text-lg font-bold uppercase tracking-tight text-slate-950">
                {assuranceNom}
              </h1>
              <div className="text-xs text-slate-700 whitespace-pre-line mt-0.5">
                {assuranceAdresse}
              </div>
            </div>

            {/* Titre Principal */}
            <div className="text-center my-6">
              <h2 className="text-xl sm:text-2xl font-bold underline tracking-wide text-slate-950">
                Quittance d’indemnisation
              </h2>
            </div>

            {/* Informations Assuré & Véhicule */}
            <div className="my-8 text-xs sm:text-sm space-y-1.5">
              <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[220px_1fr] items-baseline">
                <span className="font-semibold text-slate-950">Assuré*</span>
                <span className="font-bold text-slate-950">: {assureNom || '....................................................................'}</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[220px_1fr] items-baseline">
                <span className="font-semibold text-slate-950">N° de police</span>
                <span className="font-medium text-slate-900">: {numeroPolice || '....................................................................'}</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[220px_1fr] items-baseline">
                <span className="font-semibold text-slate-950">Marque du véhicule</span>
                <span className="font-medium text-slate-900">: {marqueVehicule || '....................................................................'}</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[220px_1fr] items-baseline">
                <span className="font-semibold text-slate-950">Immatriculation</span>
                <span className="font-bold text-slate-900 font-mono">: {immatriculation || '....................................................................'}</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[220px_1fr] items-baseline">
                <span className="font-semibold text-slate-950">N° du sinistre</span>
                <span className="font-medium text-slate-900">: {numeroSinistre || '....................................................................'}</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[220px_1fr] items-baseline">
                <span className="font-semibold text-slate-950">Date de survenance</span>
                <span className="font-medium text-slate-900">: {dateSurvenance || '....................................................................'}</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[220px_1fr] items-baseline">
                <span className="font-semibold text-slate-950">Votre Intermédiaire</span>
                <span className="font-medium text-slate-900">: {intermediaire || '....................................................................'}</span>
              </div>
            </div>

            {/* Reconnaissance et Prise en charge */}
            <div className="my-8 text-xs sm:text-sm text-justify leading-relaxed">
              <p className="mb-4">
                Je soussigné : <strong>{assureNom || '....................................................................'}</strong>
              </p>
              <p>
                , Reconnais avoir accepté la prise en charge de la réparation des dommages subis par mon véhicule par <strong>AZUR GLASS</strong> agréé par <strong>{assuranceNom}</strong>, {assuranceAdresse.replace(/\n/g, ', ')}.
              </p>
            </div>

            {/* Section Indemnité */}
            <div className="my-6 text-xs sm:text-sm leading-relaxed">
              <h3 className="font-bold text-sm sm:text-base text-slate-950 mb-2">
                Indemnité
              </h3>
              <p className="text-justify mb-4">
                Le montant net de votre indemnité est de{' '}
                <strong className="underline underline-offset-4 px-2">
                  {montantIndemnite || '........................................................'}
                </strong>{' '}
                et il constitue le solde complet, définitif et sans réserve, tous droits et indemnités compris, du Préjudice matériel qui a été causé à votre véhicule. La présente quittance vaut accord et désistement.
              </p>

              <p className="font-semibold mb-2 text-slate-950">
                Le montant restant à votre charge au titre de cette réparation est de :
              </p>
              <ul className="space-y-1.5 pl-2">
                <li className="flex items-baseline">
                  <span className="mr-2 text-base leading-none">▪</span>
                  <span>La franchise contractuelle s’élève à <strong>{franchiseContractuelle || '....................'}</strong> dhs.</span>
                </li>
                <li className="flex items-baseline">
                  <span className="mr-2 text-base leading-none">▪</span>
                  <span>La TVA sur le montant de l’indemnité est de <strong>{tvaIndemnite || '....................'}</strong> dhs.</span>
                </li>
                <li className="flex items-baseline">
                  <span className="mr-2 text-base leading-none">▪</span>
                  <span>Le montant restant à votre charge pour dépassement de plafond est de <strong>{depassementPlafond || '....................'}</strong> dhs.</span>
                </li>
              </ul>
            </div>

            {/* Clauses Légales Subrogation */}
            <div className="my-6 text-xs sm:text-sm text-justify leading-relaxed space-y-3 text-slate-800">
              <p>
                Moyennant le montant de la dite réparation, <strong>{assuranceNom}</strong> est subrogée jusqu'à concurrence du montant des réparations précité dans mes droits et actions, contre les tiers responsables qui par leur fait ont causé le dommage ayant donné lieu à la garantie de la compagnie, ou leurs assureurs.
              </p>
              <p>
                En cas de déclaration fausse ou inexacte des circonstances décrites sur la déclaration de sinistre, la Compagnie se réserve le droit de récupérer le coût de la réparation par tous moyens de droit.
              </p>
            </div>

            {/* Lieu & Signatures */}
            <div className="mt-10 pt-4">
              <p className="text-xs sm:text-sm mb-12">
                Fait à MARRAKECH, le {dateFaitA || '................................'}
              </p>

              <div className="flex justify-between items-start text-xs sm:text-sm">
                <div className="w-1/2">
                  <p className="font-semibold text-slate-900 mb-1">« Lu et approuvé »</p>
                  <p className="text-[11px] text-slate-500 italic mb-8">(Signature de l'assuré)</p>
                </div>
                <div className="w-1/2 text-right">
                  <p className="font-bold text-slate-950 tracking-wider">AZUR GLASS</p>
                  <p className="text-[11px] text-slate-500 italic mb-8">(Cachet & Signature)</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
