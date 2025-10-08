/**
 * Invoice PDF generation utility with Polish compliance
 * Generates professional PDF invoices using jsPDF with Polish formatting
 */

import { calculateInvoiceItemAmounts } from '@/lib/validations/invoice';
import type { Database } from '@/types/database';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF to include lastAutoTable property
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

// Font configuration for Polish text support

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface InvoiceWithRelations extends Invoice {
  invoice_items: InvoiceItem[];
  clients: Client;
}

interface CompanyInfo {
  name: string;
  vat_id?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface PDFGenerationOptions {
  companyInfo: CompanyInfo;
  logoUrl?: string;
  watermark?: string;
  showVATBreakdown?: boolean;
  language?: 'pl' | 'en';
}

/**
 * Formats currency amount in Polish style
 */
function formatCurrency(amount: number, currency: string = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats date in Polish style
 */
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Gets VAT rate label in Polish
 */
function getVATRateLabel(rate: number): string {
  switch (rate) {
    case 0:
      return 'zwolnione';
    case 5:
      return '5%';
    case 8:
      return '8%';
    case 23:
      return '23%';
    default:
      return `${rate}%`;
  }
}

/**
 * Gets unit label in Polish
 */
function getUnitLabel(unit: string): string {
  switch (unit) {
    case 'pcs':
      return 'szt.';
    case 'hours':
      return 'godz.';
    case 'days':
      return 'dni';
    case 'kg':
      return 'kg';
    case 'm':
      return 'm';
    case 'm2':
      return 'm²';
    case 'm3':
      return 'm³';
    case 'service':
      return 'usł.';
    default:
      return unit;
  }
}

/**
 * Gets invoice status label in Polish
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Szkic';
    case 'issued':
      return 'Wystawiona';
    case 'sent':
      return 'Wysłana';
    case 'paid':
      return 'Opłacona';
    case 'overdue':
      return 'Przeterminowana';
    case 'voided':
      return 'Anulowana';
    case 'cancelled':
      return 'Odwołana';
    default:
      return status;
  }
}

/**
 * Adds company header with logo and contact information
 */
function addCompanyHeader(doc: jsPDF, companyInfo: CompanyInfo, logoUrl?: string): number {
  let yPosition = 20;

  // Company logo (if provided)
  if (logoUrl) {
    try {
      // In a real implementation, you'd load the image
      // doc.addImage(logoUrl, 'PNG', 20, yPosition, 40, 20);
    } catch (error) {
      console.warn('Failed to load company logo:', error);
    }
    yPosition += 30;
  }

  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, 20, yPosition);
  yPosition += 8;

  // Company details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (companyInfo.address_line1) {
    doc.text(companyInfo.address_line1, 20, yPosition);
    yPosition += 5;
  }

  if (companyInfo.address_line2) {
    doc.text(companyInfo.address_line2, 20, yPosition);
    yPosition += 5;
  }

  if (companyInfo.postal_code || companyInfo.city) {
    const address = `${companyInfo.postal_code || ''} ${companyInfo.city || ''}`.trim();
    doc.text(address, 20, yPosition);
    yPosition += 5;
  }

  if (companyInfo.vat_id) {
    doc.text(`NIP: ${companyInfo.vat_id}`, 20, yPosition);
    yPosition += 5;
  }

  if (companyInfo.email) {
    doc.text(`Email: ${companyInfo.email}`, 20, yPosition);
    yPosition += 5;
  }

  if (companyInfo.phone) {
    doc.text(`Tel: ${companyInfo.phone}`, 20, yPosition);
    yPosition += 5;
  }

  if (companyInfo.website) {
    doc.text(`Web: ${companyInfo.website}`, 20, yPosition);
    yPosition += 5;
  }

  return yPosition + 10;
}

/**
 * Adds invoice header with number, dates, and status
 */
