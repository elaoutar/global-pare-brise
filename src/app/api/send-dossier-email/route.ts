import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabaseClient';

/**
 * Convertit une URL (data:image/..., data:application/pdf..., ou https://...)
 * en objet d'attachement compatible Nodemailer.
 */
function buildAttachmentFromUrl(
  url: string,
  baseFilename: string
): { filename: string; path?: string; content?: Buffer; contentType?: string } | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. Cas Data URI Base64 (ex: data:image/jpeg;base64,... ou data:application/pdf;filename=...;base64,...)
  if (trimmed.startsWith('data:')) {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx === -1) return null;

    const header = trimmed.slice(5, commaIdx); // ex: "image/jpeg;base64"
    const base64Data = trimmed.slice(commaIdx + 1);
    if (!base64Data) return null;

    const mimeMatch = header.split(';')[0] || 'application/octet-stream';
    let ext = '.jpg';
    if (mimeMatch.includes('png')) ext = '.png';
    else if (mimeMatch.includes('webp')) ext = '.webp';
    else if (mimeMatch.includes('pdf')) ext = '.pdf';
    else if (mimeMatch.includes('jpeg') || mimeMatch.includes('jpg')) ext = '.jpg';

    const hasExt = /\.[a-zA-Z0-9]{3,4}$/.test(baseFilename);
    const finalName = hasExt ? baseFilename : `${baseFilename}${ext}`;

    return {
      filename: finalName,
      content: Buffer.from(base64Data, 'base64'),
      contentType: mimeMatch,
    };
  }

  // 2. Cas URL HTTP/HTTPS classique
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const hasExt = /\.[a-zA-Z0-9]{3,4}$/.test(baseFilename);
    const finalName = hasExt ? baseFilename : `${baseFilename}.jpg`;
    return {
      filename: finalName,
      path: trimmed,
    };
  }

  return null;
}

/**
 * Repli serveur : génère un vrai fichier PDF A4 propre via jsPDF si le PDF client n'a pas été transmis
 */
