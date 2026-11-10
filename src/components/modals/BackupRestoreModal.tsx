'use client';

import React, { useState, useRef } from 'react';
import { 
  Database, 
  DownloadCloud, 
  UploadCloud, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Package, 
  Receipt, 
  Coins, 
  Truck, 
  Users, 
  Calendar,
  Loader2,
  HardDriveDownload,
  FolderArchive,
  RefreshCw
} from 'lucide-react';
import { 
  DossierSinistre, 
  ArticleStock, 
  Facture, 
  BonSortie, 
  BonLivraison, 
  ReglementRecette, 
  Assurance, 
  Partenaire, 
  Fournisseur, 
  BonCommandeFournisseur, 
  DevisClient, 
  UserSession 
} from '@/types';
import { 
  SystemBackupData, 
  generateSystemBackup, 
  downloadBackupFile, 
  validateBackupFile, 
  syncRestoredDataToSupabaseCloud 
} from '@/lib/backupService';
import { formatDate } from '@/lib/utils';

interface Props {
  currentUser: UserSession | null;
  dossiers: DossierSinistre[];
  stock: ArticleStock[];
  factures: Facture[];
  bonsSortie: BonSortie[];
  bonsLivraison: BonLivraison[];
  recettes: ReglementRecette[];
  assurances: Assurance[];
  partenaires: Partenaire[];
  fournisseurs: Fournisseur[];
  commandesFournisseurs: BonCommandeFournisseur[];
  devisList: DevisClient[];
  onClose: () => void;
  onRestoreDatasets: (restoredData: SystemBackupData['data'], mode: 'MERGE' | 'REPLACE') => Promise<void>;
  onShowToast: (message: string) => void;
}

