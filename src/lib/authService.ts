import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserSession, UserRole } from '@/types';

export interface AuthResult {
  session: UserSession | null;
  error: string | null;
}

// Comptes d'administration de référence
const MASTER_CREDENTIALS = [
  {
    emails: [
      'direction@globaleparebrise.ma',
      'direction@globalparebrise.ma',
      'admin@globaleparebrise.ma',
      'admin@globalparebrise.ma',
      'direction.globalparebrise@gmail.com',
      'direction'
    ],
    password: 'GlobalPareBrise2026!',
    nom: 'Direction Générale (Gérant)',
    role: 'SUPERADMIN' as UserRole,
    agence: 'Marrakech',
  },
  {
    emails: [
      'assistante@globaleparebrise.ma',
      'assistante@globalparebrise.ma',
      'assistante.globalparebrise@gmail.com',
      'assistante',
      'sanaa'
    ],
    password: 'Assistante2026!',
    nom: 'Sanaa (Secrétaire & Opérations)',
    role: 'ASSISTANTE' as UserRole,
    agence: 'Marrakech',
  },
];

/**
 * Connexion officielle et sécurisée avec la base de données Supabase
 */
export async function loginWithSupabase(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return { session: null, error: "Veuillez saisir votre email et votre mot de passe." };
  }

  // 1. Vérification dans la table 'utilisateurs' de Supabase Database
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .ilike('email', cleanEmail)
        .eq('statut', 'ACTIF')
        .maybeSingle();

      if (!error && data) {
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
          return { session: null, error: "Mot de passe incorrect pour cet utilisateur." };
        }
      }
    } catch (err) {
      console.warn('Vérification table utilisateurs Supabase:', err);
    }
  }

  // 2. Vérification via Supabase Auth (GoTrue) si configuré
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
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
    } catch (err) {
      console.warn('Tentative Supabase GoTrue:', err);
    }
  }

  // 3. Vérification des identifiants Master officiels
  const matchedMaster = MASTER_CREDENTIALS.find((m) =>
    m.emails.some((em) => em.toLowerCase() === cleanEmail)
  );

  if (matchedMaster) {
    if (cleanPassword === matchedMaster.password) {
      const session: UserSession = {
        id: `usr-${matchedMaster.role.toLowerCase()}-${Date.now()}`,
        nom: matchedMaster.nom,
        email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@globaleparebrise.ma`,
        role: matchedMaster.role,
        agence: matchedMaster.agence,
      };

      // Tenter de créer ou mettre à jour dans Supabase pour synchronisation
      if (isSupabaseConfigured && supabase) {
        supabase.from('utilisateurs').upsert([
          {
            id: session.id,
            nom: session.nom,
            email: session.email,
            mot_de_passe: matchedMaster.password,
            role: session.role,
            agence: session.agence,
            statut: 'ACTIF',
          }
        ], { onConflict: 'email' }).then(() => {});
      }

      return { session, error: null };
    } else {
      return { session: null, error: "Mot de passe incorrect. Veuillez réessayer." };
    }
  }

  // 4. Si aucun compte ne correspond
  return {
    session: null,
    error: "Identifiant ou mot de passe incorrect. Accès non autorisé.",
  };
}

/**
 * Création d'un collaborateur dans la base de données Supabase
 */
export async function registerSupabaseUser(
  email: string,
  password: string,
  nom: string,
  role: UserRole,
  agence: string = 'Marrakech'
): Promise<{ user: any; error: string | null }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: "Base de données non configurée." };
  }

  try {
    const newId = `usr-${Date.now()}`;
    
    // 1. Sauvegarde dans la table 'utilisateurs' de Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('utilisateurs')
      .upsert([
        {
          id: newId,
          nom: nom.trim(),
          email: cleanEmail,
          mot_de_passe: cleanPassword,
          role,
          agence,
          statut: 'ACTIF',
        }
      ], { onConflict: 'email' })
      .select()
      .single();

    if (dbError) {
      console.warn('Erreur table utilisateurs:', dbError);
    }

    // 2. Tente également de créer dans Supabase Auth
    try {
      await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: { data: { nom: nom.trim(), role, agence } },
      });
    } catch (e) {}

    return { 
      user: {
        id: dbData?.id || newId,
        nom: nom.trim(),
        email: cleanEmail,
        role,
        agence,
      }, 
      error: null 
    };
  } catch (err: any) {
    return { user: null, error: err.message || "Erreur lors de la création du compte." };
  }
}

/**
 * Récupérer tous les collaborateurs depuis la base de données Supabase
 */
export async function fetchCollaborateursFromSupabase(): Promise<any[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

/**
 * Déconnexion officielle
 */
export async function logoutSupabase(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
}

/**
 * Récupération de la session active
 */
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
