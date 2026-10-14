import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  DossierSinistre, 
  ArticleStock, 
  Facture, 
  BonSortie, 
  BonLivraison, 
  DevisClient, 
  ReglementRecette, 
  Fournisseur, 
  BonCommandeFournisseur, 
  Assurance, 
  Partenaire 
} from '@/types';

// ==============================================================================
// 1. SERVICE DE STOCKAGE DE FICHIERS (SUPABASE STORAGE)
// ==============================================================================
export const uploadFileToSupabase = async (
  file: File, 
  folder: string = 'documents'
): Promise<string | null> => {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase non configuré, retour URL locale');
    return URL.createObjectURL(file);
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('sinistre-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Erreur upload Supabase Storage:', error);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('sinistre-documents')
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (err) {
    console.error('Exception upload Supabase:', err);
    return null;
  }
};

// ==============================================================================
// 2. DOSSIERS SINISTRES (CRUD SUPABASE)
// ==============================================================================
export const fetchDossiersFromSupabase = async (): Promise<DossierSinistre[] | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .order('date_creation', { ascending: false });

    if (error) {
      console.error('Erreur fetch dossiers Supabase:', error);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      numeroDossier: row.numero_dossier,
      typeDossier: row.type_dossier,
      dateCreation: row.date_creation,
      client: row.client,
      vehicule: row.vehicule,
      assurance: row.assurance,
      agenceAssurance: row.agence_assurance,
      partenaire: row.partenaire,
      numeroSinistre: row.numero_sinistre,
      numeroPolice: row.numero_police,
      dateSinistre: row.date_sinistre,
      typeClientAssurance: row.type_client_assurance,
      referenceDossierAzurGlass: row.reference_dossier_azur_glass,
      dateEnvoiAzurGlass: row.date_envoi_azur_glass,
      montantTotalTTC: Number(row.montant_total_ttc || 0),
      montantFranchise: Number(row.montant_franchise || 0),
      franchisePayeeParClient: Boolean(row.franchise_payee_par_client),
      franchiseOfferte: Boolean(row.franchise_offerte),
      tvaExclueParAssurance: Number(row.tva_exclue_par_assurance || 0),
      montantReversementAzurGlass: Number(row.montant_reversement_azur_glass || 0),
      montantPriseEnChargeAssurance: Number(row.montant_prise_en_charge_assurance || 0),
      statut: row.statut,
      isArchive: row.statut === 'ARCHIVE',
      dateArchivage: row.statut === 'ARCHIVE' ? (row.updated_at || row.date_creation) : undefined,
      poseur: row.poseur,
      observations: row.observations,
      photos: row.photos || {},
      documents: row.documents || [],
      bonSortieId: row.bon_sortie_id,
      bonLivraisonId: row.bon_livraison_id,
      factureAssuranceId: row.facture_assurance_id,
      factureClientId: row.facture_client_id,
    }));
  } catch (err) {
    console.error('Exception fetch dossiers:', err);
    return null;
  }
};

export const saveDossierToSupabase = async (dossier: DossierSinistre): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const payload = {
      id: dossier.id,
      numero_dossier: dossier.numeroDossier,
      type_dossier: dossier.typeDossier || 'ASSURANCE',
      date_creation: dossier.dateCreation || new Date().toISOString(),
      client: dossier.client || {},
      vehicule: dossier.vehicule || {},
      assurance: dossier.assurance || null,
      agence_assurance: dossier.agenceAssurance || null,
      partenaire: dossier.partenaire || null,
      numero_sinistre: dossier.numeroSinistre || null,
      numero_police: dossier.numeroPolice || null,
      date_sinistre: dossier.dateSinistre || null,
      type_client_assurance: dossier.typeClientAssurance || 'PARTICULIER',
      reference_dossier_azur_glass: dossier.referenceDossierAzurGlass || null,
      date_envoi_azur_glass: dossier.dateEnvoiAzurGlass ? dossier.dateEnvoiAzurGlass : null,
      montant_total_ttc: Number(dossier.montantTotalTTC) || 0,
      montant_franchise: Number(dossier.montantFranchise) || 0,
      franchise_payee_par_client: Boolean(dossier.franchisePayeeParClient),
      franchise_offerte: Boolean(dossier.franchiseOfferte),
      tva_exclue_par_assurance: Number(dossier.tvaExclueParAssurance) || 0,
      montant_reversement_azur_glass: Number(dossier.montantReversementAzurGlass) || 0,
      montant_prise_en_charge_assurance: Number(dossier.montantPriseEnChargeAssurance) || 0,
      statut: dossier.isArchive ? 'ARCHIVE' : (dossier.statut || 'NOUVEAU'),
      is_archive: Boolean(dossier.isArchive),
      date_archivage: (dossier.isArchive && dossier.dateArchivage) ? dossier.dateArchivage : null,
      poseur: dossier.poseur || null,
      observations: dossier.observations || null,
      photos: dossier.photos || {},
      documents: dossier.documents || [],
      bon_sortie_id: dossier.bonSortieId || null,
      bon_livraison_id: dossier.bonLivraisonId || null,
      facture_assurance_id: dossier.factureAssuranceId || null,
      facture_client_id: dossier.factureClientId || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('dossiers')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Erreur upsert dossier Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception save dossier Supabase:', err);
    return false;
  }
};

