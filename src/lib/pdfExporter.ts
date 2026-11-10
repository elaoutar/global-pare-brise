import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DocumentExportOptions {
  filename: string;
  documentTitle?: string;
  clientPhone?: string;
  shareMessage?: string;
}

/**
 * Capture an HTML element and generate a single-page A4 format PDF (210mm x 297mm)
 */
export async function generatePdfBlobFromElement(element: HTMLElement): Promise<{ pdf: jsPDF; blob: Blob }> {
  // Capture with html2canvas with sharp rendering (scale 2) on a single A4 page
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 900,
    onclone: (_doc, clonedEl) => {
      clonedEl.style.width = '794px';
      clonedEl.style.maxWidth = '794px';
      clonedEl.style.minHeight = 'auto';
      clonedEl.style.margin = '0';
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  // Always fit onto 1 single A4 page (never duplicate/slice across 2 or 3 pages)
  let renderWidth = pdfWidth;
  let renderHeight = (canvas.height * pdfWidth) / canvas.width;
  let offsetX = 0;

  if (renderHeight > pdfHeight) {
    const scaleFactor = pdfHeight / renderHeight;
    renderHeight = pdfHeight;
    renderWidth = pdfWidth * scaleFactor;
    offsetX = (pdfWidth - renderWidth) / 2;
  }

  pdf.addImage(imgData, 'JPEG', offsetX, 0, renderWidth, renderHeight, undefined, 'FAST');

  const blob = pdf.output('blob');
  return { pdf, blob };
}

/**
 * Capture an HTML element as a compact, email-optimized single-page A4 PDF Base64 Data URI (~100-180 KB)
 * Avoids HTTP 413 Request Entity Too Large on serverless functions (Vercel 4.5MB limit).
 */
export async function generateCompactPdfBase64FromElement(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 900,
    onclone: (_doc, clonedEl) => {
      clonedEl.style.width = '794px';
      clonedEl.style.maxWidth = '794px';
      clonedEl.style.minHeight = 'auto';
      clonedEl.style.margin = '0';
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.78);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  let renderWidth = pdfWidth;
  let renderHeight = (canvas.height * pdfWidth) / canvas.width;
  let offsetX = 0;

  if (renderHeight > pdfHeight) {
    const scaleFactor = pdfHeight / renderHeight;
    renderHeight = pdfHeight;
    renderWidth = pdfWidth * scaleFactor;
    offsetX = (pdfWidth - renderWidth) / 2;
  }

  pdf.addImage(imgData, 'JPEG', offsetX, 0, renderWidth, renderHeight, undefined, 'FAST');

  return pdf.output('datauristring');
}

/**
 * Print an HTML element on a guaranteed single A4 page (1 single copy) using an isolated iframe.
 * Prevents the browser bug where `position: fixed` modals repeat across 3 pages.
 */
export async function printElementSinglePage(element: HTMLElement, documentTitle = 'Document'): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 900,
    onclone: (_doc, clonedEl) => {
      clonedEl.style.width = '794px';
      clonedEl.style.maxWidth = '794px';
      clonedEl.style.minHeight = 'auto';
      clonedEl.style.margin = '0';
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${documentTitle}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }
      html, body {
        margin: 0;
        padding: 0;
        width: 210mm;
        height: 297mm;
        overflow: hidden;
        background: #ffffff;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      img {
        max-width: 210mm;
        max-height: 297mm;
        width: auto;
        height: auto;
        object-fit: contain;
        display: block;
        page-break-inside: avoid;
        break-inside: avoid;
      }
    </style>
  </head>
  <body>
    <img id="print-img" src="${imgData}" alt="${documentTitle}" />
  </body>
</html>`);
  doc.close();

  const printImg = doc.getElementById('print-img') as HTMLImageElement | null;
  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  };

  if (printImg && !printImg.complete) {
    printImg.onload = triggerPrint;
    printImg.onerror = triggerPrint;
  } else {
    setTimeout(triggerPrint, 100);
  }
}

/**
 * Download document as A4 PDF (1 single copy)
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
