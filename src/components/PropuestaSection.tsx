import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormData, Results } from '@/lib/calculations';
import { generatePDF } from '@/lib/pdfGenerator';
import { FileText, Send, RotateCcw, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  const [sendError, setSendError] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const { toast } = useToast();

  const getFileName = () =>
    `Propuesta_Soluxion_${(data.empresa || 'Empresa').replace(/\s+/g, '_')}_${data.fechaElaboracion || 'sin_fecha'}.pdf`;

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
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('[PDF] Error triggering download:', err);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async () => {
    const error = validate();
    if (error) {
      toast({ title: 'Validación', description: error, variant: 'destructive' });
      return;
    }
    setGenerating(true);
    setSendError(false);
    try {
      console.log('[PDF] Generating PDF…');
      const blob = await generatePDF(data, results);
      if (!blob || blob.size === 0) {
        throw new Error('El PDF generado está vacío.');
      }
      console.log('[PDF] PDF generated successfully. Size:', blob.size, 'bytes');
      setPdfBlob(blob);
      setGenerated(true);
      triggerDownload(blob);
      toast({ title: 'PDF generado y descargado correctamente' });
    } catch (e: any) {
      console.error('[PDF] Generation error:', e);
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo generar el PDF.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    // Pre-flight validation
    if (!pdfBlob || pdfBlob.size === 0) {
      toast({
        title: 'PDF necesario',
        description: 'Genera el PDF antes de enviarlo.',
        variant: 'destructive',
      });
      return;
    }

    if (!data.emailCliente.trim() || !data.emailCliente.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Introduce un email válido antes de enviar.',
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
    setSendError(false);

    try {
      console.log('[EMAIL] Converting PDF to base64…');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const pdfBase64 = btoa(binary);
      console.log('[EMAIL] Base64 length:', pdfBase64.length);

      const fileName = getFileName();

      console.log('[EMAIL] Sending email to:', data.emailCliente);
      const { data: responseData, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: data.emailCliente,
          subject: data.asuntoEmail || `Propuesta de Automatización - ${data.empresa}`,
          body: data.mensajeEmail || '',
          pdfBase64,
          fileName,
        },
      });

      if (error) {
        console.error('[EMAIL] Supabase function error:', error);
        throw new Error(
          typeof error === 'object' && error.message
            ? error.message
            : 'Error al invocar la función de envío.'
        );
      }

      // Check response for errors
      if (responseData && responseData.error) {
        console.error('[EMAIL] API returned error:', responseData.error);
        throw new Error(responseData.error);
      }

      console.log('[EMAIL] Email sent successfully:', responseData);
      setSent(true);
      setSuccessDialogOpen(true);
      toast({
        title: '¡Email enviado!',
        description: `Propuesta enviada a ${data.emailCliente}`,
      });
    } catch (e: any) {
      console.error('[EMAIL] Send failed:', e);
      setSendError(true);
      toast({
        title: 'Error al enviar',
        description:
          e?.message ||
          'No se pudo enviar el email. Verifique la conexión o configuración del servidor.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (sent && !sendError) {
    return (
      <>
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-bold">¡Propuesta enviada!</h2>
            <p className="text-sm text-muted-foreground">
              Se ha enviado la propuesta a {data.emailCliente} con copia a
              soluxion.ai@gmail.com
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {pdfBlob && (
                <Button variant="outline" onClick={() => triggerDownload(pdfBlob)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              )}
              <Button onClick={onReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Nuevo cálculo
              </Button>
            </div>
          </CardContent>
        </Card>
        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Propuesta enviada correctamente</DialogTitle>
              <DialogDescription>
                La propuesta ha sido enviada a: <strong>{data.emailCliente}</strong>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </>
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
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF de nuevo
              </Button>
            </div>
          )}

          {/* Fallback when send fails */}
          {sendError && pdfBlob && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="text-sm font-medium text-destructive">
                No se pudo enviar el email. Puedes descargar el PDF manualmente:
              </p>
              <Button variant="outline" size="sm" onClick={() => triggerDownload(pdfBlob)}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF manualmente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropuestaSection;
