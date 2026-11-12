import { 
  DossierSinistre, 
  ArticleStock, 
  Facture, 
  BonSortie, 
  BonLivraison, 
  ReglementRecette, 
  Assurance, 
  Partenaire, 
  Fournisseur, 
  BonCommandeFournisseur, 
  DevisClient, 
  UserSession 
} from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { 
  saveDossierToSupabase, 
  saveStockArticleToSupabase, 
  saveFactureToSupabase, 
  saveBonLivraisonToSupabase, 
  saveDevisToSupabase, 
  saveFournisseurToSupabase, 
  saveCommandeFournisseurToSupabase, 
  savePartenaireToSupabase,
  saveAssuranceToSupabase
} from '@/lib/supabaseService';

export interface SystemBackupData {
  backupVersion: string;
  createdAt: string;
  createdBy: {
    id?: string;
    nom: string;
    role: string;
  };
  metadata: {
    garageNom: string;
    ice: string;
    ville: string;
    counts: {
      dossiers: number;
      stock: number;
      factures: number;
      bonsSortie: number;
      bonsLivraison: number;
      recettes: number;
      assurances: number;
      partenaires: number;
      fournisseurs: number;
      commandesFournisseurs: number;
      devis: number;
    };
  };
  data: {
    dossiers: DossierSinistre[];
    stock: ArticleStock[];
    factures: Facture[];
    bonsSortie: BonSortie[];
    bonsLivraison: BonLivraison[];
    recettes: ReglementRecette[];
    assurances: Assurance[];
    partenaires: Partenaire[];
    fournisseurs: Fournisseur[];
    commandesFournisseurs: BonCommandeFournisseur[];
    devis: DevisClient[];
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  backupData?: SystemBackupData;
  summary?: {
    createdAt: string;
    createdByNom: string;
    createdByRole: string;
    counts: SystemBackupData['metadata']['counts'];
  };
}

/**
 * Crée le package complet de sauvegarde avec métadonnées
 */
export const generateSystemBackup = (
  currentUser: UserSession | null,
  datasets: {
    dossiers: DossierSinistre[];
    stock: ArticleStock[];
    factures: Facture[];
    bonsSortie: BonSortie[];
    bonsLivraison: BonLivraison[];
    recettes: ReglementRecette[];
    assurances: Assurance[];
    partenaires: Partenaire[];
    fournisseurs: Fournisseur[];
    commandesFournisseurs: BonCommandeFournisseur[];
    devis: DevisClient[];
  }
): SystemBackupData => {
  return {
    backupVersion: '1.0',
    createdAt: new Date().toISOString(),
    createdBy: {
      id: currentUser?.id,
      nom: currentUser?.nom || 'Administrateur',
      role: currentUser?.role || 'SUPERADMIN',
    },
    metadata: {
      garageNom: GARAGE_INFO.nom,
      ice: GARAGE_INFO.ice,
      ville: 'Marrakech',
      counts: {
        dossiers: datasets.dossiers.length,
        stock: datasets.stock.length,
        factures: datasets.factures.length,
        bonsSortie: datasets.bonsSortie.length,
        bonsLivraison: datasets.bonsLivraison.length,
        recettes: datasets.recettes.length,
        assurances: datasets.assurances.length,
        partenaires: datasets.partenaires.length,
        fournisseurs: datasets.fournisseurs.length,
        commandesFournisseurs: datasets.commandesFournisseurs.length,
        devis: datasets.devis.length,
      },
    },
    data: {
      dossiers: datasets.dossiers,
      stock: datasets.stock,
      factures: datasets.factures,
      bonsSortie: datasets.bonsSortie,
      bonsLivraison: datasets.bonsLivraison,
      recettes: datasets.recettes,
      assurances: datasets.assurances,
      partenaires: datasets.partenaires,
      fournisseurs: datasets.fournisseurs,
      commandesFournisseurs: datasets.commandesFournisseurs,
      devis: datasets.devis,
    },
  };
};

/**
 * Télécharge le fichier JSON de sauvegarde sur l'ordinateur de l'utilisateur
 */
export const downloadBackupFile = (backupData: SystemBackupData) => {
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `BACKUP_GLOBAL_PARE_BRISE_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Analyse et valide le contenu d'un fichier de sauvegarde importé
 */
export const validateBackupFile = (rawJson: string): BackupValidationResult => {
  try {
    const parsed = JSON.parse(rawJson);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Le fichier ne contient pas un objet JSON valide.' };
    }

    // Accepter le format standard SystemBackupData ou un format direct data
    const dataSection = parsed.data || parsed;
    
    if (
      !dataSection ||
      typeof dataSection !== 'object' ||
      (!Array.isArray(dataSection.dossiers) && !Array.isArray(dataSection.factures) && !Array.isArray(dataSection.stock))
    ) {
      return { 
        isValid: false, 
        error: 'Structure de sauvegarde non reconnue. Les sections dossiers, factures ou stock sont introuvables.' 
      };
    }

    const counts = {
      dossiers: Array.isArray(dataSection.dossiers) ? dataSection.dossiers.length : 0,
      stock: Array.isArray(dataSection.stock) ? dataSection.stock.length : 0,
      factures: Array.isArray(dataSection.factures) ? dataSection.factures.length : 0,
      bonsSortie: Array.isArray(dataSection.bonsSortie) ? dataSection.bonsSortie.length : 0,
      bonsLivraison: Array.isArray(dataSection.bonsLivraison) ? dataSection.bonsLivraison.length : 0,
      recettes: Array.isArray(dataSection.recettes) ? dataSection.recettes.length : 0,
      assurances: Array.isArray(dataSection.assurances) ? dataSection.assurances.length : 0,
      partenaires: Array.isArray(dataSection.partenaires) ? dataSection.partenaires.length : 0,
      fournisseurs: Array.isArray(dataSection.fournisseurs) ? dataSection.fournisseurs.length : 0,
      commandesFournisseurs: Array.isArray(dataSection.commandesFournisseurs) ? dataSection.commandesFournisseurs.length : 0,
      devis: Array.isArray(dataSection.devis) ? dataSection.devis.length : 0,
    };

    const normalizedBackup: SystemBackupData = {
      backupVersion: parsed.backupVersion || '1.0',
      createdAt: parsed.createdAt || new Date().toISOString(),
      createdBy: {
        nom: parsed.createdBy?.nom || 'Inconnu',
        role: parsed.createdBy?.role || 'SUPERADMIN',
      },
      metadata: {
        garageNom: parsed.metadata?.garageNom || GARAGE_INFO.nom,
        ice: parsed.metadata?.ice || GARAGE_INFO.ice,
        ville: parsed.metadata?.ville || 'Marrakech',
        counts,
      },
      data: {
        dossiers: Array.isArray(dataSection.dossiers) ? dataSection.dossiers : [],
        stock: Array.isArray(dataSection.stock) ? dataSection.stock : [],
        factures: Array.isArray(dataSection.factures) ? dataSection.factures : [],
        bonsSortie: Array.isArray(dataSection.bonsSortie) ? dataSection.bonsSortie : [],
        bonsLivraison: Array.isArray(dataSection.bonsLivraison) ? dataSection.bonsLivraison : [],
        recettes: Array.isArray(dataSection.recettes) ? dataSection.recettes : [],
        assurances: Array.isArray(dataSection.assurances) ? dataSection.assurances : [],
        partenaires: Array.isArray(dataSection.partenaires) ? dataSection.partenaires : [],
        fournisseurs: Array.isArray(dataSection.fournisseurs) ? dataSection.fournisseurs : [],
        commandesFournisseurs: Array.isArray(dataSection.commandesFournisseurs) ? dataSection.commandesFournisseurs : [],
        devis: Array.isArray(dataSection.devis) ? dataSection.devis : [],
      },
    };

    return {
      isValid: true,
      backupData: normalizedBackup,
      summary: {
        createdAt: normalizedBackup.createdAt,
        createdByNom: normalizedBackup.createdBy.nom,
        createdByRole: normalizedBackup.createdBy.role,
        counts: normalizedBackup.metadata.counts,
      },
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Erreur de lecture du fichier JSON: ${err?.message || 'Format invalide'}`,
    };
  }
};

