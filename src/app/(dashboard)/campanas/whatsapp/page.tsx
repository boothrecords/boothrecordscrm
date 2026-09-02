import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';

export default async function NewWhatsappCampaignPage() {
  const supabase = createClient();
  const [{ data: templates }, { data: lists }] = await Promise.all([
    supabase.from('whatsapp_templates').select('id, meta_template_name, language, status').eq('status', 'APPROVED'),
    supabase.from('lists').select('id, name'),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Nueva campaña de WhatsApp</h1>
      <p className="mb-6 text-sm text-booth-textMuted">
        Usa una plantilla ya aprobada en Meta Business Manager y elige la audiencia.
      </p>

      <form className="space-y-5 rounded-xl border border-booth-border bg-booth-surface p-6">
        <div>
          <label className="mb-1 block text-sm text-booth-textMuted">Nombre de la campaña</label>
          <input
            className="w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent"
            placeholder="Ej. Lanzamiento tickets Booth Nights - Septiembre"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-booth-textMuted">Plantilla de Meta</label>
          <select className="w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent">
            <option value="">Selecciona una plantilla aprobada...</option>
            {(templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.meta_template_name} ({t.language})
              </option>
            ))}
          </select>
          {(!templates || templates.length === 0) && (
            <p className="mt-1 text-xs text-booth-textMuted">
              Aún no hay plantillas sincronizadas desde Meta. Ve a "Plantillas de Meta" para sincronizarlas.
            </p>
          )}
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
