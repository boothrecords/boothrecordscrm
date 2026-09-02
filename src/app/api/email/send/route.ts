import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/email/send  { campaignId: string }
// Envía la campaña de email a todos los destinatarios pendientes usando Resend.
const BATCH_SIZE = 100; // Resend admite envíos batch de hasta 100 por llamada.

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();
  if (!campaignId) {
    return NextResponse.json({ error: 'Falta campaignId.' }, { status: 400 });
  }

  // Se instancia aquí (no a nivel de módulo) para que el build no falle
  // cuando la variable de entorno todavía no está configurada.
  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabase = createServiceClient();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, email_templates(subject, html_content)')
    .eq('id', campaignId)
    .single();

  if (!campaign || campaign.channel !== 'email') {
    return NextResponse.json({ error: 'Campaña de email no encontrada.' }, { status: 404 });
  }

  const { data: recipients } = await supabase
    .from('campaign_recipients')
    .select('id, contact_id, contacts(email, email_opt_in, first_name)')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');

  await supabase.from('campaigns').update({ status: 'sending' }).eq('id', campaignId);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < (recipients?.length ?? 0); i += BATCH_SIZE) {
    const batch = ((recipients ?? []) as any[]).slice(i, i + BATCH_SIZE);
    const validBatch = batch.filter((r) => r.contacts?.email && r.contacts?.email_opt_in !== false);

    if (validBatch.length === 0) continue;

    try {
      const { data, error } = await resend.batch.send(
        validBatch.map((r) => ({
          from: process.env.RESEND_FROM_EMAIL!,
          to: r.contacts.email,
          subject: campaign.email_templates?.subject ?? '',
          html: (campaign.email_templates?.html_content ?? '').replace(
            '{{first_name}}',
            r.contacts.first_name ?? ''
          ),
        }))
      );

      if (error) throw new Error(error.message);

      await Promise.all(
        validBatch.map((r, idx) =>
          supabase
            .from('campaign_recipients')
            .update({
              status: 'sent',
              provider_message_id: data?.data?.[idx]?.id ?? null,
              sent_at: new Date().toISOString(),
            })
            .eq('id', r.id)
        )
      );
      sent += validBatch.length;
    } catch (err: any) {
      await Promise.all(
        validBatch.map((r) =>
          supabase
            .from('campaign_recipients')
            .update({ status: 'failed', error_message: err.message })
            .eq('id', r.id)
        )
      );
      failed += validBatch.length;
    }

    // Contactos sin email o sin opt-in
    const skipped = batch.filter((r) => !r.contacts?.email || r.contacts?.email_opt_in === false);
    await Promise.all(
      skipped.map((r) =>
        supabase.from('campaign_recipients').update({ status: 'opted_out' }).eq('id', r.id)
      )
    );
  }

  await supabase
    .from('campaigns')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', campaignId);

  return NextResponse.json({ sent, failed, total: recipients?.length ?? 0 });
}
