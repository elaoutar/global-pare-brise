'use client';

import React, { useState } from 'react';
import { UserSession, UserRole } from '@/types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  UserCheck, 
  Crown, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  Building2
} from 'lucide-react';
import { GARAGE_INFO } from '@/lib/data';

interface Props {
  onLogin: (session: UserSession) => void;
}

export const LoginView: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPERADMIN');

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('direction')) {
      onLogin({
        id: 'usr-admin',
        nom: 'Direction Générale (Gérant)',
        email: email,
        role: 'SUPERADMIN',
        agence: 'Marrakech',
      });
    } else {
      onLogin({
        id: 'usr-assistante',
        nom: 'Assistante de Direction',
        email: email,
        role: 'ASSISTANTE',
        agence: 'Marrakech',
      });
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    if (role === 'SUPERADMIN') {
      onLogin({
        id: 'usr-admin',
        nom: 'Directeur Général (Gérant)',
        email: 'direction@globaleparebrise.ma',
        role: 'SUPERADMIN',
        agence: 'Marrakech',
      });
    } else {
      onLogin({
        id: 'usr-assistante',
        nom: 'Sanaa (Assistante Opérations)',
        email: 'operations@globaleparebrise.ma',
        role: 'ASSISTANTE',
        agence: 'Marrakech',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      
      {/* Container principal */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* En-tête avec marque */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 mb-3 border border-white/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            {GARAGE_INFO.nom}
          </h1>
          <p className="text-xs text-indigo-300 font-semibold tracking-wide mt-1">
            Système Intégré de Gestion & Tiers-Payant Assurances
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-slate-400">
            <span>Marrakech</span>
            <span>•</span>
            <span>El Jadida</span>
            <span>•</span>
            <span>Partenaire AZUR GLASS</span>
          </div>
        </div>

        {/* Corps de la modale de connexion */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Sélecteur de rôle en 1-Clic pour test immédiat */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Choisissez votre profil de connexion :
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('SUPERADMIN')}
                className="p-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] bg-gradient-to-br from-indigo-50 to-slate-50 border-indigo-500 hover:border-indigo-600 shadow-sm group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Crown className="w-4 h-4 text-amber-300" />
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                    Direction
                  </span>
                </div>
                <p className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Super Admin
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Dashboard complet avec Chiffre d'Affaires & Finances
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ASSISTANTE')}
                className="p-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] bg-gradient-to-br from-brand-50 to-slate-50 border-brand-500 hover:border-brand-600 shadow-sm group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-bold bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded">
                    Opérations
                  </span>
                </div>
                <p className="font-extrabold text-xs text-slate-900 group-hover:text-brand-600 transition-colors">
                  Assistante
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Dossiers, Stock & Factures (Sans chiffres d'affaires)
                </p>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              ou connexion classique
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Formulaire de saisie classique */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse Email / Identifiant :
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: direction@globaleparebrise.ma"
                  className="w-full text-xs py-2.5 px-3 pl-9 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mot de Passe :
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs py-2.5 px-3 pl-9 pr-9 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <span>Se Connecter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          GLOBAL PARE-BRISE • Connexion Sécurisée • ICE: {GARAGE_INFO.ice}
        </div>

      </div>
    </div>
  );
};