export const deleteDossierFromSupabase = async (dossierId: string): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase
      .from('dossiers')
      .delete()
      .eq('id', dossierId);

    if (error) {
      console.error('Erreur delete dossier Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception delete dossier Supabase:', err);
    return false;
  }
};

// ==============================================================================
// 3. STOCK ARTICLES (CRUD SUPABASE)
// ==============================================================================
export const fetchStockFromSupabase = async (): Promise<ArticleStock[] | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .order('quantite_stock', { ascending: true });

    if (error) {
      console.error('Erreur fetch stock Supabase:', error);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      reference: row.reference,
      codeEurocode: row.code_eurocode,
      designation: row.designation || `Vitrage ${row.reference}`,
      type: row.type || 'PARE_BRISE',
      quantiteEnStock: Number(row.quantite_en_stock ?? row.quantite_stock ?? 0),
      stockMinimumAlerte: Number(row.stock_minimum_alerte ?? row.seuil_alerte ?? 2),
      prixAchatHT: Number(row.prix_achat_ht || 0),
      prixVenteHT: Number(row.prix_vente_ht || 0),
      emplacement: row.emplacement,
      rayon: row.rayon || row.emplacement,
    }));
  } catch (err) {
    console.error('Exception fetch stock Supabase:', err);
    return null;
  }
};

export const saveStockArticleToSupabase = async (article: ArticleStock): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const payload = {
      id: article.id,
      reference: article.reference,
      code_eurocode: article.codeEurocode,
      designation: article.designation,
      type: article.type,
      quantite_en_stock: article.quantiteEnStock,
      stock_minimum_alerte: article.stockMinimumAlerte,
      prix_achat_ht: article.prixAchatHT,
      prix_vente_ht: article.prixVenteHT,
      emplacement: article.emplacement || article.rayon,
      rayon: article.rayon,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('stock')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Erreur upsert article Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception save article Supabase:', err);
    return false;
  }
};

// ==============================================================================
// 4. FACTURES (CRUD SUPABASE)
// ==============================================================================
export const fetchFacturesFromSupabase = async (): Promise<Facture[] | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('factures')
      .select('*')
      .order('date_emission', { ascending: false });

    if (error) {
      console.error('Erreur fetch factures Supabase:', error);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      numeroFacture: row.numero_facture,
      dossierId: row.dossier_id,
      destinataire: row.destinataire,
      dateEmission: row.date_emission,
      dateEcheance: row.date_echeance,
      lignes: row.lignes || [],
      totalHT: Number(row.total_ht || 0),
      totalTVA: Number(row.total_tva || 0),
      totalTTC: Number(row.total_ttc || 0),
      montantRegle: Number(row.montant_regle || 0),
      statutPaiement: row.statut_paiement,
      datePaiement: row.date_paiement,
      referencePaiement: row.reference_paiement,
    }));
  } catch (err) {
    console.error('Exception fetch factures Supabase:', err);
    return null;
  }
};

export const saveFactureToSupabase = async (facture: Facture): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const payload = {
      id: facture.id,
      numero_facture: facture.numeroFacture,
      dossier_id: facture.dossierId,
      destinataire: facture.destinataire,
      date_emission: facture.dateEmission,
      date_echeance: facture.dateEcheance,
      lignes: facture.lignes,
      total_ht: Number(facture.totalHT) || 0,
      total_tva: Number(facture.totalTVA) || 0,
      total_ttc: Number(facture.totalTTC) || 0,
      montant_regle: Number(facture.montantRegle) || 0,
      statut_paiement: facture.statutPaiement || 'EN_ATTENTE',
      date_paiement: facture.datePaiement ? facture.datePaiement : null,
      reference_paiement: facture.referencePaiement || null,
    };

    const { error } = await supabase
      .from('factures')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Erreur upsert facture Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception save facture Supabase:', err);
    return false;
  }
};

