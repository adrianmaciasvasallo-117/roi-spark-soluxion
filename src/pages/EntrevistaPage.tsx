import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Save, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

type Sector = 'automatismos' | 'clinicas' | 'notarias';

interface Answers {
  sector: Sector | '';
  nombre: string;
  responsable: string;
  telefono: string;
  localidad: string;
  llamadas: number;
  tamano: string;
  ocupado: number;
  finde: string;
  // sector-specific
  sectorQ1: string;
  sectorQ2: string;
  // economic
  contratar: string;
  presupuesto: string;
  cuandoEmpezar: string;
  notas: string;
}

const DEFAULT_ANSWERS: Answers = {
  sector: '',
  nombre: '',
  responsable: '',
  telefono: '',
  localidad: '',
  llamadas: 0,
  tamano: '',
  ocupado: 0,
  finde: '',
  sectorQ1: '',
  sectorQ2: '',
  contratar: '',
  presupuesto: '',
  cuandoEmpezar: '',
  notas: '',
};

function calcularPuntuacion(a: Answers): 'cualificado' | 'potencial' | 'no_momento' {
  let score = 0;
  if (a.llamadas >= 7) score += 3;
  else if (a.llamadas >= 4) score += 1;
  if (a.ocupado >= 4) score += 3;
  else if (a.ocupado >= 2) score += 1;
  if (a.finde === 'siempre') score += 2;
  else if (a.finde === 'aveces') score += 1;
  if (a.presupuesto === 'mas_800') score += 4;
  else if (a.presupuesto === '500_800') score += 3;
  else if (a.presupuesto === '300_500') score += 2;
  else if (a.presupuesto === '100_300') score += 1;
  if (a.contratar === 'caro') score += 2;
  else if (a.contratar === 'pensado') score += 1;
  if (a.cuandoEmpezar === 'semana') score += 2;
  else if (a.cuandoEmpezar === '2semanas') score += 1;
  if (score >= 9) return 'cualificado';
  if (score >= 5) return 'potencial';
  return 'no_momento';
}

const TOTAL_STEPS = 4; // 0=sector, 1=datos, 2=dolor, 3=economia

const ScaleButtons = ({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`w-12 h-12 rounded-lg border-2 font-bold text-sm transition-colors ${
          value === n
            ? 'bg-accent text-accent-foreground border-accent'
            : 'bg-muted text-muted-foreground border-border hover:border-accent/50'
        }`}
      >
        {n}
      </button>
    ))}
  </div>
);

