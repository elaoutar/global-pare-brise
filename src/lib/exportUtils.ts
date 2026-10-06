import * as XLSX from 'xlsx';
import { DossierSinistre, Facture, ReglementRecette } from '@/types';
import { formatDate } from './utils';
import { formatMatricule } from './matriculeMaroc';
import { GARAGE_INFO } from './data';

// Generic Excel Exporter
export function exportTableToExcel(
  data: any[], 
  filename: string, 
  sheetName: string = 'Export'
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-fit column widths
  const maxProps = Object.keys(data[0] || {});
  worksheet['!cols'] = maxProps.map((key) => ({
    wch: Math.max(key.length + 4, 15),
  }));

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// 1. Export État Mensuel / Périodique des Dossiers
export function exportEtatMensuelExcel(
  dossiers: DossierSinistre[],
  moisLibelle: string = 'Courant'
) {
  const rows = dossiers.map((d) => ({
    'N° Dossier': d.numeroDossier,
    'Type Dossier': d.typeDossier === 'PARTICULIER_COMPTANT' ? 'Particulier Direct (Comptant)' : 'Assurance (Tiers-Payant)',
    'Date Création': formatDate(d.dateCreation),
    'Client': d.client.nom,
    'Téléphone': d.client.telephone,
    'Véhicule': `${d.vehicule.marque} ${d.vehicule.modele}`,
    'Immatriculation': formatMatricule(d.vehicule.immatriculation, 'LATIN'),
    'Compagnie Assurance': d.assurance?.nom || 'Sans Assurance',
    'N° Sinistre': d.numeroSinistre || '-',
    'N° Police': d.numeroPolice || '-',
    'Montant Total TTC (DH)': d.montantTotalTTC,
    'Prise en Charge Assurance (DH)': d.montantPriseEnChargeAssurance,
    'Franchise (DH)': d.montantFranchise,
    'Franchise Offerte': d.franchiseOfferte ? 'OUI' : 'NON',
    'Statut Dossier': d.statut,
    'Poseur': d.poseur || '-',
  }));

  exportTableToExcel(rows, `Etat_Mensuel_Dossiers_${moisLibelle}`, 'Dossiers');
}

// 2. Export État par Compagnie d'Assurance
export function exportEtatAssuranceExcel(
  dossiers: DossierSinistre[],
  assuranceNom: string = 'Toutes'
) {
  const dossiersAssurance = dossiers.filter((d) => d.typeDossier === 'ASSURANCE');
  const rows = dossiersAssurance.map((d) => ({
    'Assurance': d.assurance?.nom || 'Assurance',
    'N° Sinistre': d.numeroSinistre || '-',
    'N° Police': d.numeroPolice || '-',
    'Date Sinistre': formatDate(d.dateSinistre),
    'Date Dépôt': formatDate(d.dateDepotAssurance),
    'N° Dossier': d.numeroDossier,
    'Assuré (Client)': d.client.nom,
    'Véhicule': `${d.vehicule.marque} ${d.vehicule.modele}`,
    'Matricule': formatMatricule(d.vehicule.immatriculation, 'LATIN'),
    'Montant Facturé TTC (DH)': d.montantPriseEnChargeAssurance,
    'Statut Règl.': d.statut === 'VALIDE_REGLE' ? 'RÉGLÉ' : 'EN ATTENTE VIREMENT',
    'Date Règlement': formatDate(d.dateReglementAssurance),
  }));

  const cleanName = assuranceNom.replace(/[^a-zA-Z0-9]/g, '_');
  exportTableToExcel(rows, `Etat_Assurance_${cleanName}`, 'Assurances');
}

// 3. Export État par Client
export function exportEtatClientExcel(
  dossiers: DossierSinistre[],
  clientNom: string = 'Tous_Clients'
) {
  const rows = dossiers.map((d) => ({
    'Client': d.client.nom,
    'Téléphone': d.client.telephone,
    'CIN / ICE': d.client.cin || '-',
    'N° Dossier': d.numeroDossier,
    'Type Prestation': d.typeDossier === 'PARTICULIER_COMPTANT' ? 'Particulier (Comptant)' : 'Tiers-Payant Assurance',
    'Date': formatDate(d.dateCreation),
    'Véhicule': `${d.vehicule.marque} ${d.vehicule.modele}`,
    'Immatriculation': formatMatricule(d.vehicule.immatriculation, 'LATIN'),
    'Assurance': d.assurance?.nom || 'Sans Assurance',
    'Total Prestation TTC (DH)': d.montantTotalTTC,
    'Part Assurance': d.montantPriseEnChargeAssurance,
    'Franchise Client': d.montantFranchise,
    'Statut': d.statut,
  }));

  const cleanName = clientNom.replace(/[^a-zA-Z0-9]/g, '_');
  exportTableToExcel(rows, `Etat_Client_${cleanName}`, 'Clients');
}

// 4. Export État des Recettes & Trésorerie
export function exportEtatRecettesExcel(
  recettes: ReglementRecette[],
  periode: string = 'Recettes'
) {
  const rows = recettes.map((r) => ({
    'N° Reçu': r.numeroRecu,
    'Date Paiement': formatDate(r.datePaiement),
    'Payeur': r.payeurNom,
    'Type Source': r.sourceType,
    'Mode de Paiement': r.modePaiement,
    'Réf / N° Chèque / Traite': r.referenceDocument || '-',
    'Banque': r.banque || '-',
    'Date Échéance': r.dateEcheance ? formatDate(r.dateEcheance) : '-',
    'Montant (DH)': r.montant,
    'Statut Encaissement': r.statut,
    'Date Encaissement Réel': r.dateEncaissementEffectif ? formatDate(r.dateEncaissementEffectif) : '-',
    'Notes': r.notes || '-',
  }));

  exportTableToExcel(rows, `Etat_Recettes_Tresorerie_${periode}`, 'Recettes');
}
