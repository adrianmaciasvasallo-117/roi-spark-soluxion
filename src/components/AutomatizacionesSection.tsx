import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FormData,
  Results,
  AUTOMATIONS_CATALOG,
  formatCurrency,
} from '@/lib/calculations';
import { Check } from 'lucide-react';

interface Props {
  data: FormData;
  onChange: (data: FormData) => void;
  results: Results;
}

const AutomatizacionesSection = ({ data, onChange, results }: Props) => {
  const toggleAutomation = (id: string) => {
    const selected = data.selectedAutomations.includes(id)
      ? data.selectedAutomations.filter((a) => a !== id)
      : [...data.selectedAutomations, id];
    onChange({ ...data, selectedAutomations: selected });
  };

  const selectedItems = data.selectedAutomations
    .map((id) => AUTOMATIONS_CATALOG.find((a) => a.id === id)!)
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Selecciona las automatizaciones que deseas incluir en la propuesta. Los
        precios se asignarán proporcionalmente al fee mensual final.
      </p>

      <div className="grid gap-3">
        {AUTOMATIONS_CATALOG.map((item) => {
          const isSelected = data.selectedAutomations.includes(item.id);
          return (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-accent shadow-md'
                  : 'hover:shadow-sm'
              }`}
              onClick={() => toggleAutomation(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    className="mt-0.5"
                    onCheckedChange={() => toggleAutomation(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{item.nombre}</h3>
                      {item.minMensual > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Mín. {formatCurrency(item.minMensual)}/mes
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.descripcion}
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {item.beneficios.map((b, i) => (
                        <li
                          key={i}
                          className="text-xs flex items-center gap-1.5"
                        >
                          <Check className="h-3 w-3 text-accent shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Resumen de automatizaciones seleccionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.nombre}</span>
                  <span className="font-medium">
                    {formatCurrency(results.allocationPrices[item.id] || 0)}
                    /mes
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>Total fee mensual</span>
                <span>{formatCurrency(results.feeFinal)}/mes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomatizacionesSection;
