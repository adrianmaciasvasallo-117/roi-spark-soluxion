import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('[send-email] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY no configurada. Contacta con el administrador.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body JSON inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, subject, body, pdfBase64, fileName } = payload;

    if (!to || !subject || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios: to, subject, pdfBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-email] Sending to: ${to}, subject: ${subject}, attachment size: ${pdfBase64.length} chars`);

    const emailPayload: any = {
      from: FROM_EMAIL,
      to: [to],
      bcc: ['soluxion.ai@gmail.com'],
      subject,
      text: body || '',
      attachments: [
        {
          filename: fileName || 'Propuesta_Soluxion.pdf',
          content: pdfBase64,
          type: 'application/pdf',
        },
      ],
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[send-email] Resend API error:', JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: `Error de Resend [${response.status}]: ${result?.message || JSON.stringify(result)}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-email] Email sent successfully. ID:', result.id);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-email] Unhandled error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
