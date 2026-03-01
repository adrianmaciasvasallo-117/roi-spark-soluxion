import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  FormData,
  Results,
  AUTOMATIONS_CATALOG,
  formatCurrency,
  formatNumber,
  formatPercent,
} from './calculations';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ── Color System ──
const COLOR = {
  loss:       [179, 38, 30]   as [number, number, number], // #B3261E
  positive:   [46, 158, 111]  as [number, number, number], // #2E9E6F
  investment: [30, 58, 138]   as [number, number, number], // #1E3A8A
  neutral:    [71, 85, 105]   as [number, number, number], // #475569
  white:      [255, 255, 255] as [number, number, number],
  black:      [0, 0, 0]       as [number, number, number],
  lightGray:  [248, 250, 252] as [number, number, number],
  border:     [226, 232, 240] as [number, number, number],
};

const MARGIN = 18;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ── High-res chart renderer (3x pixel ratio) ──
function renderChartToImage(
  type: 'bar' | 'line' | 'doughnut',
  data: any,
  options: any,
  logicalW = 500,
  logicalH = 250
): string {
  const ratio = 2; // reduced from 3 to keep file size manageable
  const canvas = document.createElement('canvas');
  canvas.width = logicalW * ratio;
  canvas.height = logicalH * ratio;
  canvas.style.width = `${logicalW}px`;
  canvas.style.height = `${logicalH}px`;
  const ctx = canvas.getContext('2d')!;
  // Fill white background (needed for JPEG)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(ratio, ratio);
  const chart = new ChartJS(ctx, {
    type,
    data,
    options: {
      ...options,
      animation: false,
      responsive: false,
      devicePixelRatio: ratio,
    },
  });
  const image = canvas.toDataURL('image/jpeg', 0.85);
  chart.destroy();
  return image;
}

// ── Logo loader with aspect ratio preservation ──
async function loadLogo(): Promise<{ base64: string; w: number; h: number } | null> {
  try {
    const response = await fetch('/soluxion-logo.png');
    const blob = await response.blob();
    const base64: string = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    // Get natural dimensions
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = base64;
    });
    return { base64, w: img.naturalWidth, h: img.naturalHeight };
  } catch {
    return null;
  }
}

function addLogoToDoc(doc: jsPDF, logo: { base64: string; w: number; h: number }, maxW: number, x: number, y: number): number {
  const aspect = logo.w / logo.h;
  const finalW = Math.min(maxW, logo.w * 0.264583); // px to mm rough
  const finalH = finalW / aspect;
  const cappedW = Math.min(finalW, 42);
  const cappedH = cappedW / aspect;
  try {
    doc.addImage(logo.base64, 'PNG', x, y, cappedW, cappedH);
  } catch { /* skip */ }
  return cappedH;
}

// ── Helpers ──
function sectionTitle(doc: jsPDF, text: string, y: number, color: [number, number, number] = COLOR.black): number {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(text, MARGIN, y);
  return y + 7;
}

function addPageIfNeeded(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

// ── Executive KPI Block ──
function drawKpiBlock(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string,
  valueColor: [number, number, number],
  fontSize: number
) {
  // Subtle background
  doc.setFillColor(valueColor[0], valueColor[1], valueColor[2]);
  doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  // Left accent
  doc.setFillColor(...valueColor);
  doc.rect(x, y, 2.5, h, 'F');

  // Label
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.neutral);
  doc.text(label.toUpperCase(), x + 7, y + 9);

  // Value
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...valueColor);
  doc.text(value, x + 7, y + h - 6);
}

