import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormData, Results } from '@/lib/calculations';
import { generatePDF } from '@/lib/pdfGenerator';
import { FileText, Send, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  data: FormData;
  results: Results;
  onReset: () => void;
}

const PropuestaSection = ({ data, results, onReset }: Props) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const getFileName = () =>
    `Propuesta_Soluxion_${data.empresa.replace(/\s+/g, '_')}_${data.fechaElaboracion}.pdf`;

  const validate = (): string | null => {
    if (!data.empresa.trim()) return 'El campo "Empresa" es obligatorio.';
    if (!data.nombreCliente.trim())
      return 'El campo "Nombre del cliente" es obligatorio.';
    if (!data.emailCliente.trim() || !data.emailCliente.includes('@'))
      return 'Introduce un email válido.';
    if (!data.rgpdChecked)
      return 'Debes aceptar el tratamiento de datos (RGPD).';
    return null;
  };

  const triggerDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleGenerate = async () => {
    const error = validate();
    if (error) {
      toast({ title: 'Validación', description: error, variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const blob = await generatePDF(data, results);
      setPdfBlob(blob);
      setGenerated(true);
      triggerDownload(blob);
      toast({ title: 'PDF generado y descargado correctamente' });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF.',
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!pdfBlob) {
      toast({
        title: 'PDF necesario',
        description: 'Genera el PDF antes de enviarlo.',
        variant: 'destructive',
      });
      return;
    }
    if (!data.rgpdChecked) {
      toast({
        title: 'RGPD',
        description: 'Debes aceptar el tratamiento de datos.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Convert blob to base64
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      const pdfBase64 = btoa(binary);

      const fileName = `Propuesta_Soluxion_${data.empresa.replace(/\s+/g, '_')}_${data.fechaElaboracion}.pdf`;

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: data.emailCliente,
          subject: data.asuntoEmail,
          body: data.mensajeEmail,
          pdfBase64,
          fileName,
        },
      });

      if (error) throw error;

      setSent(true);
      toast({ title: '¡Email enviado!', description: `Propuesta enviada a ${data.emailCliente}` });
    } catch (e: any) {
      toast({
        title: 'Error al enviar',
        description: e?.message || 'No se pudo enviar el email. Verifica la configuración del backend.',
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Card className="text-center py-12">
        <CardContent className="space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-bold">¡Propuesta enviada!</h2>
          <p className="text-sm text-muted-foreground">
            Se ha enviado la propuesta a {data.emailCliente} con copia a
            soluxion.ai@gmail.com
          </p>
          <Button onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Nuevo cálculo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generar y enviar propuesta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generar propuesta (PDF)
            </Button>
            <Button
              onClick={handleSend}
              disabled={!pdfBlob || sending}
              variant="secondary"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar por email
            </Button>
          </div>

          {generated && pdfBlob && (
            <div className="flex gap-3 flex-wrap items-center mt-2">
              <Button variant="outline" size="sm" onClick={() => triggerDownload(pdfBlob)}>
                <FileText className="h-4 w-4 mr-2" />
                Descargar PDF de nuevo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropuestaSection;
