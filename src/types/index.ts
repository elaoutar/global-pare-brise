export type StatutDossier = 
  | 'NOUVEAU'
  | 'EN_COURS_POSE'
  | 'POSE_TERMINEE'
  | 'DEPOSE_ASSURANCE'
  | 'VALIDE_REGLE'
  | 'REJETE';

export type StatutPaiement = 'EN_ATTENTE' | 'PARTIEL' | 'REGLE' | 'IMPAYE';

export type TypeArticle = 'PARE_BRISE' | 'LUNETTE_AR' | 'VITRE_LATERALE' | 'COLLE' | 'ACCESSOIRE';

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  cin?: string;
  ville: string;
}

export interface Vehicule {
  id: string;
  clientId: string;
  immatriculation: string; // Ex: 12345-A-6
  marque: string; // Ex: Dacia, Renault, Peugeot
  modele: string; // Ex: Logan, Clio V, 208
  annee: number;
  chassisVin?: string;
  kilometrage?: number;
}

export interface Assurance {
  id: string;
  nom: string; // Ex: Wafa Assurance, RMA, Sanlam, AXA
  code: string;
  telephone: string;
  email: string;
  adresse: string;
  delaiReglementMoyenJours: number;
}

export interface Partenaire {
  id: string;
  nom: string; // Ex: Cabinet Courtage Al Baraka, Carrosserie Moderne
  type: 'COURTIER' | 'CARROSSIER' | 'DEPANNEUR' | 'AGENCE_LOCATION';
  telephone: string;
  ville: string;
  tauxCommissionPourcent: number;
}

export interface ArticleStock {
  id: string;
  reference: string;
  codeEurocode?: string; // Ex: 7288AGS
  designation: string;
  type: TypeArticle;
  quantiteEnStock: number;
  stockMinimumAlerte: number;
  prixAchatHT: number;
  prixVenteHT: number;
  emplacement?: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
  ice?: string;
  telephone: string;
  email?: string;
  ville: string;
  specialite: string;
}

export interface BonSortieLigne {
  articleId: string;
  reference: string;
  designation: string;
  quantite: number;
}

export interface BonSortie {
  id: string;
  numeroBS: string; // Ex: BS-2026-0042
  dossierId: string;
  dateSortie: string;
  poseur: string;
  lignes: BonSortieLigne[];
  notes?: string;
}

export interface LigneFacture {
  designation: string;
  codeEurocode?: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTva: number; // 20% au Maroc
  totalHT: number;
}

export interface Facture {
  id: string;
  numeroFacture: string; // Ex: FA-2026-0158
  dossierId: string;
  destinataire: 'ASSURANCE' | 'CLIENT';
  dateEmission: string;
  dateEcheance: string;
  lignes: LigneFacture[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  montantRegle: number;
  statutPaiement: StatutPaiement;
  datePaiement?: string;
  referencePaiement?: string; // Ex: Virement Wafa N° 987654
}

export type TypeDossier = 'ASSURANCE' | 'PARTICULIER_COMPTANT';

export interface DossierSinistre {
  id: string;
  numeroDossier: string; // Ex: DOS-2026-0091
  typeDossier: TypeDossier; // ASSURANCE (tiers-payant) ou PARTICULIER_COMPTANT (paiement direct client)
  dateCreation: string;
  
  // Client & Véhicule
  client: Client;
  vehicule: Vehicule;
  
  // Prise en charge Assurance (Optionnel si particulier comptant)
  assurance?: Assurance;
  partenaire?: Partenaire;
  numeroSinistre?: string;
  numeroPolice?: string;
  dateSinistre?: string;
  
  // Aspects financiers
  montantTotalTTC: number;
  montantPriseEnChargeAssurance: number;
  montantFranchise: number;
  franchisePayeeParClient: boolean;
  franchiseOfferte: boolean; // Geste commercial du garage
  
  // État d'avancement
  statut: StatutDossier;
  dateDepotAssurance?: string;
  dateReglementAssurance?: string;
  
  // Photos obligatoires assurance
  photos: {
    avantSinistreUrl?: string;
    apresPoseUrl?: string;
    carteGriseUrl?: string;
  };

  // Pièces jointes assurance & documents
  documents?: DocumentAttache[];
  
  // Pièces liées
  bonSortieId?: string;
  bonLivraisonId?: string;
  factureAssuranceId?: string;
  factureClientId?: string;
  
  poseur?: string;
  observations?: string;
}

export interface DocumentAttache {
  id: string;
  nom: string;
  typeDocument: 'PRISE_EN_CHARGE_ASSURANCE' | 'RAPPORT_EXPERTISE' | 'CARTE_GRISE' | 'DEVIS_SIGNE' | 'AUTRE';
  url: string;
  taille?: string;
  dateAjout: string;
}

export interface BonLivraisonLigne {
  designation: string;
  codeEurocode?: string;
  quantite: number;
}

export interface BonLivraison {
  id: string;
  numeroBL: string; // Ex: BL-2026-0042
  dossierId: string;
  dateLivraison: string;
  livreurPoseur: string;
  receptionnaireNom: string;
  receptionnaireCin?: string;
  lignes: BonLivraisonLigne[];
  observations?: string;
}

export type ModePaiement = 'CHEQUE' | 'ESPECES' | 'VIREMENT' | 'EFFET';
export type StatutEncaissement = 'ENCAISSE' | 'EN_ATTENTE_ECHEANCE' | 'IMPAYE_REJETE';

export interface ReglementRecette {
  id: string;
  numeroRecu: string; // Ex: REC-2026-0105
  dossierId?: string;
  factureId?: string;
  payeurNom: string; // Client ou Assurance
  sourceType: 'ASSURANCE' | 'CLIENT' | 'PARTENAIRE';
  modePaiement: ModePaiement;
  montant: number;
  datePaiement: string;
  dateEcheance?: string; // Important pour Chèque et Effet/Traite
  referenceDocument?: string; // N° Chèque, N° Effet/Traite, Réf Virement
  banque?: string; // Attijariwafa, BCP, BMCE, CIH, etc.
  statut: StatutEncaissement;
  dateEncaissementEffectif?: string;
  notes?: string;
}

