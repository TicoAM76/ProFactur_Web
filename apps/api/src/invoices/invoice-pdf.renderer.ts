import PDFDocument from 'pdfkit';
import {
  buildTaxBreakdown,
  InvoiceTaxBreakdownRow,
} from './invoice-tax-breakdown';

export interface InvoicePdfLine {
  position: number;
  code: string | null;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxRate: string;
  netAmount: string;
  taxAmount: string;
  totalAmount: string;
}

export interface InvoicePdfDocumentData {
  fullNumber: string;
  issuedAt: Date;
  currencyCode: string;
  notes: string | null;

  sellerLegalName: string;
  sellerTradeName: string | null;
  sellerTaxId: string;
  sellerAddressLine1: string;
  sellerAddressLine2: string | null;
  sellerPostalCode: string;
  sellerCity: string;
  sellerProvince: string;
  sellerCountryCode: string;

  customerLegalName: string;
  customerTradeName: string | null;
  customerTaxId: string | null;
  customerAddressLine1: string | null;
  customerAddressLine2: string | null;
  customerPostalCode: string | null;
  customerCity: string | null;
  customerProvince: string | null;
  customerCountryCode: string;

  vehicleRegistrationNumber: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleVersion: string | null;
  vehicleVin: string | null;
  vehicleMileage: number | null;

  subtotal: string;
  taxAmount: string;
  totalAmount: string;

  lines: InvoicePdfLine[];
  footerNotice?: string | null;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - MARGIN - 12;

const colors = {
  primary: '#1F2937',
  secondary: '#4B5563',
  border: '#D1D5DB',
  light: '#F3F4F6',
  white: '#FFFFFF',
};

function normalizeSpaces(value: string): string {
  return value.replace(/[\u00A0\u202F]/g, ' ');
}

export function formatInvoiceAmount(
  value: string,
  currencyCode: string,
): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Importe no válido: ${value}`);
  }

  return normalizeSpaces(
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue),
  );
}

function formatQuantity(value: string): string {
  const numericValue = Number(value);

  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numericValue);
}

function formatTaxRate(value: string): string {
  const numericValue = Number(value);

  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue)} %`;
}

function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function fallback(value: string | null | undefined): string {
  const normalized = value?.trim();

  return normalized || '-';
}

function joinAddress(
  addressLine1: string | null,
  addressLine2: string | null,
  postalCode: string | null,
  city: string | null,
  province: string | null,
): string[] {
  const lines: string[] = [];

  if (addressLine1?.trim()) {
    lines.push(addressLine1.trim());
  }

  if (addressLine2?.trim()) {
    lines.push(addressLine2.trim());
  }

  const locality = [postalCode?.trim(), city?.trim()].filter(Boolean).join(' ');

  const localityAndProvince = [locality, province?.trim()]
    .filter(Boolean)
    .join(' - ');

  if (localityAndProvince) {
    lines.push(localityAndProvince);
  }

  return lines.length > 0 ? lines : ['-'];
}

function drawInfoBox(
  doc: PDFKit.PDFDocument,
  title: string,
  lines: string[],
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  doc
    .lineWidth(0.8)
    .strokeColor(colors.border)
    .roundedRect(x, y, width, height, 4)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(colors.secondary)
    .text(title.toUpperCase(), x + 10, y + 9, {
      width: width - 20,
    });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(colors.primary)
    .text(lines.join('\n'), x + 10, y + 25, {
      width: width - 20,
      lineGap: 2,
    });
}

