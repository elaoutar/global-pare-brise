import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DocumentExportOptions {
  filename: string;
  documentTitle?: string;
  clientPhone?: string;
  shareMessage?: string;
}

/**
 * Capture an HTML element and generate an A4 format PDF (210mm x 297mm)
 */
export async function generatePdfBlobFromElement(element: HTMLElement): Promise<{ pdf: jsPDF; blob: Blob }> {
  // Capture with html2canvas with sharp rendering (scale 2)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794, // Standard A4 width at 96 DPI
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  
  // Calculate scaled height
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    // Fits in a single A4 page
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page A4
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 5) { // 5mm tolerance
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
  }

  const blob = pdf.output('blob');
  return { pdf, blob };
}

/**
 * Download document as A4 PDF
 */
export async function downloadElementAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const { pdf } = await generatePdfBlobFromElement(element);
  pdf.save(cleanFilename);
}

/**
 * Share document via WhatsApp / Native Share sheet
 */
export async function shareElementToWhatsApp(
  element: HTMLElement, 
  options: DocumentExportOptions
): Promise<{ success: boolean; sharedVia: 'native' | 'whatsapp_link' }> {
  const cleanFilename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
  const { pdf, blob } = await generatePdfBlobFromElement(element);

  const defaultMsg = options.shareMessage || 
    `Bonjour, veuillez trouver ci-joint votre document : ${options.documentTitle || options.filename} émis par GLOBAL PARE-BRISE Marrakech.`;

  // 1. Check if native file sharing is available (Mobile iOS / Android)
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([blob], cleanFilename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: options.documentTitle || cleanFilename,
          text: defaultMsg,
        });
        return { success: true, sharedVia: 'native' };
      }
    } catch (err: unknown) {
      // User aborted share or share failed
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: true, sharedVia: 'native' };
      }
      console.warn('Native sharing failed, falling back to download + WhatsApp link', err);
    }
  }

  // 2. Fallback: Save PDF file directly on device and open WhatsApp
  pdf.save(cleanFilename);

  // Format clean Moroccan or international phone number
  let targetPhone = (options.clientPhone || '').replace(/[^0-9]/g, '');
  if (targetPhone.startsWith('0')) {
    targetPhone = '212' + targetPhone.substring(1);
  }

  const whatsappUrl = targetPhone 
    ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(defaultMsg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(defaultMsg)}`;

  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  }

  return { success: true, sharedVia: 'whatsapp_link' };
}
