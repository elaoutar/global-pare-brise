import React, { useState } from 'react';
import { 
  DossierSinistre, 
  Facture, 
  BonSortie, 
  BonLivraison 
} from '@/types';
import { AZUR_GLASS_INFO, GARAGE_INFO } from '@/lib/data';
import { formatDH, formatDate } from '@/lib/utils';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Paperclip, 
  FileText, 
  ShieldCheck, 
  PackageMinus, 
  Truck, 
  Camera, 
  Copy, 
  ExternalLink, 
  Clock, 
  Sparkles,
  Info,
  Building2
} from 'lucide-react';

interface TransmettreAzurGlassModalProps {
  dossier: DossierSinistre;
  facture?: Facture;
  bonSortie?: BonSortie;
  bonLivraison?: BonLivraison;
  onClose: () => void;
  onSendComplete: (dossierId: string, transmissionData: {
    destinataire: string;
    cc?: string;
    objet: string;
    message: string;
    dateEnvoi: string;
  }) => void;
}

export const TransmettreAzurGlassModal: React.FC<TransmettreAzurGlassModalProps> = ({
  dossier,
  facture,
  bonSortie,
  bonLivraison,
  onClose,
  onSendComplete,
}) => {
  const [destinataire, setDestinataire] = useState(AZUR_GLASS_INFO.email || 'sinistres@azurglass.ma');
  const [cc, setCc] = useState(GARAGE_INFO.email || 'globalazurmaroc@gmail.com');
  
  const immat = dossier.vehicule.immatriculation;
  const assNom = dossier.assurance?.nom || 'Compagnie';
  const agence = dossier.agenceAssurance || 'Agence Principale';
  const numDossier = dossier.numeroDossier;

  // Calculs financiers
  const totalTTC = dossier.montantTotalTTC;
  const franchise = dossier.franchiseOfferte ? 0 : (dossier.montantFranchise || 0);
  const tvaPro = Number(dossier.tvaExclueParAssurance || 0);
  const netReversement = dossier.montantReversementAzurGlass || Math.max(0, totalTTC - franchise - tvaPro);

  const [objet, setObjet] = useState(
    `[GLOBAL PARE-BRISE] Dossier Complet Sinistre - ${immat} - ${assNom} (${agence}) - Réf ${numDossier}`
  );

  // Message pré-rempli professionnel
  const defaultMessage = `Bonjour l'équipe AZUR GLASS,

Veuillez trouver ci-joint le dossier sinistre complet pour prise en charge, déclaration et virement de règlement :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. INFORMATIONS DU SINISTRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Réf Dossier Global Pare-Brise : ${numDossier}
• Réf Partenaire AZUR GLASS : ${dossier.referenceDossierAzurGlass || `AZUR-${numDossier.slice(-4)}`}
• Client Assuré : ${dossier.client.nom} (Tél: ${dossier.client.telephone} • CIN: ${dossier.client.cin || 'N/A'})
• Ville / Atelier : ${dossier.client.ville}
• Véhicule : ${dossier.vehicule.marque} ${dossier.vehicule.modele} (Immatriculation : ${immat})
• Compagnie d'Assurance : ${assNom}
• Agence Locale d'Assurance : ${agence}
• N° Sinistre : ${dossier.numeroSinistre || 'En cours'}
• N° Police : ${dossier.numeroPolice || 'Non renseigné'}
• Type Client : ${dossier.typeClientAssurance === 'PROFESSIONNEL' ? 'Professionnel (TVA exclue)' : (dossier.typeClientAssurance === 'AGENCE_LOCATION' ? 'Agence de Location' : 'Particulier')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. DÉCOMPTE FINANCIER & REVERSEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Montant Total Prestation TTC : ${totalTTC.toFixed(2)} DH
• Franchise Client : ${franchise > 0 ? `${franchise.toFixed(2)} DH` : (dossier.franchiseOfferte ? '0.00 DH (Offerte par le garage)' : '0.00 DH')}
${tvaPro > 0 ? `• TVA Pro / Location exclue par l'assurance : -${tvaPro.toFixed(2)} DH\n` : ''}--------------------------------------------------
★ MONTANT NET REVERSEMENT AZUR GLASS : ${netReversement.toFixed(2)} DH
--------------------------------------------------

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. PIÈCES JOINTES AU PACK DOSSIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[X] 1. Facture Officielle N° ${facture?.numeroFacture || `FA-2026-${numDossier.slice(-4)}`} libellée à AZUR GLASS SARL (ICE 002987123000089)
[X] 2. Quittance Subrogative d'Assurance remplie et signée
${dossier.typeClientAssurance === 'PROFESSIONNEL' || dossier.typeClientAssurance === 'AGENCE_LOCATION' ? `[X] 3. Déclaration de bris de glaces signée & cachetée par la société (${dossier.client.nom})\n` : ''}[X] 4. Bon de Sortie Atelier N° ${bonSortie?.numeroBS || `BS-2026-${numDossier.slice(-4)}`} (Vitrage & fournitures de pose)
[X] 5. Bon de Livraison & Décharge client N° ${bonLivraison?.numeroBL || `BL-2026-${numDossier.slice(-4)}`}
[X] 6. Photocopie Carte Grise & Attestation d'Assurance
[X] 7. Photos justificatives du sinistre (Avant intervention, après pose et compteur)

Merci de bien vouloir valider ce dossier et nous transmettre l'accord de règlement par virement bancaire.

Cordialement,
Service Prise en Charge & Sinistres
GLOBAL PARE-BRISE
Tél: ${GARAGE_INFO.telephone}
Email: ${GARAGE_INFO.email}`;

  const [message, setMessage] = useState(defaultMessage);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  // Envoi réel 1-Clic via l'API Gmail SMTP
  const handleSend1Click = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      const response = await fetch('/api/send-dossier-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinataire,
          cc,
          objet,
          message,
          dossierNumero: dossier.numeroDossier,
          photos: dossier.photos,
          documents: dossier.documents,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de l\'envoi de l\'email');
      }

      setSendSuccess(true);
      const transmissionData = {
        destinataire,
        cc,
        objet,
        message,
        dateEnvoi: new Date().toISOString(),
      };
      
      setTimeout(() => {
        onSendComplete(dossier.id, transmissionData);
      }, 1500);
    } catch (err: any) {
      console.error('Erreur transmission email:', err);
      setSendError(err.message || 'Impossible d\'envoyer l\'email. Vérifiez votre connexion.');
    } finally {
      setIsSending(false);
    }
  };

  // Envoi direct via Webmail Gmail (Google Workspace ou compte perso)
  const handleOpenGmailWeb = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(destinataire)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`;
    window.open(gmailUrl, '_blank');
  };

  // Envoi via Client Mail par défaut (Apple Mail, Outlook, etc.)
  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(destinataire)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, '_blank');
  };

  // Copier le texte
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-2 sm:p-6 backdrop-blur-sm flex justify-center items-start">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Sticky Header with visible close button */}
        <div className="sticky top-0 z-30 flex justify-between items-center px-4 sm:px-6 py-3.5 bg-slate-900 text-white shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300">
              <Mail className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Transmission Dossier Complet à AZUR GLASS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Email 1-Clic
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Envoi officiel de la facture, quittance signée, bon de sortie et photos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Fermer la fenêtre"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">

          {/* Partenaire Déclarant Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-indigo-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-200">
                  Partenaire Déclarant Conventionné
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-0.5">
                {AZUR_GLASS_INFO.designationComplete}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                ICE : <strong className="text-white font-mono">{AZUR_GLASS_INFO.ice}</strong> • IF : <span className="font-mono">{AZUR_GLASS_INFO.ifiscal}</span> • Marrakech
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/15 text-right w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Reversement Net Attendu
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {formatDH(netReversement)}
              </span>
            </div>
          </div>

          {/* Synthèse du Dossier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Véhicule & Client</span>
              <p className="font-bold text-slate-900">{dossier.vehicule.marque} {dossier.vehicule.modele}</p>
              <p className="font-mono text-brand-700 font-bold">{immat}</p>
              <p className="text-slate-600">{dossier.client.nom} ({dossier.client.telephone})</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Compagnie & Agence</span>
              <p className="font-bold text-slate-900">{assNom}</p>
              <p className="font-semibold text-indigo-700">{agence}</p>
              <p className="text-slate-500 font-mono text-[11px]">Sinistre: {dossier.numeroSinistre || 'En attente'}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Décompte Financier</span>
              <div className="flex justify-between text-slate-600">
                <span>Total Prestation :</span>
                <span className="font-bold text-slate-800">{formatDH(totalTTC)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Franchise :</span>
                <span>{franchise > 0 ? formatDH(franchise) : '0 DH'}</span>
              </div>
              {tvaPro > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>TVA Pro déduite :</span>
                  <span>-{formatDH(tvaPro)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Checklist des Pièces Jointes Incluses */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-brand-600" />
                Pack des Pièces Jointes transmises à AZUR GLASS
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dossier complet prêt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Facture N° {facture?.numeroFacture || `FA-2026-${numDossier.slice(-4)}`}</strong> (adressée à AZUR GLASS)
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Quittance d'assurance signée</strong> (Subrogation)
                </span>
              </div>

              {(dossier.typeClientAssurance === 'PROFESSIONNEL' || dossier.typeClientAssurance === 'AGENCE_LOCATION') && (
                <div className="flex items-center gap-2 p-2 bg-indigo-50/80 rounded-lg border border-indigo-200 text-indigo-950">
                  <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">
                    <strong>Déclaration bris de glace</strong> (Cachet Société)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <PackageMinus className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Bon de Sortie Stock</strong> ({numDossier})
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Bon de Livraison & Décharge</strong> client
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <Camera className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Photos du sinistre</strong> ({Object.values(dossier.photos || {}).filter(Boolean).length} photos prêtes)
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <Paperclip className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Documents joints</strong> ({dossier.documents?.length || 0} scan(s) attachés)
                </span>
              </div>
            </div>
          </div>

          {/* Formulaire Email */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destinataire Email (AZUR GLASS) :
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={destinataire}
                    onChange={(e) => setDestinataire(e.target.value)}
                    className="w-full text-xs py-2 px-3 pl-8 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="sinistres@azurglass.ma"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  En Copie (CC - Votre Agence) :
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="w-full text-xs py-2 px-3 pl-8 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="direction@globaleparebrise.ma"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Objet de l'Email :
              </label>
              <input
                type="text"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Message Officiel de Transmission :
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" /> {copied ? 'Copié !' : 'Copier le texte'}
                </button>
              </div>
              <textarea
                rows={9}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Message de succès ou d'erreur */}
          {sendSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Email transmis avec succès à AZUR GLASS via Gmail ! Enregistrement du statut en cours...</span>
            </div>
          )}

          {sendError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900">
              <span className="font-bold text-red-600">Erreur :</span>
              <span>{sendError}</span>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Action automatique après envoi :</strong> Dès confirmation, le statut du dossier passera automatiquement à <span className="font-bold underline">« ENVOYÉ À AZUR GLASS »</span> avec horodatage de la date d'envoi.
            </div>
          </div>

        </div>

        {/* Sticky Footer with 1-Click Action Buttons */}
        <div className="sticky bottom-0 z-30 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Bouton direct Gmail Web */}
            <button
              type="button"
              onClick={handleOpenGmailWeb}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Ouvrir directement dans Gmail avec toutes les infos pré-remplies"
            >
              <Mail className="w-4 h-4 text-white" />
              <span>Ouvrir dans Gmail</span>
            </button>

            {/* Bouton Client Mail par défaut (Outlook, Apple Mail) */}
            <button
              type="button"
              onClick={handleOpenMailClient}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition-all shadow-sm"
              title="Ouvrir dans Outlook ou Apple Mail"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Autre Webmail</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSend1Click}
              disabled={isSending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-white" />
                  <span>Envoi en cours à AZUR GLASS...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer à AZUR GLASS (1-Clic)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
