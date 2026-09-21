import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/whatsapp/send  { campaignId: string }
// Envía la campaña de WhatsApp a todos los destinatarios pendientes usando
// la Meta WhatsApp Business Cloud API (Graph API), en lotes.
const GRAPH_API_VERSION = 'v21.0';
const BATCH_SIZE = 50;

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();
  if (!campaignId) {
    return NextResponse.json({ error: 'Falta campaignId.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, whatsapp_templates(meta_template_name, language)')
    .eq('id', campaignId)
    .single();

  if (!campaign || campaign.channel !== 'whatsapp') {
    return NextResponse.json({ error: 'Campaña de WhatsApp no encontrada.' }, { status: 404 });
  }

  const { data: recipients } = await supabase
    .from('campaign_recipients')
    .select('id, contact_id, contacts(phone, whatsapp_opt_in)')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');

  await supabase.from('campaigns').update({ status: 'sending' }).eq('id', campaignId);

  const { data: connection } = await supabase
    .from('whatsapp_connection')
    .select('phone_number_id')
    .eq('id', 1)
    .maybeSingle();

  const phoneNumberId = connection?.phone_number_id || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.META_WHATSAPP_TOKEN;
  const templateName = campaign.whatsapp_templates?.meta_template_name;
  const language = campaign.whatsapp_templates?.language ?? 'es';

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < (recipients?.length ?? 0); i += BATCH_SIZE) {
    const batch = (recipients ?? []).slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (recipient: any) => {
        const phone = recipient.contacts?.phone;

        if (!phone || recipient.contacts?.whatsapp_opt_in === false) {
          await supabase
            .from('campaign_recipients')
            .update({ status: 'opted_out' })
            .eq('id', recipient.id);
          return;
        }

        try {
          const res = await fetch(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                  name: templateName,
                  language: { code: language },
                },
              }),
            }
          );

          const json = await res.json();

          if (!res.ok) throw new Error(json?.error?.message ?? 'Error desconocido de Meta.');

          await supabase
            .from('campaign_recipients')
            .update({
              status: 'sent',
              provider_message_id: json?.messages?.[0]?.id ?? null,
              sent_at: new Date().toISOString(),
            })
            .eq('id', recipient.id);
          sent++;
        } catch (err: any) {
          await supabase
            .from('campaign_recipients')
            .update({ status: 'failed', error_message: err.message })
            .eq('id', recipient.id);
          failed++;
        }
      })
    );
  }

  await supabase
    .from('campaigns')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', campaignId);

  return NextResponse.json({ sent, failed, total: recipients?.length ?? 0 });
}
