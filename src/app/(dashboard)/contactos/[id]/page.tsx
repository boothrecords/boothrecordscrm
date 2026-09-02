import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import type { Contact } from '@/types/database';

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!contact) notFound();

  const c = contact as Contact;
  const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Sin nombre';

  const { data: lists } = await supabase
    .from('list_contacts')
    .select('lists(id, name)')
    .eq('contact_id', c.id);

  const { data: campaigns } = await supabase
    .from('campaign_recipients')
    .select('status, sent_at, campaigns(name, channel)')
    .eq('contact_id', c.id)
    .order('sent_at', { ascending: false });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="rounded-xl border border-booth-border bg-booth-surface p-5">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-booth-accent text-lg font-semibold text-white">
            {fullName.slice(0, 1).toUpperCase()}
          </div>
          <h1 className="text-xl font-semibold">{fullName}</h1>
          <div className="mt-1">
            <Badge variant={c.status}>{c.status}</Badge>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <Field label="Correo" value={c.email} />
            <Field label="Teléfono" value={c.phone} />
            <Field label="Ciudad" value={c.city} />
            <Field label="País" value={c.country} />
            <Field label="Origen" value={c.source} />
            <Field label="Opt-in WhatsApp" value={c.whatsapp_opt_in ? 'Sí' : 'No'} />
            <Field label="Opt-in Email" value={c.email_opt_in ? 'Sí' : 'No'} />
          </dl>
        </div>

        <div className="mt-4 rounded-xl border border-booth-border bg-booth-surface p-5">
          <h2 className="mb-3 text-sm font-medium">Listas</h2>
          {lists && lists.length > 0 ? (
            <ul className="space-y-1 text-sm text-booth-textMuted">
              {lists.map((l: any, i: number) => (
                <li key={i}>{l.lists?.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-booth-textMuted">Este contacto no pertenece a ninguna lista.</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-xl border border-booth-border bg-booth-surface p-5">
          <h2 className="mb-4 text-sm font-medium">Historial de campañas</h2>
          {campaigns && campaigns.length > 0 ? (
            <ul className="divide-y divide-booth-border text-sm">
              {campaigns.map((r: any, i: number) => (
                <li key={i} className="flex items-center justify-between py-3">
                  <span>{r.campaigns?.name}</span>
                  <span className="text-booth-textMuted">
                    {r.campaigns?.channel} · {r.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-booth-textMuted">Sin campañas enviadas a este contacto todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-booth-textMuted">{label}</dt>
      <dd className="text-right">{value || '—'}</dd>
    </div>
  );
}
