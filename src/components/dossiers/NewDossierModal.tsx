'use client';

import React, { useState } from 'react';
import { 
  Assurance, 
  Partenaire, 
  ArticleStock, 
  DossierSinistre, 
  BonSortie, 
  BonLivraison,
  Facture,
  LigneFacture,
  TypeDossier,
  ReglementRecette,
  ModePaiement
} from '@/types';
import { 
  X, 
  Shield, 
  Car, 
  User, 
  Wrench, 
  Camera, 
  Check, 
  UserCheck, 
  ShieldAlert, 
  Coins, 
  CreditCard, 
  Building2, 
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Calculator,
  Sparkles
} from 'lucide-react';
import { MatriculeMarocInput } from '@/components/ui/MatriculeMarocInput';
import { formatDH } from '@/lib/utils';
import { LISTE_MARQUES_MAROC, getModelesPourMarque } from '@/lib/vehiculesMaroc';

interface Props {
  assurances: Assurance[];
  partenaires: Partenaire[];
  stockArticles: ArticleStock[];
  onClose: () => void;
  onSubmit: (newDossier: DossierSinistre, newBonSortie?: BonSortie, newFacture?: Facture, newRecette?: ReglementRecette) => void;
}

const PRESTATIONS_RAPIDES = [
  { designation: 'Calibrage Caméra Pare-brise (ADAS)', prixHT: 350 },
  { designation: 'Déplacement & Pose à Domicile / Sur Site', prixHT: 120 },
  { designation: 'Joint de finition profilé supérieur neuf', prixHT: 80 },
  { designation: 'Rénovation optiques de phares (la paire)', prixHT: 150 },
  { designation: 'Traitement Anti-Pluie & Déperlant Vitres', prixHT: 90 },
];