const OptionButtons = ({ options, value, onChange, stacked = false }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  stacked?: boolean;
}) => (
  <div className={stacked ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`min-h-[48px] px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
          value === o.value
            ? 'bg-accent text-accent-foreground border-accent'
            : 'bg-muted text-muted-foreground border-border hover:border-accent/50'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const EntrevistaPage = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ ...DEFAULT_ANSWERS });
  const [showResult, setShowResult] = useState(false);

  const set = useCallback(<K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const progress = ((step + 1) / (TOTAL_STEPS + 1)) * 100;

  const canNext = () => {
    if (step === 0) return !!answers.sector;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else setShowResult(true);
  };

  const resultado = calcularPuntuacion(answers);

  const handleSave = () => {
    try {
      const entries = JSON.parse(localStorage.getItem('soluxion_interviews') || '[]');
      entries.unshift({
        id: Date.now().toString(),
        type: 'entrevista',
        nombre: answers.nombre || 'Sin nombre',
        sector: answers.sector,
        fecha: new Date().toISOString().split('T')[0],
        resultado,
        data: answers,
      });
      localStorage.setItem('soluxion_interviews', JSON.stringify(entries.slice(0, 50)));
    } catch { /* ignore */ }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const sectorName = answers.sector === 'automatismos' ? 'Automatismos y Puertas' : answers.sector === 'clinicas' ? 'Clínicas Dentales y Estéticas' : 'Notarías';
    const resultLabel = resultado === 'cualificado' ? 'CLIENTE CUALIFICADO' : resultado === 'potencial' ? 'POTENCIAL' : 'NO ES EL MOMENTO';

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Soluxion — Entrevista Comercial', 15, 22);

    let y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Negocio: ${answers.nombre}`, 15, y); y += 8;
    doc.text(`Responsable: ${answers.responsable}`, 15, y); y += 8;
    doc.text(`Teléfono: ${answers.telefono}`, 15, y); y += 8;
    doc.text(`Localidad: ${answers.localidad}`, 15, y); y += 8;
    doc.text(`Sector: ${sectorName}`, 15, y); y += 12;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Resultado: ${resultLabel}`, 15, y); y += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Llamadas/día: ${answers.llamadas}/10`, 15, y); y += 6;
    doc.text(`Tamaño: ${answers.tamano}`, 15, y); y += 6;
    doc.text(`Ocupado: ${answers.ocupado}/5`, 15, y); y += 6;
    doc.text(`Fines de semana: ${answers.finde}`, 15, y); y += 6;
    doc.text(`Contratar: ${answers.contratar}`, 15, y); y += 6;
    doc.text(`Presupuesto: ${answers.presupuesto}`, 15, y); y += 10;

    if (answers.notas) {
      doc.text('Notas:', 15, y); y += 6;
      const lines = doc.splitTextToSize(answers.notas, 180);
      doc.text(lines, 15, y);
    }

    doc.save(`Entrevista_${(answers.nombre || 'cliente').replace(/\s+/g, '_')}.pdf`);
  };

  // Sector-specific questions
  const renderSectorQuestions = () => {
    if (answers.sector === 'automatismos') {
      return (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Tu empresa está especializada en puertas automáticas, garajes y locales?</Label>
            <OptionButtons
              options={[
                { label: 'Sí exclusivamente', value: 'exclusivo' },
                { label: 'Sí pero también otros', value: 'tambien_otros' },
                { label: 'No, más líneas', value: 'no' },
              ]}
              value={answers.sectorQ1}
              onChange={(v) => set('sectorQ1', v)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Gestionas comunidades de vecinos?</Label>
            <OptionButtons
              options={[
                { label: 'Sí, varias', value: 'varias' },
                { label: 'Sí, alguna', value: 'alguna' },
                { label: 'No', value: 'no' },
              ]}
              value={answers.sectorQ2}
              onChange={(v) => set('sectorQ2', v)}
            />
          </div>
        </>
      );
    }
    if (answers.sector === 'clinicas') {
      return (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Qué tipo de clínica es?</Label>
            <OptionButtons
              options={[
                { label: 'Dental general', value: 'dental' },
                { label: 'Dental + ortodoncia/implantes', value: 'dental_orto' },
                { label: 'Estética', value: 'estetica' },
                { label: 'Dental + estética', value: 'dental_estetica' },
              ]}
              value={answers.sectorQ1}
              onChange={(v) => set('sectorQ1', v)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Cuántos sillones o boxes tenéis?</Label>
            <OptionButtons
              options={[
                { label: '1–2', value: '1_2' },
                { label: '3–4', value: '3_4' },
                { label: '5 o más', value: '5_mas' },
              ]}
              value={answers.sectorQ2}
              onChange={(v) => set('sectorQ2', v)}
            />
          </div>
        </>
      );
    }
    // notarias
    return (
      <>
        <div className="space-y-2">
          <Label className="text-sm font-medium">¿Cuántos administrativos gestionan el teléfono?</Label>
          <OptionButtons
            options={[
              { label: 'Solo uno', value: '1' },
              { label: '2–3', value: '2_3' },
              { label: 'Más de 3', value: 'mas_3' },
            ]}
            value={answers.sectorQ1}
            onChange={(v) => set('sectorQ1', v)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">¿Qué porcentaje de llamadas son consultas repetitivas?</Label>
          <OptionButtons
            options={[
              { label: 'Menos del 30%', value: 'menos_30' },
              { label: '30–60%', value: '30_60' },
              { label: 'Más del 60%', value: 'mas_60' },
            ]}
            value={answers.sectorQ2}
            onChange={(v) => set('sectorQ2', v)}
          />
        </div>
      </>
    );
  };

  // Result screen
  if (showResult) {
    const config = {
      cualificado: { icon: '✅', title: 'CLIENTE CUALIFICADO', desc: 'Alto volumen de llamadas, problema reconocido y presupuesto alineado. Proponer piloto de 7 días esta semana.', cls: 'bg-green-50 border-green-500' },
      potencial: { icon: '⏳', title: 'POTENCIAL', desc: 'Hay dolor pero falta urgencia o presupuesto. Seguimiento en 2 semanas.', cls: 'bg-amber-50 border-amber-500' },
      no_momento: { icon: '❌', title: 'NO ES EL MOMENTO', desc: 'Perfil no alineado ahora. Mantener en lista fría.', cls: 'bg-red-50 border-red-500' },
    }[resultado];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Entrevista Comercial" showBack />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full space-y-4">
          <Card className={`border-2 ${config.cls}`}>
            <CardContent className="text-center py-8 space-y-3">
              <div className="text-5xl">{config.icon}</div>
              <h2 className="text-xl font-bold">{config.title}</h2>
              <p className="text-sm text-muted-foreground">{config.desc}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Resumen de respuestas clave</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Negocio</span><span className="font-medium">{answers.nombre}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Llamadas/día</span><span className="font-medium">{answers.llamadas}/10</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ocupado</span><span className="font-medium">{answers.ocupado}/5</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fines de semana</span><span className="font-medium">{answers.finde}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Presupuesto</span><span className="font-medium">{answers.presupuesto}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">¿Cuándo empezar?</span><span className="font-medium">{answers.cuandoEmpezar}</span></div>
            </CardContent>
          </Card>

          <div className="space-y-1">
            <Label className="text-xs">Notas de la visita</Label>
            <Textarea value={answers.notas} onChange={(e) => set('notas', e.target.value)} rows={3} />
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => setShowResult(false)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Editar respuestas
            </Button>
            <Button onClick={() => { handleSave(); }}>
              <Save className="h-4 w-4 mr-1" /> Guardar
            </Button>
            <Button variant="secondary" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-1" /> Exportar PDF
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Entrevista Comercial" showBack />
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-center">¿En qué sector opera el cliente?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { id: 'automatismos' as Sector, emoji: '🔧', name: 'Automatismos y Puertas', desc: 'Empresas de puertas automáticas, garajes y cerramientos' },
                { id: 'clinicas' as Sector, emoji: '🦷', name: 'Clínicas Dentales y Estéticas', desc: 'Clínicas dentales, estéticas y centros de salud' },
                { id: 'notarias' as Sector, emoji: '⚖️', name: 'Notarías', desc: 'Notarías y despachos notariales' },
              ]).map((s) => (
                <button
                  key={s.id}
                  onClick={() => set('sector', s.id)}
                  className={`p-6 rounded-lg border-2 text-center transition-all ${
                    answers.sector === s.id
                      ? 'bg-accent/10 border-accent'
                      : 'bg-card border-border hover:border-accent/50'
                  }`}
                >
                  <div className="text-4xl mb-2">{s.emoji}</div>
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Datos básicos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nombre del negocio</Label>
                <Input value={answers.nombre} onChange={(e) => set('nombre', e.target.value)} className="h-12" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nombre del responsable</Label>
                <Input value={answers.responsable} onChange={(e) => set('responsable', e.target.value)} className="h-12" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input type="tel" value={answers.telefono} onChange={(e) => set('telefono', e.target.value)} className="h-12" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Localidad</Label>
                <Input value={answers.localidad} onChange={(e) => set('localidad', e.target.value)} className="h-12" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Escala de dolor</h2>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Del 1 al 10, ¿cuántas llamadas recibes al día?</Label>
              <p className="text-xs text-muted-foreground">1 = casi nunca · 10 = el móvil pegado a la oreja</p>
              <ScaleButtons value={answers.llamadas} max={10} onChange={(n) => set('llamadas', n)} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Cómo de grande es tu empresa?</Label>
              <OptionButtons
                options={[
                  { label: 'Autónomo solo', value: 'autonomo' },
                  { label: '2–5 personas', value: '2_5' },
                  { label: '6–15 personas', value: '6_15' },
                  { label: 'Más de 15', value: 'mas_15' },
                ]}
                value={answers.tamano}
                onChange={(v) => set('tamano', v)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Con qué probabilidad te pillan ocupado?</Label>
              <p className="text-xs text-muted-foreground">1 = casi nunca · 5 = siempre</p>
              <ScaleButtons value={answers.ocupado} max={5} onChange={(n) => set('ocupado', n)} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Recibes llamadas los fines de semana que tienes que atender?</Label>
              <OptionButtons
                options={[
                  { label: 'Sí siempre', value: 'siempre' },
                  { label: 'A veces', value: 'aveces' },
                  { label: 'Raramente', value: 'raramente' },
                  { label: 'No', value: 'no' },
                ]}
                value={answers.finde}
                onChange={(v) => set('finde', v)}
              />
            </div>

            {answers.sector && renderSectorQuestions()}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Cualificación económica</h2>

            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Has valorado contratar a alguien para gestionar las llamadas?</Label>
              <OptionButtons
                stacked
                options={[
                  { label: 'Sí y es muy caro', value: 'caro' },
                  { label: 'Lo he pensado pero no he actuado', value: 'pensado' },
                  { label: 'No me lo había planteado', value: 'no' },
                ]}
                value={answers.contratar}
                onChange={(v) => set('contratar', v)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium"><Label className="text-sm font-medium">Si esta solución de inteligencia artificial os soluciona el problema, ¿cuánto estarías dispuesto a pagar al mes?</Label></Label>
              <OptionButtons
                stacked
                options={[
                  { label: 'Menos de 100€/mes', value: 'menos_100' },
                  { label: '100€–300€/mes', value: '100_300' },
                  { label: '300€–500€/mes', value: '300_500' },
                  { label: '500€–800€/mes', value: '500_800' },
                  { label: 'Más de 800€/mes si los números cuadran', value: 'mas_800' },
                ]}
                value={answers.presupuesto}
                onChange={(v) => set('presupuesto', v)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Si el presupuesto te cuadra, ¿cuándo te gustaría empezar?</Label>
              <OptionButtons
                stacked
                options={[
                  { label: 'Esta misma semana', value: 'semana' },
                  { label: 'En las próximas 2 semanas', value: '2semanas' },
                  { label: 'El mes que viene', value: 'mes_que_viene' },
                  { label: 'Aún no lo tengo claro', value: 'no_claro' },
                ]}
                value={answers.cuandoEmpezar}
                onChange={(v) => set('cuandoEmpezar', v)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <div className="bg-card border-t px-4 py-3 flex items-center justify-between max-w-2xl mx-auto w-full">
        {step > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
        ) : <div />}
        <span className="text-xs text-muted-foreground">{step + 1} / {TOTAL_STEPS}</span>
        <Button size="sm" onClick={handleNext} disabled={!canNext()}>
          {step === TOTAL_STEPS - 1 ? 'Ver resultado' : 'Siguiente'}
          {step < TOTAL_STEPS - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
};

export default EntrevistaPage;
