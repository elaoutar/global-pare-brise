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
  AlertCircle
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Veuillez renseigner votre adresse email et votre mot de passe.');
      return;
    }

    setIsLoading(true);

    if (isRegisterMode) {
      // Inscription sécurisée d'un nouveau collaborateur dans Supabase
      if (!registerNom.trim()) {
        setError("Veuillez renseigner le nom complet de l'utilisateur.");
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Le mot de passe doit comporter au moins 6 caractères.");
        setIsLoading(false);
        return;
      }

      const { user, error: regError } = await registerSupabaseUser(
        cleanEmail,
        password,
        registerNom,
        registerRole
      );

      setIsLoading(false);

      if (regError) {
        setError(regError);
        return;
      }

      setSuccessMsg(`Compte créé avec succès dans Supabase ! Vous pouvez maintenant vous connecter avec votre mot de passe.`);
      setIsRegisterMode(false);
      setPassword('');
      return;
    }

    // Connexion STRICTE à la base de données Supabase
    const { session, error: loginError } = await loginWithSupabase(cleanEmail, password);
    setIsLoading(false);

    if (loginError) {
      setError(loginError);
      return;
    }

    if (session) {
      onLogin(session);
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
            Espace Sécurisé • Authentification Obligatoire
          </p>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold mt-2.5">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Sécurité Base de Données Supabase Active</span>
          </div>
        </div>

        {/* Corps de connexion sécurisée */}
        <div className="p-6 sm:p-8 space-y-5">

          {/* Messages d'erreur */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Message de succès */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formulaire strict de connexion */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Champs additionnels lors de la création de compte */}
            {isRegisterMode && (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
                  Création d'un nouveau compte enregistré dans la base Supabase.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom & Prénom du collaborateur :
                  </label>
                  <input
                    type="text"
                    required
                    value={registerNom}
                    onChange={(e) => setRegisterNom(e.target.value)}
                    placeholder="ex: Ahmed El Mansouri"
                    className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rôle & Privilèges accordés :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegisterRole('SUPERADMIN')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                        registerRole === 'SUPERADMIN'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-extrabold flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" /> Super Admin
                      </p>
                      <p className="text-[10px] opacity-80 font-normal mt-0.5">Accès CA & Finances</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('ASSISTANTE')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                        registerRole === 'ASSISTANTE'
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-extrabold flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Assistante
                      </p>
                      <p className="text-[10px] opacity-80 font-normal mt-0.5">Sans chiffres CA</p>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse Email :
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
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
                  <span>Vérification en cours...</span>
                </>
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  <span>Enregistrer le compte</span>
                </>
              ) : (
                <>
                  <span>Connexion Sécurisée</span>
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
                  ? '← Retour au formulaire de connexion' 
                  : '+ Créer un nouveau compte dans Supabase'}
              </button>
            </div>
          </form>

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          GLOBAL PARE-BRISE • Accès Contrôlé • ICE: {GARAGE_INFO.ice}
        </div>

      </div>
    </div>
  );
};
