import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';

const STATUS_VARIANT: Record<string, string> = {
  draft: 'default',
  scheduled: 'inactivo',
  sending: 'inactivo',
  sent: 'activo',
  failed: 'baja',
};

export default async function CampaignsPage() {
  const supabase = createClient();
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, channel, status, created_at, sent_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campañas</h1>
        <div className="flex gap-2">
          <Link href="/campanas/whatsapp">
            <button className="rounded-lg bg-booth-border px-4 py-2 text-sm font-medium hover:opacity-90">
              + Campaña WhatsApp
            </button>
          </Link>
          <Link href="/campanas/email">
            <button className="rounded-lg bg-booth-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              + Campaña Email
            </button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-booth-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-booth-surface text-booth-textMuted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Enviada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-booth-border">
            {(campaigns ?? []).map((c: any) => (
              <tr key={c.id} className="hover:bg-booth-surface/60">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 capitalize text-booth-textMuted">{c.channel}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                </td>
                <td className="px-4 py-3 text-booth-textMuted">
                  {c.sent_at ? new Date(c.sent_at).toLocaleString('es-CO') : '—'}
                </td>
              </tr>
            ))}
            {(!campaigns || campaigns.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-booth-textMuted">
                  Todavía no has creado ninguna campaña.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
