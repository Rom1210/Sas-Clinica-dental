import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ─── Shared Helpers ──────────────────────────────────────────────────────────

const SLATE_900 = [15, 23, 42];
const SLATE_700 = [51, 65, 85];
const SLATE_400 = [148, 163, 184];
const SLATE_100 = [241, 245, 249];
const BLUE_600  = [37, 99, 235];
const GREEN_600 = [22, 163, 74];
const RED_600   = [220, 38, 38];
const WHITE     = [255, 255, 255];

const fmtMoney = (val, currency = 'USD') => {
  const num = parseFloat(val || 0);
  const symbol = currency === 'USD' ? '$' : 'Bs.';
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const drawHeader = (doc, clinicName, docTitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark header bar
  doc.setFillColor(...SLATE_900);
  doc.rect(0, 0, pageWidth, 46, 'F');

  // Accent stripe
  doc.setFillColor(...BLUE_600);
  doc.rect(0, 43, pageWidth, 3, 'F');

  // Clinic name
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(clinicName.toUpperCase(), 18, 22);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('SISTEMA DE GESTIÓN DENTAL', 18, 31);

  // Doc type badge (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text(docTitle, pageWidth - 18, 22, { align: 'right' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageWidth - 18,
    31,
    { align: 'right' }
  );
};

const drawFooter = (doc, clinicName) => {
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...SLATE_100);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_400);
  doc.text(
    `Documento generado por ${clinicName} · ${new Date().toLocaleDateString('es-ES')} · Confidencial`,
    pageWidth / 2,
    pageHeight - 9,
    { align: 'center' }
  );
};

const drawPatientBlock = (doc, patient, startY) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...SLATE_100);
  doc.roundedRect(18, startY, pageWidth - 36, 28, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_400);
  doc.text('PACIENTE', 24, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...SLATE_900);
  doc.text((patient.name || patient.full_name || '').toUpperCase(), 24, startY + 20);

  if (patient.dni) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_400);
    doc.text(`Cédula / DNI: ${patient.dni}`, pageWidth - 24, startY + 20, { align: 'right' });
  }
};

// ─── Receipt PDF ─────────────────────────────────────────────────────────────

export const generateReceiptPDF = (patient, payment, clinicName = 'SAS Odontológico') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, clinicName, 'RECIBO DE PAGO');

  // Patient block
  drawPatientBlock(doc, patient, 56);

  // Receipt number pill
  const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BLUE_600);
  doc.text(`Nº ${receiptNo}`, pageWidth - 18, 56, { align: 'right' });

  // Payment detail table
  doc.autoTable({
    startY: 96,
    head: [['Descripción', 'Fecha', 'Método', 'Referencia', 'Monto']],
    body: [[
      'Abono a tratamiento dental',
      payment.date || new Date().toLocaleDateString('es-ES'),
      payment.method || '—',
      payment.reference || payment.ref || 'S/R',
      fmtMoney(payment.amount, payment.currency)
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: SLATE_900,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 5
    },
    bodyStyles: { fontSize: 9, cellPadding: 5, textColor: SLATE_700 },
    columnStyles: {
      0: { cellWidth: 60 },
      4: { halign: 'right', fontStyle: 'bold', textColor: GREEN_600 }
    },
    styles: { lineColor: SLATE_100, lineWidth: 0.3 }
  });

  // Total box
  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(...SLATE_900);
  doc.roundedRect(pageWidth - 90, finalY, 72, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_400);
  doc.text('TOTAL ABONADO', pageWidth - 54, finalY + 9, { align: 'center' });
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(fmtMoney(payment.amount, payment.currency), pageWidth - 54, finalY + 18, { align: 'center' });

  // Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_400);
  doc.text(
    'Este recibo es un comprobante interno de pago. Gracias por su confianza.',
    pageWidth / 2, finalY + 38, { align: 'center' }
  );

  drawFooter(doc, clinicName);

  const name = (patient.name || 'recibo').replace(/\s+/g, '_').toLowerCase();
  doc.save(`recibo_${name}_${receiptNo}.pdf`);
};

// ─── Statement PDF ────────────────────────────────────────────────────────────

export const generateStatementPDF = (patient, history, summary, clinicName = 'SAS Odontológico') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, clinicName, 'ESTADO DE CUENTA');

  // Patient block
  drawPatientBlock(doc, patient, 56);

  // ── KPI Summary boxes ──
  const kpiY = 96;
  const boxW = (pageWidth - 36 - 12) / 3;

  const kpis = [
    { label: 'COSTO TOTAL', value: fmtMoney(summary.totalDue), fill: SLATE_100, textColor: SLATE_900 },
    { label: 'TOTAL PAGADO', value: fmtMoney(summary.totalPaid), fill: [240, 253, 244], textColor: GREEN_600 },
    { label: 'REMANENTE', value: fmtMoney(summary.balance), fill: summary.balance <= 0 ? [240, 253, 244] : [254, 242, 242], textColor: summary.balance <= 0 ? GREEN_600 : RED_600 },
  ];

  kpis.forEach((kpi, i) => {
    const x = 18 + i * (boxW + 6);
    doc.setFillColor(...kpi.fill);
    doc.roundedRect(x, kpiY, boxW, 28, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_400);
    doc.text(kpi.label, x + 8, kpiY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...kpi.textColor);
    doc.text(kpi.value, x + 8, kpiY + 22);
  });

  // Status badge
  const isBalanced = summary.balance <= 0;
  const badgeText = isBalanced ? '✓  SOLVENTE' : '⚠  PENDIENTE DE PAGO';
  doc.setFillColor(...(isBalanced ? [220, 252, 231] : [254, 226, 226]));
  doc.roundedRect(18, kpiY + 34, 72, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...(isBalanced ? GREEN_600 : RED_600));
  doc.text(badgeText, 54, kpiY + 42, { align: 'center' });

  // ── Transaction Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_900);
  doc.text('HISTORIAL DE TRANSACCIONES', 18, kpiY + 60);

  const tableBody = history.length > 0
    ? history.map(h => [
        h.date || '—',
        h.method || '—',
        h.ref && h.ref !== 'Manual' ? h.ref : '—',
        fmtMoney(h.amount, h.currency)
      ])
    : [['Sin registros', '—', '—', '—']];

  doc.autoTable({
    startY: kpiY + 64,
    head: [['Fecha', 'Método de Pago', 'Referencia', 'Monto (USD)']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: SLATE_900,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4.5
    },
    bodyStyles: { fontSize: 9, cellPadding: 4.5, textColor: SLATE_700 },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold', textColor: GREEN_600 }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { lineColor: SLATE_100, lineWidth: 0.3 }
  });

  drawFooter(doc, clinicName);

  const name = (patient.name || 'estado').replace(/\s+/g, '_').toLowerCase();
  doc.save(`estado_cuenta_${name}_${Date.now().toString().slice(-6)}.pdf`);
};