function drawDocumentHeader(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfDocumentData,
): number {
  const top = MARGIN;

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(colors.primary)
    .text(
      fallback(invoice.sellerTradeName ?? invoice.sellerLegalName),
      MARGIN,
      top,
      { width: 310 },
    );

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(colors.secondary)
    .text(invoice.sellerLegalName, MARGIN, top + 27, {
      width: 310,
    })
    .text(`NIF: ${invoice.sellerTaxId}`, MARGIN, top + 41, {
      width: 310,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(24)
    .fillColor(colors.primary)
    .text('FACTURA', 360, top, {
      width: CONTENT_WIDTH - 318,
      align: 'right',
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(invoice.fullNumber, 330, top + 31, {
      width: CONTENT_WIDTH - 288,
      align: 'right',
    });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(colors.secondary)
    .text(`Fecha: ${formatInvoiceDate(invoice.issuedAt)}`, 330, top + 49, {
      width: CONTENT_WIDTH - 288,
      align: 'right',
    });

  doc
    .moveTo(MARGIN, top + 76)
    .lineTo(PAGE_WIDTH - MARGIN, top + 76)
    .strokeColor(colors.primary)
    .lineWidth(1.4)
    .stroke();

  return top + 91;
}

function drawParties(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfDocumentData,
  y: number,
): number {
  const gap = 12;
  const boxWidth = (CONTENT_WIDTH - gap) / 2;
  const boxHeight = 105;

  const sellerAddress = joinAddress(
    invoice.sellerAddressLine1,
    invoice.sellerAddressLine2,
    invoice.sellerPostalCode,
    invoice.sellerCity,
    invoice.sellerProvince,
  );

  const customerAddress = joinAddress(
    invoice.customerAddressLine1,
    invoice.customerAddressLine2,
    invoice.customerPostalCode,
    invoice.customerCity,
    invoice.customerProvince,
  );

  drawInfoBox(
    doc,
    'Emisor',
    [invoice.sellerLegalName, `NIF: ${invoice.sellerTaxId}`, ...sellerAddress],
    MARGIN,
    y,
    boxWidth,
    boxHeight,
  );

  drawInfoBox(
    doc,
    'Cliente',
    [
      invoice.customerLegalName,
      `NIF: ${fallback(invoice.customerTaxId)}`,
      ...customerAddress,
    ],
    MARGIN + boxWidth + gap,
    y,
    boxWidth,
    boxHeight,
  );

  return y + boxHeight + 14;
}

function drawVehicle(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfDocumentData,
  y: number,
): number {
  if (!invoice.vehicleRegistrationNumber) {
    return y;
  }

  const vehicleDescription = [
    invoice.vehicleBrand,
    invoice.vehicleModel,
    invoice.vehicleVersion,
  ]
    .filter(Boolean)
    .join(' ');

  const vehicleLines = [
    `Matrícula: ${invoice.vehicleRegistrationNumber}`,
    `Vehículo: ${fallback(vehicleDescription)}`,
    `Bastidor: ${fallback(invoice.vehicleVin)}`,
    `Kilometraje: ${
      invoice.vehicleMileage === null
        ? '-'
        : new Intl.NumberFormat('es-ES').format(invoice.vehicleMileage)
    } km`,
  ];

  drawInfoBox(doc, 'Vehículo', vehicleLines, MARGIN, y, CONTENT_WIDTH, 72);

  return y + 86;
}

interface TableColumn {
  title: string;
  x: number;
  width: number;
  align?: 'left' | 'right' | 'center';
}

const columns: TableColumn[] = [
  { title: '#', x: MARGIN, width: 24, align: 'center' },
  { title: 'Código', x: MARGIN + 24, width: 68 },
  { title: 'Descripción', x: MARGIN + 92, width: 184 },
  { title: 'Cant.', x: MARGIN + 276, width: 46, align: 'right' },
  { title: 'Precio', x: MARGIN + 322, width: 67, align: 'right' },
  { title: 'IVA', x: MARGIN + 389, width: 49, align: 'right' },
  { title: 'Total', x: MARGIN + 438, width: 73, align: 'right' },
];

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): number {
  const height = 23;

  doc.rect(MARGIN, y, CONTENT_WIDTH, height).fill(colors.primary);

  for (const column of columns) {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(colors.white)
      .text(column.title, column.x + 4, y + 7, {
        width: column.width - 8,
        align: column.align ?? 'left',
      });
  }

  return y + height;
}

function getRowHeight(doc: PDFKit.PDFDocument, line: InvoicePdfLine): number {
  doc.font('Helvetica').fontSize(8);

  const descriptionHeight = doc.heightOfString(line.description, {
    width: columns[2].width - 8,
  });

  return Math.max(25, descriptionHeight + 11);
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfDocumentData,
  line: InvoicePdfLine,
  y: number,
): number {
  const rowHeight = getRowHeight(doc, line);

  doc
    .rect(MARGIN, y, CONTENT_WIDTH, rowHeight)
    .fillAndStroke(colors.white, colors.border);

  const values = [
    String(line.position),
    fallback(line.code),
    line.description,
    `${formatQuantity(line.quantity)} ${line.unit}`,
    formatInvoiceAmount(line.unitPrice, invoice.currencyCode),
    formatTaxRate(line.taxRate),
    formatInvoiceAmount(line.totalAmount, invoice.currencyCode),
  ];

  values.forEach((value, index) => {
    const column = columns[index];

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.primary)
      .text(value, column.x + 4, y + 7, {
        width: column.width - 8,
        align: column.align ?? 'left',
      });
  });

  return y + rowHeight;
}

function drawContinuationHeader(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfDocumentData,
): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(colors.primary)
    .text(`Factura ${invoice.fullNumber}`, MARGIN, MARGIN);

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(colors.secondary)
    .text('Continuación', MARGIN, MARGIN + 19);

  return drawTableHeader(doc, MARGIN + 38);
}

function getTaxBreakdownHeight(rows: InvoiceTaxBreakdownRow[]): number {
  const titleHeight = 23;
  const headerHeight = 20;
  const rowHeight = 20;
  const totalHeight = 23;

  return titleHeight + headerHeight + rows.length * rowHeight + totalHeight;
}

function drawTaxBreakdown(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfDocumentData,
  rows: InvoiceTaxBreakdownRow[],
  y: number,
): number {
  const x = MARGIN;
  const width = 285;
  const titleHeight = 23;
  const headerHeight = 20;
  const rowHeight = 20;
  const height = getTaxBreakdownHeight(rows);

  doc
    .roundedRect(x, y, width, height, 4)
    .strokeColor(colors.border)
    .lineWidth(0.8)
    .stroke();

  doc.rect(x, y, width, titleHeight).fill(colors.primary);

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(colors.white)
    .text('DESGLOSE DE IVA', x + 10, y + 8, {
      width: width - 20,
    });

  const headerY = y + titleHeight;

  doc.rect(x, headerY, width, headerHeight).fill(colors.light);

  const rateX = x + 8;
  const baseX = x + 65;
  const taxX = x + 177;

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(colors.secondary)
    .text('Tipo', rateX, headerY + 6, { width: 48 })
    .text('Base imponible', baseX, headerY + 6, {
      width: 100,
      align: 'right',
    })
    .text('Cuota IVA', taxX, headerY + 6, {
      width: 100,
      align: 'right',
    });

  let rowY = headerY + headerHeight;

  for (const row of rows) {
    doc
      .moveTo(x, rowY)
      .lineTo(x + width, rowY)
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.primary)
      .text(formatTaxRate(row.taxRate), rateX, rowY + 6, {
        width: 48,
      })
      .text(
        formatInvoiceAmount(row.netAmount, invoice.currencyCode),
        baseX,
        rowY + 6,
        { width: 100, align: 'right' },
      )
      .text(
        formatInvoiceAmount(row.taxAmount, invoice.currencyCode),
        taxX,
        rowY + 6,
        { width: 100, align: 'right' },
      );

    rowY += rowHeight;
  }

  doc
    .moveTo(x, rowY)
    .lineTo(x + width, rowY)
    .strokeColor(colors.border)
    .lineWidth(0.8)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(colors.primary)
    .text('TOTAL', rateX, rowY + 7, { width: 48 })
    .text(
      formatInvoiceAmount(invoice.subtotal, invoice.currencyCode),
      baseX,
      rowY + 7,
      { width: 100, align: 'right' },
    )
    .text(
      formatInvoiceAmount(invoice.taxAmount, invoice.currencyCode),
      taxX,
      rowY + 7,
      { width: 100, align: 'right' },
    );

  return y + height;
}

