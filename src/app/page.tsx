'use client';

import React, { useState, useEffect } from 'react';
import { 
  DossierSinistre, 
  ArticleStock, 
  Facture, 
  BonSortie, 
  BonLivraison,
  BonLivraisonLigne,
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
  StatutDevis,
  UserSession
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
  fetchFournisseursFromSupabase,
  fetchCommandesFournisseursFromSupabase,
  fetchPartenairesFromSupabase,
  saveDossierToSupabase,
  saveStockArticleToSupabase,
  saveFactureToSupabase,
  saveDevisToSupabase,
  deleteDevisFromSupabase,
  deleteDossierFromSupabase,
  saveFournisseurToSupabase,
  deleteFournisseurFromSupabase,
  saveCommandeFournisseurToSupabase,
  deleteCommandeFournisseurFromSupabase,
  savePartenaireToSupabase
} from '@/lib/supabaseService';
import { getActiveSupabaseSession, logoutSupabase } from '@/lib/authService';

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
import { UtilisateursView } from '@/components/views/UtilisateursView';

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
import { LoginView } from '@/components/auth/LoginView';
import { Menu, X, ShieldCheck, LogOut } from 'lucide-react';

// Helpers pour persistance locale partagée instantanée entre comptes (Admin & Assistante)
const loadSharedStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
      if (parsed && typeof parsed === 'object') return parsed as T;
    }
  } catch (e) {
    console.error(`Erreur lecture ${key}:`, e);
  }
  return fallback;
};

