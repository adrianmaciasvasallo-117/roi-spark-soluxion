import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Save, FileText, Plus, X } from 'lucide-react';
import jsPDF from 'jspdf';

type Sector = 'automatismos' | 'clinicas' | 'notarias';

interface Contact {
  nombre: string;
  telefono: string;
  rol: string;
}

interface FAQ {
  pregunta: string;
  respuesta: string;
}

interface FormState {
  sector: Sector | '';
  // Step 1
  nombreAgente: string;
  tono: string;
  idioma: string;
  otroIdioma: string;
  // Step 2
  servicios: string[];
  otroServicio: string;
  // Step 3
  aperturaLV: string;
  cierreLV: string;
  sabados: boolean;
  aperturaSab: string;
  cierreSab: string;
  domingos: boolean;
  fueraHorario: string;
  // Step 4
  urgencias: string;
  criterioUrgencia: string;
  telefonoUrgencias: string;
  nombreUrgencias: string;
  telUrgenciasContacto: string;
  // Step 5
  faqs: FAQ[];
  // Step 6
  contactos: Contact[];
  temaProhibido: string;
  precios: string;
  preciosDetalle: string;
}

const SERVICIOS: Record<string, string[]> = {
  automatismos: ['Instalación puertas automáticas', 'Mantenimiento', 'Reparación urgente', 'Puertas de garaje', 'Puertas industriales', 'Cancelas', 'Persianas motorizadas', 'Comunidades de vecinos'],
  clinicas: ['Odontología general', 'Ortodoncia', 'Implantes', 'Estética dental', 'Medicina estética', 'Blanqueamiento'],
  notarias: ['Compraventas', 'Herencias y testamentos', 'Poderes notariales', 'Actas', 'Constitución de sociedades'],
};

const DEFAULT_FAQS: Record<string, FAQ[]> = {
  automatismos: [
    { pregunta: '¿Hacéis reparaciones urgentes?', respuesta: '' },
    { pregunta: '¿En qué zonas trabajáis?', respuesta: '' },
    { pregunta: '¿Cuánto cuesta una revisión?', respuesta: '' },
  ],
  clinicas: [
    { pregunta: '¿Aceptáis seguros?', respuesta: '' },
    { pregunta: '¿Cuánto cuesta una limpieza?', respuesta: '' },
    { pregunta: '¿Tenéis ortodoncia invisible?', respuesta: '' },
  ],
  notarias: [
    { pregunta: '¿Cuánto cuesta hacer un testamento?', respuesta: '' },
    { pregunta: '¿Necesito cita previa?', respuesta: '' },
    { pregunta: '¿Qué documentos necesito para una compraventa?', respuesta: '' },
  ],
};

