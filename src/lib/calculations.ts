// ============================================================
// Soluxion ROI Calculator – Types, Constants & Formulas
// All formulas are deterministic and documented inline.
// ============================================================

export interface AutomationItem {
  id: string;
  nombre: string;
  descripcion: string;
  beneficios: string[];
  minMensual: number;
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
    minMensual: 500,
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
    minMensual: 700,
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
    minMensual: 0,
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
    minMensual: 0,
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
    minMensual: 0,
  },
];

export type Frecuencia = 'diaria' | 'semanal' | 'mensual';

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
  costeSetup: number;
  overrideEnabled: boolean;
  feeMensualOverride: number;

  selectedAutomations: string[];
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

  selectedAutomations: [],
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
}

export function calculateResults(data: FormData): Results {
  // Frequency factor: converts task frequency to daily equivalent
  // diaria: factor = 1
  // semanal: factor = 1 / diasLaborablesSemana
  // mensual: factor = 1 / diasLaborablesMes
  let factor = 1;
  if (data.frecuencia === 'semanal') factor = 1 / data.diasLaborablesSemana;
  if (data.frecuencia === 'mensual') factor = 1 / data.diasLaborablesMes;

  // Hours lost per day
  let horasPerdidasDia: number;
  if (data.modoRapido) {
    horasPerdidasDia = data.horasPerdidasDiaInput;
  } else {
    // Minutos perdidos al día = Nº empleados * Nº tareas * Minutos/tarea * factor
    const minutosPerdidos = data.numEmpleados * data.numTareas * data.minutosPorTarea * factor;
    // Horas perdidas al día = (minutosPerdidos / 60) + gestión + retrabajo
    horasPerdidasDia = minutosPerdidos / 60 + data.horasGestion + data.horasRetrabajo;
  }

  // 1) Pérdida de Tiempo
  // Horas perdidas al mes = Horas perdidas/día * Días laborables/mes
  const horasPerdidasMes = horasPerdidasDia * data.diasLaborablesMes;
  // Tarifa por hora (€/h) = Salario mensual / Horas laborables/mes
  const tarifaHora = data.horasLaborablesMes > 0 ? data.salarioMensual / data.horasLaborablesMes : 0;
  // Costo mensual en tiempo (€) = Horas perdidas/mes * Tarifa/hora
  const costoTiempo = horasPerdidasMes * tarifaHora;

  // 2) Oportunidades y Dinero Perdido
  // Ventas perdidas (uds/mes) = Leads perdidos * (Tasa conversión / 100)
  const ventasPerdidas = data.leadsPerdidos * (data.tasaConversion / 100);
  // Ingreso perdido mensual (€) = Ventas perdidas * Ticket promedio
  const ingresoPerdido = ventasPerdidas * data.ticketPromedio;

  // 3) Costos Operativos Evitables
  // Costo evitable mensual (€) = Salario recurso * (% automatizable / 100)
  const costoEvitable = data.salarioSustituible * (data.porcentajeAutomatizable / 100);

  // 4) Resumen
  // Pérdida total mensual (€/mes) = costoTiempo + ingresoPerdido + costoEvitable
  const perdidaTotal = costoTiempo + ingresoPerdido + costoEvitable;
  // Ahorro anual bruto (€) = Pérdida total * 12 (assumes 100% automation)
  const ahorroAnualBruto = perdidaTotal * 12;

  // PRICING
  // Fee mensual sugerido = (Ahorro anual bruto * % cobro) / 12
  const feeSugerido = (ahorroAnualBruto * data.porcentajeCobro) / 100 / 12;

  // Min total from selected automations
  const minTotal = data.selectedAutomations.reduce((sum, id) => {
    const item = AUTOMATIONS_CATALOG.find((a) => a.id === id);
    return sum + (item?.minMensual || 0);
  }, 0);

  // Fee mensual final = max(feeSugerido, minTotal) unless override
  let feeFinal: number;
  if (data.overrideEnabled) {
    feeFinal = Math.max(data.feeMensualOverride, minTotal);
  } else {
    feeFinal = Math.max(feeSugerido, minTotal);
  }

  // Savings
  const costoActual = perdidaTotal;
  const costoTrasAutomatizacion = feeFinal;
  const ahorroMensualNeto = costoActual - costoTrasAutomatizacion;
  const ahorroAnualNeto = ahorroMensualNeto * 12;
  // Ahorro (%) = (Ahorro mensual neto / Coste actual) * 100
  const ahorroPorcentaje = costoActual > 0 ? (ahorroMensualNeto / costoActual) * 100 : 0;

  // ROI and Payback
  const costoAnual = feeFinal * 12;
  // ROI (%) = (Ahorro anual neto / Coste anual) * 100
  const roi = costoAnual > 0 ? (ahorroAnualNeto / costoAnual) * 100 : 0;

  let payback: number | 'no_recuperable';
  if (data.costeSetup === 0) {
    payback = 0;
  } else if (ahorroMensualNeto > 0) {
    // Payback (meses) = Setup / Ahorro mensual neto
    payback = data.costeSetup / ahorroMensualNeto;
  } else {
    payback = 'no_recuperable';
  }

  // Suggested range
  const rangoMin = (ahorroAnualBruto * 0.15) / 12;
  const rangoMax = (ahorroAnualBruto * 0.25) / 12;

  // Allocation
  const allocationPrices = allocateAutomationPrices(data.selectedAutomations, feeFinal);

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
  };
}

// ============================================================
// Automation price allocation
// ============================================================
function allocateAutomationPrices(
  selectedIds: string[],
  feeFinal: number
): Record<string, number> {
  if (selectedIds.length === 0) return {};

  const selected = selectedIds
    .map((id) => AUTOMATIONS_CATALOG.find((a) => a.id === id)!)
    .filter(Boolean);
  const sumMin = selected.reduce((s, a) => s + a.minMensual, 0);

  // Weights: proportional to minimums if any, else equal
  const weights: Record<string, number> = {};
  if (sumMin > 0) {
    selected.forEach((a) => {
      weights[a.id] = a.minMensual / sumMin;
    });
  } else {
    selected.forEach((a) => {
      weights[a.id] = 1 / selected.length;
    });
  }

  const prices: Record<string, number> = {};
  let allocated = 0;

  selected.forEach((a, i) => {
    if (i === selected.length - 1) {
      // Last item gets remainder to avoid rounding drift
      prices[a.id] = Math.round((feeFinal - allocated) * 100) / 100;
    } else {
      const price = Math.round(feeFinal * weights[a.id] * 100) / 100;
      prices[a.id] = Math.max(price, a.minMensual);
      allocated += prices[a.id];
    }
  });

  // Ensure last item meets minimum
  const lastItem = selected[selected.length - 1];
  if (prices[lastItem.id] < lastItem.minMensual) {
    const deficit = lastItem.minMensual - prices[lastItem.id];
    prices[lastItem.id] = lastItem.minMensual;
    const adjustable = selected.filter(
      (a) => a.id !== lastItem.id && a.minMensual === 0
    );
    if (adjustable.length > 0) {
      const perItem = deficit / adjustable.length;
      adjustable.forEach((a) => {
        prices[a.id] = Math.max(0, prices[a.id] - perItem);
      });
    }
  }

  return prices;
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
