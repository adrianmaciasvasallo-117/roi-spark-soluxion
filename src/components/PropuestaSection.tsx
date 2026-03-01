import { useState, useRef } from 'react';
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

type SendState = 'idle' | 'generating_pdf' | 'pdf_ready' | 'sending_email' | 'sent' | 'error';

/** Chunked base64 encoder — avoids call-stack overflow on large blobs */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip the data-url prefix  "data:...;base64,"
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el PDF.'));
    reader.readAsDataURL(blob);
  });
}

const PropuestaSection = ({ data, results, onReset }: Props) => {
  const [state, setState] = useState<SendState>('idle');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [errorDetail, setErrorDetail] = useState<string>('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const sendingRef = useRef(false); // debounce guard
  const { toast } = useToast();

  const getFileName = () =>
    `Propuesta_Soluxion_${(data.empresa || 'Empresa').replace(/\s+/g, '_')}_${data.fechaElaboracion || 'sin_fecha'}.pdf`;

  const validate = (): string | null => {
    if (!data.empresa?.trim()) return 'El campo "Empresa" es obligatorio.';
    if (!data.nombreCliente?.trim())
      return 'El campo "Nombre del cliente" es obligatorio.';
    if (!data.emailCliente?.trim() || !data.emailCliente.includes('@'))
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
    setState('generating_pdf');
    setErrorDetail('');
    try {
      console.log('[PDF] Generating PDF…');
      const blob = await generatePDF(data, results);
      if (!blob || blob.size === 0) {
        throw new Error('El PDF generado está vacío.');
      }
      console.log('[PDF] PDF generated successfully. Size:', blob.size, 'bytes');
      setPdfBlob(blob);
      setState('pdf_ready');
      triggerDownload(blob);
      toast({ title: 'PDF generado y descargado correctamente' });
    } catch (e: any) {
      console.error('[PDF] Generation error:', e);
      setState('error');
      setErrorDetail(e?.message || 'Error desconocido al generar el PDF.');
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo generar el PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleSend = async () => {
    // Debounce: prevent double-click
    if (sendingRef.current) return;

    // Gate: must have PDF
    if (!pdfBlob || pdfBlob.size === 0) {
      toast({
        title: 'PDF necesario',
        description: 'Primero genera la propuesta (PDF).',
        variant: 'destructive',
      });
      return;
    }

    if (!data.emailCliente?.trim() || !data.emailCliente.includes('@')) {
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

    sendingRef.current = true;
    setState('sending_email');
    setErrorDetail('');

    try {
      console.log('[EMAIL] Converting PDF to base64…');
      const pdfBase64 = await blobToBase64(pdfBlob);
      console.log('[EMAIL] Base64 length:', pdfBase64.length);

      const fileName = getFileName();
      const recipient = data.emailCliente.trim();

      console.log('[EMAIL] Sending email to:', recipient);
      const { data: responseData, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: recipient,
          subject: data.asuntoEmail || `Propuesta de Automatización - ${data.empresa || 'Cliente'}`,
          body: data.mensajeEmail || '',
          pdfBase64,
          fileName,
        },
      });

      if (error) {
        console.error('[EMAIL] Supabase function error:', error);
        throw new Error(
          typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Error al invocar la función de envío.'
        );
      }

      if (responseData && responseData.error) {
        console.error('[EMAIL] API returned error:', responseData.error);
        throw new Error(responseData.error);
      }

      console.log('[EMAIL] Email sent successfully:', responseData);
      setState('sent');
      setSuccessDialogOpen(true);
      toast({
        title: '¡Email enviado!',
        description: `Propuesta enviada a ${recipient}`,
      });
    } catch (e: any) {
      console.error('[EMAIL] Send failed:', e);
      setState('error');
      setErrorDetail(e?.message || 'Error desconocido al enviar el email.');
      toast({
        title: 'No se pudo enviar el email',
        description: 'Revisa el email del cliente y tu conexión.',
        variant: 'destructive',
      });
    } finally {
      sendingRef.current = false;
    }
  };

  // --- Sent view ---
  if (state === 'sent') {
    return (
      <>
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-bold">¡Propuesta enviada!</h2>
            <p className="text-sm text-muted-foreground">
              Se ha enviado la propuesta a {data.emailCliente}
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

  // --- Main view ---
  const isSending = state === 'sending_email';
  const isGenerating = state === 'generating_pdf';
  const canSend = state === 'pdf_ready' && !!pdfBlob && pdfBlob.size > 0;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generar y enviar propuesta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleGenerate} disabled={isGenerating || isSending}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generando…' : 'Generar propuesta (PDF)'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend || isSending}
              variant="secondary"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSending ? 'Enviando…' : 'Enviar por email'}
            </Button>
          </div>

          {(state === 'pdf_ready' || state === 'error') && pdfBlob && (
            <div className="flex gap-3 flex-wrap items-center mt-2">
              <Button variant="outline" size="sm" onClick={() => triggerDownload(pdfBlob)}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF de nuevo
              </Button>
            </div>
          )}

          {/* Error panel with details */}
          {state === 'error' && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="text-sm font-medium text-destructive">
                No se pudo enviar el email. Revisa el email del cliente y tu conexión.
              </p>
              {errorDetail && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Detalles técnicos
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap break-all bg-muted p-2 rounded">
                    {errorDetail}
                  </pre>
                </details>
              )}
              {pdfBlob && (
                <Button variant="outline" size="sm" onClick={() => triggerDownload(pdfBlob)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF manualmente
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState('pdf_ready')}
              >
                Reintentar envío
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropuestaSection;
