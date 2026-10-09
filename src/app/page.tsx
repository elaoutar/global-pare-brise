'use client';

import React, { useState, useEffect } from 'react';
import { 
  DossierSinistre, 
  ArticleStock, 
  Facture, 
  BonSortie, 
  BonLivraison,
  ReglementRecette,
  DocumentAttache,
  StatutDossier,
  StatutEncaissement,
  Assurance,
  Partenaire,
  Fournisseur,
  ModePaiement,
  BonCommandeFournisseur,
  DevisClient,
  StatutDevis
} from '@/types';
import { 
  INITIAL_DOSSIERS, 
  INITIAL_STOCK, 
  INITIAL_FACTURES, 
  INITIAL_BONS_SORTIE, 
  INITIAL_BONS_LIVRAISON,
  INITIAL_RECETTES,
  INITIAL_ASSURANCES, 
  INITIAL_PARTENAIRES, 
  INITIAL_FOURNISSEURS,
  INITIAL_COMMANDES_FOURNISSEURS,
  INITIAL_DEVIS,
  GARAGE_INFO 
} from '@/lib/data';
import { formatDH } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { 
  fetchDossiersFromSupabase, 
  fetchStockFromSupabase, 
  fetchFacturesFromSupabase, 
  fetchDevisFromSupabase,
  saveDossierToSupabase,
  saveStockArticleToSupabase,
  saveFactureToSupabase,
  saveDevisToSupabase
} from '@/lib/supabaseService';

import { Navigation } from '@/components/layout/Navigation';
import { DashboardView } from '@/components/views/DashboardView';
import { DossiersView } from '@/components/views/DossiersView';
import { StockView } from '@/components/views/StockView';
import { FacturationView } from '@/components/views/FacturationView';
import { RecettesView } from '@/components/views/RecettesView';
import { AssurancesView } from '@/components/views/AssurancesView';
import { PartenairesView } from '@/components/views/PartenairesView';
import { FournisseursView } from '@/components/views/FournisseursView';
import { RapportsExportView } from '@/components/views/RapportsExportView';
import { DevisView } from '@/components/views/DevisView';

import { NewDossierModal } from '@/components/dossiers/NewDossierModal';
import { QuittanceModal } from '@/components/documents/QuittanceModal';
import { FactureModal } from '@/components/documents/FactureModal';
import { BonSortieModal } from '@/components/documents/BonSortieModal';
import { BonLivraisonModal } from '@/components/documents/BonLivraisonModal';
import { EncaisserPaiementModal } from '@/components/modals/EncaisserPaiementModal';
import { BonCommandeFournisseurModal } from '@/components/documents/BonCommandeFournisseurModal';
import { DevisClientModal } from '@/components/documents/DevisClientModal';
import { NewDevisModal } from '@/components/documents/NewDevisModal';
import { TransmettreAzurGlassModal } from '@/components/dossiers/TransmettreAzurGlassModal';
import { DeclarationBrisGlaceModal } from '@/components/documents/DeclarationBrisGlaceModal';
import { Menu, X, ShieldCheck } from 'lucide-react';

