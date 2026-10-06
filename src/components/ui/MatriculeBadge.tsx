import React from 'react';
import { parseImmatriculation } from '@/lib/matriculeMaroc';

interface Props {
  immatriculation: string;
  className?: string;
  mode?: 'LATIN' | 'ARABE' | 'DUAL';
}

export const MatriculeBadge: React.FC<Props> = ({
  immatriculation,
  className = '',
  mode = 'LATIN',
}) => {
  const parsed = parseImmatriculation(immatriculation);

  if (parsed.isWW) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-black bg-slate-800 text-white tracking-wider select-all ${className}`}
        title={`Matricule WW : WW-${parsed.numero}`}
      >
        WW-{parsed.numero}
      </span>
    );
  }

  if (!parsed.numero && !parsed.lettre) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-950 border border-amber-300 ${className}`}>
        {immatriculation}
      </span>
    );
  }

  const lettre = mode === 'ARABE' 
    ? (parsed.lettreArabe || parsed.lettre) 
    : (parsed.lettreLatin || parsed.lettre);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-black bg-amber-100 text-amber-950 border border-amber-300 tracking-wider select-all ${className}`}
      title={`Matricule marocain : ${parsed.numero} | ${lettre} | ${parsed.prefecture}`}
    >
      {/* 1. Numéro à gauche */}
      <span className="font-bold">{parsed.numero}</span>

      {/* Séparateur */}
      <span className="text-amber-800/50 select-none font-bold">|</span>

      {/* 2. Lettre STRICTEMENT au centre (isolée avec bdi) */}
      <span className="text-center font-extrabold px-0.5">
        <bdi>{lettre}</bdi>
      </span>

      {/* Séparateur */}
      <span className="text-amber-800/50 select-none font-bold">|</span>

      {/* 3. Région à droite */}
      <span className="font-bold">{parsed.prefecture}</span>
    </div>
  );
};
