import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import DatosSection from '@/components/DatosSection';
import ResultadosSection from '@/components/ResultadosSection';
import AutomatizacionesSection from '@/components/AutomatizacionesSection';
import PropuestaSection from '@/components/PropuestaSection';
import {
  FormData,
  DEFAULT_FORM_DATA,
  EXAMPLE_DATA,
  calculateResults,
} from '@/lib/calculations';
import { ClipboardList, BarChart3, Cog, FileOutput } from 'lucide-react';

const Index = () => {
  const [formData, setFormData] = useState<FormData>({ ...DEFAULT_FORM_DATA });
  const [activeTab, setActiveTab] = useState('datos');

  const results = useMemo(() => calculateResults(formData), [formData]);

  const handleFillExample = () => {
    setFormData((prev) => ({
      ...prev,
      ...EXAMPLE_DATA,
      fechaElaboracion: new Date().toISOString().split('T')[0],
    }));
  };

  const handleClear = () => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      fechaElaboracion: new Date().toISOString().split('T')[0],
    });
  };

  const handleReset = () => {
    handleClear();
    setActiveTab('datos');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Calculadora ROI" showBack />
      <main className="max-w-5xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 mb-5">
            <TabsTrigger value="datos" className="text-xs sm:text-sm gap-1.5">
              <ClipboardList className="h-4 w-4 hidden sm:block" />
              Datos
            </TabsTrigger>
            <TabsTrigger value="resultados" className="text-xs sm:text-sm gap-1.5">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="automatizaciones" className="text-xs sm:text-sm gap-1.5">
              <Cog className="h-4 w-4 hidden sm:block" />
              Automatizaciones
            </TabsTrigger>
            <TabsTrigger value="propuesta" className="text-xs sm:text-sm gap-1.5">
              <FileOutput className="h-4 w-4 hidden sm:block" />
              Propuesta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos">
            <DatosSection
              data={formData}
              onChange={setFormData}
              onFillExample={handleFillExample}
              onClear={handleClear}
              derivedTarifaHora={results.tarifaHora}
              derivedFeeSugerido={results.feeSugerido}
              results={results}
            />
          </TabsContent>

          <TabsContent value="resultados">
            <ResultadosSection results={results} data={formData} />
          </TabsContent>

          <TabsContent value="automatizaciones">
            <AutomatizacionesSection
              data={formData}
              onChange={setFormData}
              results={results}
            />
          </TabsContent>

          <TabsContent value="propuesta">
            <PropuestaSection
              data={formData}
              results={results}
              onReset={handleReset}
              onUpdateData={setFormData}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