function addInvoiceHeader(doc: jsPDF, invoice: Invoice, yPosition: number): number {
  // Invoice title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FAKTURA', doc.internal.pageSize.getWidth() - 20, yPosition, { align: 'right' });
  yPosition += 10;

  // Invoice details in right column
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const invoiceDetails = [
    `Numer: ${invoice.number}`,
    `Data wystawienia: ${formatDate(invoice.issue_date)}`,
    `Termin płatności: ${formatDate(invoice.due_date)}`,
    `Status: ${getStatusLabel(invoice.status)}`,
    `Waluta: ${invoice.currency}`,
  ];

  invoiceDetails.forEach((detail) => {
    doc.text(detail, doc.internal.pageSize.getWidth() - 20, yPosition, { align: 'right' });
    yPosition += 6;
  });

  return yPosition + 10;
}

/**
 * Adds client information
 */
function addClientInfo(doc: jsPDF, client: Client, yPosition: number): number {
  // Client header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NABYWCA:', 20, yPosition);
  yPosition += 8;

  // Client details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(client.name, 20, yPosition);
  yPosition += 5;

  if (client.vat_id) {
    doc.text(`NIP: ${client.vat_id}`, 20, yPosition);
    yPosition += 5;
  }

  if (client.address_line1) {
    doc.text(client.address_line1, 20, yPosition);
    yPosition += 5;
  }

  if (client.address_line2) {
    doc.text(client.address_line2, 20, yPosition);
    yPosition += 5;
  }

  if (client.postal_code || client.city) {
    const address = `${client.postal_code || ''} ${client.city || ''}`.trim();
    doc.text(address, 20, yPosition);
    yPosition += 5;
  }

  if (client.email) {
    doc.text(`Email: ${client.email}`, 20, yPosition);
    yPosition += 5;
  }

  if (client.phone) {
    doc.text(`Tel: ${client.phone}`, 20, yPosition);
    yPosition += 5;
  }

  return yPosition + 10;
}

/**
 * Adds invoice items table
 */
function addInvoiceItemsTable(doc: jsPDF, items: InvoiceItem[], currency: string, yPosition: number): number {
  const tableColumns = [
    'Lp.',
    'Nazwa towaru/usługi',
    'Ilość',
    'Jedn.',
    'Cena netto',
    'Wartość netto',
    'VAT',
    'Wartość VAT',
    'Wartość brutto',
  ];

  const tableRows = items.map((item, index) => {
    const itemTotals = calculateInvoiceItemAmounts(item.quantity, item.unit_price, item.vat_rate);

    return [
      (index + 1).toString(),
      item.name, // Remove description as it's not in the database schema
      item.quantity.toFixed(2),
      getUnitLabel(item.unit),
      formatCurrency(item.unit_price, currency),
      formatCurrency(itemTotals.netAmount, currency),
      getVATRateLabel(item.vat_rate),
      formatCurrency(itemTotals.vatAmount, currency),
      formatCurrency(itemTotals.grossAmount, currency),
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      font: 'helvetica',
      cellPadding: 3,
      lineColor: [128, 128, 128],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // Lp.
      1: { cellWidth: 45 }, // Nazwa
      2: { halign: 'right', cellWidth: 18 }, // Ilość
      3: { halign: 'center', cellWidth: 15 }, // Jedn.
      4: { halign: 'right', cellWidth: 25 }, // Cena netto
      5: { halign: 'right', cellWidth: 25 }, // Wartość netto
      6: { halign: 'center', cellWidth: 15 }, // VAT
      7: { halign: 'right', cellWidth: 25 }, // Wartość VAT
      8: { halign: 'right', cellWidth: 25 }, // Wartość brutto
    },
  });

  return (doc.lastAutoTable?.finalY ?? 190) + 10;
}

/**
 * Adds invoice totals summary
 */
