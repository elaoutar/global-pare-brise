import { Facture } from '@/types';

/**
 * Générateur et gestionnaire de numérotation des Factures Global Pare-Brise.
 *
 * Règles :
 * 1. Factures Particulier / Client (Hors AZUR GLASS - Assurance) :
 *    - Format : N{année}{séquence}
 *    - Début : N2026148 (avec 2026 comme année)
 *    - Incrément automatique : N2026148 -> N2026149 -> N2026150...
 *
 * 2. Factures AZUR GLASS (Assurance) :
 *    - Format : N2028{séquence}
 *    - Début : N2028045
 *    - Incrément automatique : N2028045 -> N2028046 -> N2028047...
 */
export function getNextNumeroFacture(
  destinataire: 'ASSURANCE' | 'CLIENT' | 'AZUR_GLASS' | string,
  existingFactures: Facture[] = [],
  customYear?: number
): string {
  const isAzurGlass = destinataire === 'AZUR_GLASS' || destinataire === 'ASSURANCE';
  const currentYear = customYear || new Date().getFullYear();
  // Année cible (2026 par défaut ou l'année en cours)
  const targetYear = Math.max(2026, currentYear);

  if (isAzurGlass) {
    // Série AZUR GLASS : commence à N2028045
    const azurRegex = /^N2028(\d+)$/i;
    let maxSeq = 44; // de sorte que le premier calcul donne 45 -> N2028045

    existingFactures.forEach((f) => {
      if (!f || !f.numeroFacture) return;
      const cleanNum = f.numeroFacture.trim();
      const match = cleanNum.match(azurRegex);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    const seqStr = nextSeq < 100 ? String(nextSeq).padStart(3, '0') : String(nextSeq);
    return `N2028${seqStr}`;
  } else {
    // Série CLIENT / Particulier comptant :
    // Format N{année}{séquence}, débutant à N2026148
    const yearStr = String(targetYear);
    const clientRegex = new RegExp(`^N${yearStr}(\\d+)$`, 'i');
    let maxSeq = 147; // de sorte que le premier calcul donne 148 -> N2026148

    existingFactures.forEach((f) => {
      if (!f || !f.numeroFacture) return;
      // On ignore les factures Azur Glass
      if (f.destinataire === 'AZUR_GLASS' || f.destinataire === 'ASSURANCE') return;
      if (f.numeroFacture.startsWith('N2028')) return;

      const cleanNum = f.numeroFacture.trim();
      const match = cleanNum.match(clientRegex);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `N${yearStr}${nextSeq}`;
  }
}
