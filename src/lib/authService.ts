import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserSession, UserRole } from '@/types';

export interface AuthResult {
  session: UserSession | null;
  error: string | null;
}

/**
 * Connexion officielle et stricte via Supabase Auth
 * Aucun contournement : l'email et le mot de passe doivent être valides dans la base de données.
 */
export async function loginWithSupabase(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { session: null, error: "Veuillez saisir votre email et votre mot de passe." };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { session: null, error: "Le service Supabase n'est pas accessible." };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (error) {
      // Cas 1 : Email non confirmé dans Supabase
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        return {
          session: null,
          error: "⚠️ Cet email n'a pas encore été confirmé dans Supabase. Veuillez désactiver 'Confirm email' dans Supabase (Authentication > Providers > Email) ou valider l'utilisateur.",
        };
      }

      // Cas 2 : Identifiants incorrects
      if (error.message.includes('Invalid login credentials')) {
        return {
          session: null,
          error: "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.",
        };
      }

      return { session: null, error: error.message };
    }

    if (!data.user) {
      return { session: null, error: "Utilisateur non trouvé dans la base Supabase." };
    }

    // Récupération stricte du rôle et des métadonnées
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
    return { session: null, error: err.message || "Erreur de connexion au serveur d'authentification." };
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
          nom: nom.trim(),
          role,
          agence,
        },
      },
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        return {
          user: null,
          error: "Limite d'envoi d'emails Supabase atteinte. Pour créer des comptes immédiatement, désactivez 'Confirm email' dans votre console Supabase (Authentication > Providers > Email).",
        };
      }
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || "Erreur lors de la création du compte." };
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
