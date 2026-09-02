import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/whatsapp/webhook — verificación del webhook (handshake de Meta).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// POST /api/whatsapp/webhook — recibe eventos de estado (delivered/read) y
// respuestas de los contactos, y actualiza campaign_recipients.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createServiceClient();

  const entries = body?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;

      // Estados de mensajes salientes (sent/delivered/read/failed)
      for (const status of value?.statuses ?? []) {
        const column =
          status.status === 'delivered'
            ? 'delivered_at'
            : status.status === 'read'
            ? 'read_at'
            : null;

        const update: Record<string, unknown> = { status: status.status };
        if (column) update[column] = new Date(Number(status.timestamp) * 1000).toISOString();

        await supabase
          .from('campaign_recipients')
          .update(update)
          .eq('provider_message_id', status.id);
      }

      // Respuestas entrantes de contactos
      for (const message of value?.messages ?? []) {
        await supabase
          .from('campaign_recipients')
          .update({ status: 'replied', replied_at: new Date().toISOString() })
          .eq('provider_message_id', message.context?.id ?? '__none__');
      }
    }
  }

  return NextResponse.json({ received: true });
}
