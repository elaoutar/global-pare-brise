'use client';

import React, { useState } from 'react';
import { UserSession, UserRole } from '@/types';
import { registerSupabaseUser } from '@/lib/authService';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Crown, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2,
  KeyRound,
  Building2
} from 'lucide-react';

interface Collaborateur {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  agence: string;
  dateCreation: string;
  statut: 'ACTIF' | 'SUSPENDU';
}

const INITIAL_COLLABORATEURS: Collaborateur[] = [
  {
    id: 'collab-1',
    nom: 'Direction Générale (Gérant)',
    email: 'direction.globalparebrise@gmail.com',
    role: 'SUPERADMIN',
    agence: 'Marrakech',
    dateCreation: '2026-01-15',
    statut: 'ACTIF',
  },
  {
    id: 'collab-2',
    nom: 'Sanaa (Secrétaire & Opérations)',
    email: 'assistante.globalparebrise@gmail.com',
    role: 'ASSISTANTE',
    agence: 'Marrakech',
    dateCreation: '2026-02-01',
    statut: 'ACTIF',
  },
];

interface Props {
  currentAdmin: UserSession;
}

export const UtilisateursView: React.FC<Props> = ({ currentAdmin }) => {
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>(INITIAL_COLLABORATEURS);
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulaire d'ajout
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ASSISTANTE');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!nom || !cleanEmail || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    // Enregistrement dans Supabase
    const { user, error: regError } = await registerSupabaseUser(
      cleanEmail,
      password,
      nom.trim(),
      role,
      currentAdmin.agence || 'Marrakech'
    );

    setIsLoading(false);

    if (regError && !regError.includes('rate limit')) {
      setError(regError);
      return;
    }

    // Ajout dans la liste locale des collaborateurs
    const newCollab: Collaborateur = {
      id: user?.id || `collab-${Date.now()}`,
      nom: nom.trim(),
      email: cleanEmail,
      role,
      agence: currentAdmin.agence || 'Marrakech',
      dateCreation: new Date().toISOString().split('T')[0],
      statut: 'ACTIF',
    };

    setCollaborateurs([newCollab, ...collaborateurs]);
    setSuccess(`Compte ${role === 'ASSISTANTE' ? 'Assistante' : 'Administrateur'} créé pour ${nom} (${cleanEmail}) !`);
    
    // Réinitialiser le formulaire
    setNom('');
    setEmail('');
    setPassword('');
    setRole('ASSISTANTE');
    setShowAddModal(false);
  };

  const handleToggleStatut = (id: string) => {
    setCollaborateurs((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, statut: c.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF' }
          : c
      )
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black uppercase tracking-tight">
              Gestion de l'Équipe & Contrôle des Rôles
            </h1>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Espace réservé au Super Administrateur. Seule la direction peut créer ou modifier les accès de l'assistante.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setError(null);
            setSuccess(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Créer un Compte Collaborateur</span>
        </button>
      </div>

      {/* Message de succès */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Collaborateurs habilités ({collaborateurs.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Utilisateur</th>
                <th className="p-4">Rôle & Privilèges</th>
                <th className="p-4">Agence</th>
                <th className="p-4">Date de Création</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collaborateurs.map((collab) => (
                <tr key={collab.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        collab.role === 'SUPERADMIN' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-brand-100 text-brand-700'
                      }`}>
                        {collab.role === 'SUPERADMIN' ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{collab.nom}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{collab.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      collab.role === 'SUPERADMIN'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-brand-100 text-brand-800'
                    }`}>
                      {collab.role === 'SUPERADMIN' ? '👑 Super Admin (Direction)' : '👩‍💼 Assistante (Opérations)'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {collab.role === 'SUPERADMIN' 
                        ? 'Accès total avec Chiffre d\'Affaires & Finances' 
                        : 'Saisie dossiers, devis, stock (Sans CA)'}
                    </p>
                  </td>

                  <td className="p-4 font-semibold text-slate-700">
                    {collab.agence}
                  </td>

                  <td className="p-4 text-slate-500 font-mono text-[11px]">
                    {collab.dateCreation}
                  </td>

                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      collab.statut === 'ACTIF'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {collab.statut === 'ACTIF' ? '● Actif' : '○ Suspendu'}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    {collab.email !== currentAdmin.email && (
                      <button
                        onClick={() => handleToggleStatut(collab.id)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        {collab.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale d'ajout de compte par le Super Admin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-400" />
                <h3 className="font-extrabold text-sm uppercase">Nouveau Collaborateur</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom & Prénom de l'assistante / collaborateur :
                </label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex: Sanaa El Mansouri"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rôle attribué :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('ASSISTANTE')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      role === 'ASSISTANTE'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <p className="font-extrabold flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Assistante
                    </p>
                    <p className="text-[10px] opacity-80 font-normal mt-0.5">Opérations sans Chiffre d'Affaires</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('SUPERADMIN')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      role === 'SUPERADMIN'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <p className="font-extrabold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> Super Admin
                    </p>
                    <p className="text-[10px] opacity-80 font-normal mt-0.5">Accès total Direction</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse Email (Identifiant de connexion) :
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: assistante@globaleparebrise.ma"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de Passe initial (min 6 caractères) :
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs py-2 px-3 pr-9 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <span>Valider & Créer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