// ══════════════════════════════════════
//  MAIN GENERATOR
// ══════════════════════════════════════
export async function generatePDF(data: FormData, results: Results): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = MARGIN;

  const logo = await loadLogo();

  const paybackText =
    results.payback === 'no_recuperable' ? 'No recuperable'
    : results.payback === 0 ? 'Inmediato'
    : `${formatNumber(results.payback as number)} meses`;

  // ════════════════════════════════════
  //  PAGE 1 — EXECUTIVE COVER
  // ════════════════════════════════════

  // Header bar
  doc.setFillColor(...COLOR.investment);
  doc.rect(0, 0, PAGE_W, 44, 'F');

  if (logo) {
    addLogoToDoc(doc, logo, 42, MARGIN, 6);
  }

  doc.setTextColor(...COLOR.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('soluxion.ai@gmail.com  |  +34 632 14 43 98', MARGIN + 46, 18);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Soluxion', MARGIN + 46, 32);

  y = 54;

  // Title block
  doc.setTextColor(...COLOR.black);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Propuesta de Automatización', MARGIN, y);
  y += 9;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.neutral);
  doc.text(data.empresa || 'Empresa', MARGIN, y);
  y += 5.5;
  doc.text(`Cliente: ${data.nombreCliente}`, MARGIN, y);
  y += 5.5;
  doc.text(`Fecha: ${data.fechaElaboracion}`, MARGIN, y);
  y += 14;

  // ── 4 KPI Blocks ──
  const blockW = (CONTENT_W - 6) / 2;
  const blockH = 28;

  // Row 1
  drawKpiBlock(doc, MARGIN, y, blockW, blockH,
    'Pérdida mensual actual', formatCurrency(results.perdidaTotal),
    COLOR.loss, 18);

  drawKpiBlock(doc, MARGIN + blockW + 6, y, blockW, blockH,
    'Ahorro anual estimado', formatCurrency(results.ahorroAnualNeto),
    COLOR.positive, 20);

  y += blockH + 6;

  // Row 2
  drawKpiBlock(doc, MARGIN, y, blockW, blockH,
    'Inversión anual', formatCurrency(results.costoAnual),
    COLOR.investment, 16);

  drawKpiBlock(doc, MARGIN + blockW + 6, y, blockW, blockH,
    'Recuperación', paybackText,
    results.ahorroMensualNeto > 0 ? COLOR.positive : COLOR.neutral, 16);

  y += blockH + 14;

  // Executive paragraph
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.neutral);
  const summary = `Tras analizar los procesos de ${data.empresa}, identificamos una pérdida mensual de ${formatCurrency(results.costoActual)} (${formatNumber(results.horasPerdidasMes)} horas/mes en tareas repetitivas). Con la automatización propuesta, el ahorro neto anual estimado asciende a ${formatCurrency(results.ahorroAnualNeto)}, lo que supone un ROI del ${formatPercent(results.roi)}.`;
  const lines = doc.splitTextToSize(summary, CONTENT_W);
  doc.text(lines, MARGIN, y);
  y += lines.length * 4.5;

  // ════════════════════════════════════
  //  PAGE 2 — ANALYSIS + AUTOMATIONS
  // ════════════════════════════════════
  doc.addPage();
  y = MARGIN;

  // Section: Análisis Actual
  y = sectionTitle(doc, 'Análisis Actual', y, COLOR.loss);

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Valor']],
    body: [
      ['Horas perdidas/mes', formatNumber(results.horasPerdidasMes)],
      ['Tarifa por hora', formatCurrency(results.tarifaHora) + '/h'],
      ['Coste en tiempo (€/mes)', formatCurrency(results.costoTiempo)],
      ['Ingreso perdido (€/mes)', formatCurrency(results.ingresoPerdido)],
      ['Costes evitables (€/mes)', formatCurrency(results.costoEvitable)],
      ['Pérdida total (€/mes)', formatCurrency(results.perdidaTotal)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLOR.loss, textColor: COLOR.white, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3.5 },
    bodyStyles: { textColor: COLOR.neutral },
    columnStyles: { 1: { textColor: COLOR.loss, fontStyle: 'bold' } },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Section: Ahorro Proyectado
  y = addPageIfNeeded(doc, y, 50);
  y = sectionTitle(doc, 'Ahorro Proyectado', y, COLOR.positive);

  autoTable(doc, {
    startY: y,
    head: [['Métrica', 'Valor']],
    body: [
      ['Ahorro mensual neto', formatCurrency(results.ahorroMensualNeto)],
      ['Ahorro anual neto', formatCurrency(results.ahorroAnualNeto)],
      ['Ahorro (%)', formatPercent(results.ahorroPorcentaje)],
      ['ROI', formatPercent(results.roi)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLOR.positive, textColor: COLOR.white, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3.5 },
    bodyStyles: { textColor: COLOR.neutral },
    columnStyles: { 1: { textColor: COLOR.positive, fontStyle: 'bold' } },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Section: Automatizaciones
  const selectedItems = data.selectedAutomations
    .map((id) => AUTOMATIONS_CATALOG.find((a) => a.id === id)!)
    .filter(Boolean);

  if (selectedItems.length > 0) {
    y = addPageIfNeeded(doc, y, 60);
    y = sectionTitle(doc, 'Automatizaciones Seleccionadas', y, COLOR.investment);

    autoTable(doc, {
      startY: y,
      head: [['Automatización', 'Descripción', 'Precio/mes']],
      body: selectedItems.map((item) => [
        item.nombre,
        item.descripcion,
        formatCurrency(results.allocationPrices[item.id] || 0),
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLOR.investment, textColor: COLOR.white, fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3.5 },
      bodyStyles: { textColor: COLOR.neutral },
      columnStyles: { 2: { textColor: COLOR.investment, fontStyle: 'bold' } },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Section: Total Propuesta
  y = addPageIfNeeded(doc, y, 50);
  y = sectionTitle(doc, 'Total Propuesta', y, COLOR.investment);

  const rangoText = `${formatCurrency(results.rangoMin)} – ${formatCurrency(results.rangoMax)}`;
  const totalBody: [string, string][] = [
    ['Fee mensual final', formatCurrency(results.feeFinal)],
    ['Rango sugerido mensual', rangoText],
  ];
  if (results.totalSetup > 0) {
    totalBody.push(['Setup (puesta en marcha)', formatCurrency(results.totalSetup)]);
  }
  totalBody.push(['Inversión primer año', formatCurrency(results.totalFirstYear)]);

  autoTable(doc, {
    startY: y,
    body: totalBody,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3.5 },
    bodyStyles: { textColor: COLOR.neutral },
    columnStyles: { 1: { textColor: COLOR.investment, fontStyle: 'bold' } },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Payback card
  y = addPageIfNeeded(doc, y, 25);
  const pbColor = results.ahorroMensualNeto > 0 ? COLOR.positive : COLOR.neutral;
  doc.setFillColor(pbColor[0], pbColor[1], pbColor[2]);
  doc.setGState(new (doc as any).GState({ opacity: 0.07 }));
  doc.roundedRect(MARGIN, y, CONTENT_W, 20, 2, 2, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
  doc.setFillColor(...pbColor);
  doc.rect(MARGIN, y, 2.5, 20, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.neutral);
  doc.text('PAYBACK', MARGIN + 8, y + 8);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...pbColor);
  doc.text(paybackText, MARGIN + 8, y + 16);
  y += 28;

  // ════════════════════════════════════
  //  PAGE 3 — IMPACT VISUALIZATION
  // ════════════════════════════════════
  doc.addPage();
  y = MARGIN;
  y = sectionTitle(doc, 'Impacto financiero proyectado', y, COLOR.investment);
  y += 2;

  // Chart 1: Cost comparison
  const costImg = renderChartToImage('bar', {
    labels: ['Coste actual', 'Coste automatizado'],
    datasets: [{
      data: [results.costoActual, results.costoTrasAutomatizacion],
      backgroundColor: ['rgba(179,38,30,0.8)', 'rgba(30,58,138,0.8)'],
      borderRadius: 4,
    }],
  }, {
    plugins: { legend: { display: false }, title: { display: true, text: 'Coste mensual: actual vs automatizado', font: { size: 13 } } },
    scales: { y: { beginAtZero: true } },
  }, 600, 280);
  doc.addImage(costImg, 'JPEG', MARGIN, y, CONTENT_W, 55);
  y += 60;

  // Chart 2: Cumulative savings
  y = addPageIfNeeded(doc, y, 65);
  const months = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);
  const cumSavings = months.map((_, i) => results.ahorroMensualNeto * (i + 1));
  const savingsImg = renderChartToImage('line', {
    labels: months,
    datasets: [{
      label: 'Ahorro acumulado (€)',
      data: cumSavings,
      borderColor: 'rgba(46,158,111,0.95)',
      backgroundColor: 'rgba(46,158,111,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    }],
  }, {
    plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Ahorro acumulado (12 meses)', font: { size: 13 } } },
    scales: { y: { beginAtZero: true } },
  }, 600, 280);
  doc.addImage(savingsImg, 'JPEG', MARGIN, y, CONTENT_W, 55);
  y += 60;

  // Chart 3: ROI
  y = addPageIfNeeded(doc, y, 65);
  const roiImg = renderChartToImage('bar', {
    labels: ['ROI'],
    datasets: [{
      data: [results.roi],
      backgroundColor: ['rgba(46,158,111,0.85)'],
      borderRadius: 4,
    }],
  }, {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false }, title: { display: true, text: `ROI: ${formatPercent(results.roi)}`, font: { size: 13 } } },
    scales: { x: { beginAtZero: true } },
  }, 600, 180);
  doc.addImage(roiImg, 'JPEG', MARGIN, y, CONTENT_W, 35);
  y += 40;

  // Chart 4: Fee breakdown
  if (selectedItems.length > 0) {
    y = addPageIfNeeded(doc, y, 70);
    const blues = [
      'rgba(30,58,138,0.9)',
      'rgba(59,130,246,0.85)',
      'rgba(96,165,250,0.8)',
      'rgba(147,197,253,0.8)',
      'rgba(30,58,138,0.6)',
    ];
    const breakdownImg = renderChartToImage('doughnut', {
      labels: selectedItems.map((a) => a.nombre),
      datasets: [{
        data: selectedItems.map((a) => results.allocationPrices[a.id] || 0),
        backgroundColor: blues.slice(0, selectedItems.length),
      }],
    }, {
      plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Distribución de servicios', font: { size: 13 } } },
    }, 450, 300);
    doc.addImage(breakdownImg, 'JPEG', MARGIN + 15, y, CONTENT_W - 30, 60);
    y += 65;
  }

  // ── Legal footer ──
  y = addPageIfNeeded(doc, y, 20);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.neutral);
  const legal = 'Estimaciones basadas en los datos facilitados; los resultados pueden variar. Propuesta válida 30 días. Tratamiento de datos conforme al RGPD.';
  const legalLines = doc.splitTextToSize(legal, CONTENT_W);
  doc.text(legalLines, MARGIN, y);

  return doc.output('blob');
}
