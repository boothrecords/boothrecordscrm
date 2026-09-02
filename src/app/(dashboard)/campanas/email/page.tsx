import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';

export default async function NewEmailCampaignPage() {
  const supabase = createClient();
  const [{ data: templates }, { data: lists }] = await Promise.all([
    supabase.from('email_templates').select('id, name, subject'),
    supabase.from('lists').select('id, name'),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Nueva campaña de Email</h1>
      <p className="mb-6 text-sm text-booth-textMuted">
        Envío masivo vía Resend. Elige la plantilla y la audiencia.
      </p>

      <form className="space-y-5 rounded-xl border border-booth-border bg-booth-surface p-6">
        <div>
          <label className="mb-1 block text-sm text-booth-textMuted">Nombre de la campaña</label>
          <input
            className="w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent"
            placeholder="Ej. Newsletter Booth - Septiembre"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-booth-textMuted">Plantilla de email</label>
          <select className="w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent">
            <option value="">Selecciona una plantilla...</option>
            {(templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.subject}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-booth-textMuted">Audiencia (lista)</label>
          <select className="w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent">
            <option value="">Selecciona una lista...</option>
            {(lists ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button">
            Guardar borrador
          </Button>
          <Button variant="primary" type="submit">
            Revisar y enviar
          </Button>
        </div>
      </form>
    </div>
  );
}