export const BackupRestoreModal: React.FC<Props> = ({
  currentUser,
  dossiers,
  stock,
  factures,
  bonsSortie,
  bonsLivraison,
  recettes,
  assurances,
  partenaires,
  fournisseurs,
  commandesFournisseurs,
  devisList,
  onClose,
  onRestoreDatasets,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateBackupFile> | null>(null);
  const [restoreMode, setRestoreMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ step: string; percent: number }>({ step: '', percent: 0 });
  const [restoreFinished, setRestoreFinished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exporter le backup
  const handleExportBackup = () => {
    try {
      const backup = generateSystemBackup(currentUser, {
        dossiers,
        stock,
        factures,
        bonsSortie,
        bonsLivraison,
        recettes,
        assurances,
        partenaires,
        fournisseurs,
        commandesFournisseurs,
        devis: devisList,
      });

      downloadBackupFile(backup);
      onShowToast(`Sauvegarde complète téléchargée (${dossiers.length} dossiers, ${factures.length} factures, ${stock.length} articles)`);
    } catch (err: any) {
      console.error('Erreur export backup:', err);
      alert(`Erreur lors de la création de la sauvegarde: ${err?.message || 'Inconnue'}`);
    }
  };

  // Traiter le fichier sélectionné
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRestoreFinished(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateBackupFile(content);
      setValidationResult(res);
    };
    reader.onerror = () => {
      setValidationResult({
        isValid: false,
        error: 'Impossible de lire le fichier sélectionné.',
      });
    };
    reader.readAsText(file);
  };

  // Exécuter la restauration
  const handleExecuteRestore = async () => {
    if (!validationResult || !validationResult.isValid || !validationResult.backupData) {
      return;
    }

    const confirmMsg = restoreMode === 'REPLACE'
      ? 'ATTENTION : Le mode "Remplacement complet" va remplacer toutes vos données actuelles par celles du fichier de sauvegarde. Voulez-vous continuer ?'
      : 'Voulez-vous lancer la restauration avec fusion des données ? Les éléments existants seront mis à jour et les nouveaux ajoutés.';

    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);
    setRestoreProgress({ step: 'Préparation des données...', percent: 5 });

    try {
      const backupData = validationResult.backupData.data;

      // 1. Mise à jour de l'état local dans l'application
      await onRestoreDatasets(backupData, restoreMode);

      // 2. Synchronisation en arrière-plan vers Supabase Cloud
      await syncRestoredDataToSupabaseCloud(backupData, (step, percent) => {
        setRestoreProgress({ step, percent });
      });

      setRestoreFinished(true);
      onShowToast('Restauration du système effectuée avec succès et synchronisée sur le Cloud !');
    } catch (err: any) {
      console.error('Erreur restauration:', err);
      alert(`Une erreur est survenue pendant la restauration: ${err?.message || 'Erreur inconnue'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-sky-400 shadow-inner">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Sauvegarde & Restauration (Backup)</h2>
                <p className="text-xs text-slate-300">
                  Sécurisation intégrale de votre base de données et restauration d'urgence
                </p>
              </div>
            </div>

            {!isRestoring && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 max-w-md">
            <button
              onClick={() => {
                if (!isRestoring) setActiveTab('EXPORT');
              }}
              disabled={isRestoring}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'EXPORT'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Créer un Backup</span>
            </button>

            <button
              onClick={() => {
                if (!isRestoring) setActiveTab('IMPORT');
              }}
              disabled={isRestoring}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'IMPORT'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Restaurer / Importer</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'EXPORT' && (
            <div className="space-y-6">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-sky-900 text-xs">
                <ShieldCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Sauvegarde Globale 100% Autonome</p>
                  <p className="text-slate-600 leading-relaxed">
                    Le backup génère un fichier <strong className="font-semibold text-slate-800">.json sécurisé</strong> contenant l'intégralité de vos dossiers sinistres, factures, devis, stocks, bons de livraison, encaissements et partenaires. Vous pouvez le conserver sur une clé USB ou un disque dur externe.
                  </p>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                  Données actuelles prêtes à être sauvegardées :
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      <span>Dossiers</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 mt-1">{dossiers.length}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Factures</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 mt-1">{factures.length}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      <span>Articles Stock</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 mt-1">{stock.length}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bons Livraison</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 mt-1">{bonsLivraison.length}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <FolderArchive className="w-3.5 h-3.5 text-violet-600" />
                      <span>Devis</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 mt-1">{devisList.length}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>Règlements</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 mt-1">{recettes.length}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/20 active:scale-[0.99] transition-all"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  <span>Télécharger la Sauvegarde Complète (.json)</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Format compatible 100% avec toute restauration future sur n'importe quel ordinateur ou navigateur.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'IMPORT' && (
            <div className="space-y-6">
              {/* File Input Card */}
              {!selectedFile && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50 hover:bg-sky-50/50 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 group-hover:scale-110 group-hover:border-brand-300 shadow-md flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-all">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Sélectionnez votre fichier de backup (.json)
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cliquez pour parcourir ou glissez-déposez le fichier ici
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* File Validation Result */}
              {selectedFile && validationResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 border border-slate-200">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-brand-600 shadow-sm flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} Ko</p>
                      </div>
                    </div>

                    {!isRestoring && (
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setValidationResult(null);
                          setRestoreFinished(false);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg"
                      >
                        Changer
                      </button>
                    )}
                  </div>

                  {/* Invalid backup */}
                  {!validationResult.isValid && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Fichier de sauvegarde non valide</p>
                        <p className="text-rose-700 mt-1">{validationResult.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Valid backup summary */}
                  {validationResult.isValid && validationResult.summary && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-xs">Sauvegarde vérifiée et conforme</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 space-y-0.5 pt-1">
                          <p>
                            <strong>Date de création :</strong> {formatDate(validationResult.summary.createdAt)}
                          </p>
                          <p>
                            <strong>Auteur :</strong> {validationResult.summary.createdByNom} ({validationResult.summary.createdByRole})
                          </p>
                        </div>
                      </div>

                      {/* Content Badges */}
                      <div>
                        <p className="text-xs font-bold text-slate-700 mb-2">Contenu détecté dans ce backup :</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="block text-slate-400 text-[10px]">Dossiers</span>
                            <span className="font-black text-slate-900">{validationResult.summary.counts.dossiers}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="block text-slate-400 text-[10px]">Factures</span>
                            <span className="font-black text-slate-900">{validationResult.summary.counts.factures}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="block text-slate-400 text-[10px]">Stock</span>
                            <span className="font-black text-slate-900">{validationResult.summary.counts.stock}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="block text-slate-400 text-[10px]">Bons Livr.</span>
                            <span className="font-black text-slate-900">{validationResult.summary.counts.bonsLivraison}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="block text-slate-400 text-[10px]">Devis</span>
                            <span className="font-black text-slate-900">{validationResult.summary.counts.devis}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="block text-slate-400 text-[10px]">Recettes</span>
                            <span className="font-black text-slate-900">{validationResult.summary.counts.recettes}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="block text-slate-400 text-[10px]">Fournisseurs</span>
                            <span className="font-black text-slate-900">{validationResult.summary.counts.fournisseurs}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="block text-slate-400 text-[10px]">Partenaires</span>
                            <span className="font-black text-slate-900">{validationResult.summary.counts.partenaires}</span>
                          </div>
                        </div>
                      </div>

                      {/* Restore Mode Choice */}
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-slate-700">Mode de Restauration :</label>
                        <div className="space-y-2">
                          <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                            restoreMode === 'MERGE'
                              ? 'bg-sky-50 border-brand-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}>
                            <input
                              type="radio"
                              name="restoreMode"
                              checked={restoreMode === 'MERGE'}
                              onChange={() => setRestoreMode('MERGE')}
                              className="mt-1 text-brand-600 focus:ring-brand-500"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-slate-900">Fusion intelligente (Recommandé)</p>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                Conserve vos données actuelles, ajoute les enregistrements manquants et met à jour les éléments existants.
                              </p>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                            restoreMode === 'REPLACE'
                              ? 'bg-amber-50 border-amber-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}>
                            <input
                              type="radio"
                              name="restoreMode"
                              checked={restoreMode === 'REPLACE'}
                              onChange={() => setRestoreMode('REPLACE')}
                              className="mt-1 text-amber-600 focus:ring-amber-500"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-slate-900">Remplacement complet (Écrasement)</p>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                Réinitialise la base et applique strictement le contenu exact du fichier backup.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Progress Bar during restoration */}
                      {isRestoring && (
                        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 font-medium">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                              <span>{restoreProgress.step || 'Restauration en cours...'}</span>
                            </span>
                            <span className="font-bold font-mono text-sky-400">{restoreProgress.percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
                              style={{ width: `${restoreProgress.percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Success state */}
                      {restoreFinished && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                          <div className="text-xs">
                            <p className="font-bold">Restauration terminée avec succès !</p>
                            <p className="text-emerald-800 text-[11px]">
                              Toutes les données ont été rechargées et synchronisées dans le système.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Launch Button */}
                      {!restoreFinished && (
                        <button
                          onClick={handleExecuteRestore}
                          disabled={isRestoring}
                          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 active:scale-[0.99] transition-all"
                        >
                          {isRestoring ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Restauration en cours...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>Lancer la Restauration des Données</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Global Pare-Brise • Système de Secours & Redondance</span>
          <button
            onClick={onClose}
            disabled={isRestoring}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-200/60 transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
