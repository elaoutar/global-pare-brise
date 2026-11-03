import * as XLSX from 'xlsx';
import { DossierSinistre, Facture, ReglementRecette, BonSortie } from '@/types';
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

  // Auto-fit column widths dynamically based on headers and content
  const maxProps = Object.keys(data[0] || {});
  worksheet['!cols'] = maxProps.map((key) => {
    const maxContentLen = data.reduce((max, row) => {
      const valStr = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
      return Math.max(max, valStr.length);
    }, key.length);
    return { wch: Math.min(Math.max(maxContentLen + 3, 14), 50) };
  });

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

// 5. Export État Intermédiaire AZUR GLASS (Bordereau / Réconciliation Financière)
export function exportEtatAzurGlassExcel(
  dossiers: DossierSinistre[],
  periodeOuFiltre: string = 'Global',
  factures?: Facture[],
  bonsSortie?: BonSortie[]
) {
  const dossiersAzur = dossiers.filter((d) => d.typeDossier === 'ASSURANCE');
  const rows = dossiersAzur.map((d) => {
    // 1. Facture liée
    const matchedFacture = factures?.find(
      (f) =>
        f.dossierId === d.id ||
        (d.factureAssuranceId && f.id === d.factureAssuranceId) ||
        (d.factureClientId && f.id === d.factureClientId)
    );

    // 2. Prestation faite (produits montés depuis facture)
    let prestationFaite = '';
    let prixArticlesHT = 0;
    let prixMontageHT = 0;

    if (matchedFacture && matchedFacture.lignes && matchedFacture.lignes.length > 0) {
      const lignesMontage = matchedFacture.lignes.filter((l) => {
        const desc = (l.designation || '').toLowerCase();
        return (
          desc.includes("main d'œuvre") ||
          desc.includes("main d'oeuvre") ||
          desc.includes("pose") ||
          desc.includes("montage") ||
          desc.includes("installation")
        );
      });

      const lignesArticles = matchedFacture.lignes.filter((l) => {
        const desc = (l.designation || '').toLowerCase();
        return (
          !desc.includes("main d'œuvre") &&
          !desc.includes("main d'oeuvre") &&
          !desc.includes("pose") &&
          !desc.includes("montage") &&
          !desc.includes("installation")
        );
      });

      if (lignesArticles.length > 0) {
        prestationFaite = lignesArticles
          .map((l) => `${l.designation}${l.quantite > 1 ? ` (x${l.quantite})` : ''}`)
          .join(' + ');
        prixArticlesHT = +lignesArticles.reduce((acc, l) => acc + (l.totalHT || 0), 0).toFixed(2);
      } else {
        prestationFaite = getProduitPrincipal(d, bonsSortie, factures);
      }

      if (lignesMontage.length > 0) {
        prixMontageHT = +lignesMontage.reduce((acc, l) => acc + (l.totalHT || 0), 0).toFixed(2);
      } else {
        prixMontageHT = 100;
      }

      if (prixArticlesHT === 0) {
        const totalHT = +(matchedFacture.totalHT || d.montantTotalTTC / 1.20).toFixed(2);
        prixArticlesHT = Math.max(0, +(totalHT - prixMontageHT).toFixed(2));
      }
    } else {
      prestationFaite = getProduitPrincipal(d, bonsSortie, factures);
      const totalHT = +(d.montantTotalTTC / 1.20).toFixed(2);
      prixMontageHT = 100;
      prixArticlesHT = Math.max(0, +(totalHT - prixMontageHT).toFixed(2));
    }

    // 3. Montants & Déductions
    const prixFactureTTC = matchedFacture ? matchedFacture.totalTTC : (d.montantTotalTTC || 0);
    const franchiseVal = !d.franchiseOfferte ? (d.montantFranchise || 0) : 0;

    const isProOrLocation =
      d.typeClientAssurance === 'PROFESSIONNEL' ||
      d.typeClientAssurance === 'AGENCE_LOCATION' ||
      (d.tvaExclueParAssurance !== undefined && d.tvaExclueParAssurance > 0);

    const totalTvaFacture = matchedFacture
      ? matchedFacture.totalTVA
      : +(prixFactureTTC - +(prixFactureTTC / 1.20)).toFixed(2);

    const tvaVal = isProOrLocation
      ? (d.tvaExclueParAssurance !== undefined && d.tvaExclueParAssurance > 0
          ? d.tvaExclueParAssurance
          : totalTvaFacture)
      : 0;

    const commissionVal = d.commission !== undefined && d.commission !== null
      ? Number(d.commission)
      : (d.partenaire?.commission !== undefined && d.partenaire?.commission !== null
          ? Number(d.partenaire.commission)
          : (d.partenaire?.tauxCommissionPourcent
              ? +((prixFactureTTC * d.partenaire.tauxCommissionPourcent) / 100).toFixed(2)
              : 0));

    // RESTE ( PRIX FACTURE MOINS TVA ( pour pro location voiture) et FRANCHISE)
    const resteVal = Math.max(0, +(prixFactureTTC - tvaVal - franchiseVal).toFixed(2));

    return {
      'DATE': formatDate(d.dateCreation || d.dateSinistre),
      'INTERMEDAIR': d.agenceAssurance || 'AZUR GLASS / Principale',
      'TYPE VOITEUR': `${d.vehicule.marque} ${d.vehicule.modele}`,
      'Prestation faite': prestationFaite,
      'COMPAGNIE Assurance': d.assurance?.nom || 'Assurance',
      'MAT': formatMatricule(d.vehicule.immatriculation, 'LATIN'),
      'PRIX': prixArticlesHT,
      'MONTAGE': prixMontageHT,
      'COMMISSION': commissionVal,
      'TVA': tvaVal,
      'FRANCHISE': franchiseVal,
      'PRIX FACTURE': prixFactureTTC,
      'RESTE': resteVal,
    };
  });

  const cleanName = periodeOuFiltre.replace(/[^a-zA-Z0-9]/g, '_');
  exportTableToExcel(rows, `Etat_AZUR_GLASS_Assurances_${cleanName}`, 'Etat_AZUR_GLASS');
}

