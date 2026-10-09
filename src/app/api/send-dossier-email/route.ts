import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      destinataire, 
      cc, 
      objet, 
      message, 
      html, 
      dossierNumero,
      photos,
      documents
    } = body;

    if (!destinataire || !objet || !message) {
      return NextResponse.json(
        { error: 'Destinataire, objet et message obligatoires.' },
        { status: 400 }
      );
    }

    const smtpUser = process.env.SMTP_USER || 'a.elaoutar@gmail.com';
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpPassword) {
      return NextResponse.json(
        { error: 'Clé SMTP d\'application Gmail non configurée sur le serveur.' },
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

    // Préparation des pièces jointes
    const attachments: Array<{ filename: string; path?: string; content?: string | Buffer }> = [];

    // Ajouter les photos du dossier en pièces jointes si des URLs existent
    if (photos) {
      if (photos.avantSinistreUrl && photos.avantSinistreUrl.startsWith('http')) {
        attachments.push({
          filename: `Photo_1_Avant_Sinistre_${dossierNumero || 'Dossier'}.jpg`,
          path: photos.avantSinistreUrl,
        });
      }
      if (photos.apresPoseUrl && photos.apresPoseUrl.startsWith('http')) {
        attachments.push({
          filename: `Photo_2_Apres_Pose_${dossierNumero || 'Dossier'}.jpg`,
          path: photos.apresPoseUrl,
        });
      }
      if (photos.carteGriseUrl && photos.carteGriseUrl.startsWith('http')) {
        attachments.push({
          filename: `Photo_3_Carte_Grise_${dossierNumero || 'Dossier'}.jpg`,
          path: photos.carteGriseUrl,
        });
      }
    }

    // Ajouter les documents joints si disponibles
    if (Array.isArray(documents)) {
      documents.forEach((doc: any, idx: number) => {
        if (doc.url && doc.url.startsWith('http')) {
          attachments.push({
            filename: doc.nom || `Document_${idx + 1}.pdf`,
            path: doc.url,
          });
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
                📎 Pièces Jointes Incluses (${attachments.length}) :
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
