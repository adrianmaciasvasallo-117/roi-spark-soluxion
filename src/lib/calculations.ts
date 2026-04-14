// ============================================================
// Soluxion ROI Calculator – Types, Constants & Formulas
// All formulas are deterministic and documented inline.
// ============================================================

export interface AutomationItem {
  id: string;
  nombre: string;
  descripcion: string;
  beneficios: string[];
  minMonthly: number;
  defaultSetup: number;
}

export const AUTOMATIONS_CATALOG: AutomationItem[] = [
  {
    id: 'whatsapp',
    nombre: 'Bot WhatsApp',
    descripcion: 'Chatbot automatizado para WhatsApp Business que responde consultas, cualifica leads y gestiona citas 24/7.',
    beneficios: [
      'Atención 24/7 sin intervención humana',
      'Cualificación automática de leads',
      'Reducción del tiempo de respuesta a segundos',
      'Integración con CRM',
    ],
    minMonthly: 500,
    defaultSetup: 0,
  },
  {
    id: 'voz',
    nombre: 'Agente de voz IA',
    descripcion: 'Asistente telefónico con inteligencia artificial para gestión de llamadas entrantes y salientes.',
    beneficios: [
      'Gestión automática de llamadas',
      'Transcripción y resumen de conversaciones',
      'Derivación inteligente',
      'Disponibilidad fuera de horario',
    ],
    minMonthly: 700,
    defaultSetup: 0,
  },
  {
    id: 'email',
    nombre: 'Automatización de emails',
    descripcion: 'Secuencias de email automatizadas para nurturing, seguimiento y comunicación con clientes.',
    beneficios: [
      'Seguimiento automático de leads',
      'Secuencias personalizadas',
      'Reducción de tareas manuales de email',
      'Mejora en tasas de conversión',
    ],
    minMonthly: 250,
    defaultSetup: 0,
  },
  {
    id: 'crm',
    nombre: 'CRM / pipeline',
    descripcion: 'Sistema de gestión de relaciones con clientes y pipeline de ventas automatizado.',
    beneficios: [
      'Visibilidad completa del pipeline',
      'Automatización de seguimiento',
      'Informes y métricas en tiempo real',
      'Centralización de datos de clientes',
    ],
    minMonthly: 400,
    defaultSetup: 1200,
  },
  {
    id: 'web',
    nombre: 'Web / landing',
    descripcion: 'Página web o landing page optimizada para conversión con formularios y tracking integrado.',
    beneficios: [
      'Captación de leads 24/7',
      'Optimización para conversión',
      'Integración con CRM y email',
      'Análisis de comportamiento',
    ],
    minMonthly: 150,
    defaultSetup: 900,
  },
];

export type Frecuencia = 'diaria' | 'semanal' | 'mensual';

/** Per-automation overrides for monthly price and setup fee */
export interface AutomationPriceOverride {
  monthlyPrice: number;
  setupFee: number;
}

export interface FormData {
  empresa: string;
  nombreCliente: string;
  emailCliente: string;
  fechaElaboracion: string;
  asuntoEmail: string;
  mensajeEmail: string;
  rgpdChecked: boolean;

  diasLaborablesMes: number;
  horasLaborablesMes: number;
  diasLaborablesSemana: number;

  modoRapido: boolean;
  horasPerdidasDiaInput: number;
  numEmpleados: number;
  numTareas: number;
  minutosPorTarea: number;
  frecuencia: Frecuencia;
  horasGestion: number;
  horasRetrabajo: number;
  salarioMensual: number;

  leadsPerdidos: number;
  tasaConversion: number;
  ticketPromedio: number;

  salarioSustituible: number;
  porcentajeAutomatizable: number;

  porcentajeCobro: number;
  costeSetup: number; // kept for legacy/override — totalSetup is now computed
  overrideEnabled: boolean;
  feeMensualOverride: number;
  

  ivaEnabled: boolean;
  ivaPorcentaje: number;
  irpfEnabled: boolean;
  irpfPorcentaje: number;

  selectedAutomations: string[];
  /** Per-automation price overrides keyed by automation id */
  automationOverrides: Record<string, AutomationPriceOverride>;
}