// Helper pour extraire uniquement le produit principal posé (sans colle, sans main d'œuvre)
export function getProduitPrincipal(
  dossier: DossierSinistre,
  bonsSortie?: BonSortie[],
  factures?: Facture[]
): string {
  // 1. Chercher dans le Bon de Sortie associé
  if (bonsSortie && bonsSortie.length > 0) {
    const bs = bonsSortie.find((b) => b.dossierId === dossier.id);
    if (bs && bs.lignes && bs.lignes.length > 0) {
      const ligneVitrage = bs.lignes.find((l) => {
        const desc = (l.designation || '').toLowerCase();
        return (
          !desc.includes('colle') &&
          !desc.includes('mastic') &&
          !desc.includes('primaire') &&
          !desc.includes('sika')
        );
      });
      if (ligneVitrage && ligneVitrage.designation) {
        return ligneVitrage.designation;
      }
    }
  }

  // 2. Chercher dans la Facture associée
  if (factures && factures.length > 0) {
    const fac = factures.find((f) => f.dossierId === dossier.id);
    if (fac && fac.lignes && fac.lignes.length > 0) {
      const ligneVitrage = fac.lignes.find((l) => {
        const desc = (l.designation || '').toLowerCase();
        return (
          !desc.includes('colle') &&
          !desc.includes('mastic') &&
          !desc.includes('main d\'œuvre') &&
          !desc.includes('main d\'oeuvre') &&
          !desc.includes('pose') &&
          !desc.includes('franchise') &&
          !desc.includes('tva')
        );
      });
      if (ligneVitrage && ligneVitrage.designation) {
        return ligneVitrage.designation;
      }
    }
  }

  // 3. Fallback naturel basé sur la marque et le modèle du véhicule
  const v = dossier.vehicule;
  return `Pare-Brise conforme ${v.marque} ${v.modele} (${v.annee})`.trim();
}

// 6. Export État des Particuliers (Sans Assurance / Directs & Comptant)
export function exportEtatParticuliersExcel(
  dossiers: DossierSinistre[],
  periodeLibelle: string = 'Tous',
  bonsSortie?: BonSortie[],
  factures?: Facture[]
) {
  const dossiersParticuliers = dossiers.filter((d) => d.typeDossier !== 'ASSURANCE');
  const rows = dossiersParticuliers.map((d) => {
    const totalTTC = d.montantTotalTTC || 0;
    const totalHT = +(totalTTC / 1.20).toFixed(2);
    const totalTVA = +(totalTTC - totalHT).toFixed(2);
    const produitPose = getProduitPrincipal(d, bonsSortie, factures);

    return {
      'N° Dossier': d.numeroDossier,
      'Date Création': formatDate(d.dateCreation),
      'Client': d.client.nom,
      'Téléphone': d.client.telephone,
      'CIN': d.client.cin || '-',
      'Véhicule': `${d.vehicule.marque} ${d.vehicule.modele} (${d.vehicule.annee})`,
      'Immatriculation': formatMatricule(d.vehicule.immatriculation, 'LATIN'),
      'Produit Principal Posé': produitPose,
      'N° Châssis (VIN)': d.vehicule.chassisVin || '-',
      'Montant HT (DH)': totalHT,
      'TVA 20% (DH)': totalTVA,
      'Montant Total TTC (DH)': totalTTC,
      'Statut Dossier': d.statut,
      'Technicien Poseur': d.poseur || '-',
      'Observations': d.observations || '-',
    };
  });

  const cleanName = periodeLibelle.replace(/[^a-zA-Z0-9]/g, '_');
  exportTableToExcel(rows, `Etat_Particuliers_Sans_Assurance_${cleanName}`, 'Particuliers');
}