export default function Home() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data State
  const [dossiers, setDossiers] = useState<DossierSinistre[]>(INITIAL_DOSSIERS);
  const [stock, setStock] = useState<ArticleStock[]>(INITIAL_STOCK);
  const [factures, setFactures] = useState<Facture[]>(INITIAL_FACTURES);
  const [bonsSortie, setBonsSortie] = useState<BonSortie[]>(INITIAL_BONS_SORTIE);
  const [bonsLivraison, setBonsLivraison] = useState<BonLivraison[]>(INITIAL_BONS_LIVRAISON);
  const [recettes, setRecettes] = useState<ReglementRecette[]>(INITIAL_RECETTES);
  const [assurances, setAssurances] = useState<Assurance[]>(INITIAL_ASSURANCES);
  const [partenaires, setPartenaires] = useState<Partenaire[]>(INITIAL_PARTENAIRES);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(INITIAL_FOURNISSEURS);
  const [commandesFournisseurs, setCommandesFournisseurs] = useState<BonCommandeFournisseur[]>(INITIAL_COMMANDES_FOURNISSEURS);
  const [devisList, setDevisList] = useState<DevisClient[]>(INITIAL_DEVIS);

  // Modals state
  const [showNewDossierModal, setShowNewDossierModal] = useState(false);
  const [activeQuittanceDossier, setActiveQuittanceDossier] = useState<DossierSinistre | null>(null);
  const [activeDeclarationBrisGlaceDossier, setActiveDeclarationBrisGlaceDossier] = useState<DossierSinistre | null>(null);
  const [activeFactureModal, setActiveFactureModal] = useState<{ facture: Facture; dossier: DossierSinistre } | null>(null);
  const [activeBonSortieModal, setActiveBonSortieModal] = useState<{ bonSortie: BonSortie; dossier: DossierSinistre } | null>(null);
  const [activeBonLivraisonModal, setActiveBonLivraisonModal] = useState<{ bonLivraison: BonLivraison; dossier: DossierSinistre } | null>(null);
  const [activeEncaisserModal, setActiveEncaisserModal] = useState<{ dossier: DossierSinistre; facture?: Facture } | null>(null);
  const [activeCommandeFournisseurModal, setActiveCommandeFournisseurModal] = useState<{ commande: BonCommandeFournisseur; fournisseur: Fournisseur } | null>(null);
  const [activeTransmettreAzurGlassDossier, setActiveTransmettreAzurGlassDossier] = useState<DossierSinistre | null>(null);

  // Devis Modals
  const [showNewDevisModal, setShowNewDevisModal] = useState(false);
  const [editingDevis, setEditingDevis] = useState<DevisClient | null>(null);
  const [activeDevisModal, setActiveDevisModal] = useState<DevisClient | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chargement des données réelles depuis Supabase Cloud
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const loadSupabaseData = async () => {
      try {
        const [supaDossiers, supaStock, supaFactures, supaDevis] = await Promise.all([
          fetchDossiersFromSupabase(),
          fetchStockFromSupabase(),
          fetchFacturesFromSupabase(),
          fetchDevisFromSupabase(),
        ]);

        if (supaDossiers && supaDossiers.length > 0) {
          setDossiers(supaDossiers);
        }
        if (supaStock && supaStock.length > 0) {
          setStock(supaStock);
        }
        if (supaFactures && supaFactures.length > 0) {
          setFactures(supaFactures);
        }
        if (supaDevis && supaDevis.length > 0) {
          setDevisList(supaDevis);
        }
      } catch (err) {
        console.error('Erreur chargement Supabase:', err);
      }
    };

    loadSupabaseData();
  }, []);

  // Handlers
  const handleCreateDossier = (
    newDossier: DossierSinistre, 
    newBonSortie?: BonSortie, 
    newFacture?: Facture,
    newRecette?: ReglementRecette
  ) => {
    // Always create a tailored Bon de Sortie specifically for this vehicle
    const seq = Math.floor(1000 + Math.random() * 9000);
    const finalBS: BonSortie = newBonSortie || {
      id: `bs-${Date.now()}`,
      numeroBS: `BS-2026-${seq}`,
      dossierId: newDossier.id,
      dateSortie: newDossier.dateCreation,
      poseur: newDossier.poseur || 'Poseur Atelier',
      lignes: [
        {
          articleId: `art-auto-${newDossier.id}`,
          reference: `PB-${(newDossier.vehicule.marque || 'VEH').slice(0, 3).toUpperCase()}`,
          designation: `Pare-Brise conforme ${newDossier.vehicule.marque} ${newDossier.vehicule.modele} (${newDossier.vehicule.annee})`,
          quantite: 1,
        },
        {
          articleId: 'art-6',
          reference: 'COLLE-SIKA-DRIVE',
          designation: 'Cartouche Mastic Polyuréthane SikaTack Drive (300ml)',
          quantite: 1,
        },
      ],
      notes: `Affecté au véhicule ${newDossier.vehicule.marque} ${newDossier.vehicule.modele} (${newDossier.vehicule.immatriculation})`,
    };

    // Auto-generate Bon de Livraison strictly matching the vehicle
    const newBL: BonLivraison = {
      id: `bl-${Date.now()}`,
      numeroBL: `BL-2026-${seq}`,
      dossierId: newDossier.id,
      dateLivraison: newDossier.dateCreation,
      livreurPoseur: newDossier.poseur || 'Poseur Atelier',
      receptionnaireNom: newDossier.client.nom,
      receptionnaireCin: newDossier.client.cin,
      lignes: finalBS.lignes.map((l) => ({
        designation: l.designation,
        codeEurocode: l.reference,
        quantite: l.quantite,
      })),
      observations: `Véhicule ${newDossier.vehicule.marque} ${newDossier.vehicule.modele} (${newDossier.vehicule.immatriculation}) remis conforme. Garantie étanchéité validée.`,
    };

    const dossierWithDocs: DossierSinistre = {
      ...newDossier,
      bonSortieId: finalBS.id,
      bonLivraisonId: newBL.id,
    };

    setDossiers([dossierWithDocs, ...dossiers]);
    setBonsSortie([finalBS, ...bonsSortie]);
    setBonsLivraison([newBL, ...bonsLivraison]);

    if (newBonSortie) {
      // Deduct stock for the article and the glue
      setStock((prev) =>
        prev.map((art) => {
          const matchingLine = newBonSortie.lignes.find((l) => l.articleId === art.id);
          if (matchingLine) {
            return {
              ...art,
              quantiteEnStock: Math.max(0, art.quantiteEnStock - matchingLine.quantite),
            };
          }
          return art;
        })
      );
    }

    if (newFacture) {
      setFactures([newFacture, ...factures]);
      saveFactureToSupabase(newFacture);
    }

    if (newRecette) {
      setRecettes([newRecette, ...recettes]);
    }

    saveDossierToSupabase(dossierWithDocs);

    setShowNewDossierModal(false);
    showToast(
      newRecette 
        ? `Dossier ${newDossier.numeroDossier} créé ! Règlement immédiat (${newRecette.modePaiement} - ${newRecette.montant} DH) encaissé.` 
        : `Dossier ${newDossier.numeroDossier} créé ! Bon de livraison, bon de sortie et facture générés.`
    );
  };

  const handleConfirmerEncaissement = (data: {
    modePaiement: ModePaiement;
    montant: number;
    datePaiement: string;
    banque?: string;
    referenceDocument?: string;
    dateEcheance?: string;
    notes?: string;
  }) => {
    if (!activeEncaisserModal) return;
    const { dossier, facture } = activeEncaisserModal;

    const seq = Math.floor(1000 + Math.random() * 9000);
    const newRec: ReglementRecette = {
      id: `rec-${Date.now()}`,
      numeroRecu: `REC-2026-${seq}`,
      dossierId: dossier.id,
      factureId: facture?.id,
      payeurNom: facture?.destinataire === 'ASSURANCE' ? (dossier.assurance?.nom || 'Assurance') : dossier.client.nom,
      sourceType: facture?.destinataire === 'ASSURANCE' ? 'ASSURANCE' : 'CLIENT',
      modePaiement: data.modePaiement,
      montant: data.montant,
      datePaiement: data.datePaiement,
      referenceDocument: data.referenceDocument,
      banque: data.banque,
      dateEcheance: data.dateEcheance,
      statut: (data.modePaiement === 'ESPECES' || data.modePaiement === 'VIREMENT') ? 'ENCAISSE' : 'EN_ATTENTE_ECHEANCE',
      dateEncaissementEffectif: (data.modePaiement === 'ESPECES' || data.modePaiement === 'VIREMENT') ? data.datePaiement : undefined,
      notes: data.notes || `Règlement pour dossier ${dossier.numeroDossier}`,
    };

    setRecettes((prev) => [newRec, ...prev]);

    // Update matching invoice
    setFactures((prev) =>
      prev.map((f) => {
        if ((facture && f.id === facture.id) || f.dossierId === dossier.id) {
          const nouveauMontantRegle = (f.montantRegle || 0) + data.montant;
          return {
            ...f,
            statutPaiement: nouveauMontantRegle >= f.totalTTC ? 'REGLE' : 'PARTIEL',
            montantRegle: nouveauMontantRegle,
            datePaiement: data.datePaiement,
            referencePaiement: `${data.modePaiement} ${data.referenceDocument || ''}`.trim(),
          };
        }
        return f;
      })
    );

    // Update dossier status to VALIDE_REGLE
    setDossiers((prev) =>
      prev.map((d) =>
        d.id === dossier.id
          ? {
              ...d,
              statut: 'VALIDE_REGLE',
              franchisePayeeParClient: true,
            }
          : d
      )
    );

    setActiveEncaisserModal(null);
    showToast(`Règlement de ${data.montant} DH (${data.modePaiement}) enregistré et encaissé avec succès !`);
  };

  const handleOpenEncaisserModalFromDossier = (dossier: DossierSinistre) => {
    const matchedFacture = factures.find((f) => f.dossierId === dossier.id);
    setActiveEncaisserModal({ dossier, facture: matchedFacture });
  };

  const handleAddStock = (newArticle: ArticleStock) => {
    setStock([newArticle, ...stock]);
    showToast(`Article ${newArticle.reference} ajouté au stock avec succès.`);
  };

  const handleUpdateStock = (updatedArticle: ArticleStock) => {
    setStock((prev) => prev.map((a) => (a.id === updatedArticle.id ? updatedArticle : a)));
    showToast(`Article ${updatedArticle.reference} mis à jour avec succès.`);
  };

  const handleDeleteStock = (articleId: string) => {
    setStock((prev) => prev.filter((a) => a.id !== articleId));
    showToast('Article supprimé du stock.');
  };

  // CRUD Assurances
  const handleAddAssurance = (newAss: Assurance) => {
    setAssurances((prev) => [newAss, ...prev]);
    showToast(`Compagnie d'assurance "${newAss.nom}" ajoutée avec succès.`);
  };

  const handleUpdateAssurance = (updatedAss: Assurance) => {
    setAssurances((prev) => prev.map((a) => (a.id === updatedAss.id ? updatedAss : a)));
    showToast(`Compagnie d'assurance "${updatedAss.nom}" mise à jour.`);
  };

  const handleDeleteAssurance = (assuranceId: string) => {
    setAssurances((prev) => prev.filter((a) => a.id !== assuranceId));
    showToast("Compagnie d'assurance supprimée.");
  };

  // CRUD Partenaires
  const handleAddPartenaire = (newPart: Partenaire) => {
    setPartenaires((prev) => [newPart, ...prev]);
    showToast(`Partenaire "${newPart.nom}" ajouté avec succès.`);
  };

  const handleUpdatePartenaire = (updatedPart: Partenaire) => {
    setPartenaires((prev) => prev.map((p) => (p.id === updatedPart.id ? updatedPart : p)));
    showToast(`Partenaire "${updatedPart.nom}" mis à jour.`);
  };

  const handleDeletePartenaire = (partenaireId: string) => {
    setPartenaires((prev) => prev.filter((p) => p.id !== partenaireId));
    showToast('Partenaire supprimé.');
  };

  // CRUD Fournisseurs
  const handleAddFournisseur = (newFourn: Fournisseur) => {
    setFournisseurs((prev) => [newFourn, ...prev]);
    showToast(`Fournisseur "${newFourn.nom}" ajouté avec succès.`);
  };

  const handleUpdateFournisseur = (updatedFourn: Fournisseur) => {
    setFournisseurs((prev) => prev.map((f) => (f.id === updatedFourn.id ? updatedFourn : f)));
    showToast(`Fournisseur "${updatedFourn.nom}" mis à jour.`);
  };

  const handleDeleteFournisseur = (fournisseurId: string) => {
    setFournisseurs((prev) => prev.filter((f) => f.id !== fournisseurId));
    showToast('Fournisseur supprimé.');
  };

  // Commandes Fournisseurs Handlers
  const handleCreateCommandeFournisseur = (newCmd: BonCommandeFournisseur) => {
    setCommandesFournisseurs((prev) => [newCmd, ...prev]);
    const fourn = fournisseurs.find((f) => f.id === newCmd.fournisseurId);
    showToast(`Bon de Commande ${newCmd.numeroBC} créé avec succès (${formatDH(newCmd.totalTTC)} TTC).`);
  };

  const handleUpdateCommandeFournisseur = (updatedCmd: BonCommandeFournisseur) => {
    setCommandesFournisseurs((prev) =>
      prev.map((c) => (c.id === updatedCmd.id ? updatedCmd : c))
    );
    showToast(`Commande ${updatedCmd.numeroBC} mise à jour avec succès.`);
  };

  const handleOpenCommandeFournisseurModal = (commande: BonCommandeFournisseur, fournisseur: Fournisseur) => {
    setActiveCommandeFournisseurModal({ commande, fournisseur });
  };

  // ----------------------------------------------------
  // DEVIS CLIENTS HANDLERS
  // ----------------------------------------------------
  const handleSaveDevis = (devis: DevisClient) => {
    const exists = devisList.some((d) => d.id === devis.id);
    if (exists) {
      setDevisList((prev) => prev.map((d) => (d.id === devis.id ? devis : d)));
      showToast(`Devis ${devis.numeroDevis} mis à jour avec succès.`);
    } else {
      setDevisList((prev) => [devis, ...prev]);
      showToast(`Devis ${devis.numeroDevis} créé avec succès (${formatDH(devis.totalTTC)} TTC).`);
    }
    setShowNewDevisModal(false);
    setEditingDevis(null);
  };

  const handleUpdateStatutDevis = (devisId: string, newStatut: StatutDevis) => {
    setDevisList((prev) =>
      prev.map((d) => (d.id === devisId ? { ...d, statut: newStatut } : d))
    );
    showToast(`Statut du devis mis à jour : ${newStatut}`);
  };

  const handleDeleteDevis = (devisId: string) => {
    setDevisList((prev) => prev.filter((d) => d.id !== devisId));
    showToast('Devis supprimé avec succès.');
  };

  const handleConvertDevisEnDossier = (devis: DevisClient) => {
    const seq = Math.floor(1000 + Math.random() * 9000);
    const newDosId = `dos-${Date.now()}`;
    const matchedAssurance = devis.compagnieAssurance
      ? assurances.find((a) => a.nom.toLowerCase().includes((devis.compagnieAssurance || '').toLowerCase()))
      : undefined;

    const newDossier: DossierSinistre = {
      id: newDosId,
      numeroDossier: `DOS-2026-${seq}`,
      typeDossier: devis.typeDemande === 'ASSURANCE' ? 'ASSURANCE' : 'PARTICULIER_COMPTANT',
      dateCreation: new Date().toISOString().split('T')[0],
      client: {
        id: `cli-${Date.now()}`,
        nom: devis.clientNom,
        telephone: devis.clientTelephone,
        cin: devis.clientCin,
        email: devis.clientEmail,
        ville: devis.agenceVille,
      },
      vehicule: {
        id: `veh-${Date.now()}`,
        clientId: `cli-${Date.now()}`,
        immatriculation: devis.vehiculeImmatriculation,
        marque: devis.vehiculeMarque,
        modele: devis.vehiculeModele,
        annee: devis.vehiculeAnnee,
        chassisVin: devis.vehiculeChassisVin,
      },
      assurance: matchedAssurance,
      agenceAssurance: devis.compagnieAssurance ? `${devis.compagnieAssurance} (Agence)` : undefined,
      referenceDossierAzurGlass: devis.typeDemande === 'ASSURANCE' ? `AZUR-${seq}` : undefined,
      dateEnvoiAzurGlass: devis.typeDemande === 'ASSURANCE' ? new Date().toISOString().split('T')[0] : undefined,
      montantTotalTTC: devis.totalTTC,
      montantPriseEnChargeAssurance: devis.typeDemande === 'ASSURANCE' ? devis.totalTTC : 0,
      montantFranchise: 0,
      franchiseOfferte: true,
      franchisePayeeParClient: false,
      tvaExclueParAssurance: 0,
      montantReversementAzurGlass: devis.typeDemande === 'ASSURANCE' ? devis.totalTTC : 0,
      statut: devis.typeDemande === 'ASSURANCE' ? 'ENVOYE_AZUR_GLASS' : 'NOUVEAU',
      photos: {},
      poseur: 'Atelier Pose',
      observations: `Converti depuis le Devis ${devis.numeroDevis}. ${devis.observations || ''}`.trim(),
    };

    // Auto-create Bon de Sortie & Bon de Livraison
    const finalBS: BonSortie = {
      id: `bs-${Date.now()}`,
      numeroBS: `BS-2026-${seq}`,
      dossierId: newDossier.id,
      dateSortie: newDossier.dateCreation,
      poseur: 'Atelier Pose',
      lignes: devis.lignes.map((l, i) => ({
        articleId: `art-dev-${i}-${Date.now()}`,
        reference: l.codeEurocode || 'REF-VIT',
        designation: l.designation,
        quantite: l.quantite,
      })),
      notes: `Affecté suite au Devis ${devis.numeroDevis}`,
    };

    const newBL: BonLivraison = {
      id: `bl-${Date.now()}`,
      numeroBL: `BL-2026-${seq}`,
      dossierId: newDossier.id,
      dateLivraison: newDossier.dateCreation,
      livreurPoseur: 'Atelier Pose',
      receptionnaireNom: devis.clientNom,
      receptionnaireCin: devis.clientCin,
      lignes: devis.lignes.map((l) => ({
        designation: l.designation,
        codeEurocode: l.codeEurocode,
        quantite: l.quantite,
      })),
      observations: `Véhicule ${devis.vehiculeMarque} ${devis.vehiculeModele} pris en charge conforme au devis.`,
    };

    // Auto-create Facture
    const newFacture: Facture = {
      id: `fac-${Date.now()}`,
      numeroFacture: `FA-2026-${seq}`,
      dossierId: newDossier.id,
      destinataire: devis.typeDemande === 'ASSURANCE' ? 'ASSURANCE' : 'CLIENT',
      dateEmission: newDossier.dateCreation,
      dateEcheance: devis.typeDemande === 'ASSURANCE'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : newDossier.dateCreation,
      lignes: devis.lignes.map((l) => ({
        designation: l.designation,
        codeEurocode: l.codeEurocode,
        quantite: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        tauxTva: l.tauxTva,
        totalHT: l.totalHT,
      })),
      totalHT: devis.totalHT,
      totalTVA: devis.totalTVA,
      totalTTC: devis.totalTTC,
      montantRegle: 0,
      statutPaiement: 'EN_ATTENTE',
    };

    const dossierWithDocs: DossierSinistre = {
      ...newDossier,
      bonSortieId: finalBS.id,
      bonLivraisonId: newBL.id,
      factureClientId: devis.typeDemande === 'PARTICULIER_DIRECT' ? newFacture.id : undefined,
      factureAssuranceId: devis.typeDemande === 'ASSURANCE' ? newFacture.id : undefined,
    };

    setDossiers([dossierWithDocs, ...dossiers]);
    setBonsSortie([finalBS, ...bonsSortie]);
    setBonsLivraison([newBL, ...bonsLivraison]);
    setFactures([newFacture, ...factures]);

    // Mark devis as converted
    setDevisList((prev) =>
      prev.map((d) =>
        d.id === devis.id
          ? { ...d, statut: 'CONVERTI_DOSSIER', dossierIdGenere: newDosId }
          : d
      )
    );

    setActiveTab('dossiers');
    showToast(`Devis ${devis.numeroDevis} converti avec succès en Dossier ${newDossier.numeroDossier} !`);
  };

  // Helper to open or create a Devis directly from a Dossier
  const handleOpenDevisFromDossier = (dossier: DossierSinistre) => {
    let matchedDevis = devisList.find((d) => d.dossierIdGenere === dossier.id || d.vehiculeImmatriculation === dossier.vehicule.immatriculation);
    if (!matchedDevis) {
      const seq = Math.floor(1000 + Math.random() * 9000);
      const totalHT = +(dossier.montantTotalTTC / 1.20).toFixed(2);
      const totalTVA = +(dossier.montantTotalTTC - totalHT).toFixed(2);
      matchedDevis = {
        id: `dev-dos-${dossier.id}`,
        numeroDevis: `DEV-2026-${seq}`,
        dateDevis: dossier.dateCreation,
        dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        agenceVille: dossier.client.ville || 'Marrakech',
        clientNom: dossier.client.nom,
        clientTelephone: dossier.client.telephone,
        clientCin: dossier.client.cin,
        clientEmail: dossier.client.email,
        clientVille: dossier.client.ville,
        vehiculeMarque: dossier.vehicule.marque,
        vehiculeModele: dossier.vehicule.modele,
        vehiculeAnnee: dossier.vehicule.annee,
        vehiculeImmatriculation: dossier.vehicule.immatriculation,
        vehiculeChassisVin: dossier.vehicule.chassisVin,
        typeDemande: dossier.typeDossier === 'ASSURANCE' ? 'ASSURANCE' : 'PARTICULIER_DIRECT',
        compagnieAssurance: dossier.assurance?.nom,
        lignes: [
          {
            designation: `Pare-Brise conforme ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
            quantite: 1,
            prixUnitaireHT: Math.max(0, +(totalHT - 250).toFixed(2)),
            tauxTva: 20,
            totalHT: Math.max(0, +(totalHT - 250).toFixed(2)),
          },
          {
            designation: 'Kit colle polyuréthane & primaire d\'étanchéité',
            quantite: 1,
            prixUnitaireHT: 125,
            tauxTva: 20,
            totalHT: 125,
          },
          {
            designation: 'Main d\'œuvre pose et dépose vitrage collé',
            quantite: 1,
            prixUnitaireHT: 125,
            tauxTva: 20,
            totalHT: 125,
          },
        ],
        totalHT,
        totalTVA,
        totalTTC: dossier.montantTotalTTC,
        statut: 'ACCEPTE',
        dossierIdGenere: dossier.id,
        observations: `Devis rattaché au dossier ${dossier.numeroDossier}.`,
      };
      setDevisList((prev) => [matchedDevis!, ...prev]);
    }
    setActiveDevisModal(matchedDevis);
  };

  const handleUpdateStatutDossier = (dossierId: string, newStatut: StatutDossier) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const updated = { ...d, statut: newStatut };
          saveDossierToSupabase(updated);
          return updated;
        }
        return d;
      })
    );
    showToast('Statut du dossier mis à jour.');
  };

  const handleOpenTransmettreAzurGlass = (dossier: DossierSinistre) => {
    setActiveTransmettreAzurGlassDossier(dossier);
  };

  const handleSendCompleteAzurGlass = (
    dossierId: string,
    transmissionData: {
      destinataire: string;
      cc?: string;
      objet: string;
      message: string;
      dateEnvoi: string;
    }
  ) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const updated = {
            ...d,
            statut: 'ENVOYE_AZUR_GLASS' as StatutDossier,
            dateEnvoiAzurGlass: transmissionData.dateEnvoi,
          };
          saveDossierToSupabase(updated);
          return updated;
        }
        return d;
      })
    );
    setActiveTransmettreAzurGlassDossier(null);
    showToast(`Dossier complet transmis avec succès par email à AZUR GLASS (${transmissionData.destinataire}) !`);
  };

  const handleAddDocumentToDossier = (dossierId: string, doc: DocumentAttache) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const currentDocs = d.documents || [];
          const updated = {
            ...d,
            documents: [doc, ...currentDocs],
          };
          saveDossierToSupabase(updated);
          return updated;
        }
        return d;
      })
    );
    showToast(`Document "${doc.nom}" attaché au dossier.`);
  };

  const handleAddRecette = (newRecette: ReglementRecette) => {
    setRecettes([newRecette, ...recettes]);
    showToast(`Règlement ${newRecette.numeroRecu} enregistré avec succès.`);
  };

  const handleUpdateStatutRecette = (recetteId: string, statut: StatutEncaissement) => {
    setRecettes((prev) =>
      prev.map((r) =>
        r.id === recetteId
          ? {
              ...r,
              statut,
              dateEncaissementEffectif: statut === 'ENCAISSE' ? new Date().toISOString().split('T')[0] : r.dateEncaissementEffectif,
            }
          : r
      )
    );
    showToast('Statut d\'encaissement mis à jour.');
  };

  const handleMarquerFacturePayee = (factureId: string) => {
    const fac = factures.find((f) => f.id === factureId);
    setFactures((prev) =>
      prev.map((f) =>
        f.id === factureId
          ? {
              ...f,
              statutPaiement: 'REGLE',
              montantRegle: f.totalTTC,
              datePaiement: new Date().toISOString().split('T')[0],
              referencePaiement: 'Virement Assurance Validé',
            }
          : f
      )
    );

    // Also automatically create a Recette entry for this settled invoice
    if (fac) {
      const matchedDossier = dossiers.find((d) => d.id === fac.dossierId);
      const newRec: ReglementRecette = {
        id: `rec-${Date.now()}`,
        numeroRecu: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        dossierId: fac.dossierId,
        factureId: fac.id,
        payeurNom: fac.destinataire === 'ASSURANCE' ? (matchedDossier?.assurance?.nom || 'Assurance') : (matchedDossier?.client.nom || 'Client'),
        sourceType: fac.destinataire === 'ASSURANCE' ? 'ASSURANCE' : 'CLIENT',
        modePaiement: 'VIREMENT',
        montant: fac.totalTTC,
        datePaiement: new Date().toISOString().split('T')[0],
        referenceDocument: `VIR-FAC-${fac.numeroFacture}`,
        banque: 'Attijariwafa Bank',
        statut: 'ENCAISSE',
        dateEncaissementEffectif: new Date().toISOString().split('T')[0],
        notes: `Règlement facture ${fac.numeroFacture}`,
      };
      setRecettes((prev) => [newRec, ...prev]);
    }

    showToast('Facture marquée comme réglée et recette enregistrée.');
  };

  // Helper to open Facture modal from dossier
  const handleOpenFactureFromDossier = (dossier: DossierSinistre) => {
    let matchedFacture = factures.find((f) => f.dossierId === dossier.id);
    if (!matchedFacture) {
      const seq = Math.floor(1000 + Math.random() * 9000);
      const isAssurance = dossier.typeDossier === 'ASSURANCE';
      const totalHT = +(dossier.montantTotalTTC / 1.2).toFixed(2);
      const totalTVA = +(dossier.montantTotalTTC - totalHT).toFixed(2);
      matchedFacture = {
        id: `fac-${Date.now()}`,
        numeroFacture: `FA-2026-${seq}`,
        dossierId: dossier.id,
        destinataire: isAssurance ? 'ASSURANCE' : 'CLIENT',
        dateEmission: dossier.dateCreation,
        dateEcheance: isAssurance 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : dossier.dateCreation,
        lignes: [
          {
            designation: `Pare-Brise conforme ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
            quantite: 1,
            prixUnitaireHT: +(totalHT - 250).toFixed(2),
            tauxTva: 20,
            totalHT: +(totalHT - 250).toFixed(2),
          },
          {
            designation: 'Kit colle polyuréthane & primaire d\'adhérence',
            quantite: 1,
            prixUnitaireHT: 150,
            tauxTva: 20,
            totalHT: 150,
          },
          {
            designation: 'Main d\'œuvre pose et dépose vitrage collé',
            quantite: 1,
            prixUnitaireHT: 100,
            tauxTva: 20,
            totalHT: 100,
          },
        ],
        totalHT,
        totalTVA,
        totalTTC: dossier.montantTotalTTC,
        montantRegle: 0,
        statutPaiement: 'EN_ATTENTE',
      };
      setFactures((prev) => [matchedFacture!, ...prev]);
    }
    setActiveFactureModal({ facture: matchedFacture, dossier });
  };

  // Helper to open Bon Sortie modal from dossier
  const handleOpenBonSortieFromDossier = (dossier: DossierSinistre) => {
    let matchedBS = bonsSortie.find((b) => b.dossierId === dossier.id);
    if (!matchedBS) {
      const seq = Math.floor(1000 + Math.random() * 9000);
      matchedBS = {
        id: `bs-${Date.now()}`,
        numeroBS: `BS-2026-${seq}`,
        dossierId: dossier.id,
        dateSortie: dossier.dateCreation,
        poseur: dossier.poseur || 'Poseur Atelier',
        lignes: [
          {
            articleId: `art-auto-${dossier.id}`,
            reference: `PB-${(dossier.vehicule.marque || 'VEH').slice(0, 3).toUpperCase()}`,
            designation: `Pare-Brise conforme ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
            quantite: 1,
          },
          {
            articleId: 'art-6',
            reference: 'COLLE-SIKA-DRIVE',
            designation: 'Cartouche Mastic Polyuréthane SikaTack Drive (300ml)',
            quantite: 1,
          },
        ],
        notes: `Affecté au véhicule ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.immatriculation})`,
      };
      setBonsSortie((prev) => [matchedBS!, ...prev]);
    }
    setActiveBonSortieModal({ bonSortie: matchedBS, dossier });
  };

  // Helper to open Bon Livraison modal from dossier
  const handleOpenBonLivraisonFromDossier = (dossier: DossierSinistre) => {
    let matchedBL = bonsLivraison.find((b) => b.dossierId === dossier.id);
    if (!matchedBL) {
      const seq = Math.floor(1000 + Math.random() * 9000);
      matchedBL = {
        id: `bl-${Date.now()}`,
        numeroBL: `BL-2026-${seq}`,
        dossierId: dossier.id,
        dateLivraison: dossier.dateCreation,
        livreurPoseur: dossier.poseur || 'Karim Bennani (Chef d\'atelier)',
        receptionnaireNom: dossier.client.nom,
        receptionnaireCin: dossier.client.cin,
        lignes: [
          {
            designation: `Pare-Brise conforme ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
            quantite: 1,
          },
          {
            designation: 'Kit colle & étanchéité polyuréthane certifié',
            quantite: 1,
          },
        ],
        observations: `Véhicule ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.immatriculation}) remis au client en parfait état de conformité.`,
      };
      setBonsLivraison((prev) => [matchedBL!, ...prev]);
    }
    setActiveBonLivraisonModal({ bonLivraison: matchedBL, dossier });
  };

  const stockCritiqueCount = stock.filter((a) => a.quantiteEnStock <= a.stockMinimumAlerte).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenNewDossier={() => setShowNewDossierModal(true)}
          dossiersCount={dossiers.length}
          stockAlerteCount={stockCritiqueCount}
          devisCount={devisList.length}
        />
      </div>

      {/* Mobile Header Bar */}
      <div className="md:hidden no-print fixed top-0 inset-x-0 bg-slate-900 text-white z-40 px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          <span className="font-black text-sm uppercase">GLOBAL PARE-BRISE</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="w-72 bg-slate-900 h-full p-4 flex flex-col justify-between">
            <Navigation
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
              }}
              onOpenNewDossier={() => {
                setShowNewDossierModal(true);
                setIsMobileMenuOpen(false);
              }}
              dossiersCount={dossiers.length}
              stockAlerteCount={stockCritiqueCount}
              devisCount={devisList.length}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto overflow-y-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            dossiers={dossiers}
            stock={stock}
            factures={factures}
            onOpenNewDossier={() => setShowNewDossierModal(true)}
            onSelectDossier={(d) => {
              setActiveTab('dossiers');
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'devis' && (
          <DevisView
            devisList={devisList}
            stockArticles={stock}
            assurances={assurances}
            onOpenNewDevis={() => {
              setEditingDevis(null);
              setShowNewDevisModal(true);
            }}
            onOpenEditDevis={(devis) => {
              setEditingDevis(devis);
              setShowNewDevisModal(true);
            }}
            onOpenViewDevis={(devis) => setActiveDevisModal(devis)}
            onUpdateStatutDevis={handleUpdateStatutDevis}
            onDeleteDevis={handleDeleteDevis}
            onConvertDevisEnDossier={handleConvertDevisEnDossier}
          />
        )}

        {activeTab === 'dossiers' && (
          <DossiersView
            dossiers={dossiers}
            onOpenNewDossier={() => setShowNewDossierModal(true)}
            onOpenQuittance={(d) => setActiveQuittanceDossier(d)}
            onOpenFacture={handleOpenFactureFromDossier}
            onOpenBonSortie={handleOpenBonSortieFromDossier}
            onOpenBonLivraison={handleOpenBonLivraisonFromDossier}
            onOpenDevis={handleOpenDevisFromDossier}
            onOpenDeclarationBrisGlace={(d) => setActiveDeclarationBrisGlaceDossier(d)}
            onOpenTransmettreAzurGlass={handleOpenTransmettreAzurGlass}
            onAddDocumentToDossier={handleAddDocumentToDossier}
            onUpdateStatut={handleUpdateStatutDossier}
            onOpenEncaisserModal={handleOpenEncaisserModalFromDossier}
          />
        )}

        {activeTab === 'stock' && (
          <StockView
            stock={stock}
            bonsSortie={bonsSortie}
            dossiers={dossiers}
            onAddStock={handleAddStock}
            onUpdateStock={handleUpdateStock}
            onDeleteStock={handleDeleteStock}
            onOpenBonSortie={(bs, dossier) => setActiveBonSortieModal({ bonSortie: bs, dossier })}
          />
        )}

        {activeTab === 'facturation' && (
          <FacturationView
            factures={factures}
            dossiers={dossiers}
            onOpenFactureModal={(fac, d) => setActiveFactureModal({ facture: fac, dossier: d })}
            onMarquerPayee={handleMarquerFacturePayee}
            onOpenEncaisserModal={(fac, d) => setActiveEncaisserModal({ facture: fac, dossier: d })}
          />
        )}

        {activeTab === 'recettes' && (
          <RecettesView
            recettes={recettes}
            dossiers={dossiers}
            onAddRecette={handleAddRecette}
            onUpdateStatutRecette={handleUpdateStatutRecette}
          />
        )}

        {activeTab === 'rapports' && (
          <RapportsExportView
            dossiers={dossiers}
            assurances={assurances}
            recettes={recettes}
          />
        )}

        {activeTab === 'assurances' && (
          <AssurancesView
            assurances={assurances}
            dossiers={dossiers}
            factures={factures}
            onAddAssurance={handleAddAssurance}
            onUpdateAssurance={handleUpdateAssurance}
            onDeleteAssurance={handleDeleteAssurance}
          />
        )}

        {activeTab === 'partenaires' && (
          <PartenairesView
            partenaires={partenaires}
            dossiers={dossiers}
            onAddPartenaire={handleAddPartenaire}
            onUpdatePartenaire={handleUpdatePartenaire}
            onDeletePartenaire={handleDeletePartenaire}
          />
        )}

        {activeTab === 'fournisseurs' && (
          <FournisseursView
            fournisseurs={fournisseurs}
            commandes={commandesFournisseurs}
            stockArticles={stock}
            onAddFournisseur={handleAddFournisseur}
            onUpdateFournisseur={handleUpdateFournisseur}
            onDeleteFournisseur={handleDeleteFournisseur}
            onCreateCommande={handleCreateCommandeFournisseur}
            onUpdateCommande={handleUpdateCommandeFournisseur}
            onOpenCommandeModal={handleOpenCommandeFournisseurModal}
          />
        )}
      </main>

      {/* Modals & Printable Windows */}
      {showNewDossierModal && (
        <NewDossierModal
          assurances={assurances}
          partenaires={partenaires}
          stockArticles={stock}
          onClose={() => setShowNewDossierModal(false)}
          onSubmit={handleCreateDossier}
        />
      )}

      {showNewDevisModal && (
        <NewDevisModal
          stockArticles={stock}
          assurances={assurances}
          initialDevis={editingDevis}
          onSave={handleSaveDevis}
          onClose={() => {
            setShowNewDevisModal(false);
            setEditingDevis(null);
          }}
        />
      )}

      {activeDevisModal && (
        <DevisClientModal
          devis={activeDevisModal}
          onClose={() => setActiveDevisModal(null)}
        />
      )}

      {activeQuittanceDossier && (
        <QuittanceModal
          dossier={activeQuittanceDossier}
          onClose={() => setActiveQuittanceDossier(null)}
        />
      )}

      {activeDeclarationBrisGlaceDossier && (
        <DeclarationBrisGlaceModal
          dossier={activeDeclarationBrisGlaceDossier}
          onClose={() => setActiveDeclarationBrisGlaceDossier(null)}
        />
      )}

      {activeFactureModal && (
        <FactureModal
          facture={activeFactureModal.facture}
          dossier={activeFactureModal.dossier}
          onClose={() => setActiveFactureModal(null)}
        />
      )}

      {activeBonSortieModal && (
        <BonSortieModal
          bonSortie={activeBonSortieModal.bonSortie}
          dossier={activeBonSortieModal.dossier}
          onClose={() => setActiveBonSortieModal(null)}
        />
      )}

      {activeBonLivraisonModal && (
        <BonLivraisonModal
          bonLivraison={activeBonLivraisonModal.bonLivraison}
          dossier={activeBonLivraisonModal.dossier}
          onClose={() => setActiveBonLivraisonModal(null)}
        />
      )}

      {activeEncaisserModal && (
        <EncaisserPaiementModal
          dossier={activeEncaisserModal.dossier}
          facture={activeEncaisserModal.facture}
          onClose={() => setActiveEncaisserModal(null)}
          onConfirmPaiement={handleConfirmerEncaissement}
        />
      )}

      {activeCommandeFournisseurModal && (
        <BonCommandeFournisseurModal
          commande={activeCommandeFournisseurModal.commande}
          fournisseur={activeCommandeFournisseurModal.fournisseur}
          onClose={() => setActiveCommandeFournisseurModal(null)}
        />
      )}

      {activeTransmettreAzurGlassDossier && (
        <TransmettreAzurGlassModal
          dossier={activeTransmettreAzurGlassDossier}
          facture={factures.find((f) => f.dossierId === activeTransmettreAzurGlassDossier.id)}
          bonSortie={bonsSortie.find((b) => b.dossierId === activeTransmettreAzurGlassDossier.id)}
          bonLivraison={bonsLivraison.find((bl) => bl.dossierId === activeTransmettreAzurGlassDossier.id)}
          onClose={() => setActiveTransmettreAzurGlassDossier(null)}
          onSendComplete={handleSendCompleteAzurGlass}
        />
      )}
    </div>
  );
}