function generateFallbackBonSortiePdf(bonSortie: any, dossierNumero: string, dossier?: any): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GLOBAL PARE-BRISE', 15, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Service Magasin & Gestion des Stocks - Marrakech', 15, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`BON DE SORTIE MATIERES N° ${bonSortie.numeroBS || 'BS-AUTO'}`, 195, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${bonSortie.dateSortie || new Date().toISOString().split('T')[0]}`, 195, 26, { align: 'right' });
  doc.text(`Dossier : ${dossierNumero || '-'}`, 195, 31, { align: 'right' });

  doc.line(15, 36, 195, 36);

  doc.setFont('helvetica', 'bold');
  doc.text('Affectation & Vehicule :', 15, 45);
  doc.setFont('helvetica', 'normal');
  const clientNom = dossier?.client?.nom || '-';
  const vehiculeTxt = dossier?.vehicule
    ? `${dossier.vehicule.marque || ''} ${dossier.vehicule.modele || ''} (${dossier.vehicule.immatriculation || ''})`
    : (bonSortie.notes || '-');
  doc.text(`Client : ${clientNom}`, 15, 51);
  doc.text(`Vehicule : ${vehiculeTxt}`, 15, 57);
  doc.text(`Technicien / Poseur : ${bonSortie.poseur || 'Poseur Atelier'}`, 15, 63);

  // Tableau des lignes
  let y = 75;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y - 6, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Reference', 18, y);
  doc.text('Designation de l\'article', 55, y);
  doc.text('Qte', 165, y, { align: 'center' });
  doc.text('Controle', 185, y, { align: 'center' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  (bonSortie.lignes || []).forEach((l: any) => {
    doc.text(String(l.reference || '-').slice(0, 18), 18, y);
    doc.text(String(l.designation || '-').slice(0, 55), 55, y);
    doc.text(String(l.quantite || 1), 165, y, { align: 'center' });
    doc.text('Conforme', 185, y, { align: 'center' });
    y += 8;
  });

  doc.line(15, y + 4, 195, y + 4);
  if (bonSortie.notes) {
    doc.setFontSize(9);
    doc.text(`Remarques : ${bonSortie.notes}`, 15, y + 12);
  }

  return Buffer.from(doc.output('arraybuffer'));
}

function generateFallbackBonLivraisonPdf(bonLivraison: any, dossierNumero: string, dossier?: any): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GLOBAL PARE-BRISE', 15, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Centre Specialise Vitrage Auto & Bris de Glace - Marrakech', 15, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`BON DE LIVRAISON N° ${bonLivraison.numeroBL || 'BL-AUTO'}`, 195, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${bonLivraison.dateLivraison || new Date().toISOString().split('T')[0]}`, 195, 26, { align: 'right' });
  doc.text(`Dossier : ${dossierNumero || '-'}`, 195, 31, { align: 'right' });

  doc.line(15, 36, 195, 36);

  const clientNom = bonLivraison.receptionnaireNom || bonLivraison.clientNom || dossier?.client?.nom || 'Client';
  const immat = dossier?.vehicule?.immatriculation || bonLivraison.immatriculation || '';
  const vehiculeTxt = dossier?.vehicule
    ? `${dossier.vehicule.marque || ''} ${dossier.vehicule.modele || ''} (${dossier.vehicule.annee || ''})`.trim()
    : (bonLivraison.vehiculeInfo || '-');

  doc.setFont('helvetica', 'bold');
  doc.text('Client & Vehicule :', 15, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`Client : ${clientNom} (CIN: ${bonLivraison.receptionnaireCin || dossier?.client?.cin || '-'})`, 15, 51);
  doc.text(`Vehicule : ${vehiculeTxt}`, 15, 57);
  doc.setFont('helvetica', 'bold');
  doc.text(`Matricule : ${immat || 'N/A'}`, 15, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`Technicien Poseur : ${bonLivraison.livreurPoseur || 'Poseur Atelier'}`, 110, 63);

  let y = 75;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y - 6, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Prestations & Fournitures Livrees', 18, y);
  doc.text('Qte', 145, y, { align: 'center' });
  doc.text('Total TTC (DH)', 190, y, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  (bonLivraison.lignes || []).forEach((l: any) => {
    doc.text(String(l.designation || '-').slice(0, 65), 18, y);
    doc.text(String(l.quantite || 1), 145, y, { align: 'center' });
    doc.text(l.totalTTC ? `${Number(l.totalTTC).toFixed(2)} DH` : '-', 190, y, { align: 'right' });
    y += 8;
  });

  doc.line(15, y + 4, 195, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total TTC : ${Number(bonLivraison.totalTTC || 0).toFixed(2)} DH`, 190, y + 12, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

function generateFallbackFacturePdf(facture: any, dossierNumero: string, dossier?: any): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GLOBAL PARE-BRISE', 15, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Centre Specialise Vitrage Auto & Bris de Glace - Marrakech', 15, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`FACTURE OFFICIELLE N° ${facture.numeroFacture || 'N2028045'}`, 195, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${facture.dateEmission || new Date().toISOString().split('T')[0]}`, 195, 26, { align: 'right' });
  doc.text(`Dossier : ${dossierNumero || '-'}`, 195, 31, { align: 'right' });

  doc.line(15, 36, 195, 36);

  const clientNom = dossier?.client?.nom || 'AZUR GLASS SARL';
  const vehiculeTxt = dossier?.vehicule
    ? `${dossier.vehicule.marque || ''} ${dossier.vehicule.modele || ''} (${dossier.vehicule.immatriculation || ''})`
    : '-';

  doc.setFont('helvetica', 'bold');
  doc.text('Client & Sinistre :', 15, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`Assure / Client : ${clientNom}`, 15, 51);
  doc.text(`Vehicule : ${vehiculeTxt}`, 15, 57);

  let y = 70;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y - 6, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Designation', 18, y);
  doc.text('Qte', 135, y, { align: 'center' });
  doc.text('P.U HT', 160, y, { align: 'right' });
  doc.text('Total HT', 190, y, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  (facture.lignes || []).forEach((l: any) => {
    doc.text(String(l.designation || '-').slice(0, 60), 18, y);
    doc.text(String(l.quantite || 1), 135, y, { align: 'center' });
    doc.text(`${Number(l.prixUnitaireHT || 0).toFixed(2)}`, 160, y, { align: 'right' });
    doc.text(`${Number(l.totalHT || 0).toFixed(2)} DH`, 190, y, { align: 'right' });
    y += 8;
  });

  doc.line(15, y + 4, 195, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total HT : ${Number(facture.totalHT || 0).toFixed(2)} DH`, 190, y + 12, { align: 'right' });
  doc.text(`TVA (20%) : ${Number(facture.totalTVA || 0).toFixed(2)} DH`, 190, y + 18, { align: 'right' });
  doc.text(`Total TTC : ${Number(facture.totalTTC || 0).toFixed(2)} DH`, 190, y + 25, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      destinataire, 
      cc, 
      objet, 
      message, 
      html, 
      dossierId,
      dossierNumero,
      dossier,
      photos,
      documents,
      bonSortie,
      bonLivraison,
      facture,
      bonSortiePdfBase64,
      bonLivraisonPdfBase64,
      facturePdfBase64,
    } = body;

    if (!destinataire || !objet || !message) {
      return NextResponse.json(
        { error: 'Destinataire, objet et message obligatoires.' },
        { status: 400 }
      );
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      return NextResponse.json(
        { error: 'Configuration email manquante (SMTP_USER / SMTP_PASSWORD).' },
        { status: 500 }
      );
    }

    // Configuration du transporteur SMTP Gmail sécurisé
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // SSL
      auth: {
        user: smtpUser,
        pass: smtpPassword.replace(/\s+/g, ''), // Nettoyage des espaces de la clé
      },
    });

    // Récupération complémentaire des photos et documents depuis Supabase côté serveur
    // (permet d'avoir 100% des photos/documents même si le client a allégé la requête HTTP)
    let dbPhotos: Record<string, any> | null = null;
    let dbDocuments: any[] | null = null;
    const targetId = dossierId || dossier?.id;
    try {
      if (supabase && targetId) {
        const { data: row } = await supabase
          .from('dossiers')
          .select('photos, documents')
          .eq('id', targetId)
          .maybeSingle();
        if (row) {
          dbPhotos = row.photos;
          dbDocuments = row.documents;
        }
      } else if (supabase && dossierNumero) {
        const { data: row } = await supabase
          .from('dossiers')
          .select('photos, documents')
          .eq('numero_dossier', dossierNumero)
          .maybeSingle();
        if (row) {
          dbPhotos = row.photos;
          dbDocuments = row.documents;
        }
      }
    } catch (e) {
      console.warn('Lecture complémentaire Supabase dossiers ignorée:', e);
    }

    const mergedPhotos: Record<string, any> = {
      ...(dbPhotos && typeof dbPhotos === 'object' ? dbPhotos : {}),
      ...(photos && typeof photos === 'object' ? photos : {}),
    };
    if (Array.isArray(photos?.galerieUrls) && photos.galerieUrls.length > 0) {
      mergedPhotos.galerieUrls = photos.galerieUrls;
    } else if (Array.isArray(dbPhotos?.galerieUrls)) {
      mergedPhotos.galerieUrls = dbPhotos.galerieUrls;
    }

    const mergedDocuments: any[] =
      Array.isArray(documents) && documents.length > 0
        ? documents
        : Array.isArray(dbDocuments)
        ? dbDocuments
        : [];

    // Préparation des pièces jointes
    const attachments: Array<{ filename: string; path?: string; content?: string | Buffer; contentType?: string }> = [];

    // 1. Joindre la Facture Officielle en PDF A4 original
    if (facturePdfBase64) {
      const facAtt = buildAttachmentFromUrl(
        facturePdfBase64,
        `Facture_${facture?.numeroFacture || dossierNumero || 'Officielle'}.pdf`
      );
      if (facAtt) attachments.push(facAtt);
    } else if (facture) {
      const pdfBuf = generateFallbackFacturePdf(facture, dossierNumero, dossier);
      attachments.push({
        filename: `Facture_${facture.numeroFacture || dossierNumero || 'Officielle'}.pdf`,
        content: pdfBuf,
        contentType: 'application/pdf',
      });
    }

    // 2. Joindre le Bon de Sortie Atelier en PDF A4 original (jamais en .txt)
    if (bonSortiePdfBase64) {
      const bsAtt = buildAttachmentFromUrl(
        bonSortiePdfBase64,
        `Bon_de_Sortie_${bonSortie?.numeroBS || dossierNumero || 'BS'}.pdf`
      );
      if (bsAtt) attachments.push(bsAtt);
    } else if (bonSortie) {
      const pdfBuf = generateFallbackBonSortiePdf(bonSortie, dossierNumero, dossier);
      attachments.push({
        filename: `Bon_de_Sortie_${bonSortie.numeroBS || dossierNumero || 'BS'}.pdf`,
        content: pdfBuf,
        contentType: 'application/pdf',
      });
    }

    // 3. Joindre le Bon de Livraison Client en PDF A4 original (jamais en .txt)
    if (bonLivraisonPdfBase64) {
      const blAtt = buildAttachmentFromUrl(
        bonLivraisonPdfBase64,
        `Bon_de_Livraison_${bonLivraison?.numeroBL || dossierNumero || 'BL'}.pdf`
      );
      if (blAtt) attachments.push(blAtt);
    } else if (bonLivraison) {
      const pdfBuf = generateFallbackBonLivraisonPdf(bonLivraison, dossierNumero, dossier);
      attachments.push({
        filename: `Bon_de_Livraison_${bonLivraison.numeroBL || dossierNumero || 'BL'}.pdf`,
        content: pdfBuf,
        contentType: 'application/pdf',
      });
    }

    // 4. Ajouter TOUTES les photos du dossier en pièces jointes (supporte Base64 data:image/... ET https://...)
    if (mergedPhotos && typeof mergedPhotos === 'object') {
      const addedKeysOrUrls = new Set<string>();
      const photoLabels: Record<string, string> = {
        avantSinistreUrl: 'Photo_1_Avant_Sinistre',
        apresPoseUrl: 'Photo_2_Apres_Pose',
        carteGriseUrl: 'Photo_3_Carte_Grise',
        vinChassisUrl: 'Photo_4_Chassis_VIN',
        compteurKmUrl: 'Photo_5_Compteur_Km',
        permisUrl: 'Photo_6_Permis_CIN',
        angle360Url: 'Photo_7_Vue_Ensemble',
        autreUrl: 'Photo_8_Detail_Complementaire',
      };

      Object.entries(mergedPhotos).forEach(([key, url]) => {
        if (key === 'galerieUrls') return;
        if (typeof url === 'string' && url.trim() && !addedKeysOrUrls.has(url)) {
          const label = photoLabels[key] || `Photo_${key}`;
          const att = buildAttachmentFromUrl(url, `${label}_${dossierNumero || 'Dossier'}`);
          if (att) {
            addedKeysOrUrls.add(url);
            attachments.push(att);
          }
        }
      });

      if (Array.isArray(mergedPhotos.galerieUrls)) {
        mergedPhotos.galerieUrls.forEach((url: any, idx: number) => {
          if (typeof url === 'string' && url.trim() && !addedKeysOrUrls.has(url)) {
            const att = buildAttachmentFromUrl(url, `Photo_Voiture_${idx + 1}_${dossierNumero || 'Dossier'}`);
            if (att) {
              addedKeysOrUrls.add(url);
              attachments.push(att);
            }
          }
        });
      }
    }

    // 5. Ajouter les documents scannés du dossier (supporte Base64 data:... ET https://...)
    if (Array.isArray(mergedDocuments)) {
      const addedDocUrls = new Set<string>();
      mergedDocuments.forEach((doc: any, idx: number) => {
        if (doc && typeof doc.url === 'string' && doc.url.trim() && !addedDocUrls.has(doc.url)) {
          const att = buildAttachmentFromUrl(doc.url, doc.nom || `Document_${idx + 1}`);
          if (att) {
            addedDocUrls.add(doc.url);
            attachments.push(att);
          }
        }
      });
    }

    // Version HTML professionnelle et élégante pour AZUR GLASS
    const formattedHtml = html || `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; padding: 24px; text-align: left;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">GLOBAL PARE-BRISE</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Transmission Officielle de Dossier Sinistre Bris de Glaces</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin-bottom: 20px; font-size: 13px;">
            <strong>Dossier Réf :</strong> ${dossierNumero || 'En cours'}<br />
            <strong>Expéditeur certifié :</strong> ${smtpUser}
          </div>

          <div style="white-space: pre-line; font-size: 13px; color: #334155; line-height: 1.7;">
            ${message}
          </div>

          ${attachments.length > 0 ? `
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
              <p style="font-weight: bold; font-size: 12px; color: #0f172a; margin-bottom: 8px;">
                📎 Pièces Jointes PDF & Photos Incluses (${attachments.length}) :
              </p>
              <ul style="font-size: 12px; color: #475569; padding-left: 20px; margin: 0;">
                ${attachments.map(att => `<li>${att.filename}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Ce message et ses pièces jointes ont été envoyés via la plateforme officielle Global Pare-Brise.<br />
          Centre Spécialisé Pare-Brise Marrakech • SARL au Capital de 100.000 DH
        </div>
      </div>
    `;

    // Envoi de l'e-mail via SMTP
    const mailOptions = {
      from: `"GLOBAL PARE-BRISE" <${smtpUser}>`,
      to: destinataire,
      cc: cc || undefined,
      subject: objet,
      text: message,
      html: formattedHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      attachmentsCount: attachments.length,
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'email SMTP:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Échec de l\'envoi par Gmail SMTP.',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
