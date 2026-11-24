'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { BonLivraison, DossierSinistre, Facture, ArticleStock } from '@/types';
import { GARAGE_INFO } from '@/lib/data';
import { formatDate, formatDH } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { 
  FileText, 
  Save, 
  Check, 
  Truck, 
  Layers, 
  Pencil, 
  X, 
  Plus, 
  Trash2, 
  Package, 
  Car, 
  User, 
  Coins 
} from 'lucide-react';
import { DocumentActionBar } from './DocumentActionBar';

interface Props {
  bonLivraison: BonLivraison;
  dossier?: DossierSinistre;
  facture?: Facture;
  initialEdit?: boolean;
  stockArticles?: ArticleStock[];
  onClose: () => void;
  onUpdateObservations?: (newObservations: string) => void;
  onUpdateBonLivraison?: (updatedBL: BonLivraison) => void;
}

export const BonLivraisonModal: React.FC<Props> = ({
  bonLivraison,
  dossier,
  facture,
  initialEdit = false,
  stockArticles = [],
  onClose,
  onUpdateObservations,
  onUpdateBonLivraison,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // État mode édition
  const [isEditing, setIsEditing] = useState<boolean>(initialEdit);

  // Fermeture par touche Echap (si pas en train d'éditer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditing]);

  // Extraction de secours depuis observations si ancien BL enregistré sans champ immatriculation
  const obsMatch = (bonLivraison.observations || '').match(/Véhicule\s+([^(]+)\(([^)]+)\)/i);
  const fallbackVehiculeFromObs = obsMatch ? obsMatch[1].trim() : '';
  const fallbackImmatFromObs = obsMatch ? obsMatch[2].trim() : '';

  // Identité du client / réceptionnaire
  const clientNom = bonLivraison.receptionnaireNom || bonLivraison.clientNom || dossier?.client.nom || 'Client';
  const clientTel = bonLivraison.clientTelephone || dossier?.client.telephone || '';
  const clientCin = bonLivraison.receptionnaireCin || bonLivraison.clientCin || dossier?.client.cin || '';
  const clientVille = bonLivraison.clientVille || dossier?.client.ville || 'Marrakech';

  // Infos véhicule (depuis dossier, ou BL, ou observations)
  const vehiculeMarque = (dossier?.vehicule?.marque || bonLivraison.vehiculeInfo || fallbackVehiculeFromObs || '').trim();
  const vehiculeModele = (dossier?.vehicule?.modele || '').trim();
  const vehiculeAnnee = dossier?.vehicule?.annee;
  const vehiculeImmatriculation = (
    dossier?.vehicule?.immatriculation ||
    bonLivraison.immatriculation ||
    fallbackImmatFromObs ||
    ''
  ).trim();
  const formattedImmat = vehiculeImmatriculation
    ? formatMatricule(vehiculeImmatriculation, 'LATIN')
    : '';

  // Mode multi-véhicules / sans matricule unique :
  const [hideVehicleInfo, setHideVehicleInfo] = useState<boolean>(() => {
    if (vehiculeImmatriculation) {
      return Boolean(bonLivraison.isMultiVehicules && !dossier?.vehicule?.immatriculation);
    }
    return true;
  });

  useEffect(() => {
    if (vehiculeImmatriculation && (!bonLivraison.isMultiVehicules || dossier?.vehicule?.immatriculation)) {
      setHideVehicleInfo(false);
    }
  }, [vehiculeImmatriculation, bonLivraison.isMultiVehicules, dossier?.vehicule?.immatriculation]);

  // État observation rapide
  const defaultObs = (hideVehicleInfo || !vehiculeImmatriculation)
    ? 'Fournitures et vitrages livrés en parfait état de conformité.'
    : `Véhicule ${vehiculeMarque} ${vehiculeModele} (${formattedImmat || vehiculeImmatriculation}) remis en parfait état de conformité.`;

  const [observations, setObservations] = useState(bonLivraison.observations || defaultObs);
  const [hasSavedObs, setHasSavedObs] = useState(false);

  const handleSaveObs = () => {
    onUpdateObservations?.(observations);
    setHasSavedObs(true);
    setTimeout(() => setHasSavedObs(false), 2500);
  };

  // Récupérer toutes les prestations et vitrages livrés avec leurs prix en TTC pour la vue document
  const prestationsLignes = useMemo(() => {
    // 1. Si le bon de livraison a déjà ses lignes enregistrées
    if (bonLivraison.lignes && bonLivraison.lignes.length > 0) {
      return bonLivraison.lignes.map((l) => {
        const qte = l.quantite || 1;
        const puTTC = Number(l.prixUnitaireTTC) || (l.totalTTC ? +(Number(l.totalTTC) / qte).toFixed(2) : (l.prixUnitaireHT ? +(Number(l.prixUnitaireHT) * 1.20).toFixed(2) : 0));
        const totTTC = Number(l.totalTTC) || +(puTTC * qte).toFixed(2);
        return {
          designation: l.designation,
          codeEurocode: l.codeEurocode || '-',
          quantite: qte,
          prixUnitaireTTC: puTTC,
          totalTTC: totTTC,
        };
      });
    }

    // 2. Si la facture liée existe avec ses prestations complètes
    if (facture && facture.lignes && facture.lignes.length > 0) {
      return facture.lignes.map((l) => ({
        designation: l.designation,
        codeEurocode: l.codeEurocode || '-',
        quantite: l.quantite || 1,
        prixUnitaireTTC: +(l.prixUnitaireHT * 1.20).toFixed(2),
        totalTTC: +(l.totalHT * 1.20).toFixed(2),
      }));
    }

    // 3. Reconstitution des prestations depuis le dossier
    if (dossier) {
      const totalDossierTTC = dossier.montantTotalTTC || 1100;
      const colleTTC = 180;
      const moTTC = 120;
      const vitrageTTC = Math.max(0, +(totalDossierTTC - colleTTC - moTTC).toFixed(2));

      return [
        {
          designation: `Vitrage ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
          codeEurocode: bonLivraison.lignes?.[0]?.codeEurocode || `PB-${dossier.vehicule.marque.slice(0, 3).toUpperCase()}`,
          quantite: 1,
          prixUnitaireTTC: vitrageTTC,
          totalTTC: vitrageTTC,
        },
        {
          designation: 'Kit colle polyuréthane & primaire d\'adhérence haute résistance',
          codeEurocode: 'COLLE-PU',
          quantite: 1,
          prixUnitaireTTC: colleTTC,
          totalTTC: colleTTC,
        },
        {
          designation: 'Main d\'œuvre spécialisée pose & dépose vitrage',
          codeEurocode: 'MO-POSE',
          quantite: 1,
          prixUnitaireTTC: moTTC,
          totalTTC: moTTC,
        },
      ];
    }

    return [];
  }, [bonLivraison, facture, dossier]);

  // Total pièces en mode document
  const totalQuantiteArticles = useMemo(() => {
    return prestationsLignes.reduce((sum, l) => sum + (l.quantite || 1), 0);
  }, [prestationsLignes]);

  // Total dans le BL en TTC en mode document
  const totalPrestationsTTC = useMemo(() => {
    if (bonLivraison.totalTTC && bonLivraison.totalTTC > 0) return Number(bonLivraison.totalTTC);
    return +(prestationsLignes.reduce((sum, l) => sum + (l.totalTTC || 0), 0)).toFixed(2);
  }, [prestationsLignes, bonLivraison]);

  // Décompte Assurance / AZUR GLASS (si dossier assurance)
  const isAssurance = dossier?.typeDossier === 'ASSURANCE';
  const franchiseMontant = dossier?.montantFranchise || 0;
  const franchiseOfferte = Boolean(dossier?.franchiseOfferte);
  const effectiveFranchise = franchiseOfferte ? 0 : franchiseMontant;
  const effectiveTvaExclue = Number(dossier?.tvaExclueParAssurance) || 0;
  const netPriseEnCharge = isAssurance
    ? Math.max(0, +(totalPrestationsTTC - effectiveFranchise - effectiveTvaExclue).toFixed(2))
    : totalPrestationsTTC;

  const isMulti = hideVehicleInfo || !vehiculeImmatriculation;
  const displayImmat = formattedImmat || vehiculeImmatriculation;

  const docSubtitle = isMulti
    ? `Client : ${clientNom} • Livraison Multi-Vitrages (${totalQuantiteArticles} article${totalQuantiteArticles > 1 ? 's' : ''}) • Total : ${formatDH(totalPrestationsTTC)} TTC`
    : `Client : ${clientNom} • Véhicule : ${vehiculeMarque} ${vehiculeModele} • Matricule : ${displayImmat}`;

  const shareMsg = isMulti
    ? `Bonjour ${clientNom}, voici votre Bon de Livraison N° ${bonLivraison.numeroBL} d'un montant de ${formatDH(totalPrestationsTTC)} TTC attestant de la livraison conforme de ${totalQuantiteArticles} vitrage(s) chez GLOBAL PARE-BRISE.`
    : `Bonjour ${clientNom}, voici votre Bon de Livraison N° ${bonLivraison.numeroBL} d'un montant de ${formatDH(totalPrestationsTTC)} attestant de la pose et réception conforme du vitrage sur votre véhicule ${vehiculeMarque} ${vehiculeModele} (Matricule : ${displayImmat}) chez GLOBAL PARE-BRISE.`;

  // ==========================================
  // ÉTATS DÉDIÉS AU MODE ÉDITION DU BL
  // ==========================================
  const [editNumeroBL, setEditNumeroBL] = useState(bonLivraison.numeroBL || '');
  const [editDateLivraison, setEditDateLivraison] = useState(
    bonLivraison.dateLivraison?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [editLivreurPoseur, setEditLivreurPoseur] = useState(bonLivraison.livreurPoseur || 'Équipe Atelier');
  const [editClientNom, setEditClientNom] = useState(
    bonLivraison.receptionnaireNom || bonLivraison.clientNom || dossier?.client.nom || ''
  );
  const [editClientTel, setEditClientTel] = useState(
    bonLivraison.clientTelephone || dossier?.client.telephone || ''
  );
  const [editClientCin, setEditClientCin] = useState(
    bonLivraison.receptionnaireCin || bonLivraison.clientCin || dossier?.client.cin || ''
  );
  const [editClientVille, setEditClientVille] = useState(
    bonLivraison.clientVille || dossier?.client.ville || 'Marrakech'
  );
  const [editClientAdresse, setEditClientAdresse] = useState(bonLivraison.clientAdresse || '');

  const [editIsMulti, setEditIsMulti] = useState<boolean>(Boolean(bonLivraison.isMultiVehicules));
  const [editVehiculeInfo, setEditVehiculeInfo] = useState(
    dossier ? `${dossier.vehicule.marque} ${dossier.vehicule.modele}`.trim() : (bonLivraison.vehiculeInfo || fallbackVehiculeFromObs || '')
  );
  const [editImmatriculation, setEditImmatriculation] = useState(
    dossier?.vehicule.immatriculation || bonLivraison.immatriculation || fallbackImmatFromObs || ''
  );

  const [editObservations, setEditObservations] = useState(bonLivraison.observations || defaultObs);
  const [editFranchise, setEditFranchise] = useState<number>(
    bonLivraison.montantFranchise ?? dossier?.montantFranchise ?? 0
  );
  const [editTvaExclue, setEditTvaExclue] = useState<number>(
    bonLivraison.tvaExclue ?? Number(dossier?.tvaExclueParAssurance) ?? 0
  );

  const [selectedStockId, setSelectedStockId] = useState('');

  // Lignes éditables pré-remplies
  const [editLignes, setEditLignes] = useState<
    { id: string; designation: string; codeEurocode: string; quantite: number; prixUnitaireTTC: number }[]
  >(() => {
    if (bonLivraison.lignes && bonLivraison.lignes.length > 0) {
      return bonLivraison.lignes.map((l, i) => {
        const qte = l.quantite || 1;
        const puTTC = Number(l.prixUnitaireTTC) || (l.totalTTC ? +(Number(l.totalTTC) / qte).toFixed(2) : (l.prixUnitaireHT ? +(Number(l.prixUnitaireHT) * 1.20).toFixed(2) : 0));
        return {
          id: `el-${i}-${Date.now()}`,
          designation: l.designation,
          codeEurocode: l.codeEurocode || '',
          quantite: qte,
          prixUnitaireTTC: puTTC,
        };
      });
    }
    return [];
  });

  // Synchronisation des lignes avec les prestations si initialement vides
  useEffect(() => {
    if (bonLivraison.lignes && bonLivraison.lignes.length > 0) {
      setEditLignes(
        bonLivraison.lignes.map((l, i) => {
          const qte = l.quantite || 1;
          const puTTC = Number(l.prixUnitaireTTC) || (l.totalTTC ? +(Number(l.totalTTC) / qte).toFixed(2) : (l.prixUnitaireHT ? +(Number(l.prixUnitaireHT) * 1.20).toFixed(2) : 0));
          return {
            id: `el-${i}-${Date.now()}`,
            designation: l.designation,
            codeEurocode: l.codeEurocode || '',
            quantite: qte,
            prixUnitaireTTC: puTTC,
          };
        })
      );
    } else if (prestationsLignes && prestationsLignes.length > 0) {
      setEditLignes(
        prestationsLignes.map((l, i) => ({
          id: `el-${i}-${Date.now()}`,
          designation: l.designation,
          codeEurocode: l.codeEurocode !== '-' ? l.codeEurocode : '',
          quantite: l.quantite || 1,
          prixUnitaireTTC: l.prixUnitaireTTC || 0,
        }))
      );
    }
  }, [bonLivraison.lignes, prestationsLignes]);

  // Synchronisation générale si le prop bonLivraison change
  useEffect(() => {
    setEditNumeroBL(bonLivraison.numeroBL || '');
    setEditDateLivraison(bonLivraison.dateLivraison?.split('T')[0] || new Date().toISOString().split('T')[0]);
    setEditLivreurPoseur(bonLivraison.livreurPoseur || 'Équipe Atelier');
    setEditClientNom(bonLivraison.receptionnaireNom || bonLivraison.clientNom || dossier?.client.nom || '');
    setEditClientTel(bonLivraison.clientTelephone || dossier?.client.telephone || '');
    setEditClientCin(bonLivraison.receptionnaireCin || bonLivraison.clientCin || dossier?.client.cin || '');
    setEditClientVille(bonLivraison.clientVille || dossier?.client.ville || 'Marrakech');
    setEditClientAdresse(bonLivraison.clientAdresse || '');
    setEditIsMulti(Boolean(bonLivraison.isMultiVehicules));
    setEditVehiculeInfo(dossier ? `${dossier.vehicule.marque} ${dossier.vehicule.modele}`.trim() : (bonLivraison.vehiculeInfo || fallbackVehiculeFromObs || ''));
    setEditImmatriculation(dossier?.vehicule.immatriculation || bonLivraison.immatriculation || fallbackImmatFromObs || '');
    setEditObservations(bonLivraison.observations || defaultObs);
    setEditFranchise(bonLivraison.montantFranchise ?? dossier?.montantFranchise ?? 0);
    setEditTvaExclue(bonLivraison.tvaExclue ?? Number(dossier?.tvaExclueParAssurance) ?? 0);
  }, [bonLivraison, dossier, defaultObs, fallbackVehiculeFromObs, fallbackImmatFromObs]);

  // Actions d'édition des lignes
  const handleEditAddCustomLine = () => {
    setEditLignes((prev) => [
      ...prev,
      {
        id: `el-${Date.now()}`,
        designation: '',
        codeEurocode: '',
        quantite: 1,
        prixUnitaireTTC: 0,
      },
    ]);
  };

  const handleEditAddFromStock = (stockId: string) => {
    if (!stockId) return;
    const art = stockArticles?.find((s) => s.id === stockId);
    if (!art) return;
    setEditLignes((prev) => [
      ...prev,
      {
        id: `el-${Date.now()}`,
        designation: art.designation,
        codeEurocode: art.codeEurocode || art.reference || '',
        quantite: 1,
        prixUnitaireTTC: +(art.prixVenteHT * 1.20).toFixed(2),
      },
    ]);
    setSelectedStockId('');
  };

  const handleEditRemoveLine = (idx: number) => {
    if (editLignes.length <= 1) {
      alert('Le bon de livraison doit comporter au moins un article ou prestation.');
      return;
    }
    setEditLignes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEditUpdateLine = (idx: number, field: string, val: any) => {
    setEditLignes((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: val } : l))
    );
  };

  // Totaux calculés en mode édition
  const editTotalTTC = useMemo(() => {
    return +editLignes.reduce((sum, l) => sum + ((Number(l.prixUnitaireTTC) || 0) * (Number(l.quantite) || 0)), 0).toFixed(2);
  }, [editLignes]);
  const editTotalHT = +(editTotalTTC / 1.20).toFixed(2);

  // Sauvegarde globale de l'édition
  const handleSaveAll = () => {
    const cleanNum = editNumeroBL.trim().toUpperCase();
    if (!cleanNum) {
      alert('Veuillez renseigner un numéro de Bon de Livraison valide.');
      return;
    }
    const cleanClient = editClientNom.trim();
    if (!cleanClient) {
      alert('Veuillez renseigner le nom du client ou du réceptionnaire.');
      return;
    }
    if (editLignes.length === 0 || editLignes.some((l) => !l.designation.trim())) {
      alert('Veuillez renseigner la désignation de tous les articles ou prestations.');
      return;
    }

    const updatedBL: BonLivraison = {
      ...bonLivraison,
      numeroBL: cleanNum,
      dateLivraison: editDateLivraison,
      livreurPoseur: editLivreurPoseur.trim() || 'Équipe Atelier',
      receptionnaireNom: cleanClient,
      clientNom: cleanClient,
      clientTelephone: editClientTel.trim() || undefined,
      clientCin: editClientCin.trim() || undefined,
      clientVille: editClientVille.trim() || undefined,
      clientAdresse: editClientAdresse.trim() || undefined,
      isMultiVehicules: editIsMulti,
      vehiculeInfo: editIsMulti ? 'Multi-Vitrages / Flotte' : editVehiculeInfo.trim(),
      immatriculation: editIsMulti ? undefined : editImmatriculation.trim().toUpperCase(),
      lignes: editLignes.map((l) => {
        const qte = Number(l.quantite) || 1;
        const puTTC = Number(l.prixUnitaireTTC) || 0;
        const totTTC = +(puTTC * qte).toFixed(2);
        const puHT = +(puTTC / 1.20).toFixed(2);
        const totHT = +(totTTC / 1.20).toFixed(2);
        return {
          designation: l.designation.trim(),
          codeEurocode: l.codeEurocode?.trim() || undefined,
          quantite: qte,
          prixUnitaireTTC: puTTC,
          prixUnitaireHT: puHT,
          totalTTC: totTTC,
          totalHT: totHT,
        };
      }),
      totalTTC: editTotalTTC,
      totalHT: editTotalHT,
      montantFranchise: Number(editFranchise) || 0,
      tvaExclue: Number(editTvaExclue) || 0,
      observations: editObservations.trim(),
    };

    onUpdateBonLivraison?.(updatedBL);
    setObservations(updatedBL.observations || '');
    setIsEditing(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-sm flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in duration-200">
        
        {/* Action Bar */}
        <DocumentActionBar
          documentRef={printRef}
          filename={`BON-LIVRAISON-${bonLivraison.numeroBL}`}
          documentTitle={isEditing ? `Modifier BL #${bonLivraison.numeroBL}` : `Bon de Livraison #${bonLivraison.numeroBL}`}
          subtitle={isEditing ? 'Formulaire d\'édition du bon de livraison' : docSubtitle}
          clientPhone={clientTel}
          shareMessage={shareMsg}
          badgeText={isEditing ? "Mode Édition" : (isMulti ? "Multi-Vitrages" : "Livraison avec Prix")}
          badgeColor={isEditing ? "bg-amber-500 text-slate-950" : "bg-indigo-600"}
          extraActions={
            !isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                title="Modifier les données de ce Bon de Livraison"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-950" />
                <span>Modifier le BL</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Annuler</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            )
          }
          onClose={onClose}
        />

        {/* Barre d'édition d'observations & options (visible en mode document uniquement) */}
        {!isEditing && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
            <div className="flex-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Observation :</span>
              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                onBlur={handleSaveObs}
                placeholder="Ajouter une observation ou mention particulière..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveObs}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
              >
                {hasSavedObs ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Enregistré !</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>

            {/* Toggle Multi-véhicules */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-50 transition whitespace-nowrap">
              <input
                type="checkbox"
                checked={hideVehicleInfo}
                onChange={(e) => setHideVehicleInfo(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Livraison Multi-Vitrages (Sans matricule)
              </span>
            </label>
          </div>
        )}

        {/* ======================================================== */}
        {/* CORPS : MODE ÉDITION DU BL ou VUE A4 IMPRIMABLE          */}
        {/* ======================================================== */}
        {isEditing ? (
          <div className="p-4 sm:p-8 bg-slate-50 space-y-6 max-w-4xl mx-auto">
            {/* Alert Header */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Modification du Bon de Livraison #{bonLivraison.numeroBL}</p>
                  <p className="text-amber-700 text-[11px]">Modifiez les champs ci-dessous puis validez avec le bouton « Enregistrer les modifications ».</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Enregistrer
                </button>
              </div>
            </div>

            {/* Section 1: Référence & Date */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                1. Référence & Date du Bon de Livraison
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Numéro BL *</label>
                  <input
                    type="text"
                    value={editNumeroBL}
                    onChange={(e) => setEditNumeroBL(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Ex: BL-2026-0042"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de livraison *</label>
                  <input
                    type="date"
                    value={editDateLivraison}
                    onChange={(e) => setEditDateLivraison(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Livreur / Technicien Poseur</label>
                  <input
                    type="text"
                    value={editLivreurPoseur}
                    onChange={(e) => setEditLivreurPoseur(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Ex: Équipe Atelier"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Client / Destinataire */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-indigo-600" />
                2. Destinataire / Client / Réceptionnaire
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nom du client / Société *</label>
                  <input
                    type="text"
                    value={editClientNom}
                    onChange={(e) => setEditClientNom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Nom complet ou raison sociale"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={editClientTel}
                    onChange={(e) => setEditClientTel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="06... / 05..."
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CIN / ICE</label>
                  <input
                    type="text"
                    value={editClientCin}
                    onChange={(e) => setEditClientCin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="CIN ou ICE société"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={editClientVille}
                    onChange={(e) => setEditClientVille(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Marrakech"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={editClientAdresse}
                    onChange={(e) => setEditClientAdresse(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Adresse de livraison"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Véhicule & Mode de livraison */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-600" />
                  3. Véhicule & Immatriculation
                </h4>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={editIsMulti}
                    onChange={(e) => setEditIsMulti(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Livraison Multi-Vitrages (Sans matricule unique)</span>
                </label>
              </div>

              {!editIsMulti ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Véhicule (Marque & Modèle)</label>
                    <input
                      type="text"
                      value={editVehiculeInfo}
                      onChange={(e) => setEditVehiculeInfo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Ex: Dacia Logan II / Renault Clio"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Immatriculation / Matricule</label>
                    <input
                      type="text"
                      value={editImmatriculation}
                      onChange={(e) => setEditImmatriculation(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Ex: 12345-A-26"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Ce bon de livraison est configuré en mode <strong>Multi-Vitrages</strong>. Aucun véhicule ni matricule ne figurera sur l'impression.</span>
                </div>
              )}
            </div>

            {/* Section 4: Prestations & Articles */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  4. Prestations & Fournitures livrées ({editLignes.length})
                </h4>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  {stockArticles && stockArticles.length > 0 && (
                    <div className="flex items-center gap-1">
                      <select
                        value={selectedStockId}
                        onChange={(e) => {
                          setSelectedStockId(e.target.value);
                          handleEditAddFromStock(e.target.value);
                        }}
                        className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">+ Ajouter depuis le stock...</option>
                        {stockArticles.map((art) => (
                          <option key={art.id} value={art.id}>
                            {art.designation} ({art.codeEurocode || art.reference}) - {art.prixVenteHT * 1.2} DH
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleEditAddCustomLine}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Désignation de la prestation / article *</th>
                      <th className="py-2.5 px-3 w-36">Code / Eurocode</th>
                      <th className="py-2.5 px-3 w-20 text-center">Qté</th>
                      <th className="py-2.5 px-3 w-28 text-right">P.U TTC (DH)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total TTC (DH)</th>
                      <th className="py-2.5 px-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editLignes.map((l, idx) => {
                      const lineTot = +((Number(l.prixUnitaireTTC) || 0) * (Number(l.quantite) || 0)).toFixed(2);
                      return (
                        <tr key={l.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={l.designation}
                              onChange={(e) => handleEditUpdateLine(idx, 'designation', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                              placeholder="Ex: Pare-Brise, Colle, Main d'œuvre..."
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={l.codeEurocode}
                              onChange={(e) => handleEditUpdateLine(idx, 'codeEurocode', e.target.value.toUpperCase())}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500"
                              placeholder="Réf / Eurocode"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={l.quantite}
                              onChange={(e) => handleEditUpdateLine(idx, 'quantite', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-center font-bold text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={l.prixUnitaireTTC}
                              onChange={(e) => handleEditUpdateLine(idx, 'prixUnitaireTTC', Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-right font-mono text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {lineTot.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleEditRemoveLine(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                              title="Supprimer la ligne"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700">Total Prestations TTC :</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-950 text-sm">{formatDH(editTotalTTC)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section 5: Franchise & TVA (Optionnel) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Coins className="w-4 h-4 text-indigo-600" />
                5. Décompte Financier (Franchise & TVA)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Montant Franchise (DH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFranchise}
                    onChange={(e) => setEditFranchise(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TVA Exclue (DH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editTvaExclue}
                    onChange={(e) => setEditTvaExclue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Prestations TTC</span>
                  <span className="font-mono font-extrabold text-base text-slate-900">{formatDH(editTotalTTC)}</span>
                </div>
              </div>
            </div>

            {/* Section 6: Observations */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                6. Observations & Remarques
              </h4>
              <div>
                <textarea
                  rows={3}
                  value={editObservations}
                  onChange={(e) => setEditObservations(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Fournitures et vitrages livrés en parfait état de conformité..."
                />
              </div>
            </div>

            {/* Bottom save bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95"
              >
                <Save className="w-4 h-4" /> Enregistrer les modifications
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VUE A4 IMPRIMABLE                                        */
          /* ======================================================== */
          <div className="overflow-x-auto bg-slate-100/50 p-2 sm:p-6 flex justify-center">
            <div 
              ref={printRef}
              className="a4-document print-page p-6 sm:p-10 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-sm border border-slate-200/80 rounded-xl bg-white"
            >
              {/* Top Bar */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                <div>
                  <img
                    src={GARAGE_INFO.logoUrl}
                    alt={GARAGE_INFO.nom}
                    className="h-14 w-auto max-w-[260px] object-contain mb-2"
                  />
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                    Centre Spécialisé Vitrage Auto & Bris de Glace
                  </p>
                  <p className="text-xs text-slate-700 font-medium">{GARAGE_INFO.adresse}</p>
                  <p className="text-xs text-slate-700">Tél : <strong>{GARAGE_INFO.telephone}</strong></p>
                  <p className="text-xs text-slate-700">Email : <strong>{GARAGE_INFO.email}</strong></p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-950 border border-indigo-300 rounded font-black text-xs uppercase tracking-wider mb-2">
                    BON DE LIVRAISON N° {bonLivraison.numeroBL}
                  </span>
                  <p className="text-xs text-slate-600">
                    Date : <span className="font-bold text-slate-900">{formatDate(bonLivraison.dateLivraison)}</span>
                  </p>
                  {dossier?.numeroDossier ? (
                    <p className="text-xs text-slate-600">
                      Dossier Réf : <span className="font-mono font-semibold">{dossier.numeroDossier}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-indigo-700 font-semibold">
                      Type : <span>Livraison Directe / Client</span>
                    </p>
                  )}
                  {!isMulti && displayImmat && (
                    <p className="text-xs text-slate-700 mt-0.5">
                      Matricule : <strong className="font-mono font-black text-slate-900" dir="ltr">{displayImmat}</strong>
                    </p>
                  )}
                  <p className="text-xs text-slate-600">
                    Régime : <strong>{isAssurance ? (dossier?.assurance?.nom || 'Assurance via AZUR GLASS') : 'Client Direct (Comptant)'}</strong>
                  </p>
                </div>
              </div>

              {/* Client & Vehicle / Delivery Blocks */}
              <div className="grid grid-cols-2 gap-6 my-6">
                {/* Client Box */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                    Client / Destinataire
                  </p>
                  <p className="text-sm font-bold text-slate-900">{clientNom}</p>
                  <p className="text-slate-600 mt-1">
                    CIN / ICE : <span className="font-mono font-semibold text-slate-800">{clientCin || 'N/A'}</span>
                  </p>
                  <p className="text-slate-600 mt-0.5">Téléphone : <strong>{clientTel || '-'}</strong></p>
                  <p className="text-slate-600 mt-0.5">Ville : <strong>{clientVille}</strong></p>
                  {bonLivraison.clientAdresse && (
                    <p className="text-slate-600 mt-0.5 text-[11px]">Adresse : {bonLivraison.clientAdresse}</p>
                  )}
                </div>

                {/* Right Box : IF multi-véhicules -> Affiche Détails de Livraison sans aucun véhicule ni matricule */}
                {isMulti ? (
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs">
                    <p className="font-bold text-[10px] text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" /> Détails de la Livraison
                    </p>
                    <p className="font-bold text-slate-900 text-sm">
                      Livraison Multi-Vitrages & Pare-brise
                    </p>
                    <p className="text-slate-600 mt-1.5">
                      Articles livrés : <strong className="font-bold text-indigo-950 font-mono text-sm">{totalQuantiteArticles}</strong> pièce(s)
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Date livraison : <strong>{formatDate(bonLivraison.dateLivraison)}</strong>
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Livreur / Technicien : <strong>{bonLivraison.livreurPoseur || 'Équipe Atelier'}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                      Véhicule & Travaux Réalisés
                    </p>
                    <p className="font-bold text-slate-900 text-sm">
                      {vehiculeMarque} {vehiculeModele} {vehiculeAnnee ? `(${vehiculeAnnee})` : ''}
                    </p>
                    <p className="text-slate-700 mt-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                      Matricule : <strong className="font-mono font-black text-slate-900 text-sm" dir="ltr">{displayImmat}</strong>
                    </p>
                    {isAssurance && (
                      <p className="text-slate-600 mt-2 font-mono text-[11px]">
                        N° Sinistre : <strong>{dossier?.numeroSinistre || '-'}</strong>
                      </p>
                    )}
                    <p className="text-slate-600 mt-1">
                      Technicien Poseur : <strong>{bonLivraison.livreurPoseur}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Table of items & prestations with prices */}
              <div className="my-6 border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Prestations & Fournitures Livrées</th>
                      <th className="py-3 px-4 text-center">Réf / Eurocode</th>
                      <th className="py-3 px-4 text-center">Qté</th>
                      <th className="py-3 px-4 text-right">P.U TTC (DH)</th>
                      <th className="py-3 px-4 text-right">Total TTC (DH)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {prestationsLignes.map((ligne, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{ligne.designation}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">{ligne.codeEurocode || '-'}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono">{ligne.quantite}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {ligne.prixUnitaireTTC ? ligne.prixUnitaireTTC.toFixed(2) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {ligne.totalTTC ? ligne.totalTTC.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 my-6">
                {/* Franchise & TVA (si assurance) */}
                <div className="flex-1 w-full sm:max-w-md">
                  {isAssurance ? (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                        Détail Prise en Charge Assurance :
                      </p>
                      <div className="space-y-1 text-slate-700 pt-1">
                        <div className="flex justify-between">
                          <span>Franchise {franchiseOfferte ? '(Offerte)' : '(À régler par le client)'} :</span>
                          <span className={`font-mono font-bold ${franchiseOfferte ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {formatDH(franchiseMontant)}
                          </span>
                        </div>
                        {effectiveTvaExclue > 0 && (
                          <div className="flex justify-between">
                            <span>TVA exclue (Régime Pro / Location) :</span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatDH(effectiveTvaExclue)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold text-indigo-950">
                          <span>Prise en charge nette assurance :</span>
                          <span className="font-mono font-bold">
                            {formatDH(netPriseEnCharge)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                      Règlement comptant direct par le client.
                    </div>
                  )}
                </div>

                {/* Total BL en TTC (Prestations uniquement) */}
                <div className="w-full sm:w-72 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Prestations (TTC) :</span>
                    <span className="font-mono text-emerald-800 text-base">{formatDH(totalPrestationsTTC)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic text-right">
                    Total TTC incluant l'ensemble des prestations réalisées
                  </p>
                </div>
              </div>

              {/* Observations */}
              {observations && (
                <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 text-[11px] uppercase block">Observations & Remarques :</span>
                  <p className="text-slate-800 font-medium italic mt-1 whitespace-pre-wrap">
                    {observations}
                  </p>
                </div>
              )}

              {/* Signatures & Discharges */}
              <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t-2 border-slate-800 text-xs">
                <div className="text-center">
                  <p className="font-bold uppercase text-slate-900">Visa / Signature du Client / Réceptionnaire</p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    (Mention manuscrite "Bon pour réception conforme sans réserves")
                  </p>
                  <div className="h-24 border border-dashed border-slate-300 rounded-xl mt-3 flex items-end justify-center pb-2">
                    <span className="text-xs text-slate-400">Date & Signature</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-bold uppercase text-slate-900">Cachet & Visa de l'Établissement</p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">{GARAGE_INFO.nom}</p>
                  <div className="h-24 border border-dashed border-slate-300 rounded-xl mt-3 flex items-center justify-center">
                    <div className="text-[10px] text-slate-500 border border-slate-200 p-2 rounded">
                      Fait à Marrakech, le {formatDate(bonLivraison.dateLivraison)}
                      <br />Cachet & Signature
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal Bottom Footer (Visible on screen only) */}
        <div className="no-print p-3 sm:px-6 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] shadow-2xs">Échap</kbd> ou cliquez en dehors pour fermer
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition active:scale-95"
          >
            Fermer le document
          </button>
        </div>
      </div>
    </div>
  );
};
