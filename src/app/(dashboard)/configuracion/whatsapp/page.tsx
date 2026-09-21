import { createClient } from '@/lib/supabase/server';
import { ConnectWhatsAppButton } from '@/components/whatsapp/ConnectWhatsAppButton';
import type { WhatsappConnection } from '@/types/database';

export default async function WhatsappConnectionPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('whatsapp_connection')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const connection = data as WhatsappConnection | null;
  const isConnected = Boolean(connection?.phone_number_id && connection?.waba_id);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Conectar WhatsApp Business</h1>
      <p className="mb-6 text-sm text-booth-textMuted">
        Vincula tu número de WhatsApp Business existente con Booth. Tu app de WhatsApp sigue
        funcionando normalmente en tu teléfono — esto solo le da a Booth permiso para enviar
        mensajes desde ese mismo número.
      </p>

      <div className="space-y-5 rounded-xl border border-booth-border bg-booth-surface p-6">
        {isConnected ? (
          <div>
            <p className="text-sm font-medium text-emerald-400">
              WhatsApp Business conectado
            </p>
            <dl className="mt-3 space-y-1 text-sm text-booth-textMuted">
              <div className="flex justify-between">
                <dt>Número (Phone Number ID)</dt>
                <dd className="font-mono">{connection?.phone_number_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Cuenta de WhatsApp Business (WABA ID)</dt>
                <dd className="font-mono">{connection?.waba_id}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="text-sm text-booth-textMuted">Todavía no has conectado tu WhatsApp Business.</p>
        )}

        <ConnectWhatsAppButton />
      </div>
    </div>
  );
}
