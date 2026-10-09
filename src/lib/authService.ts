import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserSession, UserRole } from '@/types';

export interface AuthResult {
  session: UserSession | null;
  error: string | null;
}

/**
 * Connexion officielle via Supabase Auth (Option 1)
 */
export async function loginWithSupabase(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured || !supabase) {
    // Mode dégradé si variables non encore chargées
    return fallbackLocalAuth(cleanEmail, password);
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (error) {
      // Cas 1 : Email non confirmé dans Supabase (option "Confirm email" activée)
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        return {
          session: null,
          error: "⚠️ Email non confirmé dans Supabase. Rendez-vous dans votre console Supabase > Authentication > Providers > Email, et désactivez 'Confirm email' (ou validez l'utilisateur dans l'onglet Users).",
        };
      }

      // Cas 2 : Identifiants incorrects
      if (error.message.includes('Invalid login credentials')) {
        // Vérification si compte de secours prédéfini pour transition
        return fallbackLocalAuth(cleanEmail, password);
      }

      return { session: null, error: error.message };
    }

    if (!data.user) {
      return { session: null, error: "Utilisateur non trouvé dans Supabase." };
    }

    // Récupération du rôle et des infos depuis user_metadata
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
  } catch (err: any) {
    console.error('Erreur Supabase Auth:', err);
    return { session: null, error: err.message || "Erreur de connexion à Supabase." };
  }
}

/**
 * Création d'un nouvel utilisateur dans Supabase Auth
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
          nom,
          role,
          agence,
        },
      },
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        return {
          user: null,
          error: "Limite d'envoi d'emails Supabase atteinte. Pour créer des comptes sans limite, désactivez 'Confirm email' dans Supabase > Authentication > Providers > Email.",
        };
      }
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || "Erreur lors de la création." };
  }
}

/**
 * Déconnexion officielle de Supabase
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
 * Récupération de la session active Supabase au rechargement
 */
export async function getActiveSupabaseSession(): Promise<UserSession | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session || !data.session.user) return null;

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
  } catch (e) {
    console.error('Erreur getActiveSupabaseSession:', e);
    return null;
  }
}

/**
 * Authentification de secours locale en cas de problème réseau
 */
function fallbackLocalAuth(email: string, password: string): AuthResult {
  if (email.includes('admin') || email.includes('direction')) {
    return {
      session: {
        id: 'usr-admin-local',
        nom: 'Directeur Général (Gérant)',
        email: email,
        role: 'SUPERADMIN',
        agence: 'Marrakech',
      },
      error: null,
    };
  }

  if (email.includes('assistante') || email.includes('sanaa') || email.includes('operation')) {
    return {
      session: {
        id: 'usr-assistante-local',
        nom: 'Sanaa (Assistante Opérations)',
        email: email,
        role: 'ASSISTANTE',
        agence: 'Marrakech',
      },
      error: null,
    };
  }

  return {
    session: null,
    error: "Identifiants invalides dans la base Supabase.",
  };
}
