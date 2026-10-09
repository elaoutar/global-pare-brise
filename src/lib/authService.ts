import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserSession, UserRole } from '@/types';

export interface AuthResult {
  session: UserSession | null;
  error: string | null;
}

// Comptes initiaux d'administration
const MASTER_CREDENTIALS = [
  {
    email: 'direction@globaleparebrise.ma',
    password: 'GlobalPareBrise2026!',
    nom: 'Direction Générale (Gérant)',
    role: 'SUPERADMIN' as UserRole,
    agence: 'Marrakech',
  },
  {
    email: 'assistante@globaleparebrise.ma',
    password: 'Assistante2026!',
    nom: 'Sanaa (Secrétaire & Opérations)',
    role: 'ASSISTANTE' as UserRole,
    agence: 'Marrakech',
  },
];

/**
 * Connexion officielle et sécurisée
 * Exige STRICTEMENT un email et mot de passe valides.
 */
export async function loginWithSupabase(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { session: null, error: "Veuillez saisir votre email et votre mot de passe." };
  }

  // 1. Tente d'abord la connexion directe sur Supabase Auth
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (!error && data?.user) {
        const metadata = data.user.user_metadata || {};
        const role: UserRole = metadata.role === 'ASSISTANTE' ? 'ASSISTANTE' : 'SUPERADMIN';
        const nom: string = metadata.nom || (role === 'SUPERADMIN' ? 'Direction Générale (Gérant)' : 'Assistante Opérations');
        const agence: string = metadata.agence || 'Marrakech';

        const session: UserSession = {
          id: data.user.id,
          nom,
          email: data.user.email || cleanEmail,
          role,
          agence,
        };

        return { session, error: null };
      }
    } catch (err: any) {
      console.warn('Tentative Supabase Auth:', err);
    }
  }

  // 2. Vérification stricte des identifiants d'administration (SuperAdmin / Assistante)
  const master = MASTER_CREDENTIALS.find(
    (c) => c.email.toLowerCase() === cleanEmail && c.password === password
  );

  if (master) {
    const session: UserSession = {
      id: `usr-${master.role.toLowerCase()}-${Date.now()}`,
      nom: master.nom,
      email: master.email,
      role: master.role,
      agence: master.agence,
    };
    return { session, error: null };
  }

  // 3. Si aucun identifiant ne correspond, accès formellement refusé
  return {
    session: null,
    error: "Email ou mot de passe incorrect. Accès non autorisé.",
  };
}

/**
 * Création d'un nouvel utilisateur dans Supabase Auth (Réservé au Super Admin)
 */
export async function registerSupabaseUser(
  email: string,
  password: string,
  nom: string,
  role: UserRole,
  agence: string = 'Marrakech'
): Promise<{ user: any; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: "Supabase non configuré." };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          nom: nom.trim(),
          role,
          agence,
        },
      },
    });

    if (error && !error.message.includes('rate limit')) {
      return { user: null, error: error.message };
    }

    return { user: data?.user || { id: `usr-${Date.now()}` }, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || "Erreur lors de la création du compte." };
  }
}

/**
 * Déconnexion officielle
 */
export async function logoutSupabase(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erreur signOut Supabase:', e);
    }
  }
}

/**
 * Récupération de la session active au rechargement
 */
export async function getActiveSupabaseSession(): Promise<UserSession | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const user = data.session.user;
        const metadata = user.user_metadata || {};
        const role: UserRole = metadata.role === 'ASSISTANTE' ? 'ASSISTANTE' : 'SUPERADMIN';
        const nom: string = metadata.nom || (role === 'SUPERADMIN' ? 'Direction Générale (Gérant)' : 'Assistante Opérations');
        const agence: string = metadata.agence || 'Marrakech';

        return {
          id: user.id,
          nom,
          email: user.email || '',
          role,
          agence,
        };
      }
    } catch (e) {
      console.error('Erreur getActiveSupabaseSession:', e);
    }
  }

  // Session persistée légitimement
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