export const DEFAULT_FORM_DATA: FormData = {
  empresa: '',
  nombreCliente: '',
  emailCliente: '',
  fechaElaboracion: new Date().toISOString().split('T')[0],
  asuntoEmail: 'Propuesta de automatización – Soluxion',
  mensajeEmail:
    'Estimado/a cliente,\n\nAdjunto encontrará la propuesta personalizada de automatización elaborada por Soluxion.\n\nQuedamos a su disposición para cualquier consulta.\n\nUn saludo,\nEquipo Soluxion',
  rgpdChecked: false,

  diasLaborablesMes: 22,
  horasLaborablesMes: 160,
  diasLaborablesSemana: 5,

  modoRapido: false,
  horasPerdidasDiaInput: 3,
  numEmpleados: 5,
  numTareas: 8,
  minutosPorTarea: 15,
  frecuencia: 'diaria',
  horasGestion: 0,
  horasRetrabajo: 0,
  salarioMensual: 2000,

  leadsPerdidos: 20,
  tasaConversion: 10,
  ticketPromedio: 500,

  salarioSustituible: 1800,
  porcentajeAutomatizable: 60,

  porcentajeCobro: 20,
  costeSetup: 0,
  overrideEnabled: false,
  feeMensualOverride: 0,
  autoDistributeRemainder: true,

  ivaEnabled: true,
  ivaPorcentaje: 21,
  irpfEnabled: true,
  irpfPorcentaje: 15,

  selectedAutomations: [],
  automationOverrides: {},
};

export const EXAMPLE_DATA: Partial<FormData> = {
  empresa: 'Empresa Demo S.L.',
  nombreCliente: 'Juan García',
  emailCliente: 'juan@empresademo.es',
  numEmpleados: 5,
  numTareas: 8,
  minutosPorTarea: 15,
  frecuencia: 'diaria',
  horasGestion: 1,
  horasRetrabajo: 0.5,
  salarioMensual: 2000,
  leadsPerdidos: 20,
  tasaConversion: 10,
  ticketPromedio: 500,
  salarioSustituible: 1800,
  porcentajeAutomatizable: 60,
  porcentajeCobro: 20,
  selectedAutomations: ['whatsapp', 'email', 'crm'],
  rgpdChecked: true,
};

// ============================================================
// Helper: get effective monthly price / setup for an automation
// ============================================================
export function getEffectiveMonthly(data: FormData, id: string): number {
  const item = AUTOMATIONS_CATALOG.find((a) => a.id === id);
  if (!item) return 0;
  const override = data.automationOverrides?.[id];
  return override ? override.monthlyPrice : item.minMonthly;
}

export function getEffectiveSetup(data: FormData, id: string): number {
  const item = AUTOMATIONS_CATALOG.find((a) => a.id === id);
  if (!item) return 0;
  const override = data.automationOverrides?.[id];
  return override ? override.setupFee : item.defaultSetup;
}

// ============================================================
// Results
// ============================================================

export interface Results {
  horasPerdidasDia: number;
  horasPerdidasMes: number;
  tarifaHora: number;
  costoTiempo: number;
  ventasPerdidas: number;
  ingresoPerdido: number;
  costoEvitable: number;
  perdidaTotal: number;
  ahorroAnualBruto: number;
  feeSugerido: number;
  minTotal: number;
  feeFinal: number;
  costoActual: number;
  costoTrasAutomatizacion: number;
  ahorroMensualNeto: number;
  ahorroAnualNeto: number;
  ahorroPorcentaje: number;
  costoAnual: number;
  roi: number;
  payback: number | 'no_recuperable';
  rangoMin: number;
  rangoMax: number;
  allocationPrices: Record<string, number>;
  totalSetup: number;
  totalFirstYear: number;
  baseImponible: number;
  ivaAmount: number;
  irpfAmount: number;
  totalConImpuestos: number;
  totalAnualConImpuestos: number;
}

