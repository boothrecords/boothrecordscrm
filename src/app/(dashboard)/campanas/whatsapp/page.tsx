'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

type TemplateOption = { id: string; meta_template_name: string; language: string };
type ListOption = { id: string; name: string };

export default function NewWhatsappCampaignPage() {
  const supabase = createClient();
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [lists, setLists] = useState<ListOption[]>([]);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [listId, setListId] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: l }] = await Promise.all([
        supabase
          .from('whatsapp_templates')
          .select('id, meta_template_name, language, status')
          .eq('status', 'APPROVED'),
        supabase.from('lists').select('id, name').order('name'),
      ]);
      setTemplates((t as TemplateOption[]) ?? []);
      setLists((l as ListOption[]) ?? []);
    })();
  }, [supabase]);

  async function goToConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !templateId || !listId) {
      setError('Completa el nombre, la plantilla y la lista antes de continuar.');
      return;
    }
    const { count } = await supabase
      .from('list_contacts')
      .select('contact_id', { count: 'exact', head: true })
      .eq('list_id', listId);
    setRecipientCount(count ?? 0);
    setStep('confirm');
  }

  async function createCampaign(sendNow: boolean) {
    setSaving(true);
    setError(null);

    const { data: campaign, error: insertError } = await supabase
      .from('campaigns')
      .insert({
        name: name.trim(),
        channel: 'whatsapp',
        status: 'draft',
        list_id: listId,
        whatsapp_template_id: templateId,
      })
      .select()
      .single();

    if (insertError || !campaign) {
      setError(insertError?.message ?? 'No se pudo crear la campaña.');
      setSaving(false);
      return;
    }

    const { data: listContacts } = await supabase
      .from('list_contacts')
      .select('contact_id')
      .eq('list_id', listId);

    const contactIds = (listContacts ?? []).map((r) => r.contact_id as string);

    if (contactIds.length > 0) {
      await supabase
        .from('campaign_recipients')
        .insert(contactIds.map((contact_id) => ({ campaign_id: campaign.id, contact_id, status: 'pending' })));
    }

    if (sendNow) {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(
          `La campaña se guardó como borrador, pero el envío falló: ${json.error ?? 'error desconocido.'}`
        );
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.push('/campanas');
    router.refresh();
  }

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedList = lists.find((l) => l.id === listId);

  return (
    <div className="max-w-2xl">
      <div className="mb-2">
        <Link href="/campanas" className="text-sm text-booth-textMuted hover:text-white">
          ← Volver a Campañas
        </Link>
      </div>
      <h1 className="mb-1 text-2xl font-semibold">Nueva campaña de WhatsApp</h1>
      <p className="mb-6 text-sm text-booth-textMuted">
        Usa una plantilla ya aprobada en Meta Business Manager y elige la audiencia.
      </p>

      {step === 'form' && (
        <form onSubmit={goToConfirm} className="space-y-5 rounded-xl border border-booth-border bg-booth-surface p-6">
          <div>
            <label className={labelClass}>Nombre de la campaña</label>
            <input
              className={inputClass}
              placeholder="Ej. Lanzamiento tickets Booth Nights - Septiembre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Plantilla de WhatsApp</label>
            <select className={inputClass} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">Selecciona una plantilla aprobada...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.meta_template_name} ({t.language})
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="mt-1 text-xs text-booth-textMuted">
                Aún no hay plantillas sincronizadas desde Meta. Ve a{' '}
                <Link href="/plantillas/whatsapp" className="underline">
                  Plantillas de WhatsApp
                </Link>{' '}
                para sincronizarlas.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Audiencia (lista)</label>
            <select className={inputClass} value={listId} onChange={(e) => setListId(e.target.value)}>
              <option value="">Selecciona una lista...</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="primary" type="submit">
              Revisar y enviar
            </Button>
          </div>
        </form>
      )}

      {step === 'confirm' && (
        <div className="space-y-5 rounded-xl border border-booth-border bg-booth-surface p-6">
          <p className="text-sm text-booth-textMuted">
            Revisa los datos antes de enviar. Este mensaje llegará por WhatsApp a todos los contactos de la
            lista seleccionada.
          </p>
          <dl className="space-y-2 rounded-lg border border-booth-border bg-booth-bg p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-booth-textMuted">Campaña</dt>
              <dd className="font-medium">{name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-booth-textMuted">Plantilla</dt>
              <dd className="font-medium">
                {selectedTemplate?.meta_template_name} ({selectedTemplate?.language})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-booth-textMuted">Lista</dt>
              <dd className="font-medium">{selectedList?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-booth-textMuted">Destinatarios</dt>
              <dd className="font-medium">{recipientCount ?? '—'} contactos</dd>
            </div>
          </dl>

          {recipientCount === 0 && (
            <p className="text-sm text-yellow-400">
              Esta lista no tiene contactos todavía. Puedes guardar la campaña como borrador y enviarla después.
            </p>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" disabled={saving} onClick={() => setStep('form')}>
              Volver
            </Button>
            <Button variant="secondary" type="button" disabled={saving} onClick={() => createCampaign(false)}>
              Guardar borrador
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={saving || recipientCount === 0}
              onClick={() => createCampaign(true)}
            >
              {saving ? 'Enviando...' : 'Confirmar y enviar ahora'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
