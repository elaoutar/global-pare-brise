import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { StatutDossier, StatutPaiement } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDH(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('MAD', 'DH');
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getStatutDossierBadge(statut: StatutDossier) {
  switch (statut) {
    case 'NOUVEAU':
      return {
        label: 'Nouveau',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'EN_COURS_POSE':
      return {
        label: 'En cours de pose',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'POSE_TERMINEE':
      return {
        label: 'Pose terminée',
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
      };
    case 'DEPOSE_ASSURANCE':
      return {
        label: 'Déposé Assurance',
        bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      };
    case 'VALIDE_REGLE':
      return {
        label: 'Validé & Réglé',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'REJETE':
      return {
        label: 'Rejeté / Litige',
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    default:
      return {
        label: statut,
        bg: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
}

export function getStatutPaiementBadge(statut: StatutPaiement) {
  switch (statut) {
    case 'REGLE':
      return {
        label: 'Réglé',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'PARTIEL':
      return {
        label: 'Paiement partiel',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'EN_ATTENTE':
      return {
        label: 'En attente',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'IMPAYE':
      return {
        label: 'Impayé / Retard',
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    default:
      return {
        label: statut,
        bg: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
}

export function montantEnToutesLettres(nombre: number): string {
  if (isNaN(nombre) || nombre <= 0) return 'Zéro Dirham';

  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dix_dix_neuf = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  function convertirCentaines(n: number): string {
    let res = '';
    const c = Math.floor(n / 100);
    const reste = n % 100;

    if (c > 0) {
      if (c === 1) res += 'cent ';
      else res += unites[c] + ' cents ';
    }

    if (reste > 0) {
      if (reste < 10) {
        res += unites[reste];
      } else if (reste >= 10 && reste < 20) {
        res += dix_dix_neuf[reste - 10];
      } else {
        const d = Math.floor(reste / 10);
        const u = reste % 10;
        if (d === 7 || d === 9) {
          res += dizaines[d - 1] + '-' + (u === 1 ? 'et-onze' : dix_dix_neuf[u]);
        } else {
          res += dizaines[d] + (u === 1 ? '-et-un' : (u > 0 ? '-' + unites[u] : ''));
        }
      }
    }
    return res.trim();
  }

  const entier = Math.floor(nombre);
  const centimes = Math.round((nombre - entier) * 100);

  let resultat = '';
  const millions = Math.floor(entier / 1000000);
  const milliers = Math.floor((entier % 1000000) / 1000);
  const reste = entier % 1000;

  if (millions > 0) {
    resultat += (millions === 1 ? 'un million ' : convertirCentaines(millions) + ' millions ');
  }
  if (milliers > 0) {
    resultat += (milliers === 1 ? 'mille ' : convertirCentaines(milliers) + ' mille ');
  }
  if (reste > 0) {
    resultat += convertirCentaines(reste);
  }

  resultat = resultat.trim();
  if (!resultat) resultat = 'zéro';

  resultat = resultat.charAt(0).toUpperCase() + resultat.slice(1) + ' Dirhams';
  if (centimes > 0) {
    resultat += ' et ' + centimes + ' Cts';
  }
  return resultat;
}

export function getStatutCommandeFournisseurBadge(statut: string) {
  switch (statut) {
    case 'BROUILLON':
      return { label: 'Brouillon', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'ENVOYEE':
      return { label: 'Envoyée au Fournisseur', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'RECUE_PARTIELLE':
      return { label: 'Reçue Partiellement', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'RECUE_CONFORME':
      return { label: 'Reçue & Conforme', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'ANNULEE':
      return { label: 'Annulée', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    default:
      return { label: statut, bg: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}

export function getStatutPaiementFournisseurBadge(statut: string) {
  switch (statut) {
    case 'NON_PAYE':
      return { label: 'Non Payé (En Attente)', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    case 'ACOMPTE_VERSE':
      return { label: 'Acompte Versé', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'EN_ATTENTE_ECHEANCE':
      return { label: 'Chèque / Traite en attente', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'PAYE_TOTAL':
      return { label: 'Payé Intégralement', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    default:
      return { label: statut, bg: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}


