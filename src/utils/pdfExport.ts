import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DOMPurify from 'dompurify';

export const exportToPDF = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }

  // Hide export buttons during capture
  const buttons = element.querySelectorAll('[data-hide-in-pdf]');
  buttons.forEach((btn) => (btn as HTMLElement).style.display = 'none');

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for print quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = (pdfHeight - imgHeight * ratio) / 2;

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );
    pdf.save(filename);
  } finally {
    // Restore buttons after capture
    buttons.forEach((btn) => (btn as HTMLElement).style.display = '');
  }
};

export const printReport = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Sanitize HTML to prevent XSS
  const sanitizedHTML = DOMPurify.sanitize(element.innerHTML, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                   'table', 'thead', 'tbody', 'tr', 'td', 'th', 
                   'canvas', 'svg', 'path', 'g', 'rect', 'circle', 'line', 'text',
                   'ul', 'ol', 'li', 'strong', 'em', 'br', 'img'],
    ALLOWED_ATTR: ['class', 'style', 'viewBox', 'd', 'fill', 'stroke', 
                   'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'transform', 'src', 'alt']
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>VybePulse - Report</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Inter, sans-serif; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>${sanitizedHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};
