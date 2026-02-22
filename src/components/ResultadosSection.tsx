import { useMemo } from 'react';
import {
  Results,
  FormData,
  AUTOMATIONS_CATALOG,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/calculations';
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
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

/* ── Color system ── */
const LOSS = '#B3261E';
const POSITIVE = '#2E9E6F';
const PREMIUM = '#1E3A8A';
const LABEL = '#475569';
const LOSS_BG = 'rgba(179,38,30,0.00)';
const POSITIVE_BG = 'rgba(46,158,111,0.08)';
const PREMIUM_BG = 'rgba(30,58,138,0.08)';

/* ── Metric card ── */
interface MetricProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg?: string;
  borderColor?: string;
  size?: 'lg' | 'md' | 'sm';
}

const Metric = ({ label, value, sub, color, bg = 'white', borderColor, size = 'sm' }: MetricProps) => {
  const fontSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg';
  return (
    <div
      className="rounded-lg border p-4 shadow-sm"
      style={{
        backgroundColor: bg,
        borderLeft: borderColor ? `3px solid ${borderColor}` : undefined,
      }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: LABEL }}>{label}</p>
      <p className={`${fontSize} font-bold`} style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: LABEL }}>{sub}</p>}
    </div>
  );
};

/* ── Section header ── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: LABEL }}>
    {children}
  </p>
);

interface Props {
  results: Results;
  data: FormData;
}

const ResultadosSection = ({ results, data }: Props) => {
  const paybackText =
    results.payback === 'no_recuperable'
      ? 'No recuperable'
      : results.payback === 0
        ? 'Inmediato'
        : `${formatNumber(results.payback as number)} meses`;

  const paybackColor = results.ahorroMensualNeto > 0 ? POSITIVE : LABEL;

  /* ── Charts ── */
  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };
  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
    scales: { y: { beginAtZero: true } },
  };

  // 1) Cost comparison
  const costChartData = {
    labels: ['Coste actual (€/mes)', 'Coste automatizado (€/mes)'],
    datasets: [{
      data: [results.costoActual, results.costoTrasAutomatizacion],
      backgroundColor: [LOSS, PREMIUM],
      borderRadius: 6,
    }],
  };

  // 2) Cumulative savings
  const months = Array.from({ length: 12 }, (_, i) => `Mes ${i + 1}`);
  const cumSavings = months.map((_, i) => results.ahorroMensualNeto * (i + 1));
  const savingsChartData = {
    labels: months,
    datasets: [{
      label: 'Ahorro acumulado (€)',
      data: cumSavings,
      borderColor: POSITIVE,
      backgroundColor: 'rgba(46,158,111,0.12)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    }],
  };

  // 3) ROI bar
  const roiChartData = {
    labels: ['ROI (%)'],
    datasets: [{
      data: [Math.max(0, results.roi)],
      backgroundColor: [POSITIVE],
      borderRadius: 6,
    }],
  };

  // 4) Breakdown (blue shades only)
  const selectedItems = data.selectedAutomations
    .map((id) => AUTOMATIONS_CATALOG.find((a) => a.id === id)!)
    .filter(Boolean);

  const blueShades = [
    'rgba(30,58,138,0.9)',
    'rgba(30,58,138,0.7)',
    'rgba(30,58,138,0.5)',
    'rgba(30,58,138,0.35)',
    'rgba(30,58,138,0.2)',
  ];

  const breakdownChartData = selectedItems.length > 0
    ? {
        labels: selectedItems.map((a) => a.nombre),
        datasets: [{
          data: selectedItems.map((a) => results.allocationPrices[a.id] || 0),
          backgroundColor: blueShades.slice(0, selectedItems.length),
        }],
      }
    : null;

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: CURRENT COST (LOSS) ── */}
      <div>
        <SectionLabel>Coste actual</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Metric label="Horas perdidas/mes" value={formatNumber(results.horasPerdidasMes)} color={LOSS} borderColor={LOSS} />
          <Metric label="Coste actual (€/mes)" value={formatCurrency(results.costoActual)} color={LOSS} borderColor={LOSS} />
          <Metric label="Pérdida total mensual" value={formatCurrency(results.costoActual)} color={LOSS} borderColor={LOSS} size="md" />
        </div>
      </div>

      {/* ── SECTION 2: AUTOMATION IMPACT (POSITIVE) ── */}
      <div>
        <SectionLabel>Impacto de la automatización</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Metric label="Ahorro mensual neto" value={formatCurrency(results.ahorroMensualNeto)} sub={formatPercent(results.ahorroPorcentaje)} color={POSITIVE} bg={POSITIVE_BG} />
          <Metric label="Ahorro anual neto" value={formatCurrency(results.ahorroAnualNeto)} color={POSITIVE} bg={POSITIVE_BG} size="lg" />
          <Metric label="ROI" value={formatPercent(results.roi)} color={POSITIVE} bg={POSITIVE_BG} size="md" />
        </div>
      </div>

      {/* ── SECTION 3: INVESTMENT (PREMIUM) ── */}
      <div>
        <SectionLabel>Inversión</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Metric label="Fee mensual final" value={formatCurrency(results.feeFinal)} sub={`Rango: ${formatCurrency(results.rangoMin)} – ${formatCurrency(results.rangoMax)}`} color={PREMIUM} bg={PREMIUM_BG} size="lg" />
          <Metric label="Total setup" value={formatCurrency(results.totalSetup)} color={PREMIUM} bg={PREMIUM_BG} />
          <Metric label="Inversión primer año" value={formatCurrency(results.totalFirstYear)} color={PREMIUM} bg={PREMIUM_BG} />
        </div>
      </div>

      {/* ── SECTION 4: PAYBACK (CLOSING) ── */}
      <div className="flex justify-center">
        <div
          className="rounded-lg border p-6 shadow-sm text-center w-full max-w-md"
          style={{ backgroundColor: results.ahorroMensualNeto > 0 ? POSITIVE_BG : 'white' }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: LABEL }}>Payback</p>
          <p className="text-3xl font-bold" style={{ color: paybackColor }}>{paybackText}</p>
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1) Cost comparison */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Coste actual vs coste automatizado</CardTitle></CardHeader>
          <CardContent className="h-56"><Bar data={costChartData} options={barOpts} /></CardContent>
        </Card>

        {/* 2) Cumulative savings */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ahorro acumulado (12 meses)</CardTitle></CardHeader>
          <CardContent className="h-56"><Line data={savingsChartData} options={lineOpts} /></CardContent>
        </Card>

        {/* 3) ROI */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ROI (%)</CardTitle></CardHeader>
          <CardContent className="h-56"><Bar data={roiChartData} options={barOpts} /></CardContent>
        </Card>

        {/* 4) Breakdown */}
        {breakdownChartData ? (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Distribución del fee por automatización</CardTitle></CardHeader>
            <CardContent className="h-56">
              <Doughnut data={breakdownChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Distribución del fee</CardTitle></CardHeader>
            <CardContent className="h-56 flex items-center justify-center text-sm" style={{ color: LABEL }}>
              Selecciona automatizaciones en la pestaña correspondiente
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultadosSection;
