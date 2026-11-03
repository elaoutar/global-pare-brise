'use client';

import React, { useState } from 'react';
import { Facture, ArticleStock, LigneFacture, ModePaiement } from '@/types';
import { getNextNumeroFacture } from '@/lib/invoiceUtils';
import { formatDH } from '@/lib/utils';
import { 
  FileText, 
  X, 
  Plus, 
  Trash2, 
  User, 
  Car, 
  Building2, 
  Save, 
  CreditCard,
  Package
} from 'lucide-react';

interface Props {
  stockArticles: ArticleStock[];
  factures: Facture[];
  onClose: () => void;
  onSave: (newFacture: Facture) => void;
}

interface FormLine {
  id: string;
  articleId?: string;
  designation: string;
  codeEurocode?: string;
  quantite: number;
  prixTTC: number;
}

export const NewDirectFactureModal: React.FC<Props> = ({
  stockArticles,
  factures,
  onClose,
  onSave,
}) => {
  // Client Info
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientCin, setClientCin] = useState('');
  const [clientIce, setClientIce] = useState('');
  const [clientAdresse, setClientAdresse] = useState('Marrakech');

  // Véhicule Optionnel
  const [hasVehicule, setHasVehicule] = useState(false);
  const [vehiculeInfo, setVehiculeInfo] = useState('');
  const [immatriculation, setImmatriculation] = useState('');

  // Facture Info
  const defaultNum = getNextNumeroFacture('CLIENT', factures);
  const [numeroFacture, setNumeroFacture] = useState(defaultNum);
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [statutPaiement, setStatutPaiement] = useState<'EN_ATTENTE' | 'REGLE'>('REGLE');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('ESPECES');
  const [refPaiement, setRefPaiement] = useState('');
  const [observations, setObservations] = useState('Vente directe de pièces et vitrages au comptoir.');

  // Lignes
  const [lignes, setLignes] = useState<FormLine[]>([
    {
      id: `l-${Date.now()}`,
      designation: 'Pare-Brise conforme',
      codeEurocode: '',
      quantite: 1,
      prixTTC: 1200,
    },
  ]);

  const [selectedStockId, setSelectedStockId] = useState('');

  const handleAddStockItem = (artId: string) => {
    const art = stockArticles.find((a) => a.id === artId);
    if (!art) return;
    setLignes((prev) => [
      ...prev,
      {
        id: `l-${Date.now()}-${Math.random()}`,
        articleId: art.id,
        designation: art.designation,
        codeEurocode: art.codeEurocode || art.reference,
        quantite: 1,
        prixTTC: +(art.prixVenteHT * 1.20).toFixed(2),
      },
    ]);
    setSelectedStockId('');
  };

  const handleAddCustomLine = () => {
    setLignes((prev) => [
      ...prev,
      {
        id: `l-${Date.now()}-${Math.random()}`,
        designation: 'Article / Prestation',
        codeEurocode: '',
        quantite: 1,
        prixTTC: 200,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    setLignes((prev) => prev.filter((l) => l.id !== id));
  };

  // Calculs financiers
  const totalTTC = lignes.reduce((acc, l) => acc + (Number(l.prixTTC) || 0) * (Number(l.quantite) || 1), 0);
  const totalHT = +(totalTTC / 1.20).toFixed(2);
  const totalTVA = +(totalTTC - totalHT).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientNom.trim()) {
      alert('Veuillez renseigner le nom du client.');
      return;
    }

    if (lignes.length === 0) {
      alert('Veuillez ajouter au moins une ligne de facturation.');
      return;
    }

    const finalLignes: LigneFacture[] = lignes.map((l) => {
      const puHT = +(l.prixTTC / 1.20).toFixed(2);
      const totalLigneHT = +(puHT * l.quantite).toFixed(2);
      return {
        designation: l.designation.trim(),
        codeEurocode: l.codeEurocode?.trim() || undefined,
        quantite: Number(l.quantite) || 1,
        prixUnitaireHT: puHT,
        tauxTva: 20,
        totalHT: totalLigneHT,
      };
    });

    const newFac: Facture = {
      id: `fac-direct-${Date.now()}`,
      numeroFacture: numeroFacture.trim() || defaultNum,
      destinataire: 'CLIENT',
      dateEmission,
      dateEcheance: statutPaiement === 'REGLE' ? dateEmission : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lignes: finalLignes,
      totalHT,
      totalTVA,
      totalTTC,
      montantRegle: statutPaiement === 'REGLE' ? totalTTC : 0,
      statutPaiement,
      datePaiement: statutPaiement === 'REGLE' ? dateEmission : undefined,
      referencePaiement: statutPaiement === 'REGLE' ? `${modePaiement} ${refPaiement}`.trim() : undefined,
      observations: observations.trim(),
      clientNom: clientNom.trim(),
      clientTelephone: clientTelephone.trim() || undefined,
      clientCin: clientCin.trim() || undefined,
      clientIce: clientIce.trim() || undefined,
      clientAdresse: clientAdresse.trim() || undefined,
      vehiculeInfo: hasVehicule ? vehiculeInfo.trim() : undefined,
      immatriculation: hasVehicule ? immatriculation.trim() : undefined,
    };

    onSave(newFac);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-slate-900 text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Nouvelle Facture Directe (Vente Comptoir)
              </h3>
              <p className="text-[11px] text-slate-400">
                Émission d'une facture sans dossier sinistre ni matricule obligatoire
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs bg-slate-50/50">
          
          {/* Section 1: Numéro & Date */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                N° de Facture *
              </label>
              <input
                type="text"
                required
                value={numeroFacture}
                onChange={(e) => setNumeroFacture(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date d'Émission *
              </label>
              <input
                type="date"
                required
                value={dateEmission}
                onChange={(e) => setDateEmission(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Statut du Règlement
              </label>
              <select
                value={statutPaiement}
                onChange={(e) => setStatutPaiement(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg bg-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="REGLE">✅ Réglée immédiatement</option>
                <option value="EN_ATTENTE">⏳ En attente de paiement</option>
              </select>
            </div>
          </div>

          {/* Section 2: Client */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Coordonnées du Client (Particulier ou Société)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nom & Prénom / Raison Sociale *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Société Transport Atlas ou Rachid Alami"
                  value={clientNom}
                  onChange={(e) => setClientNom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Téléphone (Optionnel)
                </label>
                <input
                  type="tel"
                  placeholder="0661000000"
                  value={clientTelephone}
                  onChange={(e) => setClientTelephone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ICE (Obligatoire pour Sociétés)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 001234567000089"
                  value={clientIce}
                  onChange={(e) => setClientIce(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  CIN / Ville / Adresse
                </label>
                <input
                  type="text"
                  placeholder="Ex: Marrakech ou CIN EE123456"
                  value={clientAdresse}
                  onChange={(e) => setClientAdresse(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Toggle Véhicule Optionnel */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold text-[11px]">
                <input
                  type="checkbox"
                  checked={hasVehicule}
                  onChange={(e) => setHasVehicule(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Mentionner un véhicule ou matricule sur la facture (Optionnel)</span>
              </label>

              {hasVehicule && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Véhicule / Marque & Modèle
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dacia Duster 2022"
                      value={vehiculeInfo}
                      onChange={(e) => setVehiculeInfo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Immatriculation (Optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12345|A|6"
                      value={immatriculation}
                      onChange={(e) => setImmatriculation(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Lignes de Facturation */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Articles & Prestations Facturés (Saisie en TTC)</span>
              </div>

              <div className="flex items-center gap-2">
                {stockArticles.length > 0 && (
                  <select
                    value={selectedStockId}
                    onChange={(e) => {
                      if (e.target.value) handleAddStockItem(e.target.value);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                  >
                    <option value="">+ Choisir depuis le Stock...</option>
                    {stockArticles.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.designation} ({art.quantiteEnStock} en stock - {formatDH(art.prixVenteHT * 1.2)} TTC)
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={handleAddCustomLine}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Ligne Libre
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {lignes.map((l, idx) => (
                <div key={l.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50/60 p-2 rounded-lg border border-slate-200/80">
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Désignation article ou vitrage..."
                      value={l.designation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLignes((prev) => prev.map((item) => (item.id === l.id ? { ...item, designation: val } : item)));
                      }}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Réf / Code"
                      value={l.codeEurocode || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLignes((prev) => prev.map((item) => (item.id === l.id ? { ...item, codeEurocode: val } : item)));
                      }}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1">
                    <input
                      type="number"
                      min={1}
                      title="Quantité"
                      value={l.quantite}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1;
                        setLignes((prev) => prev.map((item) => (item.id === l.id ? { ...item, quantite: val } : item)));
                      }}
                      className="w-full px-2 py-1.5 border rounded-lg bg-white font-mono text-center font-bold text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        title="Prix unitaire TTC"
                        value={l.prixTTC}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setLignes((prev) => prev.map((item) => (item.id === l.id ? { ...item, prixTTC: val } : item)));
                        }}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white font-mono font-bold text-xs pr-6 text-right"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">DH</span>
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(l.id)}
                      disabled={lignes.length <= 1}
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded transition"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Block */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="text-[11px] text-slate-500">
                TVA Maroc 20% calculée automatiquement sur le HT.
              </span>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span>HT : <strong>{formatDH(totalHT)}</strong></span>
                <span>TVA (20%) : <strong>{formatDH(totalTVA)}</strong></span>
                <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Total TTC : {formatDH(totalTTC)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Règlement & Observations */}
          {statutPaiement === 'REGLE' && (
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Modalités de Paiement Immédiat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">Mode de règlement</label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-white font-bold text-emerald-950 text-xs"
                  >
                    <option value="ESPECES">💵 Espèces au comptoir</option>
                    <option value="CHEQUE">📝 Chèque</option>
                    <option value="VIREMENT">🏦 Virement bancaire</option>
                    <option value="EFFET">📄 Effet / Traite de commerce</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">Réf / N° Pièce de règlement</label>
                  <input
                    type="text"
                    placeholder="Ex: N° Chèque, Réf Virement..."
                    value={refPaiement}
                    onChange={(e) => setRefPaiement(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sticky footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow transition-all"
            >
              <Save className="w-4 h-4" /> Enregistrer la Facture Directe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