function drawTotals(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfDocumentData,
  y: number,
): number {
  const boxWidth = 210;
  const x = PAGE_WIDTH - MARGIN - boxWidth;
  const rowHeight = 23;
  const totalRows = 3;
  const height = rowHeight * totalRows;

  doc
    .roundedRect(x, y, boxWidth, height, 4)
    .fillAndStroke(colors.light, colors.border);

  const rows = [
    [
      'Base imponible',
      formatInvoiceAmount(invoice.subtotal, invoice.currencyCode),
    ],
    ['IVA', formatInvoiceAmount(invoice.taxAmount, invoice.currencyCode)],
    ['Total', formatInvoiceAmount(invoice.totalAmount, invoice.currencyCode)],
  ];

  rows.forEach(([label, value], index) => {
    const rowY = y + index * rowHeight;

    if (index > 0) {
      doc
        .moveTo(x, rowY)
        .lineTo(x + boxWidth, rowY)
        .strokeColor(colors.border)
        .lineWidth(0.5)
        .stroke();
    }

    const isTotal = index === rows.length - 1;

    doc
      .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isTotal ? 10 : 9)
      .fillColor(colors.primary)
      .text(label, x + 10, rowY + 7, { width: 100 })
      .text(value, x + 108, rowY + 7, {
        width: boxWidth - 118,
        align: 'right',
      });
  });

  return y + height;
}

