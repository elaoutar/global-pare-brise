'use client';

import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Share2, 
  X, 
  Loader2, 
  Check, 
  MessageCircle 
} from 'lucide-react';
import { downloadElementAsPdf, shareElementToWhatsApp, DocumentExportOptions } from '@/lib/pdfExporter';

interface Props {
  documentRef: React.RefObject<HTMLDivElement>;
  filename: string;
  documentTitle: string;
  subtitle?: string;
  clientPhone?: string;
  shareMessage?: string;
  badgeText?: string;
  badgeColor?: string;
  onClose: () => void;
}

export const DocumentActionBar: React.FC<Props> = ({
  documentRef,
  filename,
  documentTitle,
  subtitle,
  clientPhone,
  shareMessage,
  badgeText,
  badgeColor = 'bg-blue-600',
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current || isExporting) return;
    try {
      setIsExporting(true);
      await downloadElementAsPdf(documentRef.current, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur téléchargement PDF :', err);
      alert('Une erreur est survenue lors de la création du PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!documentRef.current || isSharing) return;
    try {
      setIsSharing(true);
      const options: DocumentExportOptions = {
        filename,
        documentTitle,
        clientPhone,
        shareMessage,
      };
      await shareElementToWhatsApp(documentRef.current, options);
    } catch (err) {
      console.error('Erreur partage WhatsApp :', err);
      alert('Impossible d’ouvrir le partage WhatsApp.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="no-print bg-slate-900 text-white p-4 sm:px-6 sm:py-4 border-b border-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Document Info */}
        <div className="flex items-center gap-3">
          {badgeText && (
            <div className={`p-2 sm:p-2.5 rounded-xl text-white font-bold text-xs uppercase ${badgeColor}`}>
              {badgeText}
            </div>
          )}
          <div>
            <h3 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-2">
              {documentTitle}
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Format A4
              </span>
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition active:scale-95 border border-slate-700"
            title="Imprimer directement ou Enregistrer via le navigateur"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>

          {/* Download PDF (A4) */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
            title="Télécharger le fichier PDF au format A4 sur votre appareil"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Génération...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span className="text-emerald-200">Téléchargé !</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Télécharger PDF (A4)</span>
              </>
            )}
          </button>

          {/* Share on WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            disabled={isSharing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
            title="Partager directement le document PDF sur WhatsApp"
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Préparation...</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 text-white" />
                <span>WhatsApp</span>
              </>
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
