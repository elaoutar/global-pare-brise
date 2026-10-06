'use client';

import React, { useState, useRef } from 'react';
import { ReglementRecette } from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { formatDate, formatDH, montantEnToutesLettres } from '@/lib/utils';
import { downloadElementAsPdf, shareElementToWhatsApp } from '@/lib/pdfExporter';
import { 
  Printer, 
  X, 
  CheckCircle, 
  Building2, 
  Calendar, 
  FileCheck2, 
  FileText,
  CreditCard,
  Check,
  Download,
  MessageCircle,
  Loader2
} from 'lucide-react';

interface Props {
  recettes: ReglementRecette[];
  onClose: () => void;
  onValiderDepot?: (recetteIds: string[]) => void;
}

const BANQUES_MAROC = [
  'Attijariwafa Bank',
  'Banque Populaire (BCP)',
  'Bank of Africa (BMCE)',
  'CIH Bank',
  'Société Générale Maroc (SGMB)',
  'Crédit du Maroc (CDM)',
  'BMCI (BNP Paribas)',
  'CFG Bank',
  'Al Barid Bank'
];

export const BordereauRemiseBancaireModal: React.FC<Props> = ({
  recettes,
  onClose,
  onValiderDepot,
}) => {
  // Filter all checks and promissory notes
  const chequesEtEffets = recettes.filter(
    (r) => r.modePaiement === 'CHEQUE' || r.modePaiement === 'EFFET'
  );

  // Type of slip: CHEQUES or EFFETS or ALL
  const [filterType, setFilterType] = useState<'CHEQUE' | 'EFFET' | 'TOUS'>('CHEQUE');
  
  // Bank where deposit is made
  const [banqueDepot, setBanqueDepot] = useState('Attijariwafa Bank');
  const [compteRib, setCompteRib] = useState(GARAGE_INFO.rib);
  const [dateRemise, setDateRemise] = useState(new Date().toISOString().split('T')[0]);
  const [numeroBordereau, setNumeroBordereau] = useState(`BR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [agenceVille, setAgenceVille] = useState('Agence Marrakech Guéliz / Massira');

  // Selected check/effet IDs
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // By default select checks that are EN_ATTENTE_ECHEANCE
    return chequesEtEffets
      .filter((r) => r.statut === 'EN_ATTENTE_ECHEANCE' && r.modePaiement === 'CHEQUE')
      .map((r) => r.id);
  });

  // Handle filter change
  const handleTypeChange = (type: 'CHEQUE' | 'EFFET' | 'TOUS') => {
    setFilterType(type);
    const filtered = chequesEtEffets.filter((r) => {
      if (type === 'TOUS') return true;
      return r.modePaiement === type;
    });
    setSelectedIds(filtered.filter(r => r.statut === 'EN_ATTENTE_ECHEANCE').map(r => r.id));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleItems = chequesEtEffets.filter((r) => {
      if (filterType === 'TOUS') return true;
      return r.modePaiement === filterType;
    });
    if (selectedIds.length === visibleItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleItems.map(r => r.id));
    }
  };

  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Selected elements for the slip
  const itemsRemise = chequesEtEffets.filter((r) => selectedIds.includes(r.id));
  const totalMontant = itemsRemise.reduce((acc, curr) => acc + curr.montant, 0);
  const totalNombre = itemsRemise.length;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || isExporting) return;
    try {
      setIsExporting(true);
      await downloadElementAsPdf(printRef.current, `BORDEREAU-REMISE-${numeroBordereau}`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du bordereau PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!printRef.current || isSharing) return;
    try {
      setIsSharing(true);
      await shareElementToWhatsApp(printRef.current, {
        filename: `BORDEREAU-REMISE-${numeroBordereau}`,
        documentTitle: `Bordereau de Remise Bancaire N° ${numeroBordereau}`,
        shareMessage: `Bonjour, voici le Bordereau de Remise Bancaire N° ${numeroBordereau} (${totalNombre} valeurs d'un montant total de ${formatDH(totalMontant)}) déposé pour le compte de GLOBAL PARE-BRISE Marrakech auprès de ${banqueDepot}.`,
      });
    } catch (err) {
      console.error(err);
      alert('Erreur lors du partage.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleValiderEncaissement = () => {
    if (onValiderDepot && selectedIds.length > 0) {
      if (window.confirm(`Confirmer la remise et marquer comme déposés/encaissés ces ${selectedIds.length} valeurs (${formatDH(totalMontant)}) ?`)) {
        onValiderDepot(selectedIds);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Header Controls (Hidden on Print) */}
        <div className="no-print sticky top-0 z-40 bg-slate-900 text-white p-3.5 sm:p-5 border-b border-slate-800 shadow-md backdrop-blur-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl">
                <FileCheck2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                  Bordereau de Remise Bancaire
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Format A4
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Dépôt officiel à l'encaissement • Compte : {banqueDepot}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {/* Print */}
              <button
                onClick={handlePrint}
                disabled={totalNombre === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
                title="Imprimer"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>

              {/* Download PDF */}
              <button
                onClick={handleDownloadPdf}
                disabled={totalNombre === 0 || isExporting}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                title="Télécharger PDF au format A4"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>Télécharger PDF (A4)</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                disabled={totalNombre === 0 || isSharing}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                title="Partager sur WhatsApp"
              >
                {isSharing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-white" />
                )}
                <span>WhatsApp</span>
              </button>

              {/* Mark deposited */}
              {onValiderDepot && (
                <button
                  onClick={handleValiderEncaissement}
                  disabled={totalNombre === 0}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  title="Marquer les valeurs sélectionnées comme déposées en banque"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Marquer Déposé</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Configuration Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Type de Valeurs :</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => handleTypeChange('CHEQUE')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-center transition ${
                    filterType === 'CHEQUE' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Chèques
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('EFFET')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-center transition ${
                    filterType === 'EFFET' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Effets/Traites
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('TOUS')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-center transition ${
                    filterType === 'TOUS' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Tous
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Banque Réceptrice :</label>
              <select
                value={banqueDepot}
                onChange={(e) => setBanqueDepot(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {BANQUES_MAROC.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Date de Remise :</label>
              <input
                type="date"
                value={dateRemise}
                onChange={(e) => setDateRemise(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">N° Bordereau :</label>
              <input
                type="text"
                value={numeroBordereau}
                onChange={(e) => setNumeroBordereau(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Interactive Selection of Cheques in Safe */}
          <div className="mt-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Sélectionner les chèques/effets à inclure dans ce bordereau :
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-bold underline"
              >
                {selectedIds.length === chequesEtEffets.filter(r => filterType === 'TOUS' || r.modePaiement === filterType).length
                  ? 'Désélectionner tout'
                  : 'Tout sélectionner'}
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
              {chequesEtEffets
                .filter((r) => filterType === 'TOUS' || (r.modePaiement as string) === filterType)
                .map((rec) => {
                  const isChecked = selectedIds.includes(rec.id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleToggleSelect(rec.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                        isChecked 
                          ? 'bg-blue-900/40 border-blue-600/70 text-white' 
                          : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:bg-slate-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-slate-200">
                          {rec.referenceDocument || rec.numeroRecu}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
                          {rec.modePaiement}
                        </span>
                        <span className="text-slate-300 truncate max-w-[180px]">{rec.payeurNom}</span>
                        {rec.banque && (
                          <span className="text-slate-400 text-[11px]">({rec.banque})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {rec.dateEcheance && (
                          <span className="text-[11px] text-amber-400 font-mono">
                            Éch: {formatDate(rec.dateEcheance)}
                          </span>
                        )}
                        <span className="font-mono font-bold text-emerald-400">
                          {formatDH(rec.montant)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {chequesEtEffets.length === 0 && (
                <div className="text-slate-400 text-center py-3 italic">
                  Aucun chèque ou traite enregistré dans le journal des recettes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PRINTABLE SLIP / BORDEREAU DE REMISE OFFICIEL */}
        <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
          <div 
            ref={printRef}
            className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl"
          >
          
          {/* Header Bordereau */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-4 mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  {GARAGE_INFO.nom}
                </h1>
                <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-800 font-bold rounded">
                  {GARAGE_INFO.formeJuridique}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">{GARAGE_INFO.adresse}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1 font-mono">
                <span><strong>ICE:</strong> {GARAGE_INFO.ice}</span>
                <span><strong>IF:</strong> {GARAGE_INFO.ifiscal}</span>
                <span><strong>RC:</strong> {GARAGE_INFO.rc}</span>
                <span><strong>Patente:</strong> {GARAGE_INFO.patente}</span>
              </div>
            </div>

            <div className="text-right sm:self-start bg-slate-50 border border-slate-300 p-3 rounded-xl min-w-[240px]">
              <div className="text-xs font-black uppercase text-blue-900 tracking-wider">
                {filterType === 'EFFET' 
                  ? "BORDEREAU D'EFFETS DE COMMERCE" 
                  : "BORDEREAU DE REMISE DE CHÈQUES"}
              </div>
              <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                N° : <span className="text-slate-950">{numeroBordereau}</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Date de remise : <strong>{formatDate(dateRemise)}</strong>
              </div>
            </div>
          </div>

          {/* Destination Bank & Account Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-100/70 p-4 rounded-xl border border-slate-300 mb-6">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                Compte à Créditer (Remettant)
              </span>
              <p className="font-bold text-slate-900">{GARAGE_INFO.nom} SARL</p>
              <p className="text-xs text-slate-600">Banque : <strong className="text-slate-800">{banqueDepot}</strong></p>
              <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                RIB : <span className="tracking-wide text-slate-950">{compteRib}</span>
              </p>
            </div>

            <div className="sm:border-l sm:border-slate-300 sm:pl-4">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                Motif & Nature de la Remise
              </span>
              <p className="font-bold text-slate-800">
                {filterType === 'EFFET' ? 'Remise à l’Encaissement / Escompte' : 'Remise de Chèques à l’Encaissement'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Nombre de valeurs remises : <strong className="text-blue-900 font-mono text-sm">{totalNombre}</strong>
              </p>
              <p className="text-xs text-slate-600">
                Agence : <strong className="text-slate-800">{agenceVille}</strong>
              </p>
            </div>
          </div>

          {/* Table of Cheques/Drafts */}
          <div className="mb-6 overflow-hidden border border-slate-300 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-200/90 border-b border-slate-300 text-slate-800 font-bold">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">N°</th>
                  <th className="py-2.5 px-3">Numéro du Chèque / Effet</th>
                  <th className="py-2.5 px-3">Banque Tirée</th>
                  <th className="py-2.5 px-3">Tireur / Émetteur (Client / Cie)</th>
                  <th className="py-2.5 px-3 text-center">Échéance</th>
                  <th className="py-2.5 px-4 text-right">Montant (DH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {itemsRemise.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {item.referenceDocument || item.numeroRecu}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800">
                      {item.banque || 'Attijariwafa Bank'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">
                      {item.payeurNom}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                      {item.dateEcheance ? formatDate(item.dateEcheance) : formatDate(item.datePaiement)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-950">
                      {formatDH(item.montant)}
                    </td>
                  </tr>
                ))}

                {itemsRemise.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Aucune valeur sélectionnée. Veuillez cocher les chèques à inclure dans les contrôles ci-dessus.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase text-slate-700">
                    Total Général ({totalNombre} {totalNombre > 1 ? 'valeurs' : 'valeur'}) :
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base font-black text-slate-950">
                    {formatDH(totalMontant)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in Words (Moroccan Standard) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mb-8">
            <p className="text-xs text-slate-700">
              Arrêté le présent bordereau de remise à la somme totale de :
            </p>
            <p className="text-sm font-black text-slate-950 mt-1 uppercase italic tracking-wide">
              {montantEnToutesLettres(totalMontant)}
            </p>
          </div>

          {/* Signatures & Bank Stamp Box */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Box Remettant */}
            <div className="border border-slate-300 rounded-xl p-4 min-h-[140px] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Cachet & Signature du Remettant
                </span>
                <span className="text-[10px] text-slate-400">Pour GLOBAL PARE-BRISE SARL</span>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-mono">
                Marrakech, le {formatDate(dateRemise)}
              </div>
            </div>

            {/* Box Banque Receipt */}
            <div className="border border-dashed border-slate-400 rounded-xl p-4 min-h-[140px] flex flex-col justify-between bg-slate-50/50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block">
                  Accusé de Réception de la Banque
                </span>
                <span className="text-[10px] text-slate-500">
                  Date, Cachet du guichet et Signature de l'agent
                </span>
              </div>
              <div className="text-[10px] text-slate-400 italic">
                * Sous réserve d'encaissement et de conformité des signatures.
              </div>
            </div>
          </div>

          {/* Legal Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 leading-normal">
            {GARAGE_INFO.nom} • Forme Juridique : {GARAGE_INFO.formeJuridique} • ICE : {GARAGE_INFO.ice} • IF : {GARAGE_INFO.ifiscal} • RC : {GARAGE_INFO.rc} • Patente : {GARAGE_INFO.patente}
            <br />
            {GARAGE_INFO.adresse} • Tél: {GARAGE_INFO.telephone} • Email: {GARAGE_INFO.email}
          </div>

        </div>
        </div>

      </div>
    </div>
  );
};
