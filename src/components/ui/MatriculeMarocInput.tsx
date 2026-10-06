'use client';

import React, { useState, useEffect } from 'react';
import { 
  LISTE_LETTRES_MAROC, 
  arabeVersLatin, 
  latinVersArabe, 
  parseImmatriculation 
} from '@/lib/matriculeMaroc';

interface Props {
  value: string;
  onChange: (fullMatricule: string) => void;
  required?: boolean;
}

export const MatriculeMarocInput: React.FC<Props> = ({
  value,
  onChange,
  required = true,
}) => {
  // Parse incoming value
  const parsed = parseImmatriculation(value);
  
  // Format preference: 'LATIN' (default: 45892 | A | 6) or 'ARABE' (45892 | أ | 6)
  const [formatMode, setFormatMode] = useState<'LATIN' | 'ARABE'>('LATIN');
  const [isWW, setIsWW] = useState(parsed.isWW);
  const [numero, setNumero] = useState(parsed.numero || '');
  const [lettreSelection, setLettreSelection] = useState(parsed.lettreLatin || 'A');
  const [prefecture, setPrefecture] = useState(parsed.prefecture || '6');

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      const p = parseImmatriculation(value);
      setIsWW(p.isWW);
      if (p.numero) setNumero(p.numero);
      if (p.lettreLatin) setLettreSelection(p.lettreLatin);
      if (p.prefecture) setPrefecture(p.prefecture);
      if (p.lettreArabe && value.includes(p.lettreArabe) && !value.includes(p.lettreLatin)) {
        setFormatMode('ARABE');
      }
    }
  }, [value]);

  // Update parent when inputs change
  useEffect(() => {
    if (isWW) {
      const formatted = `WW-${numero || '00000'}`;
      onChange(formatted);
    } else {
      if (numero || prefecture) {
        const lettreAffichee = formatMode === 'LATIN' 
          ? lettreSelection 
          : latinVersArabe(lettreSelection);

        const formatted = `${numero.trim()} | ${lettreAffichee.trim()} | ${prefecture.trim()}`;
        onChange(formatted);
      } else {
        onChange('');
      }
    }
  }, [numero, lettreSelection, prefecture, formatMode, isWW]);

  const currentLettreArabe = latinVersArabe(lettreSelection);
  const currentLettreLatin = lettreSelection;

  return (
    <div className="space-y-2">
      {/* Label and Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
        <label className="font-semibold text-slate-800 flex items-center gap-1.5">
          Immatriculation Véhicule (Maroc) {required && <span className="text-rose-500">*</span>}
        </label>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Toggle Latin / Arabe */}
          {!isWW && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFormatMode('LATIN')}
                className={`px-2 py-0.5 rounded-md transition ${
                  formatMode === 'LATIN' 
                    ? 'bg-blue-600 text-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format standard avec lettre en français/latin (ex: 45892 | A | 6)"
              >
                Format Latin (A)
              </button>
              <button
                type="button"
                onClick={() => setFormatMode('ARABE')}
                className={`px-2 py-0.5 rounded-md transition ${
                  formatMode === 'ARABE' 
                    ? 'bg-blue-600 text-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format avec lettre en arabe (ex: 45892 | أ | 6)"
              >
                Format Arabe (أ)
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsWW(!isWW)}
            className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 underline cursor-pointer"
          >
            {isWW ? "Plaque normale" : "WW (Provisoire) ?"}
          </button>
        </div>
      </div>

      {isWW ? (
        /* Immatriculation WW */
        <div className="flex items-center gap-2 p-2 bg-slate-50 border-2 border-slate-300 rounded-xl">
          <span className="px-3 py-1.5 bg-slate-800 text-white font-mono font-bold text-sm rounded-lg">
            WW
          </span>
          <input
            type="text"
            required={required}
            placeholder="Ex: 84920"
            value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      ) : (
        /* Plaque Marocaine Standard 3 Emplacements */
        <div className="bg-slate-50 p-2.5 rounded-xl border-2 border-slate-300 shadow-inner">
          <div className="grid grid-cols-12 gap-1.5 items-center" dir="ltr">
            
            {/* 1. Emplacement Numéro d'ordre (Gauche) */}
            <div className="col-span-5">
              <span className="block text-[10px] text-slate-500 font-semibold mb-0.5 text-center">
                Numéro (1 à 6 chiffres)
              </span>
              <input
                type="text"
                required={required}
                maxLength={6}
                placeholder="45892"
                value={numero}
                onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center px-2 py-2 bg-white border border-slate-300 rounded-lg text-base font-mono font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
            </div>

            {/* Séparateur visuel */}
            <div className="col-span-1 text-center font-bold text-slate-400 text-lg select-none">
              |
            </div>

            {/* 2. Emplacement Lettre (Centre) */}
            <div className="col-span-3">
              <span className="block text-[10px] text-slate-500 font-semibold mb-0.5 text-center">
                Série ({formatMode === 'LATIN' ? 'Lettre' : 'حرف'})
              </span>
              <select
                value={lettreSelection}
                onChange={(e) => setLettreSelection(e.target.value)}
                className="w-full text-center px-1 py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm cursor-pointer"
              >
                {LISTE_LETTRES_MAROC.map((l) => (
                  <option key={l.latin} value={l.latin} className="font-bold">
                    {formatMode === 'LATIN' 
                      ? `${l.latin} (${l.arabe})` 
                      : `${l.arabe} (${l.latin})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Séparateur visuel */}
            <div className="col-span-1 text-center font-bold text-slate-400 text-lg select-none">
              |
            </div>

            {/* 3. Emplacement Préfecture (Droite) */}
            <div className="col-span-2">
              <span className="block text-[10px] text-slate-500 font-semibold mb-0.5 text-center">
                Région (ex: 6, 26)
              </span>
              <input
                type="text"
                required={required}
                maxLength={2}
                placeholder="6"
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center px-1 py-2 bg-white border border-slate-300 rounded-lg text-base font-mono font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
            </div>
          </div>

          {/* Aperçu direct de la plaque en Français/Latin ET en Arabe */}
          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap justify-between items-center text-[11px] text-slate-600 px-1 gap-2">
            <span className="font-medium">Aperçu officiel :</span>
            
            <div className="flex items-center gap-2">
              {/* Badge Latin standard */}
              <div 
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-mono font-black border text-xs tracking-wider transition ${
                  formatMode === 'LATIN'
                    ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-blue-500/30'
                    : 'bg-white text-slate-600 border-slate-200 opacity-80'
                }`}
                title="Format Latin"
              >
                <span>{numero || '00000'}</span>
                <span className="text-amber-800/40 select-none font-bold">|</span>
                <span className="text-center font-bold px-0.5">{currentLettreLatin}</span>
                <span className="text-amber-800/40 select-none font-bold">|</span>
                <span>{prefecture || '0'}</span>
              </div>

              {/* Badge Arabe équivalent (Lettre arabe STRICTEMENT verrouillée au CENTRE) */}
              <div 
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-mono font-black border text-xs tracking-wider transition ${
                  formatMode === 'ARABE'
                    ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-blue-500/30'
                    : 'bg-white text-slate-600 border-slate-200 opacity-80'
                }`}
                title="Format Arabe (Lettre au centre)"
              >
                {/* 1. Numéro à gauche */}
                <span>{numero || '00000'}</span>

                {/* Séparateur */}
                <span className="text-amber-800/40 select-none font-bold">|</span>

                {/* 2. Lettre arabe au CENTRE avec isolation bdi */}
                <span className="text-center font-extrabold px-1 min-w-[20px] text-sm leading-none">
                  <bdi dir="rtl">{currentLettreArabe}</bdi>
                </span>

                {/* Séparateur */}
                <span className="text-amber-800/40 select-none font-bold">|</span>

                {/* 3. Région à droite */}
                <span>{prefecture || '0'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