// ==============================================================================
// 5. DEVIS CLIENTS (CRUD SUPABASE)
// ==============================================================================
export const fetchDevisFromSupabase = async (): Promise<DevisClient[] | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('devis')
      .select('*')
      .order('date_creation', { ascending: false });

    if (error) {
      console.error('Erreur fetch devis Supabase:', error);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      numeroDevis: row.numero_devis,
      dateDevis: row.date_devis || row.date_creation || new Date().toISOString().split('T')[0],
      dateValidite: row.date_validite,
      agenceVille: row.agence_ville || 'Marrakech',
      clientNom: row.client_nom,
      clientTelephone: row.client_telephone,
      clientCin: row.client_cin,
      clientEmail: row.client_email,
      clientVille: row.client_ville,
      vehiculeMarque: row.vehicule_marque,
      vehiculeModele: row.vehicule_modele,
      vehiculeAnnee: Number(row.vehicule_annee || 2022),
      vehiculeImmatriculation: row.vehicule_immatriculation,
      vehiculeChassisVin: row.vehicule_chassis_vin,
      typeDemande: row.type_demande || 'PARTICULIER_DIRECT',
      compagnieAssurance: row.compagnie_assurance || row.assurance_nom,
      lignes: row.lignes || [],
      totalHT: Number(row.total_ht || 0),
      totalTVA: Number(row.total_tva || 0),
      totalTTC: Number(row.total_ttc || 0),
      statut: row.statut || 'BROUILLON',
      dossierIdGenere: row.dossier_id_genere,
      observations: row.observations,
    }));
  } catch (err) {
    console.error('Exception fetch devis Supabase:', err);
    return null;
  }
};

export const saveDevisToSupabase = async (devis: DevisClient): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const payload = {
      id: devis.id,
      numero_devis: devis.numeroDevis,
      date_devis: devis.dateDevis,
      date_validite: devis.dateValidite,
      agence_ville: devis.agenceVille,
      client_nom: devis.clientNom,
      client_telephone: devis.clientTelephone,
      client_cin: devis.clientCin,
      client_email: devis.clientEmail,
      client_ville: devis.clientVille,
      vehicule_marque: devis.vehiculeMarque,
      vehicule_modele: devis.vehiculeModele,
      vehicule_annee: devis.vehiculeAnnee,
      vehicule_immatriculation: devis.vehiculeImmatriculation,
      vehicule_chassis_vin: devis.vehiculeChassisVin,
      type_demande: devis.typeDemande,
      compagnie_assurance: devis.compagnieAssurance,
      lignes: devis.lignes,
      total_ht: devis.totalHT,
      total_tva: devis.totalTVA,
      total_ttc: devis.totalTTC,
      statut: devis.statut,
      dossier_id_genere: devis.dossierIdGenere,
      observations: devis.observations,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('devis')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Erreur upsert devis Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception upsert devis Supabase:', err);
    return false;
  }
};

export const deleteDevisFromSupabase = async (devisId: string): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase
      .from('devis')
      .delete()
      .eq('id', devisId);

    if (error) {
      console.error('Erreur delete devis Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception delete devis Supabase:', err);
    return false;
  }
};

// ==============================================================================
// 6. FOURNISSEURS (CRUD SUPABASE)
// ==============================================================================
export const fetchFournisseursFromSupabase = async (): Promise<Fournisseur[] | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('fournisseurs')
      .select('*')
      .order('nom', { ascending: true });

    if (error) {
      console.warn('Erreur ou table fournisseurs absente Supabase:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      nom: row.nom,
      ice: row.ice || undefined,
      telephone: row.telephone || '',
      email: row.email || undefined,
      ville: row.ville || 'Casablanca',
      specialite: row.specialite || 'Vitrages automobiles',
    }));
  } catch (err) {
    console.warn('Exception fetch fournisseurs Supabase:', err);
    return null;
  }
};

export const saveFournisseurToSupabase = async (fournisseur: Fournisseur): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const payload = {
      id: fournisseur.id,
      nom: fournisseur.nom,
      ice: fournisseur.ice || null,
      telephone: fournisseur.telephone || '',
      email: fournisseur.email || null,
      ville: fournisseur.ville || 'Casablanca',
      specialite: fournisseur.specialite || 'Vitrages automobiles',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('fournisseurs')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Erreur upsert fournisseur Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception save fournisseur Supabase:', err);
    return false;
  }
};

export const deleteFournisseurFromSupabase = async (fournisseurId: string): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase
      .from('fournisseurs')
      .delete()
      .eq('id', fournisseurId);

    if (error) {
      console.warn('Erreur delete fournisseur Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception delete fournisseur Supabase:', err);
    return false;
  }
};