export function calculateResults(data: FormData): Results {
  // Frequency factor
  let factor = 1;
  if (data.frecuencia === 'semanal') factor = 1 / data.diasLaborablesSemana;
  if (data.frecuencia === 'mensual') factor = 1 / data.diasLaborablesMes;

  // Hours lost per day
  let horasPerdidasDia: number;
  if (data.modoRapido) {
    horasPerdidasDia = data.horasPerdidasDiaInput;
  } else {
    const minutosPerdidos = data.numEmpleados * data.numTareas * data.minutosPorTarea * factor;
    horasPerdidasDia = minutosPerdidos / 60 + data.horasGestion + data.horasRetrabajo;
  }

  // 1) Pérdida de Tiempo
  const horasPerdidasMes = horasPerdidasDia * data.diasLaborablesMes;
  const tarifaHora = data.horasLaborablesMes > 0 ? data.salarioMensual / data.horasLaborablesMes : 0;
  const costoTiempo = horasPerdidasMes * tarifaHora;

  // 2) Oportunidades y Dinero Perdido
  const ventasPerdidas = data.leadsPerdidos * (data.tasaConversion / 100);
  const ingresoPerdido = ventasPerdidas * data.ticketPromedio;

  // 3) Costos Operativos Evitables
  const costoEvitable = data.salarioSustituible * (data.porcentajeAutomatizable / 100);

  // 4) Resumen
  const perdidaTotal = costoTiempo + ingresoPerdido + costoEvitable;
  const ahorroAnualBruto = perdidaTotal * 12;

  // PRICING — new model with per-automation prices
  const feeSugerido = (ahorroAnualBruto * data.porcentajeCobro) / 100 / 12;

  // Base monthly sum = sum of effective monthly prices
  const baseMonthlySum = data.selectedAutomations.reduce(
    (sum, id) => sum + getEffectiveMonthly(data, id),
    0
  );

  // Min total (hard floor)
  const minTotal = data.selectedAutomations.reduce((sum, id) => {
    const item = AUTOMATIONS_CATALOG.find((a) => a.id === id);
    return sum + (item?.minMonthly || 0);
  }, 0);

  // Build allocation prices
  const allocationPrices: Record<string, number> = {};
  data.selectedAutomations.forEach((id) => {
    allocationPrices[id] = getEffectiveMonthly(data, id);
  });

  // Auto-distribute remainder
  if (data.autoDistributeRemainder && !data.overrideEnabled) {
    const targetMonthly = feeSugerido;
    const remainder = Math.max(0, targetMonthly - baseMonthlySum);
    if (remainder > 0) {
      // Priority: email > crm > last selected
      const priority = ['email', 'crm'];
      let assigned = false;
      for (const pid of priority) {
        if (data.selectedAutomations.includes(pid)) {
          allocationPrices[pid] = (allocationPrices[pid] || 0) + remainder;
          assigned = true;
          break;
        }
      }
      if (!assigned && data.selectedAutomations.length > 0) {
        const last = data.selectedAutomations[data.selectedAutomations.length - 1];
        allocationPrices[last] = (allocationPrices[last] || 0) + remainder;
      }
    }
  }

  // Fee final
  let feeFinal: number;
  if (data.overrideEnabled) {
    feeFinal = data.feeMensualOverride;
  } else {
    const sumAllocation = Object.values(allocationPrices).reduce((s, v) => s + v, 0);
    feeFinal = sumAllocation;
  }

  // Total setup
  const totalSetup = data.selectedAutomations.reduce(
    (sum, id) => sum + getEffectiveSetup(data, id),
    0
  );

  // Savings
  const costoActual = perdidaTotal;
  const costoTrasAutomatizacion = feeFinal;
  const ahorroMensualNeto = costoActual - costoTrasAutomatizacion;
  const ahorroAnualNeto = ahorroMensualNeto * 12;
  const ahorroPorcentaje = costoActual > 0 ? (ahorroMensualNeto / costoActual) * 100 : 0;

  // ROI — does NOT include setup (Option C)
  const costoAnual = feeFinal * 12;
  const roi = costoAnual > 0 ? (ahorroAnualNeto / costoAnual) * 100 : 0;

  // Payback — based on total setup
  let payback: number | 'no_recuperable';
  if (totalSetup === 0) {
    payback = 0;
  } else if (ahorroMensualNeto > 0) {
    payback = totalSetup / ahorroMensualNeto;
  } else {
    payback = 'no_recuperable';
  }

  // Suggested range
  const rangoMin = (ahorroAnualBruto * 0.15) / 12;
  const rangoMax = (ahorroAnualBruto * 0.25) / 12;

  // Fiscal
  const baseImponible = feeFinal;
  const ivaAmount = data.ivaEnabled ? (baseImponible * data.ivaPorcentaje) / 100 : 0;
  const irpfAmount = data.irpfEnabled ? (baseImponible * data.irpfPorcentaje) / 100 : 0;
  const totalConImpuestos = baseImponible + ivaAmount - irpfAmount;
  const totalAnualConImpuestos = totalConImpuestos * 12;

  // Total first year
  const totalFirstYear = feeFinal * 12 + totalSetup;

  return {
    horasPerdidasDia,
    horasPerdidasMes,
    tarifaHora,
    costoTiempo,
    ventasPerdidas,
    ingresoPerdido,
    costoEvitable,
    perdidaTotal,
    ahorroAnualBruto,
    feeSugerido,
    minTotal,
    feeFinal,
    costoActual,
    costoTrasAutomatizacion,
    ahorroMensualNeto,
    ahorroAnualNeto,
    ahorroPorcentaje,
    costoAnual,
    roi,
    payback,
    rangoMin,
    rangoMax,
    allocationPrices,
    totalSetup,
    totalFirstYear,
    baseImponible,
    ivaAmount,
    irpfAmount,
    totalConImpuestos,
    totalAnualConImpuestos,
  };
}

// ============================================================
// Formatters (Spanish locale)
// ============================================================
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyDecimals(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number): string {
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value) + ' %'
  );
}
