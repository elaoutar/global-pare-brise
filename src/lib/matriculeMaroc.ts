/**
 * Correspondance officielle des séries d'immatriculation au Maroc (Arabe <-> Latin)
 */
export interface LettrePlaqueMaroc {
  latin: string;
  arabe: string;
  nom: string;
}

export const LISTE_LETTRES_MAROC: LettrePlaqueMaroc[] = [
  { latin: 'A', arabe: 'أ', nom: 'Alif' },
  { latin: 'B', arabe: 'ب', nom: 'Baa' },
  { latin: 'D', arabe: 'د', nom: 'Dal' },
  { latin: 'H', arabe: 'هـ', nom: 'Haa' },
  { latin: 'W', arabe: 'و', nom: 'Waw' },
  { latin: 'Z', arabe: 'ز', nom: 'Zay' },
  { latin: 'J', arabe: 'ج', nom: 'Jim' },
  { latin: 'T', arabe: 'ط', nom: 'Taa' },
  { latin: 'Y', arabe: 'ي', nom: 'Yaa' },
  { latin: 'K', arabe: 'ك', nom: 'Kaf' },
  { latin: 'L', arabe: 'ل', nom: 'Lam' },
  { latin: 'M', arabe: 'م', nom: 'Mim' },
  { latin: 'N', arabe: 'ن', nom: 'Noun' },
  { latin: 'S', arabe: 'س', nom: 'Sin' },
  { latin: 'F', arabe: 'ف', nom: 'Faa' },
  { latin: 'Q', arabe: 'ق', nom: 'Qaf' },
  { latin: 'R', arabe: 'ر', nom: 'Raa' },
  { latin: 'E', arabe: 'ع', nom: 'Ain' },
  { latin: 'CH', arabe: 'ش', nom: 'Shin' },
  { latin: 'KH', arabe: 'خ', nom: 'Khaa' },
  { latin: 'DH', arabe: 'ذ', nom: 'Dhal' },
  { latin: 'TH', arabe: 'ث', nom: 'Thaa' },
  { latin: 'GH', arabe: 'غ', nom: 'Ghain' },
  { latin: 'ص', arabe: 'ص', nom: 'Sad' },
  { latin: 'ض', arabe: 'ض', nom: 'Dad' },
  { latin: 'ح', arabe: 'ح', nom: 'Haa point' },
];

// Dictionnaire Arabe -> Latin
const MAP_ARABE_VERS_LATIN: Record<string, string> = {
  'أ': 'A',
  'ا': 'A',
  'إ': 'A',
  'آ': 'A',
  'ب': 'B',
  'د': 'D',
  'هـ': 'H',
  'ه': 'H',
  'و': 'W',
  'ز': 'Z',
  'ج': 'J',
  'ط': 'T',
  'ي': 'Y',
  'ك': 'K',
  'ل': 'L',
  'م': 'M',
  'ن': 'N',
  'س': 'S',
  'ف': 'F',
  'ق': 'Q',
  'ر': 'R',
  'ع': 'E',
  'ش': 'CH',
  'خ': 'KH',
  'ذ': 'DH',
  'ث': 'TH',
  'غ': 'GH',
  'ت': 'T',
  'ص': 'S',
  'ض': 'D',
  'ظ': 'Z',
  'ح': 'H',
};

// Dictionnaire Latin -> Arabe
const MAP_LATIN_VERS_ARABE: Record<string, string> = {
  'A': 'أ',
  'B': 'ب',
  'D': 'د',
  'H': 'هـ',
  'W': 'و',
  'Z': 'ز',
  'J': 'ج',
  'T': 'ط',
  'Y': 'ي',
  'K': 'ك',
  'L': 'ل',
  'M': 'م',
  'N': 'ن',
  'S': 'س',
  'F': 'ف',
  'Q': 'ق',
  'R': 'ر',
  'E': 'ع',
  'CH': 'ش',
  'KH': 'خ',
  'DH': 'ذ',
  'TH': 'ث',
  'GH': 'غ',
};

/**
 * Convertit une lettre arabe en lettre latine marocaine (ex: 'أ' -> 'A')
 */
export function arabeVersLatin(lettreArabe: string): string {
  const clean = lettreArabe.trim();
  return MAP_ARABE_VERS_LATIN[clean] || clean;
}

/**
 * Convertit une lettre latine en lettre arabe marocaine (ex: 'A' -> 'أ')
 */
export function latinVersArabe(lettreLatin: string): string {
  const clean = lettreLatin.trim().toUpperCase();
  return MAP_LATIN_VERS_ARABE[clean] || clean;
}

/**
 * Découpe une immatriculation marocaine en ses composants
 */
export function parseImmatriculation(matricule: string) {
  if (!matricule) {
    return { numero: '', lettre: '', lettreLatin: '', lettreArabe: '', prefecture: '', isWW: false };
  }

  const clean = matricule.trim();
  if (clean.toUpperCase().startsWith('WW')) {
    const num = clean.replace(/[^0-9]/g, '');
    return { numero: num, lettre: 'WW', lettreLatin: 'WW', lettreArabe: 'WW', prefecture: '', isWW: true };
  }

  // Séparateurs : '|', '-', '/', ou espaces
  const parts = clean.split(/\s*\|\s*|\s*-\s*|\s*\/\s*/);
  if (parts.length >= 3) {
    const num = parts[0].trim();
    const ltr = parts[1].trim();
    const pref = parts[2].trim();

    const isArabe = !!MAP_ARABE_VERS_LATIN[ltr];
    const lettreLatin = isArabe ? arabeVersLatin(ltr) : ltr.toUpperCase();
    const lettreArabe = isArabe ? ltr : latinVersArabe(ltr);

    return {
      numero: num,
      lettre: ltr,
      lettreLatin,
      lettreArabe,
      prefecture: pref,
      isWW: false,
    };
  }

  return { numero: clean, lettre: '', lettreLatin: '', lettreArabe: '', prefecture: '', isWW: false };
}

/**
 * Formate l'immatriculation pour un affichage propre (Standard: 45892 | A | 6)
 */
export function formatMatricule(
  matricule: string, 
  mode: 'LATIN' | 'ARABE' | 'DUAL' = 'LATIN'
): string {
  if (!matricule) return '';
  const parsed = parseImmatriculation(matricule);

  if (parsed.isWW) {
    return `WW-${parsed.numero}`;
  }

  if (!parsed.numero && !parsed.lettre) {
    return matricule;
  }

  if (mode === 'ARABE') {
    return `${parsed.numero} | ${parsed.lettreArabe || parsed.lettre} | ${parsed.prefecture}`;
  }

  if (mode === 'DUAL' && parsed.lettreLatin && parsed.lettreArabe && parsed.lettreLatin !== parsed.lettreArabe) {
    return `${parsed.numero} | ${parsed.lettreLatin} (${parsed.lettreArabe}) | ${parsed.prefecture}`;
  }

  // Mode LATIN par défaut (45892 | A | 6)
  const ltr = parsed.lettreLatin || parsed.lettre;
  return `${parsed.numero} | ${ltr} | ${parsed.prefecture}`;
}
