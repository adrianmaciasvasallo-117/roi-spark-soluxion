import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FormData,
  Results,
  Frecuencia,
  formatCurrencyDecimals,
} from '@/lib/calculations';
import { Sparkles, Trash2 } from 'lucide-react';

interface Props {
  data: FormData;
  onChange: (data: FormData) => void;
  onFillExample: () => void;
  onClear: () => void;
  derivedTarifaHora: number;
  derivedFeeSugerido: number;
  results: Results;
}

const DatosSection = ({
  data,
  onChange,
  onFillExample,
  onClear,
  derivedTarifaHora,
  derivedFeeSugerido,
  results,
}: Props) => {
  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const numInput = (
    key: keyof FormData,
    opts?: { step?: string; min?: string; max?: string; placeholder?: string }
  ) => {
    const raw = data[key] as number;
    const display = raw === 0 ? '' : String(raw);
    return (
      <Input
        type="number"
        value={display}
        onChange={(e) => {
          const v = e.target.value;
          update(key, (v === '' ? 0 : Number(v)) as never);
        }}
        step={opts?.step}
        min={opts?.min}
        max={opts?.max}
        placeholder={opts?.placeholder ?? '0'}
        className="h-9"
      />
    );
  };

  return (
    <div className="space-y-5 overflow-x-hidden">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end flex-wrap">
        <Button variant="outline" size="sm" onClick={onFillExample}>
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          Rellenar ejemplo
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Limpiar
        </Button>
      </div>

      {/* A) Identificación */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identificación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Empresa</Label>
              <Input
                value={data.empresa}
                onChange={(e) => update('empresa', e.target.value)}
                placeholder="Nombre de la empresa"
                className="h-9 w-full max-w-full"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nombre del cliente</Label>
              <Input
                value={data.nombreCliente}
                onChange={(e) => update('nombreCliente', e.target.value)}
                placeholder="Nombre completo"
                className="h-9 w-full max-w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Email del cliente</Label>
              <Input
                type="email"
                value={data.emailCliente}
                onChange={(e) => update('emailCliente', e.target.value)}
                placeholder="cliente@empresa.es"
                className="h-9 w-full max-w-full"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Fecha de elaboración</Label>
              <Input
                type="date"
                value={data.fechaElaboracion}
                onChange={(e) => update('fechaElaboracion', e.target.value)}
                className="h-9 w-full max-w-full box-border min-w-0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1) Análisis de Pérdida de Tiempo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            1. Análisis de Pérdida de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Mode toggle pills */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => update('modoRapido', false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                !data.modoRapido
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              Modo detalle
            </button>
            <button
              type="button"
              onClick={() => update('modoRapido', true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                data.modoRapido
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              Modo rápido
            </button>
          </div>

          {data.modoRapido ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Horas perdidas al día</Label>
                {numInput('horasPerdidasDiaInput', { step: '0.5' })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nº empleados afectados</Label>
                {numInput('numEmpleados')}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Nº tareas repetitivas/empleado
                </Label>
                {numInput('numTareas')}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Minutos por tarea</Label>
                {numInput('minutosPorTarea')}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frecuencia</Label>
                <Select
                  value={data.frecuencia}
                  onValueChange={(v) => update('frecuencia', v as Frecuencia)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Diaria</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Horas gestión/coord. al día{' '}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                {numInput('horasGestion', { step: '0.5' })}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Horas retrabajo por errores/día{' '}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                {numInput('horasRetrabajo', { step: '0.5' })}
              </div>
            </div>
          )}
          <Separator />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Salario mensual medio (€/mes)</Label>
              {numInput('salarioMensual')}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Horas laborables/mes</Label>
              <p className="text-[10px] text-muted-foreground">Determina la tarifa €/hora</p>
              {numInput('horasLaborablesMes')}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tarifa por hora (derivada)</Label>
              <div className="h-9 px-3 flex items-center bg-muted rounded-md text-sm font-medium">
                {formatCurrencyDecimals(derivedTarifaHora)}/h
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2) Oportunidades y Dinero Perdido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            2. Oportunidades y Dinero Perdido
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Leads perdidos/mes</Label>
            {numInput('leadsPerdidos')}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tasa de conversión (%)</Label>
            {numInput('tasaConversion', { min: '0', max: '100' })}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ticket promedio (€)</Label>
            {numInput('ticketPromedio')}
          </div>
        </CardContent>
      </Card>

      {/* 3) Costos Operativos Evitables */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            3. Costos Operativos Evitables
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">
              Salario mensual recurso sustituible (€/mes)
            </Label>
            {numInput('salarioSustituible')}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              % tiempo en tareas automatizables
            </Label>
            {numInput('porcentajeAutomatizable', { min: '0', max: '100' })}
          </div>
        </CardContent>
      </Card>

      {/* C) Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pricing (tu fee)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">% a cobrar sobre ahorro anual</Label>
              <Select
                value={String(data.porcentajeCobro)}
                onValueChange={(v) => update('porcentajeCobro', Number(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fee mensual sugerido</Label>
              <div className="h-9 px-3 flex items-center bg-muted rounded-md text-sm font-medium">
                {formatCurrencyDecimals(derivedFeeSugerido)}
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Switch
                  checked={data.overrideEnabled}
                  onCheckedChange={(v) => update('overrideEnabled', v)}
                />
                <Label className="text-xs">Override manual</Label>
              </div>
              {data.overrideEnabled && (
                <div className="space-y-1">
                  <Label className="text-xs">Fee mensual final (€)</Label>
                  {numInput('feeMensualOverride')}
                </div>
              )}
            </div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">Impuestos aplicados al fee</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={data.ivaEnabled}
                  onCheckedChange={(v) => update('ivaEnabled', v)}
                />
                <Label className="text-xs">Aplicar IVA</Label>
              </div>
              {data.ivaEnabled && (
                <div className="space-y-1">
                  <Label className="text-xs">IVA (%)</Label>
                  {numInput('ivaPorcentaje', { min: '0', max: '100' })}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={data.irpfEnabled}
                  onCheckedChange={(v) => update('irpfEnabled', v)}
                />
                <Label className="text-xs">Retención IRPF</Label>
              </div>
              {data.irpfEnabled && (
                <div className="space-y-1">
                  <Label className="text-xs">IRPF (%)</Label>
                  {numInput('irpfPorcentaje', { min: '0', max: '100' })}
                </div>
              )}
            </div>
          </div>
          <div className="h-9 px-3 flex items-center bg-muted rounded-md text-xs font-medium gap-1 flex-wrap">
            <span>Base: {formatCurrencyDecimals(results.baseImponible)}</span>
            {data.ivaEnabled && <span>+ IVA: {formatCurrencyDecimals(results.ivaAmount)}</span>}
            {data.irpfEnabled && <span>− IRPF: {formatCurrencyDecimals(results.irpfAmount)}</span>}
            <span className="font-bold">= {formatCurrencyDecimals(results.totalConImpuestos)}/mes</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatosSection;
