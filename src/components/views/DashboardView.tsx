'use client';

import React from 'react';
import { DossierSinistre, ArticleStock, Facture } from '@/types';
import { formatDH, formatDate, getStatutDossierBadge } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { 
  Car, 
  FileText, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Package, 
  PlusCircle,
  Eye,
  ArrowUpRight
} from 'lucide-react';

interface Props {
  dossiers: DossierSinistre[];
  stock: ArticleStock[];
  factures: Facture[];
  onOpenNewDossier: () => void;
  onSelectDossier: (dossier: DossierSinistre) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  dossiers,
  stock,
  factures,
  onOpenNewDossier,
  onSelectDossier,
  onNavigateTab,
}) => {
  // Financial stats
  const totalFactureTTC = factures.reduce((acc, f) => acc + f.totalTTC, 0);
  const totalEncaisse = factures.reduce((acc, f) => acc + f.montantRegle, 0);
  const creancesEnAttente = Math.max(0, totalFactureTTC - totalEncaisse);

  // Stock stats
  const stockCritique = stock.filter((art) => art.quantiteEnStock <= art.stockMinimumAlerte);
  const valeurStockTotal = stock.reduce((acc, a) => acc + a.quantiteEnStock * a.prixAchatHT, 0);

  // Dossiers counts
  const dossiersEnCours = dossiers.filter((d) => d.statut === 'EN_COURS_POSE' || d.statut === 'NOUVEAU').length;
  const dossiersDeposes = dossiers.filter((d) => d.statut === 'DEPOSE_ASSURANCE').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-300 border border-brand-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Système Gestion Pare-Brise & Assurances Maroc
            </div>
            <h1 className="text-2xl font-black tracking-tight">Tableau de Bord Atelier & Gestion</h1>
            <p className="text-slate-300 text-xs mt-1">
              Globale Pare-Brise - Remplacement certifié, tiers-payant assurances & conventions directes
            </p>
          </div>
          <button
            onClick={onOpenNewDossier}
            className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-brand-500/25 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Nouveau Dossier Pare-Brise
          </button>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Chiffre d'Affaires */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono">{formatDH(totalFactureTTC)}</h3>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {formatDH(totalEncaisse)} encaissés
            </p>
          </div>
        </div>

        {/* KPI 2 : Créances Assurances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Créances Assurances</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-brand-700 font-mono">{formatDH(creancesEnAttente)}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {dossiersDeposes} dossiers déposés en attente virement
            </p>
          </div>
        </div>

        {/* KPI 3 : Dossiers en Atelier */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activité Atelier</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{dossiersEnCours}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">
              Poses en cours ou programmées
            </p>
          </div>
        </div>

        {/* KPI 4 : Stock & Alertes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valeur Stock</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono">{formatDH(valeurStockTotal)}</h3>
            {stockCritique.length > 0 ? (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {stockCritique.length} alerte(s) stock bas
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Stock opérationnel</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Dossiers + Quick Actions & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Dossiers (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Dossiers Récents & Suivi de Pose</h2>
              <p className="text-xs text-slate-500">Derniers véhicules reçus au garage</p>
            </div>
            <button
              onClick={() => onNavigateTab('dossiers')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Voir tous les dossiers <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {dossiers.slice(0, 5).map((dossier) => {
              const badge = getStatutDossierBadge(dossier.statut);
              return (
                <div
                  key={dossier.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {dossier.vehicule.marque.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{dossier.vehicule.marque} {dossier.vehicule.modele}</span>
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200" dir="ltr">
                          {formatMatricule(dossier.vehicule.immatriculation, 'LATIN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {dossier.client.nom} • {dossier.typeDossier === 'PARTICULIER_COMPTANT' ? (
                          <span className="font-semibold text-amber-700">Client Direct (Comptant)</span>
                        ) : (
                          <>
                            {dossier.assurance?.nom} • <span className="font-mono">{dossier.numeroSinistre || '-'}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-slate-900">{formatDH(dossier.montantTotalTTC)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectDossier(dossier)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Ouvrir détails & Quittance"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Stock Alerts & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Stock Alerts Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertes Magasin / Stock
              </h3>
              <button
                onClick={() => onNavigateTab('stock')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Gérer stock
              </button>
            </div>

            {stockCritique.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Aucun article sous le seuil d'alerte.</p>
            ) : (
              <div className="space-y-2.5">
                {stockCritique.map((art) => (
                  <div
                    key={art.id}
                    className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 line-clamp-1">{art.designation}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Réf: {art.reference}</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-rose-100 text-rose-800 font-bold font-mono">
                      {art.quantiteEnStock} restants
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Practical Checklist for Insurance Pack */}
          <div className="bg-brand-900 text-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              Pack Dossier Assurance Requis
            </h3>
            <p className="text-xs text-brand-200 mb-3">
              Rappels pour validation rapide par l'expert / assurance :
            </p>
            <ul className="text-xs space-y-2 text-brand-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Quittance subrogative signée par l'assuré
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copie carte grise + CIN
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Photo avant démontage (plaque visible)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Facture définitive avec ICE du garage
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
