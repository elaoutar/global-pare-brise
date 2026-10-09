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
      type_dossier: dossier.typeDossier,
      date_creation: dossier.dateCreation,
      client: dossier.client,
      vehicule: dossier.vehicule,
      assurance: dossier.assurance,
      agence_assurance: dossier.agenceAssurance,
      partenaire: dossier.partenaire,
      numero_sinistre: dossier.numeroSinistre,
      numero_police: dossier.numeroPolice,
      date_sinistre: dossier.dateSinistre,
      type_client_assurance: dossier.typeClientAssurance,
      reference_dossier_azur_glass: dossier.referenceDossierAzurGlass,
      date_envoi_azur_glass: dossier.dateEnvoiAzurGlass,
      montant_total_ttc: dossier.montantTotalTTC,
      montant_franchise: dossier.montantFranchise,
      franchise_payee_par_client: dossier.franchisePayeeParClient,
      franchise_offerte: dossier.franchiseOfferte,
      tva_exclue_par_assurance: dossier.tvaExclueParAssurance,
      montant_reversement_azur_glass: dossier.montantReversementAzurGlass,
      montant_prise_en_charge_assurance: dossier.montantPriseEnChargeAssurance,
      statut: dossier.statut,
      poseur: dossier.poseur,
      observations: dossier.observations,
      photos: dossier.photos,
      documents: dossier.documents,
      bon_sortie_id: dossier.bonSortieId,
      bon_livraison_id: dossier.bonLivraisonId,
      facture_assurance_id: dossier.factureAssuranceId,
      facture_client_id: dossier.factureClientId,
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
      emplacement: article.emplacement,
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
      total_ht: facture.totalHT,
      total_tva: facture.totalTVA,
      total_ttc: facture.totalTTC,
      montant_regle: facture.montantRegle,
      statut_paiement: facture.statutPaiement,
      date_paiement: facture.datePaiement,
      reference_paiement: facture.referencePaiement,
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
    console.error('Exception save devis Supabase:', err);
    return false;
  }
};
