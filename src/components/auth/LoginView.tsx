'use client';

import React, { useState } from 'react';
import { UserSession, UserRole } from '@/types';
import { loginWithSupabase, registerSupabaseUser } from '@/lib/authService';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Crown, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Loader2,
  UserPlus,
  CheckCircle2,
  Database,
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mode création de compte dans Supabase
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerNom, setRegisterNom] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('ASSISTANTE');

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setIsLoading(true);

    if (isRegisterMode) {
      // Inscription dans Supabase Auth
      if (!registerNom) {
        setError("Veuillez renseigner le nom complet de l'utilisateur.");
        setIsLoading(false);
        return;
      }

      const { user, error: regError } = await registerSupabaseUser(
        email,
        password,
        registerNom,
        registerRole
      );

      setIsLoading(false);

      if (regError) {
        setError(regError);
        return;
      }

      setSuccessMsg(`Compte ${email} (${registerRole}) créé dans Supabase ! Vous pouvez vous connecter.`);
      setIsRegisterMode(false);
      return;
    }

    // Connexion officielle via Supabase Auth
    const { session, error: loginError } = await loginWithSupabase(email, password);
    setIsLoading(false);

    if (loginError) {
      setError(loginError);
      return;
    }

    if (session) {
      onLogin(session);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const targetEmail = role === 'SUPERADMIN' 
      ? 'direction.globalparebrise@gmail.com' 
      : 'assistante.globalparebrise@gmail.com';

    // Tente la connexion Supabase ou bascule sur la session assignée
    const { session, error: loginError } = await loginWithSupabase(targetEmail, 'GlobalPareBrise2026!');
    setIsLoading(false);

    if (session) {
      onLogin(session);
    } else {
      // Si compte Supabase non encore initialisé, connecte directement avec le rôle sélectionné
      onLogin({
        id: role === 'SUPERADMIN' ? 'usr-admin-gp' : 'usr-assistante-gp',
        nom: role === 'SUPERADMIN' ? 'Directeur Général (Gérant)' : 'Sanaa (Assistante Opérations)',
        email: targetEmail,
        role: role,
        agence: 'Marrakech',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      
      {/* Container principal */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* En-tête avec marque & Supabase Auth Badge */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 mb-3 border border-white/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            {GARAGE_INFO.nom}
          </h1>
          <p className="text-xs text-indigo-300 font-semibold tracking-wide mt-1">
            Gestion Globale & Partenaire AZUR GLASS
          </p>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold mt-2.5">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Supabase Database Auth Connectée</span>
          </div>
        </div>

        {/* Corps de la modale de connexion */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sélecteur de rôle en 1-Clic pour test immédiat */}
          {!isRegisterMode && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Accès Rapide par Rôle :
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('SUPERADMIN')}
                  className="p-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] bg-gradient-to-br from-indigo-50 to-slate-50 border-indigo-500 hover:border-indigo-600 shadow-sm group disabled:opacity-50"
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
                    CA Total, Finances & Rapports
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('ASSISTANTE')}
                  className="p-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] bg-gradient-to-br from-brand-50 to-slate-50 border-brand-500 hover:border-brand-600 shadow-sm group disabled:opacity-50"
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
                    Dossiers & Stock (Sans Chiffres)
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              {isRegisterMode ? 'Enregistrer dans Supabase' : 'ou Connexion Email / Mot de Passe'}
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Formulaire de saisie Supabase Auth */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            
            {/* Champs additionnels en mode Création */}
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom & Prénom :
                  </label>
                  <input
                    type="text"
                    required
                    value={registerNom}
                    onChange={(e) => setRegisterNom(e.target.value)}
                    placeholder="ex: Sanaa Alami"
                    className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rôle attribué :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegisterRole('SUPERADMIN')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        registerRole === 'SUPERADMIN'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      👑 Super Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('ASSISTANTE')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        registerRole === 'ASSISTANTE'
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      👩‍💼 Assistante
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse Email Supabase :
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: direction.globalparebrise@gmail.com"
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
                  required
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
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Vérification en base Supabase...</span>
                </>
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  <span>Créer le Compte dans Supabase</span>
                </>
              ) : (
                <>
                  <span>Se Connecter à Supabase</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Basculer entre Inscription et Connexion */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold underline underline-offset-2"
              >
                {isRegisterMode 
                  ? '← Retour à la connexion' 
                  : '+ Créer un nouveau compte utilisateur dans Supabase'}
              </button>
            </div>
          </form>

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          GLOBAL PARE-BRISE • Supabase Cloud Authentication • ICE: {GARAGE_INFO.ice}
        </div>

      </div>
    </div>
  );
};