const TOTAL_STEPS = 7; // 0=sector, 1-6=blocks, final handled via showSummary

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
          value === o.value ? 'bg-accent text-accent-foreground border-accent' : 'bg-muted text-muted-foreground border-border hover:border-accent/50'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const PuestaEnMarchaPage = () => {
  const [step, setStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [form, setForm] = useState<FormState>({
    sector: '',
    nombreAgente: '',
    tono: '',
    idioma: '',
    otroIdioma: '',
    servicios: [],
    otroServicio: '',
    aperturaLV: '09:00',
    cierreLV: '18:00',
    sabados: false,
    aperturaSab: '09:00',
    cierreSab: '14:00',
    domingos: false,
    fueraHorario: '',
    urgencias: '',
    criterioUrgencia: '',
    telefonoUrgencias: '',
    nombreUrgencias: '',
    telUrgenciasContacto: '',
    faqs: [],
    contactos: [{ nombre: '', telefono: '', rol: '' }],
    temaProhibido: '',
    precios: '',
    preciosDetalle: '',
  });

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // When sector changes, populate faqs
  const selectSector = (s: Sector) => {
    setForm((prev) => ({
      ...prev,
      sector: s,
      servicios: [],
      faqs: DEFAULT_FAQS[s] || [],
    }));
  };

  const toggleServicio = (s: string) => {
    setForm((prev) => ({
      ...prev,
      servicios: prev.servicios.includes(s) ? prev.servicios.filter((x) => x !== s) : [...prev.servicios, s],
    }));
  };

  const updateFAQ = (idx: number, field: 'pregunta' | 'respuesta', value: string) => {
    setForm((prev) => {
      const faqs = [...prev.faqs];
      faqs[idx] = { ...faqs[idx], [field]: value };
      return { ...prev, faqs };
    });
  };

  const removeFAQ = (idx: number) => {
    setForm((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== idx) }));
  };

  const addFAQ = () => {
    if (form.faqs.length < 10) {
      setForm((prev) => ({ ...prev, faqs: [...prev.faqs, { pregunta: '', respuesta: '' }] }));
    }
  };

  const updateContact = (idx: number, field: keyof Contact, value: string) => {
    setForm((prev) => {
      const contactos = [...prev.contactos];
      contactos[idx] = { ...contactos[idx], [field]: value };
      return { ...prev, contactos };
    });
  };

  const addContact = () => {
    if (form.contactos.length < 3) {
      setForm((prev) => ({ ...prev, contactos: [...prev.contactos, { nombre: '', telefono: '', rol: '' }] }));
    }
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const canNext = () => {
    if (step === 0) return !!form.sector;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else setShowSummary(true);
  };

  const handleSave = () => {
    try {
      const entries = JSON.parse(localStorage.getItem('soluxion_onboardings') || '[]');
      entries.unshift({
        id: Date.now().toString(),
        type: 'puesta_en_marcha',
        nombre: form.nombreAgente || 'Sin nombre',
        sector: form.sector,
        fecha: new Date().toISOString().split('T')[0],
        resultado: 'completado',
        data: form,
      });
      localStorage.setItem('soluxion_onboardings', JSON.stringify(entries.slice(0, 50)));
    } catch { /* ignore */ }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const sectorName = form.sector === 'automatismos' ? 'Automatismos y Puertas' : form.sector === 'clinicas' ? 'Clínicas Dentales y Estéticas' : 'Notarías';

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Soluxion — Ficha Técnica del Agente', 15, 22);

    let y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Agente: ${form.nombreAgente}`, 15, y); y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sector: ${sectorName}`, 15, y); y += 7;
    doc.text(`Tono: ${form.tono}`, 15, y); y += 7;
    doc.text(`Idioma: ${form.idioma}${form.idioma === 'otro' ? ` (${form.otroIdioma})` : ''}`, 15, y); y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Servicios:', 15, y); y += 6;
    doc.setFont('helvetica', 'normal');
    form.servicios.forEach((s) => { doc.text(`• ${s}`, 20, y); y += 5; });
    if (form.otroServicio) { doc.text(`• ${form.otroServicio}`, 20, y); y += 5; }
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Horario:', 15, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`L–V: ${form.aperturaLV} – ${form.cierreLV}`, 20, y); y += 5;
    if (form.sabados) { doc.text(`Sábados: ${form.aperturaSab} – ${form.cierreSab}`, 20, y); y += 5; }
    doc.text(`Domingos: ${form.domingos ? 'Sí' : 'No'}`, 20, y); y += 5;
    doc.text(`Fuera de horario: ${form.fueraHorario}`, 20, y); y += 8;

    if (form.urgencias !== 'no') {
      doc.setFont('helvetica', 'bold');
      doc.text('Urgencias:', 15, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo: ${form.urgencias}`, 20, y); y += 5;
      if (form.criterioUrgencia) {
        const lines = doc.splitTextToSize(`Criterio: ${form.criterioUrgencia}`, 170);
        doc.text(lines, 20, y); y += lines.length * 5;
      }
      if (form.telefonoUrgencias) { doc.text(`Tel. urgencias: ${form.telefonoUrgencias}`, 20, y); y += 5; }
      y += 3;
    }

    if (y > 240) { doc.addPage(); y = 20; }

    if (form.faqs.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Preguntas frecuentes:', 15, y); y += 6;
      doc.setFont('helvetica', 'normal');
      form.faqs.forEach((faq) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`P: ${faq.pregunta}`, 20, y); y += 5;
        if (faq.respuesta) {
          const lines = doc.splitTextToSize(`R: ${faq.respuesta}`, 165);
          doc.text(lines, 20, y); y += lines.length * 5;
        }
        y += 3;
      });
    }

    doc.save(`FichaTecnica_${(form.nombreAgente || 'agente').replace(/\s+/g, '_')}.pdf`);
  };

  // Summary screen
  if (showSummary) {
    const sectorName = form.sector === 'automatismos' ? 'Automatismos y Puertas' : form.sector === 'clinicas' ? 'Clínicas Dentales y Estéticas' : 'Notarías';

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Puesta en Marcha" showBack />
        <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-4">
          <h2 className="text-lg font-bold">Resumen de configuración</h2>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Identidad del agente</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nombre</span><span className="font-medium">{form.nombreAgente}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sector</span><span className="font-medium">{sectorName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tono</span><span className="font-medium">{form.tono}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Idioma</span><span className="font-medium">{form.idioma}{form.idioma === 'otro' ? ` (${form.otroIdioma})` : ''}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Servicios</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <div className="flex flex-wrap gap-1.5">
                {form.servicios.map((s) => (
                  <span key={s} className="bg-muted px-2 py-0.5 rounded text-xs">{s}</span>
                ))}
                {form.otroServicio && <span className="bg-muted px-2 py-0.5 rounded text-xs">{form.otroServicio}</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Horario</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">L–V</span><span className="font-medium">{form.aperturaLV} – {form.cierreLV}</span></div>
              {form.sabados && <div className="flex justify-between"><span className="text-muted-foreground">Sábados</span><span className="font-medium">{form.aperturaSab} – {form.cierreSab}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Domingos</span><span className="font-medium">{form.domingos ? 'Sí' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fuera de horario</span><span className="font-medium text-right max-w-[60%]">{form.fueraHorario}</span></div>
            </CardContent>
          </Card>

          {form.faqs.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Preguntas frecuentes ({form.faqs.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {form.faqs.map((faq, i) => (
                  <div key={i}>
                    <p className="font-medium">{faq.pregunta}</p>
                    {faq.respuesta && <p className="text-muted-foreground text-xs">{faq.respuesta}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Guardar
            </Button>
            <Button variant="secondary" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-1" /> Exportar ficha técnica PDF
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Puesta en Marcha" showBack />
      <div className="h-1 bg-muted">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {/* Step 0: Sector */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-center">¿En qué sector opera el cliente?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { id: 'automatismos' as Sector, emoji: '🔧', name: 'Automatismos y Puertas' },
                { id: 'clinicas' as Sector, emoji: '🦷', name: 'Clínicas Dentales y Estéticas' },
                { id: 'notarias' as Sector, emoji: '⚖️', name: 'Notarías' },
              ]).map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSector(s.id)}
                  className={`p-6 rounded-lg border-2 text-center transition-all ${
                    form.sector === s.id ? 'bg-accent/10 border-accent' : 'bg-card border-border hover:border-accent/50'
                  }`}
                >
                  <div className="text-4xl mb-2">{s.emoji}</div>
                  <div className="font-bold text-sm">{s.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Identidad */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Identidad del agente</h2>
            <div className="space-y-1">
              <Label className="text-xs">¿Cómo se llamará el agente?</Label>
              <Input value={form.nombreAgente} onChange={(e) => set('nombreAgente', e.target.value)} placeholder="Sofía, Laura, Carlos…" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Qué tono debe tener?</Label>
              <OptionButtons
                options={[
                  { label: 'Formal y profesional', value: 'formal' },
                  { label: 'Cercano y amable', value: 'cercano' },
                  { label: 'Neutro y eficiente', value: 'neutro' },
                ]}
                value={form.tono}
                onChange={(v) => set('tono', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿En qué idioma atenderá?</Label>
              <OptionButtons
                options={[
                  { label: 'Solo español', value: 'espanol' },
                  { label: 'Español + inglés', value: 'espanol_ingles' },
                  { label: 'Español + otro', value: 'otro' },
                ]}
                value={form.idioma}
                onChange={(v) => set('idioma', v)}
              />
              {form.idioma === 'otro' && (
                <div className="space-y-1 mt-2">
                  <Label className="text-xs">¿Qué idioma?</Label>
                  <Input value={form.otroIdioma} onChange={(e) => set('otroIdioma', e.target.value)} className="h-12" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Servicios */}
        {step === 2 && form.sector && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Servicios y especialización</h2>
            <div className="space-y-2">
              {(SERVICIOS[form.sector] || []).map((s) => (
                <label key={s} className="flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50">
                  <Checkbox checked={form.servicios.includes(s)} onCheckedChange={() => toggleServicio(s)} />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
              <div className="space-y-1 mt-2">
                <Label className="text-xs">Otros</Label>
                <Input value={form.otroServicio} onChange={(e) => set('otroServicio', e.target.value)} placeholder="Especificar…" className="h-12" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Horarios */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Horarios</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Apertura L–V</Label>
                <Input type="time" value={form.aperturaLV} onChange={(e) => set('aperturaLV', e.target.value)} className="h-12" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cierre L–V</Label>
                <Input type="time" value={form.cierreLV} onChange={(e) => set('cierreLV', e.target.value)} className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Abren sábados?</Label>
              <OptionButtons options={[{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }]} value={form.sabados ? 'si' : 'no'} onChange={(v) => set('sabados', v === 'si')} />
              {form.sabados && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Apertura sábado</Label>
                    <Input type="time" value={form.aperturaSab} onChange={(e) => set('aperturaSab', e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cierre sábado</Label>
                    <Input type="time" value={form.cierreSab} onChange={(e) => set('cierreSab', e.target.value)} className="h-12" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Abren domingos o festivos?</Label>
              <OptionButtons options={[{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }]} value={form.domingos ? 'si' : 'no'} onChange={(v) => set('domingos', v === 'si')} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fuera de horario, el agente debe…</Label>
              <OptionButtons
                stacked
                options={[
                  { label: 'Informar del horario y pedir que llamen después', value: 'informar' },
                  { label: 'Tomar mensaje y número para devolver llamada', value: 'mensaje' },
                  { label: 'Derivar a número de urgencias si es urgente', value: 'derivar' },
                ]}
                value={form.fueraHorario}
                onChange={(v) => set('fueraHorario', v)}
              />
            </div>
          </div>
        )}

        {/* Step 4: Urgencias */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Urgencias</h2>
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Tienen servicio de urgencias?</Label>
              <OptionButtons
                options={[
                  { label: 'Sí 24h', value: '24h' },
                  { label: 'Sí en horario ampliado', value: 'ampliado' },
                  { label: 'No', value: 'no' },
                ]}
                value={form.urgencias}
                onChange={(v) => set('urgencias', v)}
              />
            </div>
            {form.urgencias !== 'no' && form.urgencias && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">¿Cómo identifica el agente si es urgencia?</Label>
                  <Textarea value={form.criterioUrgencia} onChange={(e) => set('criterioUrgencia', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Número de urgencias al que derivar</Label>
                  <Input type="tel" value={form.telefonoUrgencias} onChange={(e) => set('telefonoUrgencias', e.target.value)} className="h-12" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre contacto urgencias</Label>
                    <Input value={form.nombreUrgencias} onChange={(e) => set('nombreUrgencias', e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Teléfono contacto</Label>
                    <Input type="tel" value={form.telUrgenciasContacto} onChange={(e) => set('telUrgenciasContacto', e.target.value)} className="h-12" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 5: FAQs */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Preguntas frecuentes</h2>
            {form.faqs.map((faq, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                <button
                  type="button"
                  onClick={() => removeFAQ(i)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="space-y-1">
                  <Label className="text-xs">Pregunta</Label>
                  <Input value={faq.pregunta} onChange={(e) => updateFAQ(i, 'pregunta', e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Respuesta</Label>
                  <Textarea value={faq.respuesta} onChange={(e) => updateFAQ(i, 'respuesta', e.target.value)} rows={2} />
                </div>
              </div>
            ))}
            {form.faqs.length < 10 && (
              <Button variant="outline" size="sm" onClick={addFAQ}>
                <Plus className="h-4 w-4 mr-1" /> Añadir pregunta frecuente
              </Button>
            )}
          </div>
        )}

        {/* Step 6: Derivaciones */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Derivaciones</h2>
            {form.contactos.map((c, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input value={c.nombre} onChange={(e) => updateContact(i, 'nombre', e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input type="tel" value={c.telefono} onChange={(e) => updateContact(i, 'telefono', e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rol</Label>
                  <Input value={c.rol} onChange={(e) => updateContact(i, 'rol', e.target.value)} className="h-10" />
                </div>
              </div>
            ))}
            {form.contactos.length < 3 && (
              <Button variant="outline" size="sm" onClick={addContact}>
                <Plus className="h-4 w-4 mr-1" /> Añadir contacto
              </Button>
            )}

            <div className="space-y-1 mt-4">
              <Label className="text-xs">¿Hay algún tema del que el agente NO debe hablar nunca?</Label>
              <Textarea value={form.temaProhibido} onChange={(e) => set('temaProhibido', e.target.value)} rows={2} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Puede el agente mencionar precios?</Label>
              <OptionButtons
                stacked
                options={[
                  { label: 'Sí, con rangos orientativos', value: 'rangos' },
                  { label: 'Solo decir "consultar presupuesto"', value: 'consultar' },
                  { label: 'No mencionar precios nunca', value: 'nunca' },
                ]}
                value={form.precios}
                onChange={(v) => set('precios', v)}
              />
              {form.precios === 'rangos' && (
                <div className="space-y-1 mt-2">
                  <Label className="text-xs">Indica qué precios puede mencionar</Label>
                  <Textarea value={form.preciosDetalle} onChange={(e) => set('preciosDetalle', e.target.value)} rows={2} />
                </div>
              )}
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
          {step === TOTAL_STEPS - 1 ? 'Ver resumen' : 'Siguiente'}
          {step < TOTAL_STEPS - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
};

export default PuestaEnMarchaPage;
