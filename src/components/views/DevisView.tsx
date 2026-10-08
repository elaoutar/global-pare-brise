'use client';

import React, { useState } from 'react';
import { DevisClient, ArticleStock, Assurance, StatutDevis } from '@/types';
import { formatDH, formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { MatriculeBadge } from '@/components/ui/MatriculeBadge';
import { 
  FileText, 
  Printer, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  Car
} from 'lucide-react';

interface Props {
  devisList: DevisClient[];
  stockArticles: ArticleStock[];
  assurances: Assurance[];
  onOpenNewDevis: () => void;
  onOpenEditDevis: (devis: DevisClient) => void;
  onOpenViewDevis: (devis: DevisClient) => void;
  onUpdateStatutDevis: (devisId: string, newStatut: StatutDevis) => void;
  onDeleteDevis: (devisId: string) => void;
  onConvertDevisEnDossier: (devis: DevisClient) => void;
}

export const DevisView: React.FC<Props> = ({
  devisList,
  onOpenNewDevis,
  onOpenEditDevis,
  onOpenViewDevis,
  onUpdateStatutDevis,
  onDeleteDevis,
  onConvertDevisEnDossier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('ALL');
  const [filterVille, setFilterVille] = useState<string>('ALL');

  const filteredDevis = devisList.filter((d) => {
    const searchString = `
      ${d.numeroDevis} 
      ${d.clientNom} 
      ${d.clientTelephone} 
      ${d.vehiculeMarque} 
      ${d.vehiculeModele} 
      ${d.vehiculeImmatriculation} 
      ${formatMatricule(d.vehiculeImmatriculation, 'LATIN')} 
      ${formatMatricule(d.vehiculeImmatriculation, 'ARABE')}
      ${d.agenceVille}
    `.toLowerCase();

    const matchSearch = searchString.includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'ALL' || d.statut === filterStatut;
    const matchVille = filterVille === 'ALL' || d.agenceVille === filterVille;

    return matchSearch && matchStatut && matchVille;
  });

  const totalDevisTTC = devisList.reduce((acc, d) => acc + d.totalTTC, 0);
  const devisAcceptes = devisList.filter((d) => d.statut === 'ACCEPTE' || d.statut === 'CONVERTI_DOSSIER');
  const totalAcceptesTTC = devisAcceptes.reduce((acc, d) => acc + d.totalTTC, 0);
  const devisEnAttente = devisList.filter((d) => d.statut === 'ENVOYE' || d.statut === 'BROUILLON');

  const getStatutBadge = (statut: StatutDevis) => {
    switch (statut) {
      case 'ACCEPTE':
        return { label: 'Accepté / Bon pour accord', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CONVERTI_DOSSIER':
        return { label: 'Converti en Dossier', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'ENVOYE':
        return { label: 'Envoyé au Client', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'REFUSE':
        return { label: 'Refusé / Sans suite', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'BROUILLON':
      default:
        return { label: 'Brouillon', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Devis Émis TTC</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatDH(totalDevisTTC)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{devisList.length} devis créés</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Devis Acceptés & Validés</span>
          <p className="text-2xl font-black text-emerald-700 font-mono mt-1">{formatDH(totalAcceptesTTC)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">{devisAcceptes.length} devis signés ou convertis</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase">En Attente de Décision</span>
          <p className="text-2xl font-black text-amber-700 font-mono mt-1">{devisEnAttente.length}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Devis en cours de relance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-brand-600 uppercase">Actions Rapides</span>
            <p className="text-xs text-slate-500 mt-0.5">Établir une offre de prix immédiate</p>
          </div>
          <button
            onClick={onOpenNewDevis}
            className="w-full mt-3 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Créer Nouveau Devis
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <div className="relative flex-1 sm:w-80 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher devis, client, véhicule, matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Filter Ville */}
            <select
              value={filterVille}
              onChange={(e) => setFilterVille(e.target.value)}
              className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Toutes les agences</option>
              <option value="Marrakech">Marrakech</option>
              <option value="El Jadida">El Jadida</option>
            </select>

            {/* Filter Statut */}
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ENVOYE">Envoyés</option>
              <option value="ACCEPTE">Acceptés</option>
              <option value="CONVERTI_DOSSIER">Convertis en Dossier</option>
              <option value="BROUILLON">Brouillons</option>
              <option value="REFUSE">Refusés</option>
            </select>

            <button
              onClick={onOpenNewDevis}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Nouveau Devis
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">N° Devis</th>
                <th className="py-3 px-4">Date & Validité</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Véhicule</th>
                <th className="py-3 px-4">Agence</th>
                <th className="py-3 px-4 text-right">Total HT</th>
                <th className="py-3 px-4 text-right">Total TTC</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDevis.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    Aucun devis trouvé. Cliquez sur "Nouveau Devis" pour créer votre premier devis client.
                  </td>
                </tr>
              ) : (
                filteredDevis.map((dev) => {
                  const badge = getStatutBadge(dev.statut);

                  return (
                    <tr key={dev.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {dev.numeroDevis}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{formatDate(dev.dateDevis)}</span>
                        <span className="block text-[10px] text-slate-400">
                          Valable au {formatDate(dev.dateValidite)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{dev.clientNom}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {dev.clientTelephone}
                        </span>
                        {dev.typeDemande === 'ASSURANCE' && dev.compagnieAssurance && (
                          <span className="inline-block mt-0.5 text-[10px] text-brand-700 font-semibold bg-brand-50 px-1.5 py-0.2 rounded">
                            🛡️ {dev.compagnieAssurance}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {dev.vehiculeMarque} {dev.vehiculeModele} ({dev.vehiculeAnnee})
                        </span>
                        <div className="mt-1" dir="ltr">
                          <MatriculeBadge immatriculation={dev.vehiculeImmatriculation} />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          {dev.agenceVille}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatDH(dev.totalHT)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatDH(dev.totalTTC)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <select
                          value={dev.statut}
                          onChange={(e) => onUpdateStatutDevis(dev.id, e.target.value as StatutDevis)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${badge.bg} cursor-pointer focus:outline-none`}
                        >
                          <option value="BROUILLON">Brouillon</option>
                          <option value="ENVOYE">Envoyé</option>
                          <option value="ACCEPTE">Accepté</option>
                          <option value="CONVERTI_DOSSIER">Converti en Dossier</option>
                          <option value="REFUSE">Refusé</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Convert to Dossier button */}
                          {dev.statut !== 'CONVERTI_DOSSIER' && (
                            <button
                              onClick={() => onConvertDevisEnDossier(dev)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                              title="Convertir ce devis en dossier de pose actif"
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> Dossier
                            </button>
                          )}

                          {/* Print / View */}
                          <button
                            onClick={() => onOpenViewDevis(dev)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-semibold transition-colors border border-amber-200"
                            title="Visualiser, Imprimer A4, Télécharger PDF ou Partager sur WhatsApp"
                          >
                            <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onOpenEditDevis(dev)}
                            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded"
                            title="Modifier le devis"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Confirmez-vous la suppression du devis ${dev.numeroDevis} ?`)) {
                                onDeleteDevis(dev.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Supprimer le devis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
