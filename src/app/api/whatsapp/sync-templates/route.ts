import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/whatsapp/sync-templates
// Trae todas las plantillas de mensajes del WhatsApp Business Account
// configurado en Meta y las guarda (o actualiza) en whatsapp_templates.
const GRAPH_API_VERSION = 'v21.0';

export async function POST() {
  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from('whatsapp_connection')
    .select('waba_id')
    .eq('id', 1)
    .maybeSingle();

  const token = process.env.META_WHATSAPP_TOKEN;
  const wabaId = connection?.waba_id || process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !wabaId) {
    return NextResponse.json(
      {
        error:
          'Faltan las credenciales de Meta (META_WHATSAPP_TOKEN o META_WHATSAPP_BUSINESS_ACCOUNT_ID) en las variables de entorno.',
      },
      { status: 400 }
    );
  }

  let url: string | null =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/message_templates?fields=name,language,category,status,components&limit=100`;

  let synced = 0;
  const errors: string[] = [];

  try {
    while (url) {
      const res: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json: any = await res.json();

      if (!res.ok) {
        throw new Error(json?.error?.message ?? 'Error desconocido al consultar la API de Meta.');
      }

      for (const t of json.data ?? []) {
        const bodyComponent = (t.components ?? []).find((c: any) => c.type === 'BODY');
        const bodyPreview: string | null = bodyComponent?.text ?? null;
        const variables = bodyComponent?.example?.body_text ?? null;

        const { error: upsertError } = await supabase.from('whatsapp_templates').upsert(
          {
            meta_template_id: t.id,
            meta_template_name: t.name,
            language: t.language,
            category: t.category ?? null,
            status: t.status ?? null,
            body_preview: bodyPreview,
            variables: variables ? { body_text: variables } : null,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'meta_template_id' }
        );

        if (upsertError) {
          errors.push(`${t.name}: ${upsertError.message}`);
        } else {
          synced++;
        }
      }

      url = json.paging?.next ?? null;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  return NextResponse.json({ synced, errors });
}