/**
 * Pousse en arrière-plan les données restaurées vers Supabase Cloud
 */
export const syncRestoredDataToSupabaseCloud = async (
  data: SystemBackupData['data'],
  onProgress?: (step: string, percent: number) => void
): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  try {
    // 1. Dossiers
    if (onProgress) onProgress('Synchronisation des Dossiers...', 15);
    for (const dossier of data.dossiers) {
      try {
        await saveDossierToSupabase(dossier);
      } catch (e: any) {
        errors.push(`Dossier ${dossier.numeroDossier}: ${e?.message}`);
      }
    }

    // 2. Factures
    if (onProgress) onProgress('Synchronisation des Factures...', 30);
    for (const fac of data.factures) {
      try {
        await saveFactureToSupabase(fac);
      } catch (e: any) {
        errors.push(`Facture ${fac.numeroFacture}: ${e?.message}`);
      }
    }

    // 3. Stock
    if (onProgress) onProgress('Synchronisation du Stock...', 45);
    for (const art of data.stock) {
      try {
        await saveStockArticleToSupabase(art);
      } catch (e: any) {
        errors.push(`Article ${art.reference}: ${e?.message}`);
      }
    }

    // 4. Bons de livraison
    if (onProgress) onProgress('Synchronisation des Bons de Livraison...', 60);
    for (const bl of data.bonsLivraison) {
      try {
        await saveBonLivraisonToSupabase(bl);
      } catch (e: any) {
        errors.push(`BL ${bl.numeroBL}: ${e?.message}`);
      }
    }

    // 5. Devis
    if (onProgress) onProgress('Synchronisation des Devis...', 75);
    for (const devis of data.devis) {
      try {
        await saveDevisToSupabase(devis);
      } catch (e: any) {
        errors.push(`Devis ${devis.numeroDevis}: ${e?.message}`);
      }
    }

    // 6. Fournisseurs & Commandes
    if (onProgress) onProgress('Synchronisation Fournisseurs & Commandes...', 90);
    for (const f of data.fournisseurs) {
      try {
        await saveFournisseurToSupabase(f);
      } catch (e: any) {
        errors.push(`Fournisseur ${f.nom}: ${e?.message}`);
      }
    }
    for (const cmd of data.commandesFournisseurs) {
      try {
        await saveCommandeFournisseurToSupabase(cmd);
      } catch (e: any) {
        errors.push(`Commande ${cmd.numeroBC}: ${e?.message}`);
      }
    }

    // 7. Partenaires
    for (const p of data.partenaires) {
      try {
        await savePartenaireToSupabase(p);
      } catch (e: any) {
        errors.push(`Partenaire ${p.nom}: ${e?.message}`);
      }
    }

    // 8. Assurances
    for (const ass of data.assurances) {
      try {
        await saveAssuranceToSupabase(ass);
      } catch (e: any) {
        errors.push(`Assurance ${ass.nom}: ${e?.message}`);
      }
    }

    if (onProgress) onProgress('Synchronisation terminée', 100);
    return { success: errors.length === 0, errors };
  } catch (err: any) {
    errors.push(`Erreur générale sync Cloud: ${err?.message}`);
    return { success: false, errors };
  }
};
