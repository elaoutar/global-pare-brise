import React, { useState, useRef, useMemo } from 'react';
import { 
  DossierSinistre, 
  Facture, 
  BonSortie, 
  BonLivraison 
} from '@/types';
import { AZUR_GLASS_INFO, GARAGE_INFO } from '@/lib/data';
import { formatDH, formatDate } from '@/lib/utils';
import { formatMatricule } from '@/lib/matriculeMaroc';
import { generateCompactPdfBase64FromElement } from '@/lib/pdfExporter';
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
  const [destinataire, setDestinataire] = useState(AZUR_GLASS_INFO.email || '1azurglass@gmail.com');
  const [cc, setCc] = useState(GARAGE_INFO.email || 'globalazurmaroc@gmail.com');
  
  const bonSortiePrintRef = useRef<HTMLDivElement>(null);
  const bonLivraisonPrintRef = useRef<HTMLDivElement>(null);
  const facturePrintRef = useRef<HTMLDivElement>(null);

  const immat = dossier.vehicule.immatriculation;
  const assNom = dossier.assurance?.nom || 'Compagnie';
  const agence = dossier.agenceAssurance || 'Agence Principale';
  const numDossier = dossier.numeroDossier;
  const seqFallback = numDossier.slice(-4) || '1001';

  // Calculs financiers
  const totalTTC = dossier.montantTotalTTC;
  const totalHT = +(totalTTC / 1.20).toFixed(2);
  const totalTVA = +(totalTTC - totalHT).toFixed(2);
  const franchise = dossier.franchiseOfferte ? 0 : (dossier.montantFranchise || 0);
  const tvaPro = Number(dossier.tvaExclueParAssurance || 0);
  const netReversement = dossier.montantReversementAzurGlass || Math.max(0, totalTTC - franchise - tvaPro);

  // Documents effectifs (garantis même si non passés en props)
  const effectiveFacture: Facture = useMemo(() => {
    if (facture) return facture;
    const vitrageHT = Math.max(0, +(totalHT - 250).toFixed(2));
    return {
      id: `fac-auto-${dossier.id}`,
      numeroFacture: 'N2028045',
      dossierId: dossier.id,
      destinataire: dossier.typeDossier === 'ASSURANCE' ? 'AZUR_GLASS' : 'CLIENT',
      dateEmission: dossier.dateCreation,
      dateEcheance: dossier.dateCreation,
      lignes: [
        {
          designation: `Pare-Brise conforme ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
          quantite: 1,
          prixUnitaireHT: vitrageHT,
          tauxTva: 20,
          totalHT: vitrageHT,
        },
        {
          designation: 'Kit colle polyuréthane & primaire d\'adhérence certifié',
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
      totalTTC,
      montantRegle: 0,
      statutPaiement: 'EN_ATTENTE',
    };
  }, [facture, dossier, totalHT, totalTVA, totalTTC]);

  const effectiveBonSortie: BonSortie = useMemo(() => {
    if (bonSortie) return bonSortie;
    return {
      id: `bs-auto-${dossier.id}`,
      numeroBS: `BS-2026-${seqFallback}`,
      dossierId: dossier.id,
      dateSortie: dossier.dateCreation,
      poseur: dossier.poseur || 'Poseur Atelier',
      lignes: [
        {
          articleId: `art-auto-${dossier.id}`,
          reference: `PB-${(dossier.vehicule.marque || 'VEH').slice(0, 3).toUpperCase()}`,
          designation: effectiveFacture.lignes[0]?.designation || `Pare-Brise conforme ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`,
          quantite: 1,
          rayon: 'A6',
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
  }, [bonSortie, dossier, seqFallback, effectiveFacture]);

  const effectiveBonLivraison: BonLivraison = useMemo(() => {
    const vehInfo = `${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.annee})`.trim();
    if (bonLivraison) {
      return {
        ...bonLivraison,
        immatriculation: bonLivraison.immatriculation || dossier.vehicule.immatriculation,
        vehiculeInfo: bonLivraison.vehiculeInfo || vehInfo,
        clientNom: bonLivraison.clientNom || dossier.client.nom,
        clientTelephone: bonLivraison.clientTelephone || dossier.client.telephone,
        clientCin: bonLivraison.clientCin || dossier.client.cin,
        clientVille: bonLivraison.clientVille || dossier.client.ville,
        isMultiVehicules: false,
      };
    }
    return {
      id: `bl-auto-${dossier.id}`,
      numeroBL: `BL-2026-${seqFallback}`,
      dossierId: dossier.id,
      dateLivraison: dossier.dateCreation,
      livreurPoseur: dossier.poseur || 'Poseur Atelier',
      receptionnaireNom: dossier.client.nom,
      receptionnaireCin: dossier.client.cin,
      clientNom: dossier.client.nom,
      clientTelephone: dossier.client.telephone,
      clientCin: dossier.client.cin,
      clientVille: dossier.client.ville,
      vehiculeInfo: vehInfo,
      immatriculation: dossier.vehicule.immatriculation,
      isMultiVehicules: false,
      lignes: effectiveFacture.lignes.map((l) => ({
        designation: l.designation,
        codeEurocode: l.codeEurocode || '-',
        quantite: l.quantite || 1,
        prixUnitaireHT: l.prixUnitaireHT,
        prixUnitaireTTC: +(l.prixUnitaireHT * 1.20).toFixed(2),
        totalHT: l.totalHT,
        totalTTC: +(l.totalHT * 1.20).toFixed(2),
      })),
      totalHT: effectiveFacture.totalHT,
      totalTTC: effectiveFacture.totalTTC,
      montantFranchise: dossier.montantFranchise,
      tvaExclue: dossier.tvaExclueParAssurance,
      observations: `Véhicule ${dossier.vehicule.marque} ${dossier.vehicule.modele} (${dossier.vehicule.immatriculation}) remis en parfait état de conformité.`,
    };
  }, [bonLivraison, dossier, seqFallback, effectiveFacture]);

  // Liste unique de toutes les photos du dossier (clés nommées + galerieUrls)
  const uniquePhotos = useMemo(() => {
    const urls: string[] = [];
    const seen = new Set<string>();
    const p = dossier.photos || {};
    const keys = [
      'avantSinistreUrl',
      'apresPoseUrl',
      'carteGriseUrl',
      'vinChassisUrl',
      'compteurKmUrl',
      'permisUrl',
      'angle360Url',
      'autreUrl',
    ];
    for (const k of keys) {
      const val = p[k];
      if (typeof val === 'string' && val.trim() && !seen.has(val)) {
        seen.add(val);
        urls.push(val);
      }
    }
    if (Array.isArray(p.galerieUrls)) {
      for (const val of p.galerieUrls) {
        if (typeof val === 'string' && val.trim() && !seen.has(val)) {
          seen.add(val);
          urls.push(val);
        }
      }
    }
    return urls;
  }, [dossier.photos]);

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
• Réf Partenaire AZUR GLASS : ${dossier.referenceDossierAzurGlass || `AZUR-${seqFallback}`}
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
3. PIÈCES JOINTES AU PACK DOSSIER (FORMAT PDF & PHOTOS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[X] 1. Facture Officielle N° ${effectiveFacture.numeroFacture} libellée à AZUR GLASS SARL (ICE ${AZUR_GLASS_INFO.ice}) [PDF]
[X] 2. Quittance Subrogative d'Assurance remplie et signée
${dossier.typeClientAssurance === 'PROFESSIONNEL' || dossier.typeClientAssurance === 'AGENCE_LOCATION' ? `[X] 3. Déclaration de bris de glaces signée & cachetée par la société (${dossier.client.nom})\n` : ''}[X] 4. Bon de Sortie Atelier N° ${effectiveBonSortie.numeroBS} (Vitrage & fournitures de pose) [PDF]
[X] 5. Bon de Livraison & Décharge client N° ${effectiveBonLivraison.numeroBL} [PDF]
[X] 6. Photocopie Carte Grise & Attestation d'Assurance
[X] 7. Photos justificatives de la voiture et du sinistre (${uniquePhotos.length} photo(s) jointe(s))

Merci de bien vouloir valider ce dossier et nous transmettre l'accord de règlement par virement bancaire.

Cordialement,
Service Prise en Charge & Sinistres
GLOBAL PARE-BRISE
Tél: ${GARAGE_INFO.telephone}
Email: ${GARAGE_INFO.email}`;

  const [message, setMessage] = useState(defaultMessage);
  const [isSending, setIsSending] = useState(false);
  const [sendingStepText, setSendingStepText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  // Compresse une image Base64 (data:image/...) pour éviter de dépasser la limite Vercel de 4.5 Mo
  const compressDataImageForEmail = (dataUrl: string, maxDim = 1100, quality = 0.68): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        resolve(dataUrl);
        return;
      }
      // Si déjà légère (< 80 Ko), inutile de recompresser
      if (dataUrl.length < 100_000) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Envoi réel 1-Clic via l'API Gmail SMTP avec génération des vrais PDF originaux A4 compacts
  const handleSend1Click = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      let bonSortiePdfBase64: string | undefined;
      let bonLivraisonPdfBase64: string | undefined;
      let facturePdfBase64: string | undefined;

      // 1. Générer le PDF original A4 compact du Bon de Sortie
      if (bonSortiePrintRef.current) {
        setSendingStepText('Génération PDF Bon de Sortie...');
        try {
          bonSortiePdfBase64 = await generateCompactPdfBase64FromElement(bonSortiePrintRef.current);
        } catch (e) {
          console.warn('Repli PDF serveur pour Bon de Sortie:', e);
        }
      }

      // 2. Générer le PDF original A4 compact du Bon de Livraison
      if (bonLivraisonPrintRef.current) {
        setSendingStepText('Génération PDF Bon de Livraison...');
        try {
          bonLivraisonPdfBase64 = await generateCompactPdfBase64FromElement(bonLivraisonPrintRef.current);
        } catch (e) {
          console.warn('Repli PDF serveur pour Bon de Livraison:', e);
        }
      }

      // 3. Générer le PDF original A4 compact de la Facture
      if (facturePrintRef.current) {
        setSendingStepText('Génération PDF Facture...');
        try {
          facturePdfBase64 = await generateCompactPdfBase64FromElement(facturePrintRef.current);
        } catch (e) {
          console.warn('Repli PDF serveur pour Facture:', e);
        }
      }

      // 4. Compresser les photos Base64 côté client et ne jamais les dupliquer dans `dossier`
      setSendingStepText('Optimisation des photos & pièces jointes...');
      const compressedPhotos: Record<string, any> = {};
      if (dossier.photos && typeof dossier.photos === 'object') {
        for (const [key, val] of Object.entries(dossier.photos)) {
          if (key === 'galerieUrls' && Array.isArray(val)) {
            const compressedGallery: string[] = [];
            for (const gUrl of val) {
              if (typeof gUrl === 'string' && gUrl.trim()) {
                compressedGallery.push(await compressDataImageForEmail(gUrl));
              }
            }
            compressedPhotos.galerieUrls = compressedGallery;
          } else if (typeof val === 'string' && val.trim()) {
            compressedPhotos[key] = await compressDataImageForEmail(val);
          }
        }
      }

      const compressedDocuments: NonNullable<DossierSinistre['documents']> = [];
      if (Array.isArray(dossier.documents)) {
        for (const doc of dossier.documents) {
          if (doc && typeof doc.url === 'string' && doc.url.trim()) {
            const cUrl = doc.url.startsWith('data:image/')
              ? await compressDataImageForEmail(doc.url, 1200, 0.72)
              : doc.url;
            compressedDocuments.push({ ...doc, url: cUrl });
          }
        }
      }

      // Alléger `dossier` pour ne PAS dupliquer photos & documents une 2e fois dans le JSON
      const { photos: _omitPhotos, documents: _omitDocs, ...lightDossier } = dossier;

      const payloadObj: Record<string, any> = {
        destinataire,
        cc,
        objet,
        message,
        dossierId: dossier.id,
        dossierNumero: dossier.numeroDossier,
        dossier: lightDossier,
        photos: compressedPhotos,
        documents: compressedDocuments,
        bonSortie: effectiveBonSortie,
        bonLivraison: effectiveBonLivraison,
        facture: effectiveFacture,
        bonSortiePdfBase64,
        bonLivraisonPdfBase64,
        facturePdfBase64,
      };

      // Garde-fou anti-413 (limite Vercel = 4.5 Mo) : si le JSON dépasse 3.6 Mo,
      // le serveur récupérera directement `photos` et `documents` depuis Supabase via `dossierId`.
      let serializedBody = JSON.stringify(payloadObj);
      if (serializedBody.length > 3_600_000) {
        delete payloadObj.documents;
        serializedBody = JSON.stringify(payloadObj);
      }
      if (serializedBody.length > 3_600_000) {
        delete payloadObj.photos;
        serializedBody = JSON.stringify(payloadObj);
      }

      setSendingStepText('Envoi des PDF et photos par Email...');

      const response = await fetch('/api/send-dossier-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serializedBody,
      });

      const rawText = await response.text();
      let result: any;
      try {
        result = JSON.parse(rawText);
      } catch {
        throw new Error(
          response.status === 413
            ? 'Le poids des pièces jointes dépasse la limite autorisée. Veuillez réessayer.'
            : `Erreur serveur (${response.status}) : ${rawText.slice(0, 120)}`
        );
      }

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
      setSendingStepText('');
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

  // Lignes du BL avec prix TTC pour le rendu A4 original
  const blPrestationsLignes = useMemo(() => {
    if (effectiveBonLivraison.lignes && effectiveBonLivraison.lignes.length > 0) {
      return effectiveBonLivraison.lignes.map((l) => {
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
    return effectiveFacture.lignes.map((l) => ({
      designation: l.designation,
      codeEurocode: l.codeEurocode || '-',
      quantite: l.quantite || 1,
      prixUnitaireTTC: +(l.prixUnitaireHT * 1.20).toFixed(2),
      totalTTC: +(l.totalHT * 1.20).toFixed(2),
    }));
  }, [effectiveBonLivraison, effectiveFacture]);

  const isAssurance = dossier.typeDossier === 'ASSURANCE';
  const montantCashFacture = franchise + tvaPro;
  const obsFacture = effectiveFacture.observations || (
    isAssurance
      ? (montantCashFacture > 0
          ? `Règlement : ${formatDH(montantCashFacture)} réglé en espèces et le solde de ${formatDH(netReversement)} par virement bancaire.`
          : `Règlement : ${formatDH(effectiveFacture.totalTTC)} par virement bancaire.`)
      : ''
  );

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
                  Pack PDF + Photos
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Transmission de la facture PDF, bon de sortie PDF, bon de livraison PDF et photos
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
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-200">
                  Partenaire Déclarant
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
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-brand-600" />
                Pack des Pièces Jointes PDF & Photos transmises à AZUR GLASS
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Format PDF A4 + Images
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Facture N° {effectiveFacture.numeroFacture}.pdf</strong> (Format A4 original)
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

              <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-200 text-slate-800">
                <PackageMinus className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Bon de Sortie {effectiveBonSortie.numeroBS}.pdf</strong> (PDF A4 original)
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-200 text-slate-800">
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Bon de Livraison {effectiveBonLivraison.numeroBL}.pdf</strong> (PDF A4 original)
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <Camera className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Photos du véhicule</strong> ({uniquePhotos.length} photo(s) jointe(s))
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-800">
                <Paperclip className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Documents scannés</strong> ({dossier.documents?.length || 0} document(s) joint(s))
                </span>
              </div>
            </div>

            {/* Aperçu visuel des photos jointes à l'email */}
            {uniquePhotos.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[11px] font-bold text-slate-600 mb-1.5">
                  Aperçu des {uniquePhotos.length} photo(s) incluses en pièces jointes dans l'email :
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {uniquePhotos.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-300 flex-shrink-0 bg-slate-100"
                    >
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] px-1 font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    placeholder="1azurglass@gmail.com"
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
              <span>Email transmis avec succès à AZUR GLASS (PDF Bon de Sortie, PDF Bon de Livraison, PDF Facture & Photos joints) !</span>
            </div>
          )}

          {sendError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900">
              <span className="font-bold text-red-600">Erreur :</span>
              <span>{sendError}</span>
            </div>
          )}

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
                  <span>{sendingStepText || 'Envoi en cours à AZUR GLASS...'}</span>
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

      {/* ===================================================================== */}
      {/* RENDU A4 HORS-ÉCRAN POUR GÉNÉRATION DES VRAIS PDF ORIGINAUX           */}
      {/* (Bon de Sortie Atelier, Bon de Livraison Client, Facture Officielle)   */}
      {/* ===================================================================== */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '794px',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {/* 1. TEMPLATE A4 ORIGINAL : BON DE SORTIE ATELIER */}
        <div
          ref={bonSortiePrintRef}
          className="p-10 text-slate-800 text-sm leading-relaxed bg-white"
          style={{ width: '794px', minHeight: '1123px', backgroundColor: '#ffffff' }}
        >
          <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4">
            <div>
              <img
                src={GARAGE_INFO.logoUrl}
                alt={GARAGE_INFO.nom}
                className="h-11 w-auto max-w-[220px] object-contain mb-1"
              />
              <p className="text-xs text-slate-500">Service Magasin & Gestion des Stocks</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-xs uppercase px-2.5 py-1 bg-amber-100 text-amber-900 rounded">
                BON DE SORTIE MATIÈRES
              </span>
              <p className="text-xs text-slate-600 mt-1">
                N° : <strong className="font-mono">{effectiveBonSortie.numeroBS}</strong>
              </p>
              <p className="text-xs text-slate-600">
                Date : <strong>{formatDate(effectiveBonSortie.dateSortie)}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 my-4 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase">Affectation Dossier</p>
              <p className="text-sm font-semibold text-slate-900">{dossier.numeroDossier}</p>
              <p className="text-slate-600">Client : {dossier.client.nom}</p>
              <p className="text-slate-600">
                Assurance : {dossier.typeDossier === 'PARTICULIER_COMPTANT' ? 'Particulier Direct (Sans Assurance)' : (dossier.assurance?.nom || 'Assurance')}
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase">Véhicule Cible & Poseur</p>
              <p className="text-sm font-bold text-slate-900">
                {dossier.vehicule.marque} {dossier.vehicule.modele} (<span dir="ltr">{formatMatricule(dossier.vehicule.immatriculation, 'LATIN')}</span>)
              </p>
              <p className="text-slate-700 mt-1">
                Technicien / Poseur : <strong className="text-amber-800">{effectiveBonSortie.poseur}</strong>
              </p>
            </div>
          </div>

          <div className="my-6 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-4">Référence</th>
                  <th className="py-2.5 px-4">Désignation de l'article</th>
                  <th className="py-2.5 px-4 text-center">Rayon / Dépôt</th>
                  <th className="py-2.5 px-4 text-center">Quantité délivrée</th>
                  <th className="py-2.5 px-4 text-center">Contrôle état</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {effectiveBonSortie.lignes.map((ligne, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{ligne.reference}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{ligne.designation}</td>
                    <td className="py-3 px-4 text-center">
                      {ligne.rayon ? (
                        <span className="inline-block px-2 py-0.5 font-mono font-black text-amber-900 bg-amber-100 rounded border border-amber-300">
                          {ligne.rayon}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-base text-slate-900">{ligne.quantite}</td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-semibold">☑ Conforme</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {effectiveBonSortie.notes && (
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-xs text-slate-700 my-4">
              <strong>Remarques / Emplacement :</strong> {effectiveBonSortie.notes}
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-12 pt-4 border-t border-slate-300 text-xs">
            <div className="text-center">
              <p className="font-bold text-slate-700 uppercase">Visa Magasinier / Stock</p>
              <div className="h-20 border border-dashed border-slate-300 rounded-lg mt-2 flex items-center justify-center text-slate-500 font-semibold">
                Validé Atelier - {GARAGE_INFO.nom}
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700 uppercase">Visa Technicien Poseur</p>
              <div className="h-20 border border-dashed border-slate-300 rounded-lg mt-2 flex items-center justify-center text-slate-500 font-semibold">
                {effectiveBonSortie.poseur}
              </div>
            </div>
          </div>
        </div>

        {/* 2. TEMPLATE A4 ORIGINAL : BON DE LIVRAISON CLIENT */}
        <div
          ref={bonLivraisonPrintRef}
          className="p-10 text-slate-800 text-sm leading-relaxed bg-white"
          style={{ width: '794px', minHeight: '1123px', backgroundColor: '#ffffff' }}
        >
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
                BON DE LIVRAISON N° {effectiveBonLivraison.numeroBL}
              </span>
              <p className="text-xs text-slate-600">
                Date : <span className="font-bold text-slate-900">{formatDate(effectiveBonLivraison.dateLivraison)}</span>
              </p>
              <p className="text-xs text-slate-600">
                Dossier Réf : <span className="font-mono font-semibold">{dossier.numeroDossier}</span>
              </p>
              {(dossier.vehicule.immatriculation || effectiveBonLivraison.immatriculation) && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Matricule :{' '}
                  <strong className="font-mono font-black text-slate-900" dir="ltr">
                    {formatMatricule(dossier.vehicule.immatriculation || effectiveBonLivraison.immatriculation || '', 'LATIN')}
                  </strong>
                </p>
              )}
              <p className="text-xs text-slate-600">
                Régime : <strong>{isAssurance ? (dossier.assurance?.nom || 'Assurance via AZUR GLASS') : 'Client Direct (Comptant)'}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 my-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
              <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                Client / Destinataire
              </p>
              <p className="text-sm font-bold text-slate-900">{dossier.client.nom}</p>
              <p className="text-slate-600 mt-1">
                CIN / ICE : <span className="font-mono font-semibold text-slate-800">{dossier.client.cin || 'N/A'}</span>
              </p>
              <p className="text-slate-600 mt-0.5">Téléphone : <strong>{dossier.client.telephone || '-'}</strong></p>
              <p className="text-slate-600 mt-0.5">Ville : <strong>{dossier.client.ville || 'Marrakech'}</strong></p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
              <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                Véhicule & Travaux Réalisés
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {dossier.vehicule.marque} {dossier.vehicule.modele} ({dossier.vehicule.annee})
              </p>
              <p className="text-slate-700 mt-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                Matricule :{' '}
                <strong className="font-mono font-black text-slate-900 text-sm" dir="ltr">
                  {formatMatricule(dossier.vehicule.immatriculation || effectiveBonLivraison.immatriculation || '', 'LATIN')}
                </strong>
              </p>
              {isAssurance && (
                <p className="text-slate-600 mt-2 font-mono text-[11px]">
                  N° Sinistre : <strong>{dossier.numeroSinistre || '-'}</strong>
                </p>
              )}
              <p className="text-slate-600 mt-1">
                Technicien Poseur : <strong>{effectiveBonLivraison.livreurPoseur}</strong>
              </p>
            </div>
          </div>

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
                {blPrestationsLignes.map((ligne, idx) => (
                  <tr key={idx}>
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

          <div className="flex justify-between items-start gap-4 my-6">
            <div className="flex-1 max-w-md">
              {isAssurance && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                    Détail Prise en Charge Assurance :
                  </p>
                  <div className="space-y-1 text-slate-700 pt-1">
                    <div className="flex justify-between">
                      <span>Franchise {dossier.franchiseOfferte ? '(Offerte)' : '(À régler par le client)'} :</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatDH(dossier.montantFranchise || 0)}
                      </span>
                    </div>
                    {tvaPro > 0 && (
                      <div className="flex justify-between">
                        <span>TVA exclue (Régime Pro / Location) :</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatDH(tvaPro)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold text-indigo-950">
                      <span>Prise en charge nette assurance :</span>
                      <span className="font-mono font-bold">{formatDH(netReversement)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-72 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Prestations (TTC) :</span>
                <span className="font-mono text-emerald-800 text-base">{formatDH(totalTTC)}</span>
              </div>
              <p className="text-[10px] text-slate-500 italic text-right">
                Total TTC incluant l'ensemble des prestations réalisées
              </p>
            </div>
          </div>

          {effectiveBonLivraison.observations && (
            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 text-[11px] uppercase block">Observations & Remarques :</span>
              <p className="text-slate-800 font-medium italic mt-1">{effectiveBonLivraison.observations}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t-2 border-slate-800 text-xs">
            <div className="text-center">
              <p className="font-bold uppercase text-slate-900">Visa / Réceptionnaire</p>
              <div className="h-20 border border-dashed border-slate-300 rounded-xl mt-3 flex items-center justify-center">
                <span className="text-xs text-slate-500 font-semibold">{dossier.client.nom}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold uppercase text-slate-900">Cachet & Visa de l'Établissement</p>
              <div className="h-20 border border-dashed border-slate-300 rounded-xl mt-3 flex items-center justify-center">
                <span className="text-xs text-slate-500 font-semibold">
                  {GARAGE_INFO.nom} - {formatDate(effectiveBonLivraison.dateLivraison)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TEMPLATE A4 ORIGINAL : FACTURE OFFICIELLE */}
        <div
          ref={facturePrintRef}
          className="p-10 text-slate-800 text-sm leading-relaxed bg-white"
          style={{ width: '794px', minHeight: '1123px', backgroundColor: '#ffffff' }}
        >
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div>
              <img
                src={GARAGE_INFO.logoUrl}
                alt={GARAGE_INFO.nom}
                className="h-14 w-auto max-w-[260px] object-contain mb-2"
              />
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                Remplacement & Réparation de Pare-Brise et Vitrage Automobile
              </p>
              <p className="text-xs text-slate-600">{GARAGE_INFO.adresse}</p>
              <p className="text-xs text-slate-600">Tél : {GARAGE_INFO.telephone}</p>
              <p className="text-xs text-slate-600">Email : {GARAGE_INFO.email}</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase tracking-wider mb-2">
                FACTURE N° {effectiveFacture.numeroFacture}
              </div>
              <p className="text-xs text-slate-600">
                Date émission : <span className="font-medium text-slate-900">{formatDate(effectiveFacture.dateEmission)}</span>
              </p>
              <p className="text-xs text-slate-600">
                Date échéance : <span className="font-medium text-slate-900">{formatDate(effectiveFacture.dateEcheance)}</span>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Dossier Réf : <span className="font-mono font-semibold">{dossier.numeroDossier}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 my-6 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Facturé à :</p>
              {isAssurance ? (
                <>
                  <p className="text-base font-black text-slate-900">{AZUR_GLASS_INFO.nom} SARL</p>
                  <p className="text-xs text-slate-600">{AZUR_GLASS_INFO.designationComplete}</p>
                  <p className="text-xs text-slate-600">{AZUR_GLASS_INFO.adresse}</p>
                  <p className="text-xs font-mono text-slate-800 mt-1 font-bold">ICE : {AZUR_GLASS_INFO.ice}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Compagnie : <strong>{dossier.assurance?.nom}</strong> ({dossier.agenceAssurance || 'Agence'})
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold text-slate-900">{dossier.client.nom}</p>
                  <p className="text-xs text-slate-600">Tél : {dossier.client.telephone}</p>
                  <p className="text-xs text-slate-600">CIN : {dossier.client.cin || '-'}</p>
                </>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assuré & Véhicule :</p>
              <p className="text-sm font-bold text-slate-900">{dossier.client.nom}</p>
              <p className="text-xs text-slate-600">
                Véhicule : <strong>{dossier.vehicule.marque} {dossier.vehicule.modele} ({dossier.vehicule.annee})</strong>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Matricule : <strong className="font-mono">{formatMatricule(dossier.vehicule.immatriculation, 'LATIN')}</strong>
              </p>
              {dossier.numeroSinistre && (
                <p className="text-xs text-slate-600 mt-1 font-mono">
                  N° Sinistre : <strong>{dossier.numeroSinistre}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="my-6 border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Désignation des Prestations & Fournitures</th>
                  <th className="py-3 px-4 text-center">Qté</th>
                  <th className="py-3 px-4 text-right">P.U HT (DH)</th>
                  <th className="py-3 px-4 text-center">TVA</th>
                  <th className="py-3 px-4 text-right">Total HT (DH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {effectiveFacture.lignes.map((l, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{l.designation}</td>
                    <td className="py-3 px-4 text-center font-mono">{l.quantite}</td>
                    <td className="py-3 px-4 text-right font-mono">{l.prixUnitaireHT.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center font-mono">{l.tauxTva}%</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{l.totalHT.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end my-6">
            <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total HT :</span>
                <span className="font-mono font-semibold">{formatDH(effectiveFacture.totalHT)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA (20%) :</span>
                <span className="font-mono font-semibold">{formatDH(effectiveFacture.totalTVA)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-slate-900 text-sm">
                <span>Total TTC :</span>
                <span className="font-mono text-emerald-700">{formatDH(effectiveFacture.totalTTC)}</span>
              </div>
            </div>
          </div>

          {obsFacture && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 my-4">
              <strong>Observation :</strong> {obsFacture}
            </div>
          )}

          <div className="mt-10 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
            {GARAGE_INFO.nom} • ICE : {GARAGE_INFO.ice} • RC : {GARAGE_INFO.rc} • IF : {GARAGE_INFO.ifiscal} • {GARAGE_INFO.adresse}
          </div>
        </div>
      </div>
    </div>
  );
};
