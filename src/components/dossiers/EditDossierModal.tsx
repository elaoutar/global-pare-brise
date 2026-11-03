'use client';

import React, { useState } from 'react';
import { DossierSinistre, Assurance, Partenaire, StatutDossier } from '@/types';
import { MatriculeMarocInput } from '@/components/ui/MatriculeMarocInput';
import { 
  Pencil, 
  X, 
  Check, 
  User, 
  Car, 
  Shield, 
  MapPin, 
  Calendar, 
  FileText, 
  DollarSign, 
  Wrench, 
  Save 
} from 'lucide-react';
import { formatDH } from '@/lib/utils';

interface Props {
  dossier: DossierSinistre;
  assurances: Assurance[];
  partenaires: Partenaire[];
  onClose: () => void;
  onSave: (updatedDossier: DossierSinistre) => void;
}

export const EditDossierModal: React.FC<Props> = ({
  dossier,
  assurances,
  partenaires,
  onClose,
  onSave,
}) => {
  // Client Info
  const [clientNom, setClientNom] = useState(dossier.client.nom);
  const [clientTel, setClientTel] = useState(dossier.client.telephone);
  const [clientCin, setClientCin] = useState(dossier.client.cin || '');
  const [clientVille, setClientVille] = useState(dossier.client.ville || 'Marrakech');

  // Véhicule Info
  const [vehiculeMarque, setVehiculeMarque] = useState(dossier.vehicule.marque);
  const [vehiculeModele, setVehiculeModele] = useState(dossier.vehicule.modele);
  const [vehiculeAnnee, setVehiculeAnnee] = useState(dossier.vehicule.annee);
  const [vehiculeImm, setVehiculeImm] = useState(dossier.vehicule.immatriculation);
  const [vehiculeVin, setVehiculeVin] = useState(dossier.vehicule.chassisVin || '');

  // Assurance Info (si dossier ASSURANCE)
  const isAssurance = dossier.typeDossier === 'ASSURANCE';
  const [selectedAssuranceId, setSelectedAssuranceId] = useState(dossier.assurance?.id || (assurances[0]?.id || ''));
  const [agenceAssurance, setAgenceAssurance] = useState(dossier.agenceAssurance || '');
  const [numeroSinistre, setNumeroSinistre] = useState(dossier.numeroSinistre || '');
  const [numeroPolice, setNumeroPolice] = useState(dossier.numeroPolice || '');
  const [dateSinistre, setDateSinistre] = useState(dossier.dateSinistre || '');
  const [referenceAzur, setReferenceAzur] = useState(dossier.referenceDossierAzurGlass || '');
  const [typeClientAssurance, setTypeClientAssurance] = useState(dossier.typeClientAssurance || 'PARTICULIER');

  // Financier
  const [montantTotalTTC, setMontantTotalTTC] = useState<number>(dossier.montantTotalTTC || 0);
  const [montantFranchise, setMontantFranchise] = useState<number>(dossier.montantFranchise || 0);
  const [franchiseOfferte, setFranchiseOfferte] = useState<boolean>(Boolean(dossier.franchiseOfferte));
  const [tvaExclueParAssurance, setTvaExclueParAssurance] = useState<number>(dossier.tvaExclueParAssurance || 0);
  const [commission, setCommission] = useState<number>(dossier.commission || 0);

  // Technique & Pose
  const [poseur, setPoseur] = useState(dossier.poseur || 'Poseur Atelier');
  const [observations, setObservations] = useState(dossier.observations || '');
  const [statut, setStatut] = useState<StatutDossier>(dossier.statut);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedAssurance = assurances.find((a) => a.id === selectedAssuranceId) || dossier.assurance;

    // Recalcul net reversement AZUR GLASS
    const effectiveFranchise = franchiseOfferte ? 0 : Number(montantFranchise);
    const effectiveTvaExclue = (typeClientAssurance === 'PROFESSIONNEL' || typeClientAssurance === 'AGENCE_LOCATION')
      ? Number(tvaExclueParAssurance)
      : 0;
    const netReversement = isAssurance
      ? Math.max(0, +(Number(montantTotalTTC) - effectiveFranchise - effectiveTvaExclue).toFixed(2))
      : 0;

    const updated: DossierSinistre = {
      ...dossier,
      client: {
        ...dossier.client,
        nom: clientNom.trim(),
        telephone: clientTel.trim(),
        cin: clientCin.trim(),
        ville: clientVille.trim(),
      },
      vehicule: {
        ...dossier.vehicule,
        marque: vehiculeMarque.trim(),
        modele: vehiculeModele.trim(),
        annee: Number(vehiculeAnnee),
        immatriculation: vehiculeImm.trim(),
        chassisVin: vehiculeVin.trim(),
      },
      assurance: isAssurance ? selectedAssurance : undefined,
      agenceAssurance: isAssurance ? agenceAssurance.trim() : undefined,
      numeroSinistre: isAssurance ? numeroSinistre.trim() : undefined,
      numeroPolice: isAssurance ? numeroPolice.trim() : undefined,
      dateSinistre: isAssurance ? dateSinistre : undefined,
      referenceDossierAzurGlass: isAssurance ? referenceAzur.trim() : undefined,
      typeClientAssurance: isAssurance ? typeClientAssurance : undefined,
      montantTotalTTC: Number(montantTotalTTC),
      montantPriseEnChargeAssurance: isAssurance ? Number(montantTotalTTC) : 0,
      montantFranchise: Number(montantFranchise),
      franchiseOfferte,
      franchisePayeeParClient: !franchiseOfferte && Number(montantFranchise) > 0,
      tvaExclueParAssurance: effectiveTvaExclue,
      montantReversementAzurGlass: netReversement,
      commission: Number(commission) || 0,
      poseur: poseur.trim(),
      observations: observations.trim(),
      statut,
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-slate-900 text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                Modifier le Dossier <span className="text-emerald-400 font-mono">{dossier.numeroDossier}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Mise à jour des informations client, véhicule, assurance et prestations
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
          
          {/* Section 1: Client */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Coordonnées du Client</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nom & Prénom / Société *
                </label>
                <input
                  type="text"
                  required
                  value={clientNom}
                  onChange={(e) => setClientNom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Téléphone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={clientTel}
                  onChange={(e) => setClientTel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  CIN / N° Identité
                </label>
                <input
                  type="text"
                  value={clientCin}
                  onChange={(e) => setClientCin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ville / Agence
                </label>
                <input
                  type="text"
                  value={clientVille}
                  onChange={(e) => setClientVille(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Véhicule */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <Car className="w-4 h-4 text-emerald-600" />
              <span>Véhicule & Immatriculation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Marque *
                </label>
                <input
                  type="text"
                  required
                  value={vehiculeMarque}
                  onChange={(e) => setVehiculeMarque(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Modèle *
                </label>
                <input
                  type="text"
                  required
                  value={vehiculeModele}
                  onChange={(e) => setVehiculeModele(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Année *
                </label>
                <input
                  type="number"
                  min={1990}
                  max={2030}
                  required
                  value={vehiculeAnnee}
                  onChange={(e) => setVehiculeAnnee(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Immatriculation (Format Maroc) *
                </label>
                <MatriculeMarocInput
                  value={vehiculeImm}
                  onChange={setVehiculeImm}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  N° Châssis (VIN)
                </label>
                <input
                  type="text"
                  placeholder="Ex: VF1BB0A0F..."
                  value={vehiculeVin}
                  onChange={(e) => setVehiculeVin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Assurance (si dossier ASSURANCE) */}
          {isAssurance && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Assurance & Déclaration Sinistre</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Compagnie d'Assurance
                  </label>
                  <select
                    value={selectedAssuranceId}
                    onChange={(e) => setSelectedAssuranceId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {assurances.map((ass) => (
                      <option key={ass.id} value={ass.id}>
                        {ass.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Agence Locale
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Agence Guéliz"
                    value={agenceAssurance}
                    onChange={(e) => setAgenceAssurance(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Type Client Assurance
                  </label>
                  <select
                    value={typeClientAssurance}
                    onChange={(e) => setTypeClientAssurance(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="PARTICULIER">Particulier (TVA couverte)</option>
                    <option value="PROFESSIONNEL">Professionnel (TVA exclue)</option>
                    <option value="AGENCE_LOCATION">Agence de Location (TVA exclue)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    N° Sinistre
                  </label>
                  <input
                    type="text"
                    value={numeroSinistre}
                    onChange={(e) => setNumeroSinistre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    N° Police d'Assurance
                  </label>
                  <input
                    type="text"
                    value={numeroPolice}
                    onChange={(e) => setNumeroPolice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Réf AZUR GLASS
                  </label>
                  <input
                    type="text"
                    value={referenceAzur}
                    onChange={(e) => setReferenceAzur(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Montants & Franchise */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Montants & Tarification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Montant Total TTC (DH) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={montantTotalTTC}
                  onChange={(e) => setMontantTotalTTC(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {isAssurance && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Franchise Client (DH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={montantFranchise}
                      onChange={(e) => setMontantFranchise(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <label className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={franchiseOfferte}
                        onChange={(e) => setFranchiseOfferte(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Franchise offerte par le garage</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      TVA Exclue (Sociétés) (DH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tvaExclueParAssurance}
                      onChange={(e) => setTvaExclueParAssurance(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Commission Intermédiaire (DH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={commission}
                      onChange={(e) => setCommission(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 5: Poseur & Observations */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <Wrench className="w-4 h-4 text-emerald-600" />
              <span>Poseur, Statut & Observations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Poseur Affecté
                </label>
                <input
                  type="text"
                  value={poseur}
                  onChange={(e) => setPoseur(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Statut du Dossier
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutDossier)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="NOUVEAU">Nouveau dossier</option>
                  <option value="EN_COURS_POSE">En cours de pose</option>
                  <option value="POSE_TERMINEE">Pose terminée</option>
                  <option value="ENVOYE_AZUR_GLASS">Envoyé à AZUR GLASS</option>
                  <option value="ACCORD_RECUE_AZUR_GLASS">Accord reçu (AZUR GLASS)</option>
                  <option value="EN_ATTENTE_REGLEMENT_AZUR">En attente reversement AZUR GLASS</option>
                  <option value="VALIDE_REGLE">Soldé & Réglé par AZUR GLASS</option>
                  <option value="REJETE">Rejeté / Litige</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Observations / Remarques
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Notes internes sur la pose, particularités vitrage..."
                  className="w-full px-3 py-2 border rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

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
              <Save className="w-4 h-4" /> Enregistrer les Modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