export const NewDossierModal: React.FC<Props> = ({
  assurances,
  partenaires,
  stockArticles,
  onClose,
  onSubmit,
}) => {
  // Step indicator & Option B Validation Error
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Type Dossier : Assurance vs Particulier Comptant
  const [typeDossier, setTypeDossier] = useState<TypeDossier>('ASSURANCE');

  // Form State
  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [clientCin, setClientCin] = useState('');
  const [clientVille, setClientVille] = useState('Marrakech');

  const [vehiculeImm, setVehiculeImm] = useState('');
  const [vehiculeMarque, setVehiculeMarque] = useState('Dacia');
  const [vehiculeModele, setVehiculeModele] = useState('Logan');
  const [vehiculeAnnee, setVehiculeAnnee] = useState(2022);
  const [vehiculeVin, setVehiculeVin] = useState('');

  // Marque et Modèle sélectionnables ou saisie libre
  const [isCustomMarque, setIsCustomMarque] = useState(false);
  const [isCustomModele, setIsCustomModele] = useState(false);

  const handleSelectMarque = (m: string) => {
    if (m === '__AUTRE__') {
      setIsCustomMarque(true);
      setVehiculeMarque('');
      setIsCustomModele(true);
      setVehiculeModele('');
    } else {
      setIsCustomMarque(false);
      setVehiculeMarque(m);
      if (stepError) setStepError(null);
      const models = getModelesPourMarque(m);
      if (models.length > 0) {
        setIsCustomModele(false);
        setVehiculeModele(models[0]);
      } else {
        setIsCustomModele(true);
        setVehiculeModele('');
      }
    }
  };

  const handleSelectModele = (m: string) => {
    if (m === '__AUTRE__') {
      setIsCustomModele(true);
      setVehiculeModele('');
    } else {
      setIsCustomModele(false);
      setVehiculeModele(m);
      if (stepError) setStepError(null);
    }
  };

  const [assuranceId, setAssuranceId] = useState(assurances[0]?.id || '');
  const [partenaireId, setPartenaireId] = useState('');
  const [numSinistre, setNumSinistre] = useState('');
  const [numPolice, setNumPolice] = useState('');
  const [dateSinistre, setDateSinistre] = useState(new Date().toISOString().split('T')[0]);

  // Financials & Prestations HT (Entièrement Modifiables)
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [modeVitrage, setModeVitrage] = useState<'STOCK' | 'SUR_COMMANDE'>('SUR_COMMANDE');
  const [customVitrageDesignation, setCustomVitrageDesignation] = useState('');
  const [customEurocode, setCustomEurocode] = useState('');
  
  // Prestations unit prices (DH HT)
  const [prixVitrageHT, setPrixVitrageHT] = useState<number>(1250);
  const [prixColleHT, setPrixColleHT] = useState<number>(150);
  const [prixMainOeuvreHT, setPrixMainOeuvreHT] = useState<number>(100);
  const [lignesPrestationsExtra, setLignesPrestationsExtra] = useState<
    { id: string; designation: string; prixHT: number }[]
  >([]);
  const [customPrestationNom, setCustomPrestationNom] = useState('');
  const [customPrestationPrix, setCustomPrestationPrix] = useState<number>(150);
  const [showAddCustomPrestation, setShowAddCustomPrestation] = useState(false);

  const [prixTotalTTC, setPrixTotalTTC] = useState(1800);
  const [montantFranchise, setMontantFranchise] = useState(200);
  const [franchiseOfferte, setFranchiseOfferte] = useState(true);
  const [poseurNom, setPoseurNom] = useState('Karim Bennani (Atelier)');

  // Retail Payment options at file creation
  const [reglementImmediat, setReglementImmediat] = useState(true);
  const [modePaiementClient, setModePaiementClient] = useState<ModePaiement>('ESPECES');
  const [banqueClient, setBanqueClient] = useState('Attijariwafa Bank');
  const [refPaiementClient, setRefPaiementClient] = useState('');
  const [echeancePaiementClient, setEcheancePaiementClient] = useState(new Date().toISOString().split('T')[0]);

  // Sample Photos
  const [photoAvant, setPhotoAvant] = useState('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80');
  const [photoCarteGrise, setPhotoCarteGrise] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80');

  // Dynamic Financials Calculations
  const extraPrestationsTotalHT = lignesPrestationsExtra.reduce((sum, item) => sum + (Number(item.prixHT) || 0), 0);
  const dynamicTotalHT = +(Number(prixVitrageHT) + Number(prixColleHT) + Number(prixMainOeuvreHT) + extraPrestationsTotalHT).toFixed(2);
  const dynamicTotalTVA = +(dynamicTotalHT * 0.20).toFixed(2);
  const dynamicTotalTTC = +(dynamicTotalHT + dynamicTotalTVA).toFixed(2);

  const handleArticleChange = (artId: string) => {
    setSelectedArticleId(artId);
    const art = stockArticles.find((a) => a.id === artId);
    if (art) {
      setPrixVitrageHT(art.prixVenteHT);
      const newTotalHT = art.prixVenteHT + prixColleHT + prixMainOeuvreHT + extraPrestationsTotalHT;
      setPrixTotalTTC(Math.round(newTotalHT * 1.2));
    }
  };

  const handleAddPresetPrestation = (preset: { designation: string; prixHT: number }) => {
    setLignesPrestationsExtra((prev) => [
      ...prev,
      { id: `ext-${Date.now()}-${Math.random()}`, designation: preset.designation, prixHT: preset.prixHT },
    ]);
  };

  const handleRemoveExtraPrestation = (id: string) => {
    setLignesPrestationsExtra((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddCustomPrestation = () => {
    if (!customPrestationNom.trim()) return;
    setLignesPrestationsExtra((prev) => [
      ...prev,
      { id: `ext-${Date.now()}`, designation: customPrestationNom.trim(), prixHT: Number(customPrestationPrix) || 0 },
    ]);
    setCustomPrestationNom('');
    setShowAddCustomPrestation(false);
  };

  // Option B Validation Rules
  const validateStep1 = (): boolean => {
    if (!clientNom.trim()) {
      setStepError('Veuillez renseigner le nom complet ou la société du client.');
      return false;
    }
    if (!clientTel.trim()) {
      setStepError('Veuillez renseigner le numéro de téléphone du client.');
      return false;
    }
    if (!vehiculeImm.trim()) {
      setStepError('Veuillez renseigner le matricule / immatriculation du véhicule.');
      return false;
    }
    if (!vehiculeMarque.trim()) {
      setStepError('Veuillez renseigner la marque du véhicule (ex: Dacia, Renault, Peugeot).');
      return false;
    }
    if (!vehiculeModele.trim()) {
      setStepError('Veuillez renseigner le modèle du véhicule (ex: Logan, Clio, Golf).');
      return false;
    }
    setStepError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!validateStep1()) return false;

    if (typeDossier === 'ASSURANCE') {
      if (!numSinistre.trim()) {
        setStepError('Veuillez renseigner le numéro de sinistre communiqué par l\'assurance.');
        return false;
      }
    } else {
      if (dynamicTotalTTC <= 0 && prixTotalTTC <= 0) {
        setStepError('Veuillez définir un montant valide pour la prestation.');
        return false;
      }
      if (reglementImmediat && (modePaiementClient === 'CHEQUE' || modePaiementClient === 'EFFET')) {
        if (!refPaiementClient.trim()) {
          setStepError(`Veuillez renseigner le numéro de ${modePaiementClient === 'CHEQUE' ? 'chèque' : 'traite/effet'}.`);
          return false;
        }
      }
    }
    setStepError(null);
    return true;
  };

  const goToStep = (targetStep: 1 | 2 | 3) => {
    if (targetStep === 1) {
      setStepError(null);
      setStep(1);
    } else if (targetStep === 2) {
      if (validateStep1()) {
        setStepError(null);
        setStep(2);
      }
    } else if (targetStep === 3) {
      if (validateStep1() && validateStep2()) {
        setStepError(null);
        setStep(3);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    const selectedAssurance = assurances.find((a) => a.id === assuranceId) || assurances[0];
    const selectedPartenaire = partenaires.find((p) => p.id === partenaireId);
    const selectedArticle = modeVitrage === 'STOCK' ? stockArticles.find((a) => a.id === selectedArticleId) : undefined;

    const dossierId = `dos-${Date.now()}`;
    const dateNow = new Date().toISOString().split('T')[0];
    const seq = Math.floor(1000 + Math.random() * 9000);
    const numDossier = `DOS-2026-${seq}`;

    // Determine the exact designation of the glass tailored to the vehicle
    const fallbackDesignation = `Pare-Brise conforme ${vehiculeMarque || 'Véhicule'} ${vehiculeModele || ''} (${vehiculeAnnee})`.trim();
    const finalDesignation = selectedArticle
      ? selectedArticle.designation
      : (customVitrageDesignation.trim() || fallbackDesignation);

    const finalEurocode = selectedArticle?.codeEurocode || (customEurocode.trim() || undefined);
    const finalRef = selectedArticle
      ? selectedArticle.reference
      : (customEurocode.trim() || `PB-${(vehiculeMarque || 'VEH').slice(0, 3).toUpperCase()}-${(vehiculeModele || '01').slice(0, 3).toUpperCase()}`);

    // Auto-create Bon de Sortie ALWAYS tailored to this vehicle
    const bsId = `bs-${Date.now()}`;
    const bonSortie: BonSortie = {
      id: bsId,
      numeroBS: `BS-2026-${seq}`,
      dossierId: dossierId,
      dateSortie: dateNow,
      poseur: poseurNom,
      lignes: [
        {
          articleId: selectedArticle ? selectedArticle.id : `art-auto-${dossierId}`,
          reference: finalRef,
          designation: finalDesignation,
          quantite: 1,
        },
        {
          articleId: 'art-6',
          reference: 'COLLE-SIKA-DRIVE',
          designation: 'Cartouche Mastic Polyuréthane SikaTack Drive (300ml)',
          quantite: 1,
        },
      ],
      notes: `Affecté au véhicule ${vehiculeMarque} ${vehiculeModele} (${vehiculeImm})`,
    };

    const isAssurance = typeDossier === 'ASSURANCE';

    // Construire toutes les lignes de facturation avec les tarifs modifiés en direct
    const extraLines: LigneFacture[] = lignesPrestationsExtra.map((extra) => ({
      designation: extra.designation,
      quantite: 1,
      prixUnitaireHT: Number(extra.prixHT) || 0,
      tauxTva: 20,
      totalHT: Number(extra.prixHT) || 0,
    }));

    const finalLignes: LigneFacture[] = [
      {
        designation: finalDesignation,
        codeEurocode: finalEurocode,
        quantite: 1,
        prixUnitaireHT: Number(prixVitrageHT) || 0,
        tauxTva: 20,
        totalHT: Number(prixVitrageHT) || 0,
      },
      {
        designation: 'Kit colle polyuréthane & primaire d\'adhérence certifié',
        quantite: 1,
        prixUnitaireHT: Number(prixColleHT) || 0,
        tauxTva: 20,
        totalHT: Number(prixColleHT) || 0,
      },
      {
        designation: 'Main d\'œuvre pose et dépose vitrage collé',
        quantite: 1,
        prixUnitaireHT: Number(prixMainOeuvreHT) || 0,
        tauxTva: 20,
        totalHT: Number(prixMainOeuvreHT) || 0,
      },
      ...extraLines,
    ];

    const computedTotalHT = +finalLignes.reduce((sum, l) => sum + l.totalHT, 0).toFixed(2);
    const computedTotalTVA = +(computedTotalHT * 0.20).toFixed(2);
    const computedTotalTTC = +(computedTotalHT + computedTotalTVA).toFixed(2);

    // Auto-create Facture (Assurance ou Client direct)
    const facId = `fac-${Date.now()}`;
    const factureGeneree: Facture = {
      id: facId,
      numeroFacture: `FA-2026-${seq}`,
      dossierId: dossierId,
      destinataire: isAssurance ? 'ASSURANCE' : 'CLIENT',
      dateEmission: dateNow,
      dateEcheance: isAssurance 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : dateNow,
      lignes: finalLignes,
      totalHT: computedTotalHT,
      totalTVA: computedTotalTVA,
      totalTTC: computedTotalTTC,
      montantRegle: 0,
      statutPaiement: 'EN_ATTENTE',
    };

    let newRecette: ReglementRecette | undefined = undefined;
    if (typeDossier === 'PARTICULIER_COMPTANT' && reglementImmediat) {
      factureGeneree.statutPaiement = 'REGLE';
      factureGeneree.montantRegle = computedTotalTTC;
      factureGeneree.datePaiement = dateNow;
      factureGeneree.referencePaiement = `${modePaiementClient} ${refPaiementClient || ''}`.trim();

      newRecette = {
        id: `rec-${Date.now()}`,
        numeroRecu: `REC-2026-${seq}`,
        dossierId: dossierId,
        factureId: facId,
        payeurNom: clientNom || 'Client Comptoir',
        sourceType: 'CLIENT',
        modePaiement: modePaiementClient,
        montant: computedTotalTTC,
        datePaiement: dateNow,
        banque: modePaiementClient !== 'ESPECES' ? banqueClient : undefined,
        referenceDocument: refPaiementClient || undefined,
        dateEcheance: (modePaiementClient === 'CHEQUE' || modePaiementClient === 'EFFET') ? echeancePaiementClient : undefined,
        statut: (modePaiementClient === 'ESPECES' || modePaiementClient === 'VIREMENT') ? 'ENCAISSE' : 'EN_ATTENTE_ECHEANCE',
        dateEncaissementEffectif: (modePaiementClient === 'ESPECES' || modePaiementClient === 'VIREMENT') ? dateNow : undefined,
        notes: `Règlement comptoir dossier particulier ${numDossier}`,
      };
    }

    const newDossier: DossierSinistre = {
      id: dossierId,
      numeroDossier: numDossier,
      typeDossier,
      dateCreation: dateNow,
      client: {
        id: `cli-${Date.now()}`,
        nom: clientNom,
        telephone: clientTel,
        cin: clientCin,
        ville: clientVille,
      },
      vehicule: {
        id: `veh-${Date.now()}`,
        clientId: `cli-${Date.now()}`,
        immatriculation: vehiculeImm,
        marque: vehiculeMarque,
        modele: vehiculeModele,
        annee: vehiculeAnnee,
        chassisVin: vehiculeVin,
      },
      assurance: isAssurance ? selectedAssurance : undefined,
      partenaire: selectedPartenaire,
      numeroSinistre: isAssurance ? (numSinistre || `SIN-${selectedAssurance.code}-${seq}`) : undefined,
      numeroPolice: isAssurance ? (numPolice || `POL-${seq}`) : undefined,
      dateSinistre: isAssurance ? dateSinistre : undefined,
      montantTotalTTC: computedTotalTTC,
      montantPriseEnChargeAssurance: isAssurance ? (franchiseOfferte ? computedTotalTTC : Math.max(0, computedTotalTTC - montantFranchise)) : 0,
      montantFranchise: isAssurance ? montantFranchise : 0,
      franchisePayeeParClient: isAssurance && !franchiseOfferte && montantFranchise > 0,
      franchiseOfferte: isAssurance ? franchiseOfferte : false,
      statut: (typeDossier === 'PARTICULIER_COMPTANT' && reglementImmediat) ? 'VALIDE_REGLE' : 'EN_COURS_POSE',
      photos: {
        avantSinistreUrl: photoAvant,
        carteGriseUrl: photoCarteGrise,
      },
      bonSortieId: bonSortie ? bsId : undefined,
      factureAssuranceId: isAssurance ? facId : undefined,
      factureClientId: !isAssurance ? facId : undefined,
      poseur: poseurNom,
    };

    onSubmit(newDossier, bonSortie, factureGeneree, newRecette);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        {/* Header (Sticky at top of modal) */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-sm sm:text-base">Nouveau Dossier Pare-Brise & Sinistre</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs with Option B Validation Guards */}
        <div className="sticky top-[52px] sm:top-[56px] z-20 flex border-b border-slate-200 bg-slate-50 px-3 sm:px-6 py-2 text-xs font-medium shadow-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => goToStep(1)}
            className={`flex items-center gap-2 py-1 px-3 rounded-md transition-colors ${
              step === 1 ? 'bg-white text-brand-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" /> 1. Client & Véhicule
          </button>
          <button
            type="button"
            onClick={() => goToStep(2)}
            className={`flex items-center gap-2 py-1 px-3 rounded-md transition-colors ${
              step === 2 ? 'bg-white text-brand-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> 2. {typeDossier === 'ASSURANCE' ? 'Assurance & Sinistre' : 'Règlement Direct'}
          </button>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className={`flex items-center gap-2 py-1 px-3 rounded-md transition-colors ${
              step === 3 ? 'bg-white text-brand-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> 3. Pièces, Prestations & Pose
          </button>
        </div>

        {/* Option B Validation Error Banner */}
        {stepError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="font-semibold">{stepError}</span>
            </div>
            <button
              type="button"
              onClick={() => setStepError(null)}
              className="text-red-500 hover:text-red-700 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 text-sm">
          {/* STEP 1: Client & Véhicule */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Type de dossier : Assurance vs Particulier */}
              <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTypeDossier('ASSURANCE')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    typeDossier === 'ASSURANCE'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4" /> Dossier Assurance (Tiers-Payant)
                </button>
                <button
                  type="button"
                  onClick={() => setTypeDossier('PARTICULIER_COMPTANT')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    typeDossier === 'PARTICULIER_COMPTANT'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" /> Client Particulier (Sans Assurance)
                </button>
              </div>

              {typeDossier === 'ASSURANCE' ? (
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 flex-shrink-0 text-blue-700" />
                  <span>Dossier sous convention assurance : prise en charge et quittance subrogative.</span>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                  <User className="w-4 h-4 flex-shrink-0 text-amber-700" />
                  <span>Client particulier sans bris de glace : règlement direct atelier (sans passer par l'assurance).</span>
                </div>
              )}

              {/* 3 Emplacements d'immatriculation marocaine */}
              <div className={`bg-white p-3.5 rounded-xl border shadow-sm ${!vehiculeImm.trim() && stepError ? 'border-red-400 bg-red-50/20' : 'border-slate-200'}`}>
                <MatriculeMarocInput
                  value={vehiculeImm}
                  onChange={(val) => {
                    setVehiculeImm(val);
                    if (stepError) setStepError(null);
                  }}
                  required={true}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom & Prénom / Société du client *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mohamed Tazi"
                  value={clientNom}
                  onChange={(e) => {
                    setClientNom(e.target.value);
                    if (stepError) setStepError(null);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                    !clientNom.trim() && stepError ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400' : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="06 61 00 00 00"
                    value={clientTel}
                    onChange={(e) => {
                      setClientTel(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                      !clientTel.trim() && stepError ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400' : 'border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CIN / ICE</label>
                  <input
                    type="text"
                    placeholder="Ex: BJ123456"
                    value={clientCin}
                    onChange={(e) => setClientCin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={clientVille}
                    onChange={(e) => setClientVille(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                {/* 1. Marque */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Marque *</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomMarque(!isCustomMarque)}
                      className="text-[10px] text-brand-600 hover:text-brand-800 font-semibold"
                    >
                      {isCustomMarque ? '← Choisir liste' : '✏️ Autre marque'}
                    </button>
                  </div>

                  {isCustomMarque ? (
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dacia, Tesla, Jeep"
                      value={vehiculeMarque}
                      onChange={(e) => {
                        setVehiculeMarque(e.target.value);
                        if (stepError) setStepError(null);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                        !vehiculeMarque.trim() && stepError ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400' : 'border-slate-300'
                      }`}
                    />
                  ) : (
                    <select
                      value={LISTE_MARQUES_MAROC.includes(vehiculeMarque) ? vehiculeMarque : (vehiculeMarque ? '__AUTRE__' : '')}
                      onChange={(e) => handleSelectMarque(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white ${
                        !vehiculeMarque.trim() && stepError ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Sélectionner une marque...</option>
                      {LISTE_MARQUES_MAROC.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="__AUTRE__">➕ Autre marque (saisie libre)...</option>
                    </select>
                  )}
                </div>

                {/* 2. Modèle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Modèle *</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomModele(!isCustomModele)}
                      className="text-[10px] text-brand-600 hover:text-brand-800 font-semibold"
                    >
                      {isCustomModele ? '← Choisir liste' : '✏️ Autre modèle'}
                    </button>
                  </div>

                  {isCustomModele || !vehiculeMarque || getModelesPourMarque(vehiculeMarque).length === 0 ? (
                    <input
                      type="text"
                      required
                      placeholder="Ex: Logan, Clio, Golf"
                      value={vehiculeModele}
                      onChange={(e) => {
                        setVehiculeModele(e.target.value);
                        if (stepError) setStepError(null);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                        !vehiculeModele.trim() && stepError ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400' : 'border-slate-300'
                      }`}
                    />
                  ) : (
                    <select
                      value={getModelesPourMarque(vehiculeMarque).includes(vehiculeModele) ? vehiculeModele : (vehiculeModele ? '__AUTRE__' : '')}
                      onChange={(e) => handleSelectModele(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white ${
                        !vehiculeModele.trim() && stepError ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Sélectionner un modèle...</option>
                      {getModelesPourMarque(vehiculeMarque).map((mod) => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                      <option value="__AUTRE__">➕ Autre modèle (saisie libre)...</option>
                    </select>
                  )}
                </div>

                {/* 3. Année */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Année</label>
                  <input
                    type="number"
                    min="1990"
                    max="2027"
                    value={vehiculeAnnee}
                    onChange={(e) => setVehiculeAnnee(+e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">N° Châssis (VIN)</label>
                <input
                  type="text"
                  placeholder="Ex: VF1... (17 caractères)"
                  value={vehiculeVin}
                  onChange={(e) => setVehiculeVin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  Suivant : {typeDossier === 'ASSURANCE' ? 'Assurance & Sinistre' : 'Règlement Direct'} →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Assurance & Sinistre OU Facturation Directe */}
          {step === 2 && (
            <div className="space-y-4">
              {typeDossier === 'PARTICULIER_COMPTANT' ? (
                /* SECTION PARTICULIER COMPTANT */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950">
                      <User className="w-4 h-4 text-amber-700" /> Prestation Directe Sans Assurance
                    </p>
                    <p className="text-slate-600">
                      Le client ne possède pas d'option bris de glace ou préfère régler seul.
                      Aucun numéro de sinistre ni accord d'assurance n'est requis.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Apporteur / Partenaire (Optionnel)
                    </label>
                    <select
                      value={partenaireId}
                      onChange={(e) => setPartenaireId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">Aucun (Client comptoir direct)</option>
                      {partenaires.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom} ({p.tauxCommissionPourcent}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Montant Total TTC Convenu avec le Client (DH) *
                    </label>
                    <input
                      type="number"
                      required
                      value={prixTotalTTC}
                      onChange={(e) => setPrixTotalTTC(+e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-base font-mono font-black text-brand-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Montant net à encaisser auprès du client (inclut la TVA 20%).
                    </p>
                  </div>

                  {/* Mode de règlement & Modalité de Paiement */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" /> Mode & Échéance de Règlement
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={reglementImmediat}
                          onChange={(e) => setReglementImmediat(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          Régler immédiatement (Au comptoir)
                        </span>
                      </label>
                    </div>

                    {reglementImmediat ? (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        {/* 4 Moroccan payment options */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'ESPECES', label: 'Espèces', icon: Coins },
                            { id: 'CHEQUE', label: 'Chèque', icon: FileText },
                            { id: 'VIREMENT', label: 'Virement', icon: Building2 },
                            { id: 'EFFET', label: 'Effet / Traite', icon: CreditCard },
                          ].map((item) => {
                            const isSelected = modePaiementClient === item.id;
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setModePaiementClient(item.id as ModePaiement)}
                                className={`p-2.5 rounded-lg border text-center transition-all ${
                                  isSelected
                                    ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold shadow-sm ring-1 ring-brand-600'
                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Icon className="w-4 h-4 mx-auto mb-1" />
                                <span className="block text-[11px] leading-tight">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Mode specifics */}
                        {modePaiementClient === 'ESPECES' && (
                          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] flex items-center gap-2 border border-emerald-200">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>Paiement en espèces au comptoir de {prixTotalTTC} DH TTC. La facture sera marquée réglée et la recette enregistrée en caisse.</span>
                          </div>
                        )}

                        {(modePaiementClient === 'CHEQUE' || modePaiementClient === 'EFFET') && (
                          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                {modePaiementClient === 'CHEQUE' ? 'N° Chèque *' : 'N° Effet/Traite *'}
                              </label>
                              <input
                                type="text"
                                placeholder={modePaiementClient === 'CHEQUE' ? 'Ex: CHQ-8827361' : 'Ex: EFF-2026-01'}
                                value={refPaiementClient}
                                onChange={(e) => setRefPaiementClient(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-brand-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Banque émettrice</label>
                              <select
                                value={banqueClient}
                                onChange={(e) => setBanqueClient(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                              >
                                {[
                                  'Attijariwafa Bank',
                                  'Banque Populaire (BCP)',
                                  'Bank of Africa (BMCE)',
                                  'CIH Bank',
                                  'Société Générale Maroc',
                                  'Crédit Agricole du Maroc',
                                  'BMCI (BNP Paribas)',
                                  'CFG Bank',
                                  'Al Barid Bank',
                                  'Autre Banque',
                                ].map((b) => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date d'échéance</label>
                              <input
                                type="date"
                                value={echeancePaiementClient}
                                onChange={(e) => setEcheancePaiementClient(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-brand-500 font-mono"
                              />
                            </div>
                          </div>
                        )}

                        {modePaiementClient === 'VIREMENT' && (
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Réf / N° Virement</label>
                              <input
                                type="text"
                                placeholder="Ex: VIR-WAF-998822"
                                value={refPaiementClient}
                                onChange={(e) => setRefPaiementClient(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-brand-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Banque Réceptrice</label>
                              <select
                                value={banqueClient}
                                onChange={(e) => setBanqueClient(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                              >
                                {[
                                  'Attijariwafa Bank',
                                  'Banque Populaire (BCP)',
                                  'Bank of Africa (BMCE)',
                                  'CIH Bank',
                                  'Société Générale Maroc',
                                  'CFG Bank',
                                ].map((b) => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                        Le client réglera plus tard (à la livraison du véhicule). La facture sera émise en statut <em>« En attente »</em> et vous pourrez enregistrer son règlement d'un simple clic sur <strong>« Encaisser »</strong>.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SECTION DOSSIER ASSURANCE */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Compagnie d'Assurance *
                      </label>
                      <select
                        value={assuranceId}
                        onChange={(e) => setAssuranceId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                      >
                        {assurances.map((ass) => (
                          <option key={ass.id} value={ass.id}>
                            {ass.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Apporteur / Partenaire (Optionnel)
                      </label>
                      <select
                        value={partenaireId}
                        onChange={(e) => setPartenaireId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      >
                        <option value="">Aucun (Client direct)</option>
                        {partenaires.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom} ({p.tauxCommissionPourcent}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">N° Sinistre *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: SIN-2026-99"
                        value={numSinistre}
                        onChange={(e) => {
                          setNumSinistre(e.target.value);
                          if (stepError) setStepError(null);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                          !numSinistre.trim() && stepError ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">N° Police</label>
                      <input
                        type="text"
                        placeholder="Ex: POL-88320"
                        value={numPolice}
                        onChange={(e) => setNumPolice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date du sinistre</label>
                      <input
                        type="date"
                        value={dateSinistre}
                        onChange={(e) => setDateSinistre(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Franchise Management */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Gestion de la Franchise</span>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={franchiseOfferte}
                          onChange={(e) => setFranchiseOfferte(e.target.checked)}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span className="text-xs font-semibold text-emerald-700">
                          Franchise offerte au client (Geste commercial)
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Montant Franchise (DH)
                        </label>
                        <input
                          type="number"
                          value={montantFranchise}
                          onChange={(e) => setMontantFranchise(+e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Estimation Prise en charge Assurance (TTC)
                        </label>
                        <input
                          type="number"
                          value={prixTotalTTC}
                          onChange={(e) => {
                            const val = +e.target.value;
                            setPrixTotalTTC(val);
                            const targetHT = Math.round(val / 1.2);
                            setPrixVitrageHT(Math.max(0, targetHT - prixColleHT - prixMainOeuvreHT - extraPrestationsTotalHT));
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-brand-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  ← Précédent
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  Suivant : Pièces, Prestations & Pose →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Pièce Vitrage & Validation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800">
                    Origine de la pièce vitrage pour ce véhicule :
                  </label>
                  <div className="flex gap-1.5 bg-slate-200/80 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setModeVitrage('SUR_COMMANDE')}
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                        modeVitrage === 'SUR_COMMANDE'
                          ? 'bg-white text-brand-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🚗 Vitrage {vehiculeMarque || 'Véhicule'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModeVitrage('STOCK')}
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                        modeVitrage === 'STOCK'
                          ? 'bg-white text-brand-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📦 Stock Magasin
                    </button>
                  </div>
                </div>

                {modeVitrage === 'STOCK' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sélectionner l'article en stock (décompte automatique de l'inventaire) :
                    </label>
                    <select
                      value={selectedArticleId}
                      onChange={(e) => handleArticleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 font-medium bg-white"
                    >
                      <option value="">Sélectionner une référence en stock...</option>
                      {stockArticles
                        .filter((art) => art.quantiteEnStock > 0)
                        .map((art) => (
                          <option key={art.id} value={art.id}>
                            {art.designation} (En stock: {art.quantiteEnStock}) - {art.prixVenteHT} DH HT
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Désignation exacte du pare-brise / vitrage :
                      </label>
                      <input
                        type="text"
                        value={customVitrageDesignation || `Pare-Brise conforme ${vehiculeMarque} ${vehiculeModele} (${vehiculeAnnee})`}
                        onChange={(e) => setCustomVitrageDesignation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-brand-500 bg-white"
                        placeholder={`Pare-Brise ${vehiculeMarque} ${vehiculeModele}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Code Eurocode (Optionnel)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 7288AGS / 2088AGS"
                          value={customEurocode}
                          onChange={(e) => setCustomEurocode(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                      <div className="flex items-center text-[11px] text-slate-500 pt-3">
                        ✓ Attribué automatiquement au Bon de Sortie, Bon de Livraison et Facture.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tarifs Prestations, Main d'Œuvre & Fournitures Modifiables en Direct */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-brand-600" />
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Tarification des Prestations & Main d'Œuvre (DH HT)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">TVA 20% calculée automatiquement</span>
                </div>

                {/* Prestations Table / Inputs */}
                <div className="space-y-2.5 text-xs">
                  {/* 1. Vitrage */}
                  <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <span className="font-bold text-slate-800 block">1. Pièce Vitrage / Pare-brise</span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {(modeVitrage === 'STOCK' && selectedArticleId)
                          ? stockArticles.find((a) => a.id === selectedArticleId)?.designation
                          : (customVitrageDesignation || `Pare-brise conforme ${vehiculeMarque || 'Véhicule'} ${vehiculeModele || ''}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Prix HT :</label>
                      <div className="relative w-28">
                        <input
                          type="number"
                          min="0"
                          value={prixVitrageHT}
                          onChange={(e) => setPrixVitrageHT(+e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">DH</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Main d'œuvre */}
                  <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <span className="font-bold text-slate-800 block">2. Main d'œuvre Pose & Dépose Vitrage</span>
                      <span className="text-[11px] text-slate-500">Démontage accessoires, préparation baie, application primaire & pose</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Prix HT :</label>
                      <div className="relative w-28">
                        <input
                          type="number"
                          min="0"
                          value={prixMainOeuvreHT}
                          onChange={(e) => setPrixMainOeuvreHT(+e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">DH</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Colle */}
                  <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <span className="font-bold text-slate-800 block">3. Fourniture Kit Colle & Primaire d'étanchéité</span>
                      <span className="text-[11px] text-slate-500">Mastic polyuréthane certifié constructeur (300ml) + tampon activateur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Prix HT :</label>
                      <div className="relative w-28">
                        <input
                          type="number"
                          min="0"
                          value={prixColleHT}
                          onChange={(e) => setPrixColleHT(+e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">DH</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Prestations Additionnelles Extra */}
                  {lignesPrestationsExtra.map((extra) => (
                    <div key={extra.id} className="flex items-center justify-between gap-3 p-2.5 bg-brand-50/40 rounded-lg border border-brand-200 animate-in fade-in duration-150">
                      <div className="flex-1 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">{extra.designation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-600">Prix HT :</label>
                        <div className="relative w-28">
                          <input
                            type="number"
                            min="0"
                            value={extra.prixHT}
                            onChange={(e) => {
                              const val = +e.target.value;
                              setLignesPrestationsExtra((prev) =>
                                prev.map((item) => (item.id === extra.id ? { ...item, prixHT: val } : item))
                              );
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                          />
                          <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">DH</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraPrestation(extra.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer la prestation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prestations Rapides Shortcuts */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-600 mb-1.5">
                    Ajouter d'autres prestations au dossier :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESTATIONS_RAPIDES.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPresetPrestation(p)}
                        className="text-[11px] py-1 px-2.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-slate-200 rounded-lg text-slate-700 transition-colors flex items-center gap-1 font-medium"
                      >
                        <Plus className="w-3 h-3" /> {p.designation} (+{p.prixHT} DH)
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAddCustomPrestation(!showAddCustomPrestation)}
                      className="text-[11px] py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 font-bold"
                    >
                      <Plus className="w-3 h-3" /> Prestation personnalisée...
                    </button>
                  </div>

                  {showAddCustomPrestation && (
                    <div className="mt-2.5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Désignation (Ex: Polissage lunette arrière)"
                        value={customPrestationNom}
                        onChange={(e) => setCustomPrestationNom(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Prix HT"
                        value={customPrestationPrix}
                        onChange={(e) => setCustomPrestationPrix(+e.target.value)}
                        className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-right"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomPrestation}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                </div>

                {/* Recap Totaux Dynamiques */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      Total Calculé de la Facture
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      HT: {formatDH(dynamicTotalHT)} • TVA (20%): {formatDH(dynamicTotalTVA)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-emerald-400 font-bold block">Total TTC Net</span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {formatDH(dynamicTotalTTC)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Poseur / Technicien</label>
                  <input
                    type="text"
                    value={poseurNom}
                    onChange={(e) => setPoseurNom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Photos Sinistre</label>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <Camera className="w-3.5 h-3.5" /> 2 Photos jointes
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary box */}
              <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-200 text-xs text-brand-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-brand-950">
                  <Check className="w-4 h-4 text-brand-600" /> Ce dossier va automatiquement générer :
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>La <strong>Quittance subrogative d'assurance</strong> prête pour signature</li>
                  <li>Le <strong>Bon de Sortie Stock</strong> pour l'atelier (-1 pare-brise, -1 cartouche de colle)</li>
                  <li>La <strong>Facture proforma / définitive</strong> à adresser à la compagnie d'assurance ou au client</li>
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  ← Précédent
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow transition-all"
                >
                  Créer et Valider le Dossier
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
