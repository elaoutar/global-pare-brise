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
  FileSpreadsheet,
  Crown,
  User,
  LogOut
} from 'lucide-react';
import { GARAGE_INFO } from '@/lib/data';
import { UserSession } from '@/types';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewDossier: () => void;
  dossiersCount: number;
  stockAlerteCount: number;
  devisCount?: number;
  userSession?: UserSession | null;
  onLogout?: () => void;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenNewDossier,
  dossiersCount,
  stockAlerteCount,
  devisCount = 0,
  userSession,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
    },
    {
      id: 'devis',
      label: 'Devis Clients',
      icon: FileSpreadsheet,
      badge: devisCount > 0 ? devisCount : undefined,
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

  const filteredNavItems = userSession?.role === 'ASSISTANTE'
    ? navItems.filter((item) => item.id !== 'recettes' && item.id !== 'rapports')
    : navItems;

  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 flex-shrink-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800">
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

          {/* User Session Info Card */}
          {userSession && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  userSession.role === 'SUPERADMIN' ? 'bg-indigo-600 text-amber-300' : 'bg-brand-600 text-white'
                }`}>
                  {userSession.role === 'SUPERADMIN' ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="truncate">
                  <p className="font-bold text-white text-xs truncate leading-tight">{userSession.nom}</p>
                  <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                    userSession.role === 'SUPERADMIN' ? 'bg-indigo-900/90 text-indigo-300' : 'bg-brand-900/90 text-brand-300'
                  }`}>
                    {userSession.role === 'SUPERADMIN' ? '👑 Super Admin' : '👩‍💼 Assistante'}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors flex-shrink-0"
                  title="Se Déconnecter"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
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
          {filteredNavItems.map((item) => {
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
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
        <div>
          <p className="font-mono text-slate-400 font-semibold">{GARAGE_INFO.ice}</p>
          <p className="text-[10px] mt-0.5">Tiers-payant conventionné</p>
        </div>
        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Supabase Cloud Connecté</span>
        </div>
      </div>
    </aside>
  );
};
