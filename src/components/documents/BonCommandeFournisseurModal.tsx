'use client';

import React, { useRef } from 'react';
import { BonCommandeFournisseur, Fournisseur } from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { formatDate, formatDH, montantEnToutesLettres, getStatutCommandeFournisseurBadge, getStatutPaiementFournisseurBadge } from '@/lib/utils';
import { DocumentActionBar } from './DocumentActionBar';
import { FileCheck, Building2, MapPin, Phone, Mail, Truck } from 'lucide-react';

interface Props {
  commande: BonCommandeFournisseur;
  fournisseur: Fournisseur;
  onClose: () => void;
}

export const BonCommandeFournisseurModal: React.FC<Props> = ({ commande, fournisseur, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const shareMsg = `Bonjour ${fournisseur.nom}, voici le Bon de Commande N° ${commande.numeroBC} émis par ${GARAGE_INFO.nom} pour un montant total de ${formatDH(commande.totalTTC)} TTC. Merci de nous confirmer la date de livraison.`;

  const badgeCommande = getStatutCommandeFournisseurBadge(commande.statutCommande);
  const badgePaiement = getStatutPaiementFournisseurBadge(commande.statutPaiement);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Document Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`BON-COMMANDE-${commande.numeroBC}-${fournisseur.nom.replace(/\s+/g, '_')}`}
          documentTitle={`Bon de Commande Fournisseur #${commande.numeroBC}`}
          subtitle={`Fournisseur : ${fournisseur.nom} • Total : ${formatDH(commande.totalTTC)} TTC • Agence : ${commande.agenceVille || 'Marrakech'}`}
          clientPhone={fournisseur.telephone}
          shareMessage={shareMsg}
          badgeText="Achat / Appro"
          badgeColor="bg-indigo-600"
          onClose={onClose}
        />

        {/* Printable Voucher (Strict A4) */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl"
          >
            {/* Header: Company & Order Badge */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight">
                  {GARAGE_INFO.nom}
                </h1>
                <p className="text-xs text-slate-600 font-semibold">{GARAGE_INFO.formeJuridique} • Centre Spécialisé Vitrage Automobile</p>
                <p className="text-[11px] text-slate-500 mt-1">{GARAGE_INFO.adresse}</p>
                <p className="text-[11px] text-slate-500">
                  Tél : {GARAGE_INFO.telephone} | Email : {GARAGE_INFO.email}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ICE: {GARAGE_INFO.ice} | RC: {GARAGE_INFO.rc} | IF: {GARAGE_INFO.ifiscal} | Patente: {GARAGE_INFO.patente}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block font-black text-xs sm:text-sm uppercase px-3 py-1.5 bg-indigo-900 text-white rounded-lg shadow-sm">
                  BON DE COMMANDE
                </span>
                <p className="text-sm font-black text-slate-900 mt-2 font-mono">
                  N° {commande.numeroBC}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Date : <strong>{formatDate(commande.dateCommande)}</strong>
                </p>
                {commande.agenceVille && (
                  <p className="text-xs font-semibold text-brand-700 mt-0.5">
                    Agence : 📍 {commande.agenceVille}
                  </p>
                )}
                {commande.dateLivraisonPrevue && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Livraison souhaitée : <strong>{formatDate(commande.dateLivraisonPrevue)}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Grid Buyer / Supplier Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Buyer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Émetteur de la Commande
                </p>
                <p className="font-bold text-slate-900 text-sm">{GARAGE_INFO.nom}</p>
                <p className="text-slate-600">Service Approvisionnement & Gestion des Stocks</p>
                <p className="text-slate-600 mt-1">Lieu de livraison : <strong>{GARAGE_INFO.adresse}</strong></p>
                <p className="text-slate-600">Contact réception : <strong>{GARAGE_INFO.telephone}</strong></p>
              </div>

              {/* Supplier */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 text-xs">
                <p className="font-bold text-[10px] text-indigo-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" /> Fournisseur Destinataire
                </p>
                <p className="font-bold text-slate-900 text-sm">{fournisseur.nom}</p>
                <p className="text-slate-600 font-semibold">{fournisseur.specialite}</p>
                <p className="text-slate-600 mt-1">Ville : <strong>{fournisseur.ville}</strong></p>
                <p className="text-slate-600">Tél : <strong>{fournisseur.telephone || '-'}</strong></p>
                {fournisseur.email && <p className="text-slate-600">Email : {fournisseur.email}</p>}
                {fournisseur.ice && (
                  <p className="text-[11px] font-mono text-indigo-900 font-semibold mt-1">
                    ICE : {fournisseur.ice}
                  </p>
                )}
              </div>
            </div>

            {/* Status overview badges (for internal reference) */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-4 text-xs">
              <span className="font-semibold text-slate-600">État de la commande :</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeCommande.bg}`}>
                {badgeCommande.label}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-600">État du règlement :</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgePaiement.bg}`}>
                {badgePaiement.label}
              </span>
              {commande.modePaiement && (
                <span className="text-[11px] text-slate-600 font-medium">
                  ({commande.modePaiement} {commande.referencePaiement ? `• ${commande.referencePaiement}` : ''})
                </span>
              )}
            </div>

            {/* Order Lines Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Désignation de l'article / Vitrage</th>
                    <th className="py-2.5 px-3 w-32">Réf / Eurocode</th>
                    <th className="py-2.5 px-3 w-16 text-center">Qté</th>
                    <th className="py-2.5 px-3 w-28 text-right">P.U Achat HT</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {commande.lignes.map((ligne, idx) => (
                    <tr key={ligne.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {ligne.designation}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {ligne.codeEurocode || ligne.reference || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {ligne.quantite}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatDH(ligne.prixUnitaireAchatHT)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatDH(ligne.totalHT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Written Amount */}
            <div className="flex justify-between items-start gap-6 border-t-2 border-slate-200 pt-4 mb-6">
              <div className="flex-1 space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Arrêté le présent bon de commande à la somme de :</p>
                  <p className="font-bold text-slate-900 italic mt-1 text-[11px]">
                    « {montantEnToutesLettres(commande.totalTTC)} »
                  </p>
                </div>

                {commande.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                    <strong>Instructions & Observations :</strong> {commande.notes}
                  </p>
                )}

                {/* Situation financière récap */}
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                  <p>Montant payé / acompte : <strong>{formatDH(commande.montantPaye)}</strong></p>
                  <p>Reste à payer fournisseur : <strong className={commande.totalTTC - commande.montantPaye > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    {formatDH(Math.max(0, commande.totalTTC - commande.montantPaye))}
                  </strong></p>
                </div>
              </div>

              <div className="w-64 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Total Hors Taxes (HT) :</span>
                  <span className="font-mono font-bold text-slate-900">{formatDH(commande.totalHT)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600 border-t border-slate-200">
                  <span>TVA Maroc (20%) :</span>
                  <span className="font-mono font-bold text-slate-900">{formatDH(commande.totalTVA)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900 bg-white px-2 rounded-lg mt-1">
                  <span>TOTAL TTC :</span>
                  <span className="font-mono text-indigo-700">{formatDH(commande.totalTTC)}</span>
                </div>
              </div>
            </div>

            {/* Signatures & Stamps */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs text-center mt-6">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 min-h-[110px] flex flex-col justify-between">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Visa & Cachet du Fournisseur
                </p>
                <p className="text-[10px] text-slate-400 italic">Pour acceptation de commande & délai de livraison</p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 min-h-[110px] flex flex-col justify-between">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Pour {GARAGE_INFO.nom}
                </p>
                <p className="text-[10px] text-slate-400 italic">Signature de la Direction & Cachet</p>
              </div>
            </div>

            {/* Footer Legal Note */}
            <div className="text-center text-[10px] text-slate-400 mt-8 pt-3 border-t border-slate-200">
              {GARAGE_INFO.nom} • Document officiel de commande de fournitures conforme à la législation marocaine • {GARAGE_INFO.siteWeb}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
