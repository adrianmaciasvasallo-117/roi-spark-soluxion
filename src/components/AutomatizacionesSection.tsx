import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  FormData,
  Results,
  AUTOMATIONS_CATALOG,
  formatCurrency,
  getEffectiveMonthly,
  getEffectiveSetup,
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

  const updateOverride = (
    id: string,
    field: 'monthlyPrice' | 'setupFee',
    value: number
  ) => {
    const item = AUTOMATIONS_CATALOG.find((a) => a.id === id)!;
    const current = data.automationOverrides[id] || {
      monthlyPrice: item.minMonthly,
      setupFee: item.defaultSetup,
    };
    onChange({
      ...data,
      automationOverrides: {
        ...data.automationOverrides,
        [id]: { ...current, [field]: value },
      },
    });
  };

  const selectedItems = data.selectedAutomations
    .map((id) => AUTOMATIONS_CATALOG.find((a) => a.id === id)!)
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Selecciona las automatizaciones que deseas incluir en la propuesta.
        Puedes ajustar el precio mensual y setup de cada una.
      </p>

      <div className="grid gap-3">
        {AUTOMATIONS_CATALOG.map((item) => {
          const isSelected = data.selectedAutomations.includes(item.id);
          const effectiveMonthly = getEffectiveMonthly(data, item.id);
          const effectiveSetup = getEffectiveSetup(data, item.id);
          const override = data.automationOverrides[item.id];

          return (
            <Card
              key={item.id}
              className={`transition-all ${
                isSelected
                  ? 'ring-2 ring-accent shadow-md'
                  : 'hover:shadow-sm'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    className="mt-0.5 cursor-pointer"
                    onCheckedChange={() => toggleAutomation(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="flex items-center gap-2 mb-1 cursor-pointer"
                      onClick={() => toggleAutomation(item.id)}
                    >
                      <h3 className="text-sm font-semibold">{item.nombre}</h3>
                      <Badge variant="secondary" className="text-xs">
                        Mín. {formatCurrency(item.minMonthly)}/mes
                      </Badge>
                      {item.defaultSetup > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Setup {formatCurrency(item.defaultSetup)}
                        </Badge>
                      )}
                    </div>
                    <p
                      className="text-xs text-muted-foreground mb-2 cursor-pointer"
                      onClick={() => toggleAutomation(item.id)}
                    >
                      {item.descripcion}
                    </p>
                    <ul
                      className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-2 cursor-pointer"
                      onClick={() => toggleAutomation(item.id)}
                    >
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

                    {isSelected && (
                      <div className="flex gap-4 mt-2 pt-2 border-t border-border">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground block mb-1">
                            Precio mensual (€)
                          </label>
                          <Input
                            type="number"
                            min={item.minMonthly}
                            step={50}
                            value={
                              (override?.monthlyPrice ?? item.minMonthly) === 0
                                ? ''
                                : String(override?.monthlyPrice ?? item.minMonthly)
                            }
                            onChange={(e) =>
                              updateOverride(
                                item.id,
                                'monthlyPrice',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="h-8 text-sm"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            Mín. {formatCurrency(item.minMonthly)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground block mb-1">
                            Setup (€)
                          </label>
                          <Input
                            type="number"
                            min={item.defaultSetup}
                            step={100}
                            value={
                              (override?.setupFee ?? item.defaultSetup) === 0
                                ? ''
                                : String(override?.setupFee ?? item.defaultSetup)
                            }
                            onChange={(e) =>
                              updateOverride(
                                item.id,
                                'setupFee',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="h-8 text-sm"
                          />
                          {item.defaultSetup > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              Mín. {formatCurrency(item.defaultSetup)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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
              {selectedItems.map((item) => {
                const monthly = getEffectiveMonthly(data, item.id);
                const setup = getEffectiveSetup(data, item.id);
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.nombre}</span>
                    <div className="text-right">
                      <span className="font-medium">
                        {formatCurrency(results.allocationPrices[item.id] || monthly)}/mes
                      </span>
                      {setup > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          + {formatCurrency(setup)} setup
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>Total mensual</span>
                <span>{formatCurrency(results.feeFinal)}/mes</span>
              </div>
              {results.totalSetup > 0 && (
                <div className="flex justify-between text-sm font-bold">
                  <span>Total setup</span>
                  <span>{formatCurrency(results.totalSetup)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-primary">
                <span>Total primer año</span>
                <span>{formatCurrency(results.totalFirstYear)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomatizacionesSection;
