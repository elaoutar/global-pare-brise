'use client';

import React, { useState } from 'react';
import { DevisClient, ArticleStock, Assurance, LigneDevis } from '@/types';
import { formatDH } from '@/lib/utils';
import { MatriculeMarocInput } from '@/components/ui/MatriculeMarocInput';
import { 
  FileText, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calculator, 
  User, 
  Car, 
  MapPin, 
  Building2, 
  ShieldCheck 
} from 'lucide-react';

interface Props {
  stockArticles: ArticleStock[];
  assurances: Assurance[];
  initialDevis?: DevisClient | null;
  onSave: (devis: DevisClient) => void;
  onClose: () => void;
}

export const NewDevisModal: React.FC<Props> = ({
  stockArticles,
  assurances,
  initialDevis,
  onSave,
  onClose,
}) => {
  // Client Info
  const [clientNom, setClientNom] = useState(initialDevis?.clientNom || '');
  const [clientTelephone, setClientTelephone] = useState(initialDevis?.clientTelephone || '');
  const [clientCin, setClientCin] = useState(initialDevis?.clientCin || '');
  const [clientEmail, setClientEmail] = useState(initialDevis?.clientEmail || '');
  const [agenceVille, setAgenceVille] = useState(initialDevis?.agenceVille || 'Marrakech');

  // Vehicule Info
  const [vehiculeMarque, setVehiculeMarque] = useState(initialDevis?.vehiculeMarque || 'Renault');
  const [vehiculeModele, setVehiculeModele] = useState(initialDevis?.vehiculeModele || 'Clio');
  const [vehiculeAnnee, setVehiculeAnnee] = useState(initialDevis?.vehiculeAnnee || new Date().getFullYear());
  const [vehiculeImmatriculation, setVehiculeImmatriculation] = useState(initialDevis?.vehiculeImmatriculation || '45892|A|6');
  const [vehiculeChassisVin, setVehiculeChassisVin] = useState(initialDevis?.vehiculeChassisVin || '');

  // Type & Assurance
  const [typeDemande, setTypeDemande] = useState<'PARTICULIER_DIRECT' | 'ASSURANCE'>(
    initialDevis?.typeDemande || 'PARTICULIER_DIRECT'
  );
  const [compagnieAssurance, setCompagnieAssurance] = useState(initialDevis?.compagnieAssurance || '');

  // Dates
  const [dateDevis, setDateDevis] = useState(
    initialDevis?.dateDevis || new Date().toISOString().split('T')[0]
  );
  const [dateValidite, setDateValidite] = useState(
    initialDevis?.dateValidite ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [statut, setStatut] = useState<DevisClient['statut']>(initialDevis?.statut || 'ENVOYE');
  const [observations, setObservations] = useState(initialDevis?.observations || '');

  // Lignes de devis (Gérées en TTC, calcul automatique du HT / TVA)
  interface LigneFormTTC {
    id: string;
    designation: string;
    codeEurocode?: string;
    quantite: number;
    prixTTC: number;
  }

  const [lignesTTC, setLignesTTC] = useState<LigneFormTTC[]>(() => {
    if (initialDevis && initialDevis.lignes.length > 0) {
      return initialDevis.lignes.map((l, i) => ({
        id: `l-${i}`,
        designation: l.designation,
        codeEurocode: l.codeEurocode,
        quantite: l.quantite,
        prixTTC: +(l.prixUnitaireHT * 1.20).toFixed(2),
      }));
    }
    return [
      {
        id: 'l-1',
        designation: 'Pare-Brise teinté conforme',
        codeEurocode: '',
        quantite: 1,
        prixTTC: 1500,
      },
      {
        id: 'l-2',
        designation: 'Kit colle polyuréthane & primaire d\'étanchéité',
        codeEurocode: 'SIKA-300ML',
        quantite: 1,
        prixTTC: 150,
      },
      {
        id: 'l-3',
        designation: 'Main d\'œuvre pose et dépose vitrage collé',
        codeEurocode: '',
        quantite: 1,
        prixTTC: 150,
      },
    ];
  });

  // New item inputs
  const [newItemDesignation, setNewItemDesignation] = useState('');
  const [newItemEurocode, setNewItemEurocode] = useState('');
  const [newItemQte, setNewItemQte] = useState(1);
  const [newItemPrixTTC, setNewItemPrixTTC] = useState<number>(200);

  // Stock picker helper
  const handleSelectFromStock = (artId: string) => {
    const art = stockArticles.find((a) => a.id === artId);
    if (!art) return;
    setNewItemDesignation(art.designation);
    setNewItemEurocode(art.codeEurocode || art.reference);
    setNewItemPrixTTC(art.prixVenteHT); // Stock prixVente is TTC
  };

  const handleAddLine = () => {
    if (!newItemDesignation.trim()) return;
    setLignesTTC((prev) => [
      ...prev,
      {
        id: `l-${Date.now()}`,
        designation: newItemDesignation,
        codeEurocode: newItemEurocode || undefined,
        quantite: newItemQte,
        prixTTC: newItemPrixTTC,
      },
    ]);
    setNewItemDesignation('');
    setNewItemEurocode('');
    setNewItemQte(1);
    setNewItemPrixTTC(200);
  };

  const handleRemoveLine = (id: string) => {
    setLignesTTC((prev) => prev.filter((l) => l.id !== id));
  };

  // Prestations Rapides
  const handleAddPrestationRapide = (nom: string, prixTTC: number) => {
    setLignesTTC((prev) => [
      ...prev,
      {
        id: `l-preset-${Date.now()}`,
        designation: nom,
        quantite: 1,
        prixTTC,
      },
    ]);
  };

  // Totaux calculés depuis le TTC
  const totalTTC = lignesTTC.reduce((acc, l) => acc + l.prixTTC * l.quantite, 0);
  const totalHT = +(totalTTC / 1.20).toFixed(2);
  const totalTVA = +(totalTTC - totalHT).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lignesTTC.length === 0) {
      alert('Veuillez ajouter au moins une ligne de prestation ou vitrage au devis.');
      return;
    }

    const seq = Math.floor(1000 + Math.random() * 9000);
    const generatedLignes: LigneDevis[] = lignesTTC.map((l, idx) => {
      const puHT = +(l.prixTTC / 1.20).toFixed(2);
      const ligneTotalHT = +(puHT * l.quantite).toFixed(2);
      return {
        id: `ldev-${idx}-${Date.now()}`,
        designation: l.designation,
        codeEurocode: l.codeEurocode,
        quantite: l.quantite,
        prixUnitaireHT: puHT,
        tauxTva: 20,
        totalHT: ligneTotalHT,
      };
    });

    const devisResult: DevisClient = {
      id: initialDevis?.id || `dev-${Date.now()}`,
      numeroDevis: initialDevis?.numeroDevis || `DEV-2026-${seq}`,
      dateDevis,
      dateValidite,
      agenceVille,
      clientNom,
      clientTelephone,
      clientCin: clientCin || undefined,
      clientEmail: clientEmail || undefined,
      clientVille: agenceVille,
      vehiculeMarque,
      vehiculeModele,
      vehiculeAnnee: Number(vehiculeAnnee),
      vehiculeImmatriculation,
      vehiculeChassisVin: vehiculeChassisVin || undefined,
      typeDemande,
      compagnieAssurance: typeDemande === 'ASSURANCE' ? compagnieAssurance : undefined,
      lignes: generatedLignes,
      totalHT,
      totalTVA,
      totalTTC,
      statut,
      observations: observations || undefined,
      dossierIdGenere: initialDevis?.dossierIdGenere,
    };

    onSave(devisResult);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-10 bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialDevis ? `Modifier Devis ${initialDevis.numeroDevis}` : 'Créer un Nouveau Devis Client'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Tarification directe en TTC • Calcul automatique du HT & TVA (20%) • Format A4 officiel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 text-xs bg-slate-50/50">
          
          {/* Section 1: Agence, Dates & Statut */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" /> Agence / Ville *
              </label>
              <select
                value={agenceVille}
                onChange={(e) => setAgenceVille(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
              >
                <option value="Marrakech">📍 Marrakech (Siège)</option>
                <option value="El Jadida">📍 El Jadida (Agence)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date du Devis *</label>
              <input
                type="date"
                required
                value={dateDevis}
                onChange={(e) => setDateDevis(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date de Validité *</label>
              <input
                type="date"
                required
                value={dateValidite}
                onChange={(e) => setDateValidite(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Statut du Devis</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as DevisClient['statut'])}
                className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-800"
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYE">Envoyé au client</option>
                <option value="ACCEPTE">Accepté (Bon pour accord)</option>
                <option value="REFUSE">Refusé</option>
                <option value="CONVERTI_DOSSIER">Converti en Dossier</option>
              </select>
            </div>
          </div>

          {/* Section 2: Client & Véhicule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-2">
                <User className="w-4 h-4 text-brand-600" /> Informations du Client
              </h4>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Nom & Prénom / Raison Sociale *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Samir Mansour"
                    value={clientNom}
                    onChange={(e) => setClientNom(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Téléphone (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0661000000"
                    value={clientTelephone}
                    onChange={(e) => setClientTelephone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    CIN (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: EE123456"
                    value={clientCin}
                    onChange={(e) => setClientCin(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white uppercase font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Type de prise en charge
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTypeDemande('PARTICULIER_DIRECT')}
                      className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                        typeDemande === 'PARTICULIER_DIRECT'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      👤 Particulier (Comptant)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeDemande('ASSURANCE')}
                      className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                        typeDemande === 'ASSURANCE'
                          ? 'border-brand-500 bg-brand-50 text-brand-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      🛡️ Prise en charge Assurance
                    </button>
                  </div>
                </div>

                {typeDemande === 'ASSURANCE' && (
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-brand-800 mb-0.5">
                      Compagnie d'assurance pressentie :
                    </label>
                    <select
                      value={compagnieAssurance}
                      onChange={(e) => setCompagnieAssurance(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-brand-300 rounded-lg bg-brand-50/50 font-medium"
                    >
                      <option value="">-- Sélectionner l'assurance --</option>
                      {assurances.map((ass) => (
                        <option key={ass.id} value={ass.nom}>
                          {ass.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Véhicule Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-2">
                <Car className="w-4 h-4 text-brand-600" /> Véhicule Concerné
              </h4>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Marque *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Renault"
                    value={vehiculeMarque}
                    onChange={(e) => setVehiculeMarque(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Modèle *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clio 5"
                    value={vehiculeModele}
                    onChange={(e) => setVehiculeModele(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Année *</label>
                  <input
                    type="number"
                    min={1990}
                    max={2030}
                    required
                    value={vehiculeAnnee}
                    onChange={(e) => setVehiculeAnnee(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Matricule du véhicule (Format Maroc) :
                  </label>
                  <MatriculeMarocInput
                    value={vehiculeImmatriculation}
                    onChange={setVehiculeImmatriculation}
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    N° Châssis (VIN Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: VF1... (17 caractères)"
                    value={vehiculeChassisVin}
                    onChange={(e) => setVehiculeChassisVin(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white uppercase font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Prestations & Articles du Devis (Saisie TTC) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Prestations, Vitrage & Fournitures (Saisie directe en TTC) :
                </h4>
              </div>
              <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
                ✓ Saisie en TTC • Le HT et la TVA (20%) sont calculés automatiquement
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Ajouts rapides :</span>
              <button
                type="button"
                onClick={() => handleAddPrestationRapide('Calibrage Caméra ADAS Pare-brise', 450)}
                className="px-2 py-1 bg-white hover:bg-amber-50 border border-slate-200 rounded text-[11px] text-slate-700 font-medium"
              >
                + Calibrage Caméra ADAS (450 DH TTC)
              </button>
              <button
                type="button"
                onClick={() => handleAddPrestationRapide('Traitement anti-pluie céramique', 200)}
                className="px-2 py-1 bg-white hover:bg-amber-50 border border-slate-200 rounded text-[11px] text-slate-700 font-medium"
              >
                + Anti-pluie céramique (200 DH TTC)
              </button>
              <button
                type="button"
                onClick={() => handleAddPrestationRapide('Déplacement atelier mobile à domicile', 150)}
                className="px-2 py-1 bg-white hover:bg-amber-50 border border-slate-200 rounded text-[11px] text-slate-700 font-medium"
              >
                + Déplacement à domicile (150 DH TTC)
              </button>

              {stockArticles.length > 0 && (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Du stock :</span>
                  <select
                    onChange={(e) => handleSelectFromStock(e.target.value)}
                    className="text-[11px] py-1 px-2 border rounded-lg bg-white"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Choisir vitrage du stock --</option>
                    {stockArticles.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.reference} - {art.designation} ({art.prixVenteHT} DH TTC)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Add Custom Item Row */}
            <div className="grid grid-cols-12 gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/60 items-end">
              <div className="col-span-5">
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Désignation de la pièce ou prestation *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pare-brise athermique capteur"
                  value={newItemDesignation}
                  onChange={(e) => setNewItemDesignation(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-medium"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Réf / Eurocode (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 7295AGS"
                  value={newItemEurocode}
                  onChange={(e) => setNewItemEurocode(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-mono"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Qté</label>
                <input
                  type="number"
                  min={1}
                  value={newItemQte}
                  onChange={(e) => setNewItemQte(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  P.U TTC (DH)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newItemPrixTTC}
                  onChange={(e) => setNewItemPrixTTC(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-right font-mono font-bold"
                />
              </div>

              <div className="col-span-1">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center justify-center shadow-xs"
                  title="Ajouter au devis"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table of items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2 px-3">Désignation</th>
                    <th className="py-2 px-3">Réf / Eurocode</th>
                    <th className="py-2 px-3 text-center">Qté</th>
                    <th className="py-2 px-3 text-right">P.U TTC (DH)</th>
                    <th className="py-2 px-3 text-right">Total TTC (DH)</th>
                    <th className="py-2 px-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lignesTTC.map((line) => (
                    <tr key={line.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{line.designation}</td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                        {line.codeEurocode || '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{line.quantite}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {formatDH(line.prixTTC)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatDH(line.prixTTC * line.quantite)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux Card */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Décomposition Comptable Officielle (TVA 20%)
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  HT: {formatDH(totalHT)} • TVA (20%): {formatDH(totalTVA)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-amber-400 font-bold block">
                  Total Devis Net TTC
                </span>
                <span className="text-xl font-black font-mono text-amber-400">
                  {formatDH(totalTTC)}
                </span>
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Observations & Remarques (affichées sur le document imprimé)
            </label>
            <input
              type="text"
              placeholder="Ex: Garantie étanchéité 1 an incluse. Pose effectuée dans notre atelier."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-semibold text-slate-700 text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {initialDevis ? 'Mettre à jour le Devis' : 'Enregistrer le Devis Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
