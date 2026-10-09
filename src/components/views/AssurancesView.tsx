'use client';

import React, { useState, useMemo } from 'react';
import { Assurance, DossierSinistre, Facture, TypeClientAssurance, StatutDossier } from '@/types';
import { formatDH, formatDate } from '@/lib/utils';
import { GARAGE_INFO, AZUR_GLASS_INFO } from '@/lib/data';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { 
  Shield, 
  ShieldCheck,
  Building,
  Building2,
  Clock, 
  Printer, 
  FileSpreadsheet, 
  X, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle,
  Car,
  FileCheck,
  ArrowRight,
  Filter,
  CheckCircle2,
  Send,
  Coins,
  ChevronDown
} from 'lucide-react';

interface Props {
  assurances: Assurance[];
  dossiers: DossierSinistre[];
  factures: Facture[];
  onAddAssurance: (assurance: Assurance) => void;
  onUpdateAssurance: (assurance: Assurance) => void;
  onDeleteAssurance: (assuranceId: string) => void;
  onUpdateStatutDossier?: (dossierId: string, newStatut: StatutDossier) => void;
}

export const AssurancesView: React.FC<Props> = ({
  assurances,
  dossiers,
  factures,
  onAddAssurance,
  onUpdateAssurance,
  onDeleteAssurance,
  onUpdateStatutDossier,
}) => {
  // Navigation interne entre le suivi des dossiers AZUR GLASS et le répertoire des compagnies
  const [activeSubTab, setActiveSubTab] = useState<'DossiersAzur' | 'Compagnies'>('DossiersAzur');

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeClient, setSelectedTypeClient] = useState<string>('ALL'); // 'ALL', 'PARTICULIER', 'PROFESSIONNEL', 'AGENCE_LOCATION'
  const [selectedAssuranceId, setSelectedAssuranceId] = useState<string>('ALL');
  const [selectedStatutAzur, setSelectedStatutAzur] = useState<string>('ALL'); // 'ALL', 'A_TRANSMETTRE', 'TRANSMIS', 'ACCORD', 'REGLE'

  // Modal Bordereau d'envoi récapitulatif AZUR GLASS
  const [showBordereauModal, setShowBordereauModal] = useState(false);

  // Modal Ajout/Modification Assurance
  const [showModal, setShowModal] = useState(false);
  const [editingAssurance, setEditingAssurance] = useState<Assurance | null>(null);
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [delai, setDelai] = useState<number>(30);
  const [assuranceToDelete, setAssuranceToDelete] = useState<Assurance | null>(null);

  // Tous les dossiers confiés à AZUR GLASS (dossiers de type ASSURANCE)
  const allDossiersAssurance = useMemo(() => {
    return dossiers.filter((d) => d.typeDossier === 'ASSURANCE');
  }, [dossiers]);

  // Filtrage des dossiers pour AZUR GLASS
  const filteredDossiersAzur = useMemo(() => {
    return allDossiersAssurance.filter((d) => {
      // Filtre Recherche
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        !term ||
        d.numeroDossier.toLowerCase().includes(term) ||
        d.client.nom.toLowerCase().includes(term) ||
        (d.client.telephone && d.client.telephone.includes(term)) ||
        d.vehicule.immatriculation.toLowerCase().includes(term) ||
        (d.assurance?.nom && d.assurance.nom.toLowerCase().includes(term)) ||
        (d.agenceAssurance && d.agenceAssurance.toLowerCase().includes(term)) ||
        (d.numeroSinistre && d.numeroSinistre.toLowerCase().includes(term)) ||
        (d.referenceDossierAzurGlass && d.referenceDossierAzurGlass.toLowerCase().includes(term));

      // Filtre Type Client
      const matchType = 
        selectedTypeClient === 'ALL' ||
        (selectedTypeClient === 'PARTICULIER' && (!d.typeClientAssurance || d.typeClientAssurance === 'PARTICULIER')) ||
        (selectedTypeClient === 'PROFESSIONNEL' && d.typeClientAssurance === 'PROFESSIONNEL') ||
        (selectedTypeClient === 'AGENCE_LOCATION' && d.typeClientAssurance === 'AGENCE_LOCATION');

      // Filtre Compagnie
      const matchAssurance = 
        selectedAssuranceId === 'ALL' ||
        d.assurance?.id === selectedAssuranceId;

      // Filtre Statut AZUR GLASS
      let matchStatut = true;
      if (selectedStatutAzur === 'A_TRANSMETTRE') {
        matchStatut = d.statut !== 'ENVOYE_AZUR_GLASS' && d.statut !== 'ACCORD_RECUE_AZUR_GLASS' && d.statut !== 'VALIDE_REGLE';
      } else if (selectedStatutAzur === 'TRANSMIS') {
        matchStatut = d.statut === 'ENVOYE_AZUR_GLASS' || d.statut === 'DEPOSE_ASSURANCE';
      } else if (selectedStatutAzur === 'ACCORD') {
        matchStatut = d.statut === 'ACCORD_RECUE_AZUR_GLASS';
      } else if (selectedStatutAzur === 'REGLE') {
        matchStatut = d.statut === 'VALIDE_REGLE';
      }

      return matchSearch && matchType && matchAssurance && matchStatut;
    });
  }, [allDossiersAssurance, searchTerm, selectedTypeClient, selectedAssuranceId, selectedStatutAzur]);

  // Totaux financiers pour les dossiers AZUR GLASS
  const statsAzur = useMemo(() => {
    let totalPrestationsTTC = 0;
    let totalFranchises = 0;
    let totalTvaExclue = 0;
    let totalNetReversementAttendu = 0;
    let totalRegle = 0;

    allDossiersAssurance.forEach((d) => {
      const montantTTC = d.montantTotalTTC || 0;
      const franchise = !d.franchiseOfferte ? (d.montantFranchise || 0) : 0;
      const tvaExclue = d.tvaExclueParAssurance || 0;
      const reversementNet = d.montantReversementAzurGlass || Math.max(0, montantTTC - franchise - tvaExclue);

      totalPrestationsTTC += montantTTC;
      totalFranchises += franchise;
      totalTvaExclue += tvaExclue;
      totalNetReversementAttendu += reversementNet;

      if (d.statut === 'VALIDE_REGLE') {
        totalRegle += reversementNet;
      }
    });

    const resteEnAttente = Math.max(0, totalNetReversementAttendu - totalRegle);

    return {
      totalDossiers: allDossiersAssurance.length,
      totalPrestationsTTC,
      totalFranchises,
      totalTvaExclue,
      totalNetReversementAttendu,
      totalRegle,
      resteEnAttente,
      particuliersCount: allDossiersAssurance.filter((d) => !d.typeClientAssurance || d.typeClientAssurance === 'PARTICULIER').length,
      proCount: allDossiersAssurance.filter((d) => d.typeClientAssurance === 'PROFESSIONNEL').length,
      locationCount: allDossiersAssurance.filter((d) => d.typeClientAssurance === 'AGENCE_LOCATION').length,
    };
  }, [allDossiersAssurance]);

  // Handlers pour ajout/édition de compagnie
  const openAddModal = () => {
    setEditingAssurance(null);
    setNom('');
    setCode('');
    setTelephone('');
    setEmail('');
    setAdresse('Marrakech, Maroc');
    setDelai(30);
    setShowModal(true);
  };

  const openEditModal = (ass: Assurance) => {
    setEditingAssurance(ass);
    setNom(ass.nom);
    setCode(ass.code);
    setTelephone(ass.telephone);
    setEmail(ass.email);
    setAdresse(ass.adresse);
    setDelai(ass.delaiReglementMoyenJours);
    setShowModal(true);
  };

  const handleSaveAssurance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    if (editingAssurance) {
      onUpdateAssurance({
        ...editingAssurance,
        nom,
        code: code || nom.slice(0, 4).toUpperCase(),
        telephone,
        email,
        adresse,
        delaiReglementMoyenJours: Number(delai) || 30,
      });
    } else {
      const newAss: Assurance = {
        id: `ass-${Date.now()}`,
        nom,
        code: code || nom.slice(0, 4).toUpperCase(),
        telephone,
        email,
        adresse,
        delaiReglementMoyenJours: Number(delai) || 30,
      };
      onAddAssurance(newAss);
    }

    setShowModal(false);
  };

  const confirmDelete = () => {
    if (assuranceToDelete) {
      onDeleteAssurance(assuranceToDelete.id);
      setAssuranceToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* BANNER PRINCIPAL : PARTENAIRE DÉCLARANT AZUR GLASS SARL                    */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Intermédiaire Déclarant Exclusif des Assurances
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Convention Tiers-Payant</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <span>{AZUR_GLASS_INFO.nom}</span>
              <span className="text-sm font-semibold text-indigo-300 normal-case bg-indigo-900/60 px-2.5 py-0.5 rounded-lg border border-indigo-700/60">
                Centre Partenaire Agréé
              </span>
            </h1>

            <p className="text-xs text-indigo-200 mt-1 max-w-3xl leading-relaxed">
              Global Pare-Brise traite les déclarations d'assurance en collaboration avec <strong>AZUR GLASS SARL</strong> (ICE: {AZUR_GLASS_INFO.ice}). AZUR GLASS centralise les dossiers (quittances, factures, déclarations bris de glaces pour personnes morales), obtient les accords auprès des compagnies et assure le reversement à notre garage.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {AZUR_GLASS_INFO.adresse}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> {AZUR_GLASS_INFO.telephone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> {AZUR_GLASS_INFO.email}
              </span>
            </div>
          </div>

          {/* Action imprimer bordereau global */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto flex-shrink-0">
            <button
              onClick={() => setShowBordereauModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Bordereau Récapitulatif AZUR GLASS</span>
            </button>
          </div>
        </div>

        {/* CARTES STATS FINANCIÈRES AZUR GLASS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-indigo-900/60">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-indigo-900/40">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Dossiers Confiés</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">{statsAzur.totalDossiers}</span>
            <span className="text-[10px] text-indigo-300">100% via AZUR GLASS</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-indigo-900/40">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Prestations</span>
            <span className="text-lg font-black text-sky-400 font-mono mt-0.5 block">{formatDH(statsAzur.totalPrestationsTTC)}</span>
            <span className="text-[10px] text-slate-400">Montants TTC bruts</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-indigo-900/40">
            <span className="text-[10px] text-amber-300 font-bold uppercase block">Franchises Exclues</span>
            <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">-{formatDH(statsAzur.totalFranchises)}</span>
            <span className="text-[10px] text-slate-400">Payées par clients</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-indigo-900/40">
            <span className="text-[10px] text-rose-300 font-bold uppercase block">TVA Pro Exclue</span>
            <span className="text-lg font-black text-rose-400 font-mono mt-0.5 block">-{formatDH(statsAzur.totalTvaExclue)}</span>
            <span className="text-[10px] text-slate-400">Pro & Agences Location</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-indigo-900/40">
            <span className="text-[10px] text-emerald-300 font-bold uppercase block">Net Reversement</span>
            <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">{formatDH(statsAzur.totalNetReversementAttendu)}</span>
            <span className="text-[10px] text-slate-400">Part revenant au garage</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-indigo-900/40">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">Reste en Attente</span>
            <span className="text-lg font-black text-amber-300 font-mono mt-0.5 block">{formatDH(statsAzur.resteEnAttente)}</span>
            <span className="text-[10px] text-emerald-400">{formatDH(statsAzur.totalRegle)} réglé</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ONGLETS INTERNES : SUIVI AZUR GLASS VS COMPAGNIES / AGENCES LOCALES         */}
      {/* ========================================================================= */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('DossiersAzur')}
          className={`py-3 px-5 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'DossiersAzur'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Suivi des Dossiers AZUR GLASS ({allDossiersAssurance.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('Compagnies')}
          className={`py-3 px-5 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'Compagnies'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Compagnies d'Assurance & Agences Locales ({assurances.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* CONTENU ONGLET 1 : SUIVI DÉTAILLÉ DES DOSSIERS AZUR GLASS                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'DossiersAzur' && (
        <div className="space-y-4">
          
          {/* BARRE DE FILTRES COMPLÈTE */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            
            {/* Ligne 1 : Catégorie Client (Particulier, Pro, Agence de Location) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Catégorie :
                </span>
                
                <button
                  onClick={() => setSelectedTypeClient('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTypeClient === 'ALL'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous ({allDossiersAssurance.length})
                </button>

                <button
                  onClick={() => setSelectedTypeClient('PARTICULIER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedTypeClient === 'PARTICULIER'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Particuliers ({statsAzur.particuliersCount})</span>
                </button>

                <button
                  onClick={() => setSelectedTypeClient('PROFESSIONNEL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedTypeClient === 'PROFESSIONNEL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Professionnels & Sociétés ({statsAzur.proCount})</span>
                  <span className="text-[10px] bg-indigo-900/20 px-1 rounded font-normal">TVA Exclue</span>
                </button>

                <button
                  onClick={() => setSelectedTypeClient('AGENCE_LOCATION')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedTypeClient === 'AGENCE_LOCATION'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Agences de Location ({statsAzur.locationCount})</span>
                </button>
              </div>

              {/* Bouton pour réinitialiser les filtres */}
              {(selectedTypeClient !== 'ALL' || selectedAssuranceId !== 'ALL' || selectedStatutAzur !== 'ALL' || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedTypeClient('ALL');
                    setSelectedAssuranceId('ALL');
                    setSelectedStatutAzur('ALL');
                    setSearchTerm('');
                  }}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {/* Ligne 2 : Sélecteurs & Recherche textuelle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              {/* Recherche globale */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Client, matricule, agence, n° sinistre..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filtre Compagnie d'assurance */}
              <div>
                <select
                  value={selectedAssuranceId}
                  onChange={(e) => setSelectedAssuranceId(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Toutes les Compagnies d'Assurance</option>
                  {assurances.map((ass) => (
                    <option key={ass.id} value={ass.id}>
                      {ass.nom} ({ass.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Statut de traitement AZUR GLASS */}
              <div>
                <select
                  value={selectedStatutAzur}
                  onChange={(e) => setSelectedStatutAzur(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tous les Statuts AZUR GLASS</option>
                  <option value="A_TRANSMETTRE">1. À Transmettre à AZUR GLASS</option>
                  <option value="TRANSMIS">2. Transmis / Déposé chez AZUR GLASS</option>
                  <option value="ACCORD">3. Accord Reçu d'AZUR GLASS</option>
                  <option value="REGLE">4. Réglé / Virement Reçu d'AZUR GLASS</option>
                </select>
              </div>

              {/* Compteur résultats */}
              <div className="flex items-center justify-end text-xs font-bold text-slate-500 pr-2">
                <span>{filteredDossiersAzur.length} dossier(s) affiché(s)</span>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* TABLEAU PRINCIPAL DES DOSSIERS TRANSMIS À AZUR GLASS                       */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Dossier & Date</th>
                    <th className="p-3.5">Client & Véhicule</th>
                    <th className="p-3.5">Régime Client</th>
                    <th className="p-3.5">Compagnie & Agence Locale</th>
                    <th className="p-3.5 text-right">Montant TTC</th>
                    <th className="p-3.5 text-right">Déductions</th>
                    <th className="p-3.5 text-right bg-emerald-50/60 text-emerald-950">Net Reversement AZUR</th>
                    <th className="p-3.5 text-center">Statut AZUR GLASS</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDossiersAzur.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                        Aucun dossier ne correspond à vos critères de recherche pour AZUR GLASS.
                      </td>
                    </tr>
                  ) : (
                    filteredDossiersAzur.map((dossier) => {
                      const franchise = !dossier.franchiseOfferte ? (dossier.montantFranchise || 0) : 0;
                      const tvaExclue = dossier.tvaExclueParAssurance || 0;
                      const reversementNet = dossier.montantReversementAzurGlass || Math.max(0, dossier.montantTotalTTC - franchise - tvaExclue);

                      return (
                        <tr key={dossier.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* 1. Dossier & Date */}
                          <td className="p-3.5">
                            <span className="font-mono font-black text-slate-900 block">{dossier.numeroDossier}</span>
                            <span className="text-[10px] text-slate-400">{dossier.dateCreation}</span>
                          </td>

                          {/* 2. Client & Véhicule */}
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900">{dossier.client.nom}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {dossier.vehicule.marque} {dossier.vehicule.modele} • {formatMatricule(dossier.vehicule.immatriculation)}
                            </div>
                          </td>

                          {/* 3. Régime Client (Particulier / Pro / Location) */}
                          <td className="p-3.5">
                            {dossier.typeClientAssurance === 'PROFESSIONNEL' ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                                  <Building2 className="w-3 h-3" /> Société / Pro
                                </span>
                                <span className="block text-[9px] text-indigo-600 font-semibold mt-0.5">
                                  Cachet société + TVA Déduite
                                </span>
                              </div>
                            ) : dossier.typeClientAssurance === 'AGENCE_LOCATION' ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                                  <Car className="w-3 h-3" /> Agence Location
                                </span>
                                <span className="block text-[9px] text-purple-600 font-semibold mt-0.5">
                                  Flotte / TVA Déduite
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                Particulier
                              </span>
                            )}
                          </td>

                          {/* 4. Compagnie & Agence Locale */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-brand-600" />
                              <span>{dossier.assurance?.nom || 'Compagnie non définie'}</span>
                            </div>
                            
                            {/* Agence d'assurance déclarée */}
                            {dossier.agenceAssurance && (
                              <div className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3 text-indigo-500" />
                                <span>{dossier.agenceAssurance}</span>
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {dossier.numeroSinistre ? `Sinistre: ${dossier.numeroSinistre}` : dossier.numeroPolice ? `Police: ${dossier.numeroPolice}` : 'Sans n° sinistre'}
                            </div>
                          </td>

                          {/* 5. Montant TTC */}
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            {formatDH(dossier.montantTotalTTC)}
                          </td>

                          {/* 6. Déductions (Franchise + TVA Pro) */}
                          <td className="p-3.5 text-right font-mono text-[11px]">
                            {franchise > 0 && (
                              <div className="text-amber-700">
                                <span>Franchise : </span>
                                <strong>-{formatDH(franchise)}</strong>
                              </div>
                            )}
                            {tvaExclue > 0 && (
                              <div className="text-rose-700 font-bold">
                                <span>TVA Pro : </span>
                                <strong>-{formatDH(tvaExclue)}</strong>
                              </div>
                            )}
                            {franchise === 0 && tvaExclue === 0 && (
                              <span className="text-slate-400 text-[10px]">Aucune déduction</span>
                            )}
                          </td>

                          {/* 7. Net Reversement AZUR GLASS */}
                          <td className="p-3.5 text-right font-mono font-black text-sm text-emerald-700 bg-emerald-50/60">
                            {formatDH(reversementNet)}
                          </td>

                          {/* 8. Statut AZUR GLASS */}
                          <td className="p-3.5 text-center">
                            {dossier.statut === 'VALIDE_REGLE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Virement Reçu
                              </span>
                            ) : dossier.statut === 'ACCORD_RECUE_AZUR_GLASS' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black uppercase">
                                <Check className="w-3 h-3" /> Accord Reçu
                              </span>
                            ) : dossier.statut === 'ENVOYE_AZUR_GLASS' || dossier.statut === 'DEPOSE_ASSURANCE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                                <Send className="w-3 h-3" /> Transmis AZUR
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                                <Clock className="w-3 h-3" /> À Transmettre
                              </span>
                            )}

                            {dossier.dateEnvoiAzurGlass && (
                              <span className="block text-[9px] text-slate-400 mt-0.5">
                                Envoyé le {formatDate(dossier.dateEnvoiAzurGlass)}
                              </span>
                            )}
                          </td>

                          {/* 9. Actions rapides de suivi */}
                          <td className="p-3.5 text-right">
                            {onUpdateStatutDossier && dossier.statut !== 'VALIDE_REGLE' && (
                              <button
                                onClick={() => onUpdateStatutDossier(dossier.id, 'VALIDE_REGLE')}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                                title="Marquer le reversement reçu d'AZUR GLASS"
                              >
                                ✓ Virement Reçu
                              </button>
                            )}
                            {dossier.statut === 'VALIDE_REGLE' && (
                              <span className="text-[10px] text-emerald-700 font-bold">Régularisé</span>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTENU ONGLET 2 : COMPAGNIES D'ASSURANCE & AGENCES LOCALES                */}
      {/* ========================================================================= */}
      {activeSubTab === 'Compagnies' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase">
                Répertoire des Compagnies d'Assurance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compagnies conventionnées transitant par l'intermédiaire AZUR GLASS
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une Compagnie</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assurances.map((ass) => {
              const dossiersAss = allDossiersAssurance.filter((d) => d.assurance?.id === ass.id);
              const totalFacture = dossiersAss.reduce((acc, d) => acc + d.montantTotalTTC, 0);
              const totalReversement = dossiersAss.reduce((acc, d) => acc + (d.montantReversementAzurGlass || d.montantTotalTTC), 0);

              return (
                <div key={ass.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{ass.nom}</h3>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">Code : {ass.code}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(ass)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setAssuranceToDelete(ass)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="my-3 space-y-1 text-slate-500 text-[11px]">
                      <p className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" /> {ass.telephone || 'Non renseigné'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" /> {ass.email || 'Non renseigné'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" /> {ass.adresse || 'Marrakech'}
                      </p>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100">
                      <div className="flex justify-between text-slate-600">
                        <span>Dossiers traités via AZUR :</span>
                        <strong className="text-slate-900">{dossiersAss.length}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Volume facturé TTC :</span>
                        <span className="font-mono font-semibold">{formatDH(totalFacture)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                        <span>Reversement attendu :</span>
                        <span className="font-mono">{formatDH(totalReversement)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE D'IMPRESSION DU BORDEREAU DE TRANSMISSION AZUR GLASS               */}
      {/* ========================================================================= */}
      {showBordereauModal && (
        <div className="fixed inset-0 z-50 bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4">
            
            {/* Header barre */}
            <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm uppercase">
                  Bordereau Récapitulatif de Transmission • AZUR GLASS
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Bordereau</span>
                </button>
                <button
                  onClick={() => setShowBordereauModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document imprimable A4 */}
            <div className="p-8 sm:p-12 text-slate-900 bg-white space-y-6 text-xs printable-document">
              
              {/* En-tête officiel Garage & Intermédiaire */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h1 className="text-xl font-black uppercase text-slate-950 tracking-tight">{GARAGE_INFO.nom}</h1>
                  <p className="text-slate-600 font-medium">{GARAGE_INFO.adresse}</p>
                  <p className="text-slate-600">Tél : {GARAGE_INFO.telephone}</p>
                  <p className="text-slate-600 font-mono text-[11px]">ICE : {GARAGE_INFO.ice} • RC : {GARAGE_INFO.rc}</p>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-right max-w-xs">
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">Destinataire Agréé</span>
                  <p className="font-black text-sm text-indigo-950 mt-1">{AZUR_GLASS_INFO.nom} SARL</p>
                  <p className="text-indigo-800 text-[11px]">{AZUR_GLASS_INFO.adresse}</p>
                  <p className="font-mono text-indigo-700 text-[10px]">ICE : {AZUR_GLASS_INFO.ice}</p>
                </div>
              </div>

              {/* Titre du bordereau */}
              <div className="text-center py-2">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-950 border-b border-t border-slate-300 py-2">
                  Bordereau Récapitulatif des Dossiers d'Assurances Transmis
                </h2>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                  <span>Date d'édition : {new Date().toLocaleDateString('fr-FR')}</span>
                  <span>Nombre de dossiers : {filteredDossiersAzur.length}</span>
                </div>
              </div>

              {/* Tableau imprimable */}
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">N° Dossier</th>
                    <th className="p-2 border-r border-slate-300">Client / Société</th>
                    <th className="p-2 border-r border-slate-300">Véhicule</th>
                    <th className="p-2 border-r border-slate-300">Compagnie & Agence</th>
                    <th className="p-2 border-r border-slate-300">Régime</th>
                    <th className="p-2 border-r border-slate-300 text-right">Prestation TTC</th>
                    <th className="p-2 border-r border-slate-300 text-right">Franchise</th>
                    <th className="p-2 border-r border-slate-300 text-right">TVA Pro</th>
                    <th className="p-2 text-right">Net AZUR GLASS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDossiersAzur.map((d) => {
                    const franchise = !d.franchiseOfferte ? (d.montantFranchise || 0) : 0;
                    const tvaExclue = d.tvaExclueParAssurance || 0;
                    const net = d.montantReversementAzurGlass || Math.max(0, d.montantTotalTTC - franchise - tvaExclue);

                    return (
                      <tr key={d.id}>
                        <td className="p-2 font-mono font-bold border-r border-slate-200">{d.numeroDossier}</td>
                        <td className="p-2 border-r border-slate-200">{d.client.nom}</td>
                        <td className="p-2 font-mono border-r border-slate-200">{d.vehicule.immatriculation}</td>
                        <td className="p-2 border-r border-slate-200">
                          {d.assurance?.nom} {d.agenceAssurance ? `(${d.agenceAssurance})` : ''}
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          {d.typeClientAssurance === 'PROFESSIONNEL' ? 'Pro' : d.typeClientAssurance === 'AGENCE_LOCATION' ? 'Location' : 'Particulier'}
                        </td>
                        <td className="p-2 text-right font-mono border-r border-slate-200">{formatDH(d.montantTotalTTC)}</td>
                        <td className="p-2 text-right font-mono border-r border-slate-200">{franchise > 0 ? `-${formatDH(franchise)}` : '0,00'}</td>
                        <td className="p-2 text-right font-mono border-r border-slate-200">{tvaExclue > 0 ? `-${formatDH(tvaExclue)}` : '0,00'}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatDH(net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold">
                  <tr>
                    <td colSpan={5} className="p-2 uppercase text-right border-r border-slate-300">Totaux Récapitulatifs :</td>
                    <td className="p-2 text-right font-mono border-r border-slate-300">
                      {formatDH(filteredDossiersAzur.reduce((acc, d) => acc + d.montantTotalTTC, 0))}
                    </td>
                    <td className="p-2 text-right font-mono border-r border-slate-300">
                      -{formatDH(filteredDossiersAzur.reduce((acc, d) => acc + (!d.franchiseOfferte ? (d.montantFranchise || 0) : 0), 0))}
                    </td>
                    <td className="p-2 text-right font-mono border-r border-slate-300">
                      -{formatDH(filteredDossiersAzur.reduce((acc, d) => acc + (d.tvaExclueParAssurance || 0), 0))}
                    </td>
                    <td className="p-2 text-right font-mono font-black text-sm text-slate-950">
                      {formatDH(filteredDossiersAzur.reduce((acc, d) => {
                        const franchise = !d.franchiseOfferte ? (d.montantFranchise || 0) : 0;
                        const tva = d.tvaExclueParAssurance || 0;
                        return acc + (d.montantReversementAzurGlass || Math.max(0, d.montantTotalTTC - franchise - tva));
                      }, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Relevé bancaire & Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 border-t border-slate-300">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">Coordonnées de Virement Bancaire (Global Pare-Brise) :</p>
                  <p className="font-mono text-slate-800 text-[11px]">Banque : Attijariwafa Bank</p>
                  <p className="font-mono text-slate-800 text-[11px]">RIB : {GARAGE_INFO.rib}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="h-28 border border-dashed border-slate-400 rounded-xl p-2 flex flex-col justify-between">
                    <span className="font-bold text-[10px] uppercase">Cachet Global Pare-Brise</span>
                  </div>
                  <div className="h-28 border border-dashed border-slate-400 rounded-xl p-2 flex flex-col justify-between">
                    <span className="font-bold text-[10px] uppercase">Réception & Accord AZUR GLASS</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE D'AJOUT / MODIFICATION D'UNE COMPAGNIE D'ASSURANCE                 */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm flex justify-center items-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                {editingAssurance ? "Modifier la Compagnie d'Assurance" : "Nouvelle Compagnie d'Assurance"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAssurance} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom de la Compagnie *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sanlam, Wafa Assurance, RMA..."
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code / Abréviation</label>
                  <input
                    type="text"
                    placeholder="Ex: SANLAM"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Délai moyen (jours)</label>
                  <input
                    type="number"
                    value={delai}
                    onChange={(e) => setDelai(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Téléphone de contact</label>
                <input
                  type="text"
                  placeholder="Ex: 0524405060"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email pour déclarations</label>
                <input
                  type="email"
                  placeholder="Ex: sinistres@compagnie.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse ou Siège régional</label>
                <input
                  type="text"
                  placeholder="Ex: Boulevard Mohammed V, Marrakech"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {assuranceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm flex justify-center items-center">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-900">Supprimer la compagnie {assuranceToDelete.nom} ?</h4>
            <p className="text-xs text-slate-500">Cette action ne supprimera pas les dossiers déjà enregistrés.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setAssuranceToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
