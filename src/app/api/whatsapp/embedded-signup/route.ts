import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/whatsapp/embedded-signup
// Recibe el resultado del flujo "Embedded Signup" de Meta (despues de que
// el usuario conecta su WhatsApp Business desde el boton en Booth).
//
// Hay dos casos:
// 1) Numero/WABA nuevo creado con el wizard completo: el frontend recibe
//    phoneNumberId y wabaId directamente por postMessage (evento FINISH).
// 2) Se comparte un numero/WABA que YA EXISTIA en otro negocio (por ejemplo
//    migrar un numero de otra cuenta): Meta no manda ese postMessage, solo
//    nos da el "code" de autorizacion. En ese caso los descubrimos nosotros
//    usando la Graph API: intercambiamos el code por un token, miramos los
//    "granular_scopes" del token (ahi viene el ID de la WABA autorizada) y
//    luego pedimos los numeros de telefono de esa WABA.
const GRAPH_API_VERSION = 'v21.0';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code } = body;
  let { phoneNumberId, wabaId, businessName } = body;

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: 'Falta configurar NEXT_PUBLIC_META_APP_ID o META_APP_SECRET en Vercel.' },
      { status: 500 }
    );
  }

  let userToken: string | null = null;
  let subscribeWarning: string | null = null;

  // El intercambio del "code" exige el mismo redirect_uri que se uso al
  // generarlo. Con el flujo del SDK de JavaScript (FB.login en un popup) ese
  // redirect_uri implicito es la URL del sitio donde corre la pagina, que es
  // la misma que configuramos como "URI de redireccionamiento de OAuth
  // validos" en Meta.
  const redirectUri = `${req.nextUrl.origin}/`;

  // Paso 1: intercambiar el "code" por un token de usuario.
  if (code) {
    try {
      const tokenRes = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
      );
      const tokenJson = await tokenRes.json();
      userToken = tokenJson?.access_token ?? null;
      if (!userToken) {
        subscribeWarning = tokenJson?.error?.message ?? 'No se pudo intercambiar el codigo por un token.';
      }
    } catch (err: any) {
      subscribeWarning = err.message;
    }
  }

  // Paso 2: si no tenemos phoneNumberId/wabaId (caso de un numero que ya
  // existia en otro negocio y solo se compartio), los descubrimos con el
  // token recien obtenido.
  if ((!phoneNumberId || !wabaId) && userToken) {
    try {
      const debugRes = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/debug_token?input_token=${userToken}&access_token=${appId}|${appSecret}`
      );
      const debugJson = await debugRes.json();
      const scopes: any[] = debugJson?.data?.granular_scopes ?? [];
      const waScope = scopes.find((s) => s.scope === 'whatsapp_business_management');
      const discoveredWabaId = waScope?.target_ids?.[0];

      if (discoveredWabaId) {
        wabaId = discoveredWabaId;

        const numbersRes = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${discoveredWabaId}/phone_numbers?access_token=${userToken}`
        );
        const numbersJson = await numbersRes.json();
        const firstNumber = numbersJson?.data?.[0];
        if (firstNumber?.id) {
          phoneNumberId = firstNumber.id;
          businessName = businessName ?? firstNumber.verified_name ?? null;
        } else {
          subscribeWarning =
            numbersJson?.error?.message ?? 'Se autorizo la cuenta de WhatsApp Business, pero no se encontro un numero de telefono en ella.';
        }
      } else {
        subscribeWarning = 'No se pudo determinar automaticamente la cuenta de WhatsApp Business autorizada.';
      }
    } catch (err: any) {
      subscribeWarning = err.message;
    }
  }

  if (!phoneNumberId || !wabaId) {
    return NextResponse.json(
      { error: subscribeWarning ?? 'Falta phoneNumberId o wabaId.' },
      { status: 400 }
    );
  }

  // Paso 3: suscribir la app de Booth a la WABA (necesario para recibir
  // mensajes/webhooks).
  if (userToken) {
    try {
      const subscribeRes = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`,
        { method: 'POST', headers: { Authorization: `Bearer ${userToken}` } }
      );
      const subscribeJson = await subscribeRes.json();
      if (!subscribeRes.ok) {
        subscribeWarning = subscribeJson?.error?.message ?? 'No se pudo suscribir la app a la WABA.';
      } else {
        subscribeWarning = null;
      }
    } catch (err: any) {
      subscribeWarning = err.message;
    }
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
