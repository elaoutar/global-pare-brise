'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  FileCheck, 
  Package, 
  Receipt, 
  ShieldAlert, 
  Users2, 
  Truck,
  Wrench,
  ShieldCheck,
  Plus,
  Coins,
  FileSpreadsheet
} from 'lucide-react';
import { GARAGE_INFO } from '@/lib/data';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewDossier: () => void;
  dossiersCount: number;
  stockAlerteCount: number;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenNewDossier,
  dossiersCount,
  stockAlerteCount,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
    },
    {
      id: 'dossiers',
      label: 'Dossiers Sinistres & Pose',
      icon: FileCheck,
      badge: dossiersCount,
    },
    {
      id: 'stock',
      label: 'Stock & Bons de Sortie',
      icon: Package,
      alertBadge: stockAlerteCount > 0 ? stockAlerteCount : undefined,
    },
    {
      id: 'facturation',
      label: 'Facturation (TVA 20%)',
      icon: Receipt,
    },
    {
      id: 'recettes',
      label: 'État des Recettes (Chèques, Traites)',
      icon: Coins,
    },
    {
      id: 'rapports',
      label: 'Rapports & Exports (PDF/XLSX)',
      icon: FileSpreadsheet,
    },
    {
      id: 'assurances',
      label: 'État des Assurances',
      icon: ShieldAlert,
    },
    {
      id: 'partenaires',
      label: 'État Partenaires',
      icon: Users2,
    },
    {
      id: 'fournisseurs',
      label: 'Fournisseurs & Commandes',
      icon: Truck,
    },
  ];

  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 flex-shrink-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-sm text-white tracking-tight leading-none uppercase">
                GLOBAL PARE-BRISE
              </h1>
              <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
                Marrakech • Maroc
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4">
          <button
            onClick={onOpenNewDossier}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nouveau Dossier Sinistre
          </button>
        </div>

        {/* Menu Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {item.alertBadge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {item.alertBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="font-mono text-slate-400 font-semibold">{GARAGE_INFO.ice}</p>
        <p className="text-[10px] mt-0.5">Tiers-payant conventionné</p>
      </div>
    </aside>
  );
};
