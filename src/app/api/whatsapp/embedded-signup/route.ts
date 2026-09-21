import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/whatsapp/embedded-signup
// Recibe el resultado del flujo "Embedded Signup" de Meta (después de que
// el usuario conecta su WhatsApp Business desde el botón en Booth):
// - intercambia el "code" por un token temporal de usuario
// - suscribe la app de Booth a la WABA para poder recibir mensajes/webhooks
// - guarda el phone_number_id / waba_id en la tabla whatsapp_connection
const GRAPH_API_VERSION = 'v21.0';

export async function POST(req: NextRequest) {
  const { code, phoneNumberId, wabaId, businessName } = await req.json();

  if (!phoneNumberId || !wabaId) {
    return NextResponse.json({ error: 'Falta phoneNumberId o wabaId.' }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  let subscribeWarning: string | null = null;

  // Paso 1: si tenemos "code" y las credenciales de la app, lo intercambiamos
  // por un token y suscribimos la app a la WABA (necesario para webhooks).
  if (code && appId && appSecret) {
    try {
      const tokenRes = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`
      );
      const tokenJson = await tokenRes.json();
      const userToken = tokenJson?.access_token;

      if (userToken) {
        const subscribeRes = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`,
          { method: 'POST', headers: { Authorization: `Bearer ${userToken}` } }
        );
        const subscribeJson = await subscribeRes.json();
        if (!subscribeRes.ok) {
          subscribeWarning = subscribeJson?.error?.message ?? 'No se pudo suscribir la app a la WABA.';
        }
      } else {
        subscribeWarning = tokenJson?.error?.message ?? 'No se pudo intercambiar el código por un token.';
      }
    } catch (err: any) {
      subscribeWarning = err.message;
    }
  } else if (!appSecret) {
    subscribeWarning =
      'Falta configurar META_APP_SECRET en Vercel: la conexión se guardó, pero falta suscribir la app a la WABA.';
  }

  const supabase = createServiceClient();
  const { error: dbError } = await supabase.from('whatsapp_connection').upsert({
    id: 1,
    phone_number_id: phoneNumberId,
    waba_id: wabaId,
    business_name: businessName ?? null,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phoneNumberId, wabaId, warning: subscribeWarning });
}