function addInvoiceTotals(
  doc: jsPDF,
  invoice: Invoice,
  currency: string,
  yPosition: number,
  options: PDFGenerationOptions,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Summary box
  const boxX = pageWidth - 80;
  const boxY = yPosition;
  const boxWidth = 70;
  const boxHeight = options.showVATBreakdown ? 50 : 35;

  // Draw box
  doc.setDrawColor(128, 128, 128);
  doc.setLineWidth(0.5);
  doc.rect(boxX, boxY, boxWidth, boxHeight);

  // Totals
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let textY = boxY + 8;

  doc.text('Suma netto:', boxX + 3, textY);
  doc.text(formatCurrency(invoice.subtotal_net, currency), boxX + boxWidth - 3, textY, { align: 'right' });
  textY += 6;

  doc.text('Suma VAT:', boxX + 3, textY);
  doc.text(formatCurrency(invoice.total_vat, currency), boxX + boxWidth - 3, textY, { align: 'right' });
  textY += 6;

  // Separator line
  doc.setLineWidth(0.3);
  doc.line(boxX + 3, textY, boxX + boxWidth - 3, textY);
  textY += 5;

  // Final total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RAZEM:', boxX + 3, textY);
  doc.text(formatCurrency(invoice.total_gross, currency), boxX + boxWidth - 3, textY, { align: 'right' });

  return yPosition + boxHeight + 15;
}

/**
 * Adds payment information
 */
function addPaymentInfo(doc: jsPDF, invoice: Invoice, yPosition: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACJE O PŁATNOŚCI:', 20, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Termin płatności: ${formatDate(invoice.due_date)}`, 20, yPosition);
  yPosition += 5;

  // Bank account information would go here in a real implementation
  doc.text('Forma płatności: Przelew bankowy', 20, yPosition);
  yPosition += 5;

  return yPosition + 10;
}

/**
 * Adds footer with notes and legal information
 */
function addFooter(doc: jsPDF, invoice: Invoice, yPosition: number): void {
  const pageHeight = doc.internal.pageSize.getHeight();

  // Notes
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Uwagi:', 20, yPosition);
    yPosition += 6;

    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, yPosition);
    yPosition += noteLines.length * 4 + 10;
  }

  // Legal footer
  const footerY = Math.max(yPosition, pageHeight - 30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const legalText = 'Faktura wystawiona zgodnie z obowiązującymi przepisami podatkowymi.';
  doc.text(legalText, 20, footerY);

  // Page number
  const pageNumber = `Strona 1`;
  doc.text(pageNumber, doc.internal.pageSize.getWidth() - 20, footerY, { align: 'right' });
}

/**
 * Generates PDF invoice
 */
export async function generateInvoicePDF(invoice: InvoiceWithRelations, options: PDFGenerationOptions): Promise<Blob> {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Configure fonts for Polish characters
  doc.setFont('helvetica', 'normal');

  let yPosition = 20;

  try {
    // Add company header
    yPosition = addCompanyHeader(doc, options.companyInfo, options.logoUrl);

    // Add invoice header
    yPosition = addInvoiceHeader(doc, invoice, yPosition);

    // Add client information
    yPosition = addClientInfo(doc, invoice.clients, yPosition);

    // Add items table
    yPosition = addInvoiceItemsTable(doc, invoice.invoice_items, invoice.currency, yPosition);

    // Add totals
    yPosition = addInvoiceTotals(doc, invoice, invoice.currency, yPosition, options);

    // Add payment information
    yPosition = addPaymentInfo(doc, invoice, yPosition);

    // Add footer
    addFooter(doc, invoice, yPosition);

    // Add watermark if specified
    if (options.watermark) {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(48);
      doc.text(options.watermark, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2, {
        align: 'center',
        angle: 45,
        baseline: 'middle',
      });
    }

    // Return PDF as blob
    return doc.output('blob');
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Downloads PDF invoice
 */
export async function downloadInvoicePDF(
  invoice: InvoiceWithRelations,
  options: PDFGenerationOptions,
  filename?: string,
): Promise<void> {
  try {
    const pdfBlob = await generateInvoicePDF(invoice, options);

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `Faktura_${invoice.number}.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
