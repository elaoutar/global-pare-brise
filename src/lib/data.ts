import { 
  Assurance, 
  Partenaire, 
  ArticleStock, 
  Fournisseur, 
  DossierSinistre, 
  Facture, 
  BonSortie,
  BonLivraison,
  ReglementRecette,
  BonCommandeFournisseur,
  DevisClient
} from '@/types';

export const GARAGE_INFO = {
  nom: 'GLOBAL PARE-BRISE',
  formeJuridique: 'SARL',
  adresse: 'LA FERAIL HAY ALKARAM N 179 MARRAKECH - MAROC',
  telephone: '0700367182 / 0524307501',
  email: 'globalazurmaroc@gmail.com',
  siteWeb: 'www.globalparebrise.ma',
  ice: '003011381000053',
  patente: '64008343',
  ifiscal: '51763123',
  rc: '49821 Marrakech',
  cnss: '8923412',
  rib: '011 780 0000 123456789012 34 (Attijariwafa Bank)',
};

// Intermédiaire Partenaire Exclusif pour les Déclarations d'Assurance
export const AZUR_GLASS_INFO = {
  nom: 'AZUR GLASS',
  formeJuridique: 'SARL',
  designationComplete: 'AZUR GLASS (Centre Conventionné Assurances)',
  adresse: 'Angle Bd Yacoub El Mansour & Rue Al Fourat, Marrakech - Maroc',
  telephone: '0524443322 / 0661123456',
  email: 'contact@azurglass.ma',
  ice: '002987123000089',
  ifiscal: '48901234',
  rc: '42190 Marrakech',
  patente: '55120984',
};

export const INITIAL_ASSURANCES: Assurance[] = [
  {
    id: 'ass-1',
    nom: 'Wafa Assurance',
    code: 'WAFA',
    telephone: '05 22 54 55 56',
    email: 'sinistres.auto@wafaassurance.co.ma',
    adresse: '1 Boulevard Abdelmoumen, Casablanca',
    delaiReglementMoyenJours: 45,
  },
  {
    id: 'ass-2',
    nom: 'RMA (Royale Marocaine d\'Assurance)',
    code: 'RMA',
    telephone: '05 22 20 40 40',
    email: 'reglements.auto@rma.co.ma',
    adresse: '83 Avenue de l\'Armée Royale, Casablanca',
    delaiReglementMoyenJours: 35,
  },
  {
    id: 'ass-3',
    nom: 'Sanlam Maroc',
    code: 'SANLAM',
    telephone: '05 22 42 06 06',
    email: 'gestion.sinistre@sanlam.ma',
    adresse: '216 Boulevard Zerktouni, Casablanca',
    delaiReglementMoyenJours: 40,
  },
  {
    id: 'ass-4',
    nom: 'AXA Assurance Maroc',
    code: 'AXA',
    telephone: '05 22 88 92 92',
    email: 'priseencharge@axa.ma',
    adresse: '120-122 Avenue Hassan II, Casablanca',
    delaiReglementMoyenJours: 30,
  },
  {
    id: 'ass-5',
    nom: 'AtlantaSanad',
    code: 'ATLANTASANAD',
    telephone: '05 22 95 78 00',
    email: 'sinistre.auto@atlantasanad.ma',
    adresse: '181 Boulevard d\'Anfa, Casablanca',
    delaiReglementMoyenJours: 50,
  },
  {
    id: 'ass-6',
    nom: 'MAMDA - MCMA',
    code: 'MAMDA',
    telephone: '05 37 68 80 00',
    email: 'contact@mamda-mcma.ma',
    adresse: 'Place Moulay Hassan, Rabat',
    delaiReglementMoyenJours: 40,
  },
];

export const INITIAL_PARTENAIRES: Partenaire[] = [
  {
    id: 'part-1',
    nom: 'Cabinet d\'Assurance Al Baraka (Courtier)',
    type: 'COURTIER',
    telephone: '05 22 30 11 22',
    ville: 'Casablanca',
    tauxCommissionPourcent: 8,
  },
  {
    id: 'part-2',
    nom: 'Carrosserie Auto Moderne Ain Sebaa',
    type: 'CARROSSIER',
    telephone: '06 61 40 50 60',
    ville: 'Casablanca',
    tauxCommissionPourcent: 5,
  },
  {
    id: 'part-3',
    nom: 'Dépannage Express & Assistance 24/7',
    type: 'DEPANNEUR',
    telephone: '06 63 99 88 77',
    ville: 'Mohammedia',
    tauxCommissionPourcent: 5,
  },
  {
    id: 'part-4',
    nom: 'Atlas Location Voitures Longue Durée',
    type: 'AGENCE_LOCATION',
    telephone: '05 22 80 90 00',
    ville: 'Casablanca',
    tauxCommissionPourcent: 10,
  },
];

export const INITIAL_FOURNISSEURS: Fournisseur[] = [
  {
    id: 'fourn-1',
    nom: 'Saint-Gobain Sekurit Maroc',
    ice: '001569483000078',
    telephone: '05 22 66 12 00',
    email: 'commandes@saint-gobain-sekurit.ma',
    ville: 'Casablanca',
    specialite: 'Vitrages d\'origine première monte',
  },
  {
    id: 'fourn-2',
    nom: 'Pilkington Vitrage Auto Distribution',
    ice: '002019485000032',
    telephone: '05 22 34 56 78',
    email: 'contact@pilkington-maroc.ma',
    ville: 'Tanger',
    specialite: 'Pare-brise et capteurs de pluie',
  },
  {
    id: 'fourn-3',
    nom: 'Sika Maroc (Chimie & Adhésifs)',
    ice: '000045812000099',
    telephone: '05 22 35 41 41',
    email: 'info@ma.sika.com',
    ville: 'Bouskoura',
    specialite: 'Colle polyuréthane pare-brise & Primaires',
  },
];

// Données d'activité réinitialisées à vide pour mise en production / test réel
export const INITIAL_STOCK: ArticleStock[] = [];
export const INITIAL_DOSSIERS: DossierSinistre[] = [];
export const INITIAL_BONS_SORTIE: BonSortie[] = [];
export const INITIAL_FACTURES: Facture[] = [];
export const INITIAL_BONS_LIVRAISON: BonLivraison[] = [];
export const INITIAL_RECETTES: ReglementRecette[] = [];
export const INITIAL_COMMANDES_FOURNISSEURS: BonCommandeFournisseur[] = [];
export const INITIAL_DEVIS: DevisClient[] = [];
