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

// Ensure Chart.js is registered
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function renderChartToImage(
  type: 'bar' | 'line' | 'doughnut',
  data: any,
  options: any,
  width = 500,
  height = 250
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const chart = new ChartJS(ctx, {
    type,
    data,
    options: {
      ...options,
      animation: false,
      responsive: false,
    },
  });
  const image = canvas.toDataURL('image/png');
  chart.destroy();
  return image;
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/soluxion-logo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generatePDF(
  data: FormData,
  results: Results
): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const navy = [45, 55, 72] as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];
  const gray = [120, 120, 120] as [number, number, number];

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = margin;
    }
  };

  // ---- COVER ----
  const logo = await loadLogoBase64();

  // Navy header bar
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  if (logo) {
    try {
      doc.addImage(logo, 'JPEG', margin, 8, 35, 35);
    } catch { /* skip logo if format issue */ }
  }

  doc.setTextColor(...white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Soluxion', margin + 40, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('soluxion.ai@gmail.com  |  +34 632 14 43 98', margin + 40, 30);
  doc.text('Propuesta de Automatización', margin + 40, 38);

  y = 60;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.empresa || 'Empresa', margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${data.nombreCliente}`, margin, y);
  y += 5;
  doc.text(`Fecha: ${data.fechaElaboracion}`, margin, y);
  y += 10;

  // Executive summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Ejecutivo', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const summary = `Tras analizar los procesos de ${data.empresa}, identificamos una pérdida mensual de ${formatCurrency(results.costoActual)} (${formatNumber(results.horasPerdidasMes)} horas/mes en tareas repetitivas). Con la automatización propuesta, el ahorro neto anual estimado asciende a ${formatCurrency(results.ahorroAnualNeto)}, lo que supone un ROI del ${formatPercent(results.roi)}.`;
  const summaryLines = doc.splitTextToSize(summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.5 + 8;

  // ---- SECTION 2: Análisis Actual ----
  addPageIfNeeded(50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Análisis Actual', margin, y);
  y += 6;

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
    headStyles: { fillColor: navy, textColor: white },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ---- SECTION 3: Ahorro Proyectado ----
  addPageIfNeeded(50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ahorro Proyectado', margin, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Métrica', 'Valor']],
    body: [
      ['Ahorro mensual neto', formatCurrency(results.ahorroMensualNeto)],
      ['Ahorro anual neto', formatCurrency(results.ahorroAnualNeto)],
      ['Ahorro (%)', formatPercent(results.ahorroPorcentaje)],
    ],
    theme: 'grid',
    headStyles: { fillColor: navy, textColor: white },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ---- SECTION 4: ROI + Payback ----
  addPageIfNeeded(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ROI y Payback', margin, y);
  y += 6;

  const paybackText =
    results.payback === 'no_recuperable'
      ? 'No recuperable'
      : results.payback === 0
        ? 'Inmediato'
        : `${formatNumber(results.payback as number)} meses`;

  autoTable(doc, {
    startY: y,
    head: [['Métrica', 'Valor']],
    body: [
      ['ROI', formatPercent(results.roi)],
      ['Payback', paybackText],
      ['Coste anual', formatCurrency(results.costoAnual)],
    ],
    theme: 'grid',
    headStyles: { fillColor: navy, textColor: white },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ---- SECTION 5: Automatizaciones ----
  const selectedItems = data.selectedAutomations
    .map((id) => AUTOMATIONS_CATALOG.find((a) => a.id === id)!)
    .filter(Boolean);

  if (selectedItems.length > 0) {
    addPageIfNeeded(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Automatizaciones Seleccionadas', margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Automatización', 'Descripción', 'Precio/mes']],
      body: selectedItems.map((item) => [
        item.nombre,
        item.descripcion,
        formatCurrency(results.allocationPrices[item.id] || 0),
      ]),
      theme: 'grid',
      headStyles: { fillColor: navy, textColor: white },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 1: { cellWidth: 80 } },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ---- SECTION 6: Total Propuesta ----
  addPageIfNeeded(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Propuesta', margin, y);
  y += 6;

  const rangoText = `${formatCurrency(results.rangoMin)} – ${formatCurrency(results.rangoMax)}`;
  const totalBody: string[][] = [
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
    styles: { fontSize: 10, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ---- CHARTS ----
  addPageIfNeeded(80);
  doc.addPage();
  y = margin;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Gráficos', margin, y);
  y += 8;

  // Cost comparison chart
  const costChartImg = renderChartToImage(
    'bar',
    {
      labels: ['Coste actual', 'Coste automatizado'],
      datasets: [
        {
          data: [results.costoActual, results.costoTrasAutomatizacion],
          backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(59,130,246,0.8)'],
          borderRadius: 4,
        },
      ],
    },
    {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    }
  );
  doc.addImage(costChartImg, 'PNG', margin, y, contentWidth, 55);
  y += 60;

  // Cumulative savings
  addPageIfNeeded(70);
  const months = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);
  const cumSavings = months.map(
    (_, i) => results.ahorroMensualNeto * (i + 1)
  );
  const savingsImg = renderChartToImage(
    'line',
    {
      labels: months,
      datasets: [
        {
          label: 'Ahorro acumulado (€)',
          data: cumSavings,
          borderColor: 'rgba(59,130,246,0.9)',
          backgroundColor: 'rgba(59,130,246,0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    },
    {
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } },
    }
  );
  doc.addImage(savingsImg, 'PNG', margin, y, contentWidth, 55);
  y += 60;

  // Fee breakdown donut
  if (selectedItems.length > 0) {
    addPageIfNeeded(70);
    const colors = [
      'rgba(59,130,246,0.8)',
      'rgba(168,85,247,0.8)',
      'rgba(34,197,94,0.8)',
      'rgba(251,191,36,0.8)',
      'rgba(239,68,68,0.8)',
    ];
    const breakdownImg = renderChartToImage(
      'doughnut',
      {
        labels: selectedItems.map((a) => a.nombre),
        datasets: [
          {
            data: selectedItems.map(
              (a) => results.allocationPrices[a.id] || 0
            ),
            backgroundColor: colors.slice(0, selectedItems.length),
          },
        ],
      },
      { plugins: { legend: { position: 'bottom' } } },
      400,
      250
    );
    doc.addImage(breakdownImg, 'PNG', margin + 20, y, contentWidth - 40, 55);
    y += 60;
  }

  // ---- LEGAL ----
  addPageIfNeeded(30);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  const legal =
    'Estimaciones basadas en los datos facilitados; los resultados pueden variar. Propuesta válida 30 días. Tratamiento de datos únicamente para el envío de esta propuesta conforme al RGPD.';
  const legalLines = doc.splitTextToSize(legal, contentWidth);
  doc.text(legalLines, margin, y);

  return doc.output('blob');
}