function drawNotes(doc: PDFKit.PDFDocument, notes: string, y: number): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(colors.primary)
    .text('Observaciones', MARGIN, y);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(colors.secondary)
    .text(notes, MARGIN, y + 15, {
      width: CONTENT_WIDTH,
      lineGap: 2,
    });

  return (
    y +
    15 +
    doc.heightOfString(notes, {
      width: CONTENT_WIDTH,
      lineGap: 2,
    })
  );
}

function addPageFooters(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfDocumentData,
): void {
  const range = doc.bufferedPageRange();

  for (
    let pageIndex = range.start;
    pageIndex < range.start + range.count;
    pageIndex += 1
  ) {
    doc.switchToPage(pageIndex);

    doc
      .moveTo(MARGIN, FOOTER_Y - 8)
      .lineTo(PAGE_WIDTH - MARGIN, FOOTER_Y - 8)
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .stroke();

    const pageNumber = pageIndex - range.start + 1;

    const footer = [
      invoice.footerNotice,
      `Generado por Profactur - Página ${pageNumber} de ${range.count}`,
    ]
      .filter(Boolean)
      .join(' | ');

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(colors.secondary)
      .text(footer, MARGIN, FOOTER_Y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
  }
}

export function renderInvoicePdf(
  invoice: InvoicePdfDocumentData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      bufferPages: true,
      info: {
        Title: `Factura ${invoice.fullNumber}`,
        Author: invoice.sellerLegalName,
        Subject: `Factura ${invoice.fullNumber}`,
        Creator: 'Profactur',
      },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on('error', reject);

    let y = drawDocumentHeader(doc, invoice);
    y = drawParties(doc, invoice, y);
    y = drawVehicle(doc, invoice, y);
    y = drawTableHeader(doc, y);

    for (const line of invoice.lines) {
      const rowHeight = getRowHeight(doc, line);

      if (y + rowHeight > PAGE_HEIGHT - 125) {
        doc.addPage();
        y = drawContinuationHeader(doc, invoice);
      }

      y = drawTableRow(doc, invoice, line, y);
    }

    y += 18;

    const taxBreakdown = buildTaxBreakdown(invoice.lines);
    const taxBreakdownHeight = getTaxBreakdownHeight(taxBreakdown);
    const totalsHeight = 69;
    const fiscalSectionHeight = Math.max(taxBreakdownHeight, totalsHeight);

    if (y + fiscalSectionHeight > PAGE_HEIGHT - MARGIN - 32) {
      doc.addPage();
      y = MARGIN;
    }

    drawTaxBreakdown(doc, invoice, taxBreakdown, y);
    drawTotals(doc, invoice, y);

    y += fiscalSectionHeight;

    if (invoice.notes?.trim()) {
      const notesHeight = doc.heightOfString(invoice.notes, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });

      if (y + notesHeight + 45 > PAGE_HEIGHT - MARGIN - 32) {
        doc.addPage();
        y = MARGIN;
      } else {
        y += 22;
      }

      drawNotes(doc, invoice.notes, y);
    }

    addPageFooters(doc, invoice);
    doc.end();
  });
}
