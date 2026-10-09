import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserSession, UserRole } from '@/types';

export interface AuthResult {
  session: UserSession | null;
  error: string | null;
}

export interface UtilisateurDB {
  id: string;
  nom: string;
  email: string;
  mot_de_passe: string;
  role: UserRole;
  agence: string;
  statut: 'ACTIF' | 'SUSPENDU';
  created_at?: string;
  updated_at?: string;
}

// Comptes d'administration de référence (fallback si la table n'est pas encore initialisée)
const MASTER_CREDENTIALS: UtilisateurDB[] = [
  {
    id: 'usr-admin-master',
    email: 'direction@globaleparebrise.ma',
    mot_de_passe: 'GlobalPareBrise2026!',
    nom: 'Direction Générale (Gérant)',
    role: 'SUPERADMIN',
    agence: 'Marrakech',
    statut: 'ACTIF',
  },
  {
    id: 'usr-assistante-master',
    email: 'assistante@globaleparebrise.ma',
    mot_de_passe: 'Assistante2026!',
    nom: 'Sanaa (Secrétaire & Opérations)',
    role: 'ASSISTANTE',
    agence: 'Marrakech',
    statut: 'ACTIF',
  },
];

/**
 * Connexion sécurisée basée sur la table 'utilisateurs' de Supabase
 */
export async function loginWithSupabase(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return { session: null, error: "Veuillez saisir votre adresse email et votre mot de passe." };
  }

  // 1. Recherche directe dans la table 'utilisateurs' de Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        // Vérifier si le compte est suspendu
        if (data.statut === 'SUSPENDU') {
          return {
            session: null,
            error: "Ce compte a été suspendu par la direction. Veuillez contacter le gérant.",
          };
        }

        // Vérifier le mot de passe
        if (data.mot_de_passe === cleanPassword) {
          const session: UserSession = {
            id: data.id,
            nom: data.nom,
            email: data.email,
            role: (data.role || 'ASSISTANTE') as UserRole,
            agence: data.agence || 'Marrakech',
          };
          return { session, error: null };
        } else {
          return {
            session: null,
            error: "Mot de passe incorrect. Veuillez vérifier votre saisie.",
          };
        }
      }
    } catch (err) {
      console.warn('Erreur requête table utilisateurs:', err);
    }
  }

  // 2. Fallback sur les comptes Master de référence
  const matchedMaster = MASTER_CREDENTIALS.find(
    (m) =>
      m.email.toLowerCase() === cleanEmail ||
      (cleanEmail === 'direction' && m.role === 'SUPERADMIN') ||
      (cleanEmail === 'assistante' && m.role === 'ASSISTANTE') ||
      (cleanEmail === 'direction@globalparebrise.ma' && m.role === 'SUPERADMIN') ||
      (cleanEmail === 'admin@globaleparebrise.ma' && m.role === 'SUPERADMIN') ||
      (cleanEmail === 'assistante@globalparebrise.ma' && m.role === 'ASSISTANTE')
  );

  if (matchedMaster) {
    if (cleanPassword === matchedMaster.mot_de_passe) {
      const session: UserSession = {
        id: matchedMaster.id,
        nom: matchedMaster.nom,
        email: matchedMaster.email,
        role: matchedMaster.role,
        agence: matchedMaster.agence,
      };

      // Tenter d'auto-insérer dans Supabase si la table vient d'être créée
      if (isSupabaseConfigured && supabase) {
        supabase.from('utilisateurs').upsert([
          {
            id: matchedMaster.id,
            nom: matchedMaster.nom,
            email: matchedMaster.email,
            mot_de_passe: matchedMaster.mot_de_passe,
            role: matchedMaster.role,
            agence: matchedMaster.agence,
            statut: 'ACTIF',
          }
        ], { onConflict: 'email' }).then(() => {});
      }

      return { session, error: null };
    } else {
      return { session: null, error: "Mot de passe incorrect. Veuillez vérifier votre saisie." };
    }
  }

  // 3. Aucun compte correspondant
  return {
    session: null,
    error: "Identifiant introuvable ou mot de passe incorrect.",
  };
}

/**
 * Création d'un nouvel utilisateur dans la table 'utilisateurs' de Supabase
 */
export async function createCollaborateurInSupabase(
  nom: string,
  email: string,
  motDePasse: string,
  role: UserRole,
  agence: string = 'Marrakech'
): Promise<{ user: UtilisateurDB | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = motDePasse.trim();

  const newId = `usr-${Date.now()}`;
  const newUser: UtilisateurDB = {
    id: newId,
    nom: nom.trim(),
    email: cleanEmail,
    mot_de_passe: cleanPassword,
    role,
    agence,
    statut: 'ACTIF',
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data || newUser, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || "Erreur de connexion à Supabase." };
    }
  }

  return { user: newUser, error: null };
}

/**
 * Liste des collaborateurs depuis la table 'utilisateurs'
 */
export async function fetchCollaborateursFromSupabase(): Promise<UtilisateurDB[]> {
  if (!isSupabaseConfigured || !supabase) return MASTER_CREDENTIALS;

  try {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MASTER_CREDENTIALS;
    }

    return data;
  } catch (err) {
    console.error('Erreur fetchCollaborateursFromSupabase:', err);
    return MASTER_CREDENTIALS;
  }
}

/**
 * Mise à jour du statut d'un collaborateur (Actif / Suspendu)
 */
export async function updateStatutCollaborateurInSupabase(
  id: string,
  statut: 'ACTIF' | 'SUSPENDU'
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const { error } = await supabase
      .from('utilisateurs')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  } catch (err) {
    console.error('Erreur updateStatutCollaborateurInSupabase:', err);
    return false;
  }
}

/**
 * Modification du mot de passe d'un collaborateur par le Super Admin
 */
export async function updatePasswordCollaborateurInSupabase(
  id: string,
  newPassword: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const { error } = await supabase
      .from('utilisateurs')
      .update({ mot_de_passe: newPassword.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  } catch (err) {
    console.error('Erreur updatePasswordCollaborateurInSupabase:', err);
    return false;
  }
}

/**
 * Suppression d'un collaborateur dans Supabase
 */
export async function deleteCollaborateurFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const { error } = await supabase
      .from('utilisateurs')
      .delete()
      .eq('id', id);

    return !error;
  } catch (err) {
    console.error('Erreur deleteCollaborateurFromSupabase:', err);
    return false;
  }
}

/**
 * Alias pour compatibilité
 */
export const registerSupabaseUser = async (
  email: string,
  password: string,
  nom: string,
  role: UserRole,
  agence: string = 'Marrakech'
) => {
  return createCollaborateurInSupabase(nom, email, password, role, agence);
};

export async function logoutSupabase(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gp_user_session');
  }
}

export async function getActiveSupabaseSession(): Promise<UserSession | null> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('gp_user_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
  }
  return null;
}