const saveSharedStorage = <T,>(key: string, data: T) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erreur écriture ${key}:`, e);
  }
};

export default function Home() {
  // Session & Rôles Utilisateurs
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data State - Données partagées persistantes
  const [dossiers, setDossiers] = useState<DossierSinistre[]>(() => loadSharedStorage('gp_shared_dossiers', INITIAL_DOSSIERS));
  const [stock, setStock] = useState<ArticleStock[]>(() => loadSharedStorage('gp_shared_stock', INITIAL_STOCK));
  const [factures, setFactures] = useState<Facture[]>(() => loadSharedStorage('gp_shared_factures', INITIAL_FACTURES));
  const [bonsSortie, setBonsSortie] = useState<BonSortie[]>(() => loadSharedStorage('gp_shared_bons_sortie', INITIAL_BONS_SORTIE));
  const [bonsLivraison, setBonsLivraison] = useState<BonLivraison[]>(() => loadSharedStorage('gp_shared_bons_livraison', INITIAL_BONS_LIVRAISON));
  const [recettes, setRecettes] = useState<ReglementRecette[]>(() => loadSharedStorage('gp_shared_recettes', INITIAL_RECETTES));
  const [assurances, setAssurances] = useState<Assurance[]>(INITIAL_ASSURANCES);
  const [partenaires, setPartenaires] = useState<Partenaire[]>(() => loadSharedStorage('gp_shared_partenaires', INITIAL_PARTENAIRES));
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(() => loadSharedStorage('gp_shared_fournisseurs', INITIAL_FOURNISSEURS));
  const [commandesFournisseurs, setCommandesFournisseurs] = useState<BonCommandeFournisseur[]>(() => loadSharedStorage('gp_shared_commandes', INITIAL_COMMANDES_FOURNISSEURS));
  const [devisList, setDevisList] = useState<DevisClient[]>(() => loadSharedStorage('gp_shared_devis', INITIAL_DEVIS));

  // Modals state
  const [showNewDossierModal, setShowNewDossierModal] = useState(false);
  const [activeQuittanceDossier, setActiveQuittanceDossier] = useState<DossierSinistre | null>(null);
  const [activeDeclarationBrisGlaceDossier, setActiveDeclarationBrisGlaceDossier] = useState<DossierSinistre | null>(null);
  const [activeFactureModal, setActiveFactureModal] = useState<{ facture: Facture; dossier: DossierSinistre } | null>(null);
  const [activeBonSortieModal, setActiveBonSortieModal] = useState<{ bonSortie: BonSortie; dossier: DossierSinistre } | null>(null);
  const [activeBonLivraisonModal, setActiveBonLivraisonModal] = useState<{ bonLivraison: BonLivraison; dossier: DossierSinistre; facture?: Facture } | null>(null);
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

  // Synchronisation avec Supabase Cloud
  const loadSupabaseData = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const [
        supaDossiers, 
        supaStock, 
        supaFactures, 
        supaDevis,
        supaFournisseurs,
        supaCommandes,
        supaPartenaires
      ] = await Promise.all([
        fetchDossiersFromSupabase(),
        fetchStockFromSupabase(),
        fetchFacturesFromSupabase(),
        fetchDevisFromSupabase(),
        fetchFournisseursFromSupabase(),
        fetchCommandesFournisseursFromSupabase(),
        fetchPartenairesFromSupabase(),
      ]);

      if (supaDossiers && supaDossiers.length > 0) {
        setDossiers(supaDossiers);
        saveSharedStorage('gp_shared_dossiers', supaDossiers);
      }
      if (supaStock && supaStock.length > 0) {
        setStock(supaStock);
        saveSharedStorage('gp_shared_stock', supaStock);
      }
      if (supaFactures && supaFactures.length > 0) {
        setFactures(supaFactures);
        saveSharedStorage('gp_shared_factures', supaFactures);
      }
      if (supaDevis && supaDevis.length > 0) {
        setDevisList(supaDevis);
        saveSharedStorage('gp_shared_devis', supaDevis);
      }
      if (supaFournisseurs && supaFournisseurs.length > 0) {
        setFournisseurs(supaFournisseurs);
        saveSharedStorage('gp_shared_fournisseurs', supaFournisseurs);
      }
      if (supaCommandes && supaCommandes.length > 0) {
        setCommandesFournisseurs(supaCommandes);
        saveSharedStorage('gp_shared_commandes', supaCommandes);
      }
      if (supaPartenaires && supaPartenaires.length > 0) {
        setPartenaires(supaPartenaires);
        saveSharedStorage('gp_shared_partenaires', supaPartenaires);
      }
    } catch (err) {
      console.error('Erreur chargement Supabase:', err);
    }
  };

  // Chargement strict de la session officielle Supabase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        const supaSession = await getActiveSupabaseSession();
        if (supaSession) {
          setCurrentUser(supaSession);
          localStorage.setItem('gp_user_session', JSON.stringify(supaSession));
        } else {
          localStorage.removeItem('gp_user_session');
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Erreur vérification session Supabase:', err);
        localStorage.removeItem('gp_user_session');
        setCurrentUser(null);
      } finally {
        setAuthLoaded(true);
      }
    };

    initAuth();
  }, []);

  const handleLogin = (session: UserSession) => {
    setCurrentUser(session);
    try {
      localStorage.setItem('gp_user_session', JSON.stringify(session));
    } catch (err) {
      console.error('Erreur stockage session:', err);
    }
    showToast(`Connexion réussie : Bienvenue ${session.nom} (${session.role === 'SUPERADMIN' ? 'Super Admin' : 'Assistante'})`);
    // Re-synchronisation immédiate de toutes les données du Cloud lors du changement de session
    loadSupabaseData();
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('gp_user_session');
      await logoutSupabase();
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
    showToast('Déconnexion effectuée.');
  };

  // Sécurité navigation : L'Assistante ne peut pas accéder aux recettes, rapports financiers ou gestion utilisateurs
  useEffect(() => {
    if (currentUser?.role === 'ASSISTANTE' && (activeTab === 'recettes' || activeTab === 'rapports' || activeTab === 'utilisateurs')) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Chargement des données réelles depuis Supabase Cloud au montage
  useEffect(() => {
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

    // Auto-generate Bon de Livraison strictly matching the vehicle & all prestations with prices
    const newBLLignes: BonLivraisonLigne[] = newFacture && newFacture.lignes.length > 0
      ? newFacture.lignes.map((l) => ({
          designation: l.designation,
          codeEurocode: l.codeEurocode,
          quantite: l.quantite,
          prixUnitaireHT: l.prixUnitaireHT,
          prixUnitaireTTC: +(l.prixUnitaireHT * 1.20).toFixed(2),
          totalHT: l.totalHT,
          totalTTC: +(l.totalHT * 1.20).toFixed(2),
        }))
      : finalBS.lignes.map((l) => ({
          designation: l.designation,
          codeEurocode: l.reference,
          quantite: l.quantite,
        }));

    const newBL: BonLivraison = {
      id: `bl-${Date.now()}`,
      numeroBL: `BL-2026-${seq}`,
      dossierId: newDossier.id,
      dateLivraison: newDossier.dateCreation,
      livreurPoseur: newDossier.poseur || 'Poseur Atelier',
      receptionnaireNom: newDossier.client.nom,
      receptionnaireCin: newDossier.client.cin,
      lignes: newBLLignes,
      totalHT: newFacture?.totalHT,
      totalTTC: newFacture?.totalTTC || newDossier.montantTotalTTC,
      montantFranchise: newDossier.montantFranchise,
      tvaExclue: newDossier.tvaExclueParAssurance,
      observations: `Véhicule ${newDossier.vehicule.marque} ${newDossier.vehicule.modele} (${newDossier.vehicule.immatriculation}) remis conforme.`,
    };

    const dossierWithDocs: DossierSinistre = {
      ...newDossier,
      bonSortieId: finalBS.id,
      bonLivraisonId: newBL.id,
    };

    const updatedDossiers = [dossierWithDocs, ...dossiers];
    setDossiers(updatedDossiers);
    saveSharedStorage('gp_shared_dossiers', updatedDossiers);

    const updatedBS = [finalBS, ...bonsSortie];
    setBonsSortie(updatedBS);
    saveSharedStorage('gp_shared_bons_sortie', updatedBS);

    const updatedBL = [newBL, ...bonsLivraison];
    setBonsLivraison(updatedBL);
    saveSharedStorage('gp_shared_bons_livraison', updatedBL);

    if (newBonSortie) {
      // Deduct stock for the article and the glue
      setStock((prev) => {
        const updatedStock = prev.map((art) => {
          const matchingLine = newBonSortie.lignes.find((l) => l.articleId === art.id);
          if (matchingLine) {
            const updatedArt = {
              ...art,
              quantiteEnStock: Math.max(0, art.quantiteEnStock - matchingLine.quantite),
            };
            saveStockArticleToSupabase(updatedArt);
            return updatedArt;
          }
          return art;
        });
        saveSharedStorage('gp_shared_stock', updatedStock);
        return updatedStock;
      });
    }

    if (newFacture) {
      const updatedFactures = [newFacture, ...factures];
      setFactures(updatedFactures);
      saveSharedStorage('gp_shared_factures', updatedFactures);
      saveFactureToSupabase(newFacture);
    }

    if (newRecette) {
      const updatedRecettes = [newRecette, ...recettes];
      setRecettes(updatedRecettes);
      saveSharedStorage('gp_shared_recettes', updatedRecettes);
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
    setStock((prev) => {
      const updated = [newArticle, ...prev];
      saveSharedStorage('gp_shared_stock', updated);
      return updated;
    });
    saveStockArticleToSupabase(newArticle);
    showToast(`Article ${newArticle.reference} ajouté au stock avec succès.`);
  };

  const handleUpdateStock = (updatedArticle: ArticleStock) => {
    setStock((prev) => {
      const updated = prev.map((a) => (a.id === updatedArticle.id ? updatedArticle : a));
      saveSharedStorage('gp_shared_stock', updated);
      return updated;
    });
    saveStockArticleToSupabase(updatedArticle);
    showToast(`Article ${updatedArticle.reference} mis à jour avec succès.`);
  };

  const handleDeleteStock = (articleId: string) => {
    setStock((prev) => {
      const updated = prev.filter((a) => a.id !== articleId);
      saveSharedStorage('gp_shared_stock', updated);
      return updated;
    });
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
    setPartenaires((prev) => {
      const updated = [newPart, ...prev];
      saveSharedStorage('gp_shared_partenaires', updated);
      return updated;
    });
    savePartenaireToSupabase(newPart);
    showToast(`Partenaire "${newPart.nom}" ajouté avec succès.`);
  };

  const handleUpdatePartenaire = (updatedPart: Partenaire) => {
    setPartenaires((prev) => {
      const updated = prev.map((p) => (p.id === updatedPart.id ? updatedPart : p));
      saveSharedStorage('gp_shared_partenaires', updated);
      return updated;
    });
    savePartenaireToSupabase(updatedPart);
    showToast(`Partenaire "${updatedPart.nom}" mis à jour.`);
  };

  const handleDeletePartenaire = (partenaireId: string) => {
    setPartenaires((prev) => {
      const updated = prev.filter((p) => p.id !== partenaireId);
      saveSharedStorage('gp_shared_partenaires', updated);
      return updated;
    });
    showToast('Partenaire supprimé.');
  };

  // CRUD Fournisseurs
  const handleAddFournisseur = (newFourn: Fournisseur) => {
    setFournisseurs((prev) => {
      const updated = [newFourn, ...prev];
      saveSharedStorage('gp_shared_fournisseurs', updated);
      return updated;
    });
    saveFournisseurToSupabase(newFourn);
    showToast(`Fournisseur "${newFourn.nom}" enregistré avec succès.`);
  };

  const handleUpdateFournisseur = (updatedFourn: Fournisseur) => {
    setFournisseurs((prev) => {
      const updated = prev.map((f) => (f.id === updatedFourn.id ? updatedFourn : f));
      saveSharedStorage('gp_shared_fournisseurs', updated);
      return updated;
    });
    saveFournisseurToSupabase(updatedFourn);
    showToast(`Fournisseur "${updatedFourn.nom}" mis à jour.`);
  };

  const handleDeleteFournisseur = (fournisseurId: string) => {
    setFournisseurs((prev) => {
      const updated = prev.filter((f) => f.id !== fournisseurId);
      saveSharedStorage('gp_shared_fournisseurs', updated);
      return updated;
    });
    deleteFournisseurFromSupabase(fournisseurId);
    showToast('Fournisseur supprimé avec succès.');
  };

  // Commandes Fournisseurs Handlers
  const handleCreateCommandeFournisseur = (newCmd: BonCommandeFournisseur) => {
    setCommandesFournisseurs((prev) => {
      const updated = [newCmd, ...prev];
      saveSharedStorage('gp_shared_commandes', updated);
      return updated;
    });
    saveCommandeFournisseurToSupabase(newCmd);
    showToast(`Bon de Commande ${newCmd.numeroBC} enregistré avec succès (${formatDH(newCmd.totalTTC)} TTC).`);
  };

  const handleUpdateCommandeFournisseur = (updatedCmd: BonCommandeFournisseur) => {
    setCommandesFournisseurs((prev) => {
      const updated = prev.map((c) => (c.id === updatedCmd.id ? updatedCmd : c));
      saveSharedStorage('gp_shared_commandes', updated);
      return updated;
    });
    saveCommandeFournisseurToSupabase(updatedCmd);
    showToast(`Commande ${updatedCmd.numeroBC} mise à jour avec succès.`);
  };

  const handleOpenCommandeFournisseurModal = (commande: BonCommandeFournisseur, fournisseur: Fournisseur) => {
    setActiveCommandeFournisseurModal({ commande, fournisseur });
  };

  // ----------------------------------------------------
  // DEVIS CLIENTS HANDLERS
  // ----------------------------------------------------
  const handleSaveDevis = (devis: DevisClient) => {
    setDevisList((prev) => {
      const exists = prev.some((d) => d.id === devis.id);
      const updated = exists
        ? prev.map((d) => (d.id === devis.id ? devis : d))
        : [devis, ...prev];
      saveSharedStorage('gp_shared_devis', updated);
      return updated;
    });
    saveDevisToSupabase(devis);
    showToast(`Devis ${devis.numeroDevis} enregistré avec succès (${formatDH(devis.totalTTC)} TTC).`);
    setShowNewDevisModal(false);
    setEditingDevis(null);
  };

  const handleUpdateStatutDevis = (devisId: string, newStatut: StatutDevis) => {
    setDevisList((prev) => {
      const updated = prev.map((d) => {
        if (d.id === devisId) {
          const u = { ...d, statut: newStatut };
          saveDevisToSupabase(u);
          return u;
        }
        return d;
      });
      saveSharedStorage('gp_shared_devis', updated);
      return updated;
    });
    showToast(`Statut du devis mis à jour : ${newStatut}`);
  };

  const handleDeleteDevis = (devisId: string) => {
    setDevisList((prev) => {
      const updated = prev.filter((d) => d.id !== devisId);
      saveSharedStorage('gp_shared_devis', updated);
      return updated;
    });
    deleteDevisFromSupabase(devisId);
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
            designation: 'Kit colle polyuréthane & primaire d\'adhérence',
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
    setDossiers((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dossierId) {
          const u = { ...d, statut: newStatut };
          saveDossierToSupabase(u);
          return u;
        }
        return d;
      });
      saveSharedStorage('gp_shared_dossiers', updated);
      return updated;
    });
    showToast('Statut du dossier mis à jour.');
  };

  // ----------------------------------------------------
  // GESTION ARCHIVES / CORBEILLE & SÉCURITÉ 30 JOURS
  // ----------------------------------------------------
  const handleArchiveDossier = (dossierId: string, motif?: string) => {
    setDossiers((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dossierId) {
          const u: DossierSinistre = {
            ...d,
            isArchive: true,
            dateArchivage: new Date().toISOString(),
            statutPrecedent: d.statut !== 'ARCHIVE' ? d.statut : 'NOUVEAU',
            statut: 'ARCHIVE',
            motifArchivage: motif || 'Dossier archivé',
          };
          saveDossierToSupabase(u);
          return u;
        }
        return d;
      });
      saveSharedStorage('gp_shared_dossiers', updated);
      return updated;
    });
    showToast('Dossier placé en archive sécurisée (conservé 30 jours avant suppression automatique).');
  };

  const handleRestoreDossier = (dossierId: string) => {
    setDossiers((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dossierId) {
          const u: DossierSinistre = {
            ...d,
            isArchive: false,
            dateArchivage: undefined,
            statut: d.statutPrecedent || 'NOUVEAU',
          };
          saveDossierToSupabase(u);
          return u;
        }
        return d;
      });
      saveSharedStorage('gp_shared_dossiers', updated);
      return updated;
    });
    showToast('Dossier restauré avec succès dans les dossiers actifs.');
  };

  const handleDeleteDossierPermanent = async (dossierId: string) => {
    setDossiers((prev) => {
      const updated = prev.filter((d) => d.id !== dossierId);
      saveSharedStorage('gp_shared_dossiers', updated);
      return updated;
    });
    await deleteDossierFromSupabase(dossierId);
    showToast('Dossier supprimé définitivement de la base de données.');
  };

  const handlePurgeExpiredDossiers = async () => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expired = dossiers.filter(
      (d) => (d.isArchive || d.statut === 'ARCHIVE') && d.dateArchivage && (now - new Date(d.dateArchivage).getTime() >= thirtyDaysMs)
    );

    if (expired.length === 0) {
      showToast("Aucun dossier archivé n'a atteint les 30 jours de rétention.");
      return;
    }

    const expiredIds = expired.map((d) => d.id);
    setDossiers((prev) => prev.filter((d) => !expiredIds.includes(d.id)));
    for (const id of expiredIds) {
      await deleteDossierFromSupabase(id);
    }
    showToast(`Suppression automatique : ${expired.length} dossier(s) archivés de plus de 30 jours ont été purgés.`);
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
      const matchedArt = stock.find((s) => s.designation.toLowerCase().includes(dossier.vehicule.marque.toLowerCase())) || stock[0];
      matchedBS = {
        id: `bs-${Date.now()}`,
        numeroBS: `BS-2026-${seq}`,
        dossierId: dossier.id,
        dateSortie: dossier.dateCreation,
        poseur: dossier.poseur || 'Poseur Atelier',
        lignes: [
          {
            articleId: matchedArt?.id || `art-auto-${dossier.id}`,
            reference: matchedArt?.reference || `PB-${(dossier.vehicule.marque || 'VEH').slice(0, 3).toUpperCase()}`,
            designation: `Pare-Brise conforme ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
            quantite: 1,
            rayon: matchedArt?.rayon || matchedArt?.emplacement || 'A6',
          },
          {
            articleId: 'art-6',
            reference: 'COLLE-SIKA-DRIVE',
            designation: 'Cartouche Mastic Polyuréthane SikaTack Drive (300ml)',
            quantite: 1,
            rayon: 'ACC-01',
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
    const matchedFacture = factures.find((f) => f.dossierId === dossier.id);

    if (!matchedBL) {
      const seq = Math.floor(1000 + Math.random() * 9000);
      const newLignes: BonLivraisonLigne[] = matchedFacture && matchedFacture.lignes.length > 0
        ? matchedFacture.lignes.map((l) => ({
            designation: l.designation,
            codeEurocode: l.codeEurocode,
            quantite: l.quantite,
            prixUnitaireHT: l.prixUnitaireHT,
            prixUnitaireTTC: +(l.prixUnitaireHT * 1.20).toFixed(2),
            totalHT: l.totalHT,
            totalTTC: +(l.totalHT * 1.20).toFixed(2),
          }))
        : [
            {
              designation: `Pare-Brise conforme ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
              quantite: 1,
              prixUnitaireTTC: Math.max(0, dossier.montantTotalTTC - 300),
              totalTTC: Math.max(0, dossier.montantTotalTTC - 300),
            },
            {
              designation: 'Kit colle polyuréthane & primaire d\'adhérence certifié',
              quantite: 1,
              prixUnitaireTTC: 180,
              totalTTC: 180,
            },
            {
              designation: 'Main d\'œuvre pose et dépose vitrage collé',
              quantite: 1,
              prixUnitaireTTC: 120,
              totalTTC: 120,
            },
          ];

      matchedBL = {
        id: `bl-${Date.now()}`,
        numeroBL: `BL-2026-${seq}`,
        dossierId: dossier.id,
        dateLivraison: dossier.dateCreation,
        livreurPoseur: dossier.poseur || 'Karim Bennani (Chef d\'atelier)',
        receptionnaireNom: dossier.client.nom,
        receptionnaireCin: dossier.client.cin,
        lignes: newLignes,
        totalHT: matchedFacture?.totalHT,
        totalTTC: matchedFacture?.totalTTC || dossier.montantTotalTTC,
        montantFranchise: dossier.montantFranchise,
        tvaExclue: dossier.tvaExclueParAssurance,
        observations: `Véhicule ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.immatriculation}) remis au client en parfait état de conformité.`,
      };
      setBonsLivraison((prev) => [matchedBL!, ...prev]);
    }
    setActiveBonLivraisonModal({ bonLivraison: matchedBL, dossier, facture: matchedFacture });
  };

  const handleUpdateBonLivraisonObservations = (newObservations: string) => {
    if (!activeBonLivraisonModal) return;
    const blId = activeBonLivraisonModal.bonLivraison.id;
    setBonsLivraison((prev) =>
      prev.map((b) => (b.id === blId ? { ...b, observations: newObservations } : b))
    );
    setActiveBonLivraisonModal((prev) =>
      prev ? { ...prev, bonLivraison: { ...prev.bonLivraison, observations: newObservations } } : null
    );
  };

  const handleUpdateFactureObservations = (newObservations: string) => {
    if (!activeFactureModal) return;
    const facId = activeFactureModal.facture.id;
    setFactures((prev) =>
      prev.map((f) => (f.id === facId ? { ...f, observations: newObservations } : f))
    );
    setActiveFactureModal((prev) =>
      prev ? { ...prev, facture: { ...prev.facture, observations: newObservations } } : null
    );
  };

  const stockCritiqueCount = stock.filter((a) => a.quantiteEnStock <= a.stockMinimumAlerte).length;

  // Écran d'attente lors du chargement de la session
  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <ShieldCheck className="w-12 h-12 text-sky-400 animate-pulse" />
        <p className="text-sm font-bold text-slate-400">Chargement de Global Pare-Brise...</p>
      </div>
    );
  }

  // Écran de Connexion si aucune session active
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

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
          userSession={currentUser}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Header Bar */}
      <div className="md:hidden no-print fixed top-0 inset-x-0 bg-slate-900 text-white z-40 px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          <span className="font-black text-sm uppercase">GLOBAL PARE-BRISE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-bold">
            {currentUser?.role === 'SUPERADMIN' ? (
              <span className="text-amber-300">👑 Admin</span>
            ) : (
              <span className="text-sky-300">👩‍💼 Assistante</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
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
              userSession={currentUser}
              onLogout={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
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
            userRole={currentUser?.role}
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
            onArchiveDossier={handleArchiveDossier}
            onRestoreDossier={handleRestoreDossier}
            onDeleteDossierPermanent={handleDeleteDossierPermanent}
            onPurgeExpiredDossiers={handlePurgeExpiredDossiers}
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

        {activeTab === 'recettes' && currentUser?.role === 'SUPERADMIN' && (
          <RecettesView
            recettes={recettes}
            dossiers={dossiers}
            onAddRecette={handleAddRecette}
            onUpdateStatutRecette={handleUpdateStatutRecette}
          />
        )}

        {activeTab === 'rapports' && currentUser?.role === 'SUPERADMIN' && (
          <RapportsExportView
            dossiers={dossiers}
            assurances={assurances}
            recettes={recettes}
            bonsSortie={bonsSortie}
            factures={factures}
          />
        )}

        {activeTab === 'utilisateurs' && currentUser?.role === 'SUPERADMIN' && (
          <UtilisateursView currentAdmin={currentUser} />
        )}

        {activeTab === 'assurances' && (
          <AssurancesView
            assurances={assurances}
            dossiers={dossiers}
            factures={factures}
            onAddAssurance={handleAddAssurance}
            onUpdateAssurance={handleUpdateAssurance}
            onDeleteAssurance={handleDeleteAssurance}
            onUpdateStatutDossier={handleUpdateStatutDossier}
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
          onAddPartenaire={handleAddPartenaire}
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
          onUpdateObservations={handleUpdateFactureObservations}
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
          facture={activeBonLivraisonModal.facture}
          onClose={() => setActiveBonLivraisonModal(null)}
          onUpdateObservations={handleUpdateBonLivraisonObservations}
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