// ==============================================================================
// 7. COMMANDES FOURNISSEURS (CRUD SUPABASE)
// ==============================================================================
export const fetchCommandesFournisseursFromSupabase = async (): Promise<BonCommandeFournisseur[] | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('commandes_fournisseurs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erreur ou table commandes_fournisseurs absente Supabase:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      numeroBC: row.numero_commande || row.numero_bc,
      fournisseurId: row.fournisseur_id,
      dateCommande: row.date_commande,
      dateLivraisonPrevue: row.date_livraison_prevue || undefined,
      agenceVille: row.agence_ville || 'Marrakech',
      lignes: row.lignes || [],
      totalHT: Number(row.total_ht || row.montant_total_ht || 0),
      tauxTva: 20,
      totalTVA: Number(row.total_tva || 0),
      totalTTC: Number(row.total_ttc || row.montant_total_ttc || 0),
      statutCommande: row.statut || row.statut_commande || 'ENVOYEE',
      statutPaiement: row.statut_paiement || 'NON_PAYE',
      montantPaye: Number(row.montant_paye || 0),
      modePaiement: row.mode_paiement || undefined,
      referencePaiement: row.reference_paiement || undefined,
      dateEcheancePaiement: row.date_echeance_paiement || undefined,
      numeroBLFournisseur: row.numero_bl_fournisseur || undefined,
      numeroFactureFournisseur: row.numero_facture_fournisseur || undefined,
      notes: row.notes || undefined,
    }));
  } catch (err) {
    console.warn('Exception fetch commandes fournisseurs Supabase:', err);
    return null;
  }
};

export const saveCommandeFournisseurToSupabase = async (cmd: BonCommandeFournisseur): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const payload = {
      id: cmd.id,
      numero_commande: cmd.numeroBC,
      fournisseur_id: cmd.fournisseurId,
      date_commande: cmd.dateCommande,
      date_livraison_prevue: cmd.dateLivraisonPrevue || null,
      agence_ville: cmd.agenceVille || 'Marrakech',
      lignes: cmd.lignes || [],
      total_ht: Number(cmd.totalHT) || 0,
      total_tva: Number(cmd.totalTVA) || 0,
      total_ttc: Number(cmd.totalTTC) || 0,
      statut: cmd.statutCommande || 'ENVOYEE',
      statut_paiement: cmd.statutPaiement || 'NON_PAYE',
      montant_paye: Number(cmd.montantPaye) || 0,
      mode_paiement: cmd.modePaiement || null,
      reference_paiement: cmd.referencePaiement || null,
      date_echeance_paiement: cmd.dateEcheancePaiement || null,
      numero_bl_fournisseur: cmd.numeroBLFournisseur || null,
      numero_facture_fournisseur: cmd.numeroFactureFournisseur || null,
      notes: cmd.notes || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('commandes_fournisseurs')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Erreur upsert commande fournisseur Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception save commande fournisseur Supabase:', err);
    return false;
  }
};

export const deleteCommandeFournisseurFromSupabase = async (cmdId: string): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase
      .from('commandes_fournisseurs')
      .delete()
      .eq('id', cmdId);

    if (error) {
      console.warn('Erreur delete commande fournisseur Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception delete commande fournisseur Supabase:', err);
    return false;
  }
};

// ==============================================================================
// 8. PARTENAIRES (CRUD SUPABASE)
// ==============================================================================
export const fetchPartenairesFromSupabase = async (): Promise<Partenaire[] | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('partenaires')
      .select('*')
      .order('nom', { ascending: true });

    if (error) {
      console.warn('Erreur ou table partenaires absente Supabase:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      nom: row.nom,
      type: row.type || 'COURTIER',
      telephone: row.telephone || '',
      ville: row.ville || '',
      tauxCommissionPourcent: Number(row.taux_commission_pourcent || 0),
    }));
  } catch (err) {
    console.warn('Exception fetch partenaires Supabase:', err);
    return null;
  }
};

export const savePartenaireToSupabase = async (part: Partenaire): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const payload = {
      id: part.id,
      nom: part.nom,
      code: part.nom.substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
      type: part.type || 'COURTIER',
      telephone: part.telephone || null,
      ville: part.ville || null,
      taux_commission_pourcent: part.tauxCommissionPourcent || 0,
    };

    const { error } = await supabase
      .from('partenaires')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Erreur upsert partenaire Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception save partenaire Supabase:', err);
    return false;
  }
};
