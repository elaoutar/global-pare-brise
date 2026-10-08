'use client';

import React, { useRef } from 'react';
import { DevisClient } from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { formatDH, formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { FileText, ShieldCheck } from 'lucide-react';
import { DocumentActionBar } from './DocumentActionBar';

interface Props {
  devis: DevisClient;
  onClose: () => void;
}

export const DevisClientModal: React.FC<Props> = ({ devis, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const shareMsg = `Bonjour ${devis.clientNom}, voici votre Devis N° ${devis.numeroDevis} d'un montant de ${formatDH(devis.totalTTC)} TTC pour l'intervention sur votre véhicule ${devis.vehiculeMarque} ${devis.vehiculeModele} (${devis.vehiculeImmatriculation}) chez GLOBAL PARE-BRISE.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Modern Document Action Bar with Print, A4 PDF & WhatsApp */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`DEVIS-${devis.numeroDevis}`}
          documentTitle={`Devis Client #${devis.numeroDevis}`}
          subtitle={`Client : ${devis.clientNom} • Véhicule : ${devis.vehiculeMarque} ${devis.vehiculeModele} (${devis.vehiculeImmatriculation})`}
          clientPhone={devis.clientTelephone}
          shareMessage={shareMsg}
          badgeText="Devis Gratuit"
          badgeColor="bg-amber-600"
          onClose={onClose}
        />

        {/* Printable Devis Page (Strict A4) */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl bg-white"
          >
            {/* Top Bar with Logo & Legal Identifiers */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {GARAGE_INFO.nom}
                </h1>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                  Spécialiste Vitrage Automobile • Pare-Brise • Lunettes • Glaces
                </p>
                <p className="text-xs text-slate-600">
                  {devis.agenceVille === 'El Jadida' ? 'Agence El Jadida - Maroc' : GARAGE_INFO.adresse}
                </p>
                <p className="text-xs text-slate-600">Tél: {GARAGE_INFO.telephone}</p>
                <p className="text-xs text-slate-600">Email: {GARAGE_INFO.email}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded font-black text-xs uppercase tracking-wider mb-2">
                  DEVIS N° {devis.numeroDevis}
                </span>
                <p className="text-xs text-slate-600">
                  Date émission : <span className="font-semibold text-slate-900">{formatDate(devis.dateDevis)}</span>
                </p>
                <p className="text-xs text-slate-600">
                  Validité jusqu'au : <span className="font-semibold text-slate-900">{formatDate(devis.dateValidite)}</span>
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Agence : <span className="font-bold text-brand-700">{devis.agenceVille}</span>
                </p>
              </div>
            </div>

            {/* Client & Vehicle Block */}
            <div className="grid grid-cols-2 gap-6 my-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Client Destinataire :
                </p>
                <p className="text-base font-bold text-slate-900">{devis.clientNom}</p>
                <p className="text-xs text-slate-600">Tél : {devis.clientTelephone}</p>
                {devis.clientCin && <p className="text-xs text-slate-600">CIN : {devis.clientCin}</p>}
                {devis.clientEmail && <p className="text-xs text-slate-600">Email : {devis.clientEmail}</p>}
                <p className="text-xs text-slate-600">Ville : {devis.clientVille || devis.agenceVille}</p>
                {devis.typeDemande === 'ASSURANCE' && devis.compagnieAssurance && (
                  <p className="text-xs text-brand-700 font-semibold mt-2 pt-2 border-t border-slate-200">
                    Assurance pressentie : {devis.compagnieAssurance}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Véhicule Concerné :
                </p>
                <p className="font-semibold text-slate-900 text-base">
                  {devis.vehiculeMarque} {devis.vehiculeModele} ({devis.vehiculeAnnee})
                </p>
                <div className="mt-2 inline-flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-slate-200 text-xs shadow-xs">
                  <span className="font-medium text-slate-500">Immatriculation:</span>
                  <span className="font-mono font-bold text-slate-900" dir="ltr">
                    {formatMatricule(devis.vehiculeImmatriculation, 'LATIN')}
                  </span>
                </div>
                {devis.vehiculeChassisVin && (
                  <p className="text-xs text-slate-600 mt-2 font-mono">
                    N° Châssis (VIN) : {devis.vehiculeChassisVin}
                  </p>
                )}
              </div>
            </div>

            {/* Table of Items */}
            <div className="my-6 border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Désignation des Prestations & Pièces</th>
                    <th className="py-3 px-4 text-center">Réf / Eurocode</th>
                    <th className="py-3 px-4 text-center">Qté</th>
                    <th className="py-3 px-4 text-right">P.U HT (DH)</th>
                    <th className="py-3 px-4 text-center">TVA</th>
                    <th className="py-3 px-4 text-right">Total HT (DH)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devis.lignes.map((ligne, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-900">{ligne.designation}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{ligne.codeEurocode || '-'}</td>
                      <td className="py-3 px-4 text-center font-medium">{ligne.quantite}</td>
                      <td className="py-3 px-4 text-right font-mono">{ligne.prixUnitaireHT.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{ligne.tauxTva}%</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {ligne.totalHT.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="flex justify-between items-start my-6 pt-2">
              <div className="max-w-xs text-xs text-slate-500 space-y-1.5">
                <p className="font-bold text-slate-700">Conditions du devis :</p>
                <p className="text-[11px]">
                  • Devis valable 30 jours à compter de la date d'émission.
                </p>
                <p className="text-[11px]">
                  • Vitrages d'origine certifiés conformes 43R (normes européennes et constructeurs).
                </p>
                <p className="text-[11px]">
                  • Garantie étanchéité 1 an sur toute pose collée.
                </p>
                {devis.observations && (
                  <div className="p-2 bg-amber-50 rounded border border-amber-200/80 text-[11px] text-amber-900 mt-2">
                    <strong>Observations :</strong> {devis.observations}
                  </div>
                )}
              </div>

              <div className="w-72 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Hors Taxes (HT) :</span>
                  <span className="font-mono font-semibold">{formatDH(devis.totalHT)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>T.V.A (20.00%) :</span>
                  <span className="font-mono font-semibold">{formatDH(devis.totalTVA)}</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Net T.T.C :</span>
                  <span className="font-mono text-amber-700 text-base">{formatDH(devis.totalTTC)}</span>
                </div>
              </div>
            </div>

            {/* Signature & Bon pour accord */}
            <div className="mt-10 pt-4 border-t-2 border-slate-800 grid grid-cols-2 gap-6 text-[10px] text-slate-600">
              <div>
                <p className="font-bold text-slate-800 uppercase mb-1">
                  {GARAGE_INFO.nom} {GARAGE_INFO.formeJuridique}
                </p>
                <p>ICE: <span className="font-mono font-semibold text-slate-800">{GARAGE_INFO.ice}</span> | IF: <span className="font-mono font-semibold text-slate-800">{GARAGE_INFO.ifiscal}</span></p>
                <p>RC: <span className="font-mono">{GARAGE_INFO.rc}</span> | Patente: <span className="font-mono">{GARAGE_INFO.patente}</span></p>
                <div className="h-16 mt-2 flex items-end">
                  <span className="text-[10px] text-slate-400 italic">Signature & Cachet Garage</span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-slate-800 uppercase">Bon pour Accord Client :</p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    Mention manuscrite « Bon pour accord et commande de travaux »
                  </p>
                </div>
                <div className="flex justify-between items-end pt-6 text-[10px] text-slate-400">
                  <span>Date : .... / .... / 2026</span>
                  <span>Signature :</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
