import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FormData,
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
  derivedMinTotal: number;
}

const DatosSection = ({
  data,
  onChange,
  onFillExample,
  onClear,
  derivedTarifaHora,
  derivedFeeSugerido,
  derivedMinTotal,
}: Props) => {
  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const numInput = (
    key: keyof FormData,
    opts?: { step?: string; min?: string; max?: string; placeholder?: string }
  ) => (
    <Input
      type="number"
      value={data[key] as number}
      onChange={(e) => update(key, Number(e.target.value) as never)}
      step={opts?.step}
      min={opts?.min}
      max={opts?.max}
      placeholder={opts?.placeholder}
      className="h-9"
    />
  );

  return (
    <div className="space-y-5">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Empresa</Label>
            <Input
              value={data.empresa}
              onChange={(e) => update('empresa', e.target.value)}
              placeholder="Nombre de la empresa"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nombre del cliente</Label>
            <Input
              value={data.nombreCliente}
              onChange={(e) => update('nombreCliente', e.target.value)}
              placeholder="Nombre completo"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email del cliente</Label>
            <Input
              type="email"
              value={data.emailCliente}
              onChange={(e) => update('emailCliente', e.target.value)}
              placeholder="cliente@empresa.es"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fecha de elaboración</Label>
            <Input
              type="date"
              value={data.fechaElaboracion}
              onChange={(e) => update('fechaElaboracion', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Asunto del email</Label>
            <Input
              value={data.asuntoEmail}
              onChange={(e) => update('asuntoEmail', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Mensaje del email</Label>
            <Textarea
              value={data.mensajeEmail}
              onChange={(e) => update('mensajeEmail', e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>
          <div className="flex items-start gap-2 md:col-span-2">
            <Checkbox
              id="rgpd"
              checked={data.rgpdChecked}
              onCheckedChange={(v) => update('rgpdChecked', !!v)}
              className="mt-0.5"
            />
            <Label htmlFor="rgpd" className="text-xs leading-relaxed">
              Acepto el tratamiento de datos para recibir la propuesta por
              email.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* B) Parámetros generales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Parámetros generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Días laborables/mes</Label>
            {numInput('diasLaborablesMes')}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Horas laborables/mes</Label>
            {numInput('horasLaborablesMes')}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Días laborables/semana</Label>
            {numInput('diasLaborablesSemana')}
          </div>
        </CardContent>
      </Card>

      {/* 1) Análisis de Pérdida de Tiempo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            1. Análisis de Pérdida de Tiempo
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Label className="text-xs text-muted-foreground">
              Detalle por tareas
            </Label>
            <Switch
              checked={data.modoRapido}
              onCheckedChange={(v) => update('modoRapido', v)}
            />
            <Label className="text-xs text-muted-foreground">
              Introducción rápida
            </Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.modoRapido ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Horas perdidas al día</Label>
                {numInput('horasPerdidasDiaInput', { step: '0.5' })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Salario mensual medio (€/mes)</Label>
              {numInput('salarioMensual')}
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
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <Label className="text-xs">
                Coste de puesta en marcha (€){' '}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              {numInput('costeSetup')}
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Fee mensual sugerido</Label>
              <div className="h-9 px-3 flex items-center bg-muted rounded-md text-sm font-medium">
                {formatCurrencyDecimals(derivedFeeSugerido)}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mínimo total (automatizaciones)</Label>
              <div className="h-9 px-3 flex items-center bg-muted rounded-md text-sm font-medium">
                {formatCurrencyDecimals(derivedMinTotal)}
              </div>
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default DatosSection;
