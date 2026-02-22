import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Props {
  results: Results;
  data: FormData;
}

const KPI = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) => (
  <div
    className={`kpi-card ${accent ? 'border-l-4' : ''}`}
    style={accent ? { borderLeftColor: 'hsl(210, 75%, 50%)' } : {}}
  >
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-lg font-bold">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const ResultadosSection = ({ results, data }: Props) => {
  const paybackText =
    results.payback === 'no_recuperable'
      ? 'No recuperable'
      : results.payback === 0
        ? 'Inmediato'
        : `${formatNumber(results.payback as number)} meses`;

  const rangoText = `${formatCurrency(results.rangoMin)} – ${formatCurrency(results.rangoMax)}`;

  // Chart colors
  const blue = 'rgba(59, 130, 246, 0.8)';
  const green = 'rgba(34, 197, 94, 0.8)';
  const red = 'rgba(239, 68, 68, 0.8)';
  const blueLight = 'rgba(59, 130, 246, 0.15)';

  // 1) Bar: Hours
  const hoursChartData = {
    labels: ['Horas actuales/mes', 'Post-automatización'],
    datasets: [
      {
        data: [results.horasPerdidasMes, 0],
        backgroundColor: [red, green],
        borderRadius: 6,
      },
    ],
  };

  // 2) Bar: Cost
  const costChartData = {
    labels: ['Coste actual (€/mes)', 'Coste automatizado (€/mes)'],
    datasets: [
      {
        data: [results.costoActual, results.costoTrasAutomatizacion],
        backgroundColor: [red, blue],
        borderRadius: 6,
      },
    ],
  };

  // 3) Line: Cumulative savings
  const months = Array.from({ length: 12 }, (_, i) => `Mes ${i + 1}`);
  const cumSavings = months.map(
    (_, i) => results.ahorroMensualNeto * (i + 1)
  );
  const savingsChartData = {
    labels: months,
    datasets: [
      {
        label: 'Ahorro acumulado (€)',
        data: cumSavings,
        borderColor: blue,
        backgroundColor: blueLight,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  // 4) Bar: ROI
  const roiChartData = {
    labels: ['ROI (%)'],
    datasets: [
      {
        data: [Math.max(0, results.roi)],
        backgroundColor: [green],
        borderRadius: 6,
      },
    ],
  };

  // 5) Line: Payback timeline
  const paybackChartData = useMemo(() => {
    if (results.totalSetup <= 0 || results.ahorroMensualNeto <= 0) return null;
    const maxMonths = Math.min(
      Math.ceil((results.totalSetup / results.ahorroMensualNeto) * 2),
      24
    );
    const labels = Array.from({ length: maxMonths }, (_, i) => `${i + 1}`);
    const cumulative = labels.map(
      (_, i) => results.ahorroMensualNeto * (i + 1)
    );
    const setupLine = labels.map(() => results.totalSetup);
    return {
      labels,
      datasets: [
        {
          label: 'Ahorro acumulado',
          data: cumulative,
          borderColor: green,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Setup',
          data: setupLine,
          borderColor: red,
          borderDash: [5, 5],
          pointRadius: 0,
        },
      ],
    };
  }, [results.totalSetup, results.ahorroMensualNeto]);

  // 6) Doughnut: Fee breakdown
  const selectedItems = data.selectedAutomations
    .map((id) => AUTOMATIONS_CATALOG.find((a) => a.id === id)!)
    .filter(Boolean);
  const doughnutColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(251, 191, 36, 0.8)',
    'rgba(239, 68, 68, 0.8)',
  ];
  const breakdownChartData =
    selectedItems.length > 0
      ? {
          labels: selectedItems.map((a) => a.nombre),
          datasets: [
            {
              data: selectedItems.map(
                (a) => results.allocationPrices[a.id] || 0
              ),
              backgroundColor: doughnutColors.slice(0, selectedItems.length),
            },
          ],
        }
      : null;

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

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          label="Horas perdidas/mes"
          value={formatNumber(results.horasPerdidasMes)}
        />
        <KPI
          label="Coste actual (€/mes)"
          value={formatCurrency(results.costoActual)}
        />
        <KPI
          label="Coste tras automatización"
          value={formatCurrency(results.costoTrasAutomatizacion)}
        />
        <KPI
          label="Ahorro mensual neto"
          value={formatCurrency(results.ahorroMensualNeto)}
          sub={formatPercent(results.ahorroPorcentaje)}
          accent
        />
        <KPI
          label="Ahorro anual neto"
          value={formatCurrency(results.ahorroAnualNeto)}
          accent
        />
        <KPI label="ROI" value={formatPercent(results.roi)} accent />
        <KPI label="Payback" value={paybackText} />
        <KPI
          label="Fee mensual final"
          value={formatCurrency(results.feeFinal)}
          sub={`Rango: ${rangoText}`}
        />
        {results.totalSetup > 0 && (
          <KPI
            label="Setup total"
            value={formatCurrency(results.totalSetup)}
          />
        )}
        <KPI
          label="Inversión 1er año"
          value={formatCurrency(results.totalFirstYear)}
          accent
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Horas actuales vs post-automatización
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <Bar data={hoursChartData} options={barOpts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Coste actual vs coste automatizado
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <Bar data={costChartData} options={barOpts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Ahorro acumulado (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <Line data={savingsChartData} options={lineOpts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ROI (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <Bar data={roiChartData} options={barOpts} />
          </CardContent>
        </Card>

        {paybackChartData ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Payback timeline</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <Line data={paybackChartData} options={lineOpts} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Payback timeline</CardTitle>
            </CardHeader>
            <CardContent className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              {results.totalSetup <= 0
                ? 'Sin coste de setup – payback inmediato'
                : 'Ahorro insuficiente para recuperar setup'}
            </CardContent>
          </Card>
        )}

        {breakdownChartData ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Distribución del fee por automatización
              </CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <Doughnut
                data={breakdownChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Distribución del fee
              </CardTitle>
            </CardHeader>
            <CardContent className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Selecciona automatizaciones en la pestaña correspondiente
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultadosSection;
