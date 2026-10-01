import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';

const CAMPAIGN_STATUS_VARIANT: Record<string, string> = {
  draft: 'default',
  scheduled: 'inactivo',
  sending: 'inactivo',
  sent: 'activo',
  failed: 'baja',
};

const RECIPIENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  sent: 'Enviado',
  delivered: 'Entregado',
  read: 'Leido',
  replied: 'Respondio',
  bounced: 'Rebotado',
  failed: 'Fallido',
  opted_out: 'Dado de baja',
};

const RECIPIENT_STATUS_VARIANT: Record<string, string> = {
  pending: 'default',
  sent: 'inactivo',
  delivered: 'activo',
  read: 'activo',
  replied: 'activo',
  bounced: 'baja',
  failed: 'baja',
  opted_out: 'inactivo',
};

function pct(count: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select(
      'id, name, channel, status, created_at, sent_at, whatsapp_templates(meta_template_name), email_templates(name), lists(name)'
    )
    .eq('id', params.id)
    .single();

  if (!campaign) notFound();

  const { data: recipients } = await supabase
    .from('campaign_recipients')
    .select(
      'id, status, error_message, sent_at, delivered_at, read_at, replied_at, contacts(first_name, last_name, phone, email)'
    )
    .eq('campaign_id', params.id);

  const rows = (recipients ?? []) as any[];
  const total = rows.length;

  const countByStatus = (statuses: string[]) => rows.filter((r) => statuses.includes(r.status)).length;

  const enviados = rows.filter(
    (r) => r.sent_at || ['sent', 'delivered', 'read', 'replied', 'failed', 'bounced'].includes(r.status)
  ).length;
  const entregados = rows.filter((r) => r.delivered_at).length;
  const leidos = rows.filter((r) => r.read_at).length;
  const rebotados = countByStatus(['failed', 'bounced']);
  const bajas = countByStatus(['opted_out']);

  const problemRows = rows.filter((r) => ['failed', 'bounced'].includes(r.status));

  const reasonCounts = new Map<string, number>();
  for (const r of problemRows) {
    const reason = r.error_message || 'Sin motivo especificado';
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
  const reasonList = Array.from(reasonCounts.entries()).sort((a, b) => b[1] - a[1]);

  const templateName =
    campaign.channel === 'whatsapp'
      ? (campaign as any).whatsapp_templates?.meta_template_name
      : (campaign as any).email_templates?.name;

  const stats = [
    { label: 'Destinatarios', value: total, sub: null as string | null },
    { label: 'Enviados', value: enviados, sub: pct(enviados, total) },
    { label: 'Entregados', value: entregados, sub: pct(entregados, total) },
    { label: 'Leidos', value: leidos, sub: pct(leidos, total) },
    { label: 'Rebotados', value: rebotados, sub: pct(rebotados, total) },
    { label: 'Bajas', value: bajas, sub: pct(bajas, total) },
  ];

  return (
    <div>
      <Link href="/campanas" className="mb-4 inline-block text-sm text-booth-textMuted hover:text-booth-text">
        {'\u2190'} Volver a campanas
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="mt-1 text-sm text-booth-textMuted">
            Canal: <span className="capitalize">{campaign.channel}</span>
            {templateName ? ` \u00b7 Plantilla: ${templateName}` : ''}
            {(campaign as any).lists?.name ? ` \u00b7 Lista: ${(campaign as any).lists.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status]}>{campaign.status}</Badge>
          <span className="text-sm text-booth-textMuted">
            {campaign.sent_at ? `Enviada el ${new Date(campaign.sent_at).toLocaleString('es-CO')}` : 'Aun no enviada'}
          </span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-booth-border bg-booth-surface p-4">
            <p className="text-sm text-booth-textMuted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            {s.sub && <p className="text-xs text-booth-textMuted">{s.sub}</p>}
          </div>
        ))}
      </div>

      {reasonList.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Motivos de rebote o fallo</h2>
          <div className="overflow-hidden rounded-xl border border-booth-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-booth-surface text-booth-textMuted">
                <tr>
                  <th className="px-4 py-3 font-medium">Razon</th>
                  <th className="px-4 py-3 font-medium">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-booth-border">
                {reasonList.map(([reason, count]) => (
                  <tr key={reason}>
                    <td className="px-4 py-3">{reason}</td>
                    <td className="px-4 py-3">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Contactos con problemas de entrega</h2>
        {problemRows.length === 0 ? (
          <p className="text-sm text-booth-textMuted">No hay rebotes ni fallos registrados en esta campana.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-booth-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-booth-surface text-booth-textMuted">
                <tr>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-booth-border">
                {problemRows.map((r) => {
                  const c = r.contacts;
                  const name = [c?.first_name, c?.last_name].filter(Boolean).join(' ') || '\u2014';
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-booth-textMuted">{c?.phone || c?.email || '\u2014'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={RECIPIENT_STATUS_VARIANT[r.status]}>
                          {RECIPIENT_STATUS_LABEL[r.status] ?? r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-booth-textMuted">{r.error_message || '\u2014'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
