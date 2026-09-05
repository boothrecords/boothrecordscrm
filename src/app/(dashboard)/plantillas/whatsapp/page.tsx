import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { SyncTemplatesButton } from '@/components/templates/SyncTemplatesButton';

const STATUS_VARIANT: Record<string, string> = {
  APPROVED: 'activo',
  PENDING: 'inactivo',
  REJECTED: 'baja',
};

export default async function WhatsappTemplatesPage() {
  const supabase = createClient();
  const { data: templates } = await supabase
    .from('whatsapp_templates')
    .select('id, meta_template_name, language, category, status, body_preview, synced_at')
    .order('synced_at', { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Plantillas de WhatsApp</h1>
          <p className="mt-1 text-sm text-booth-textMuted">
            Las plantillas se crean y aprueban en Meta Business Manager. Aquí solo se sincronizan.
          </p>
        </div>
        <SyncTemplatesButton />
      </div>

      <div className="overflow-hidden rounded-xl border border-booth-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-booth-surface text-booth-textMuted">
            <tr>
              <th className="px-4 py-3 font-medium">Plantilla</th>
              <th className="px-4 py-3 font-medium">Idioma</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Vista previa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-booth-border">
            {(templates ?? []).map((t) => (
              <tr key={t.id} className="hover:bg-booth-surface/60">
                <td className="px-4 py-3 font-medium">{t.meta_template_name}</td>
                <td className="px-4 py-3 text-booth-textMuted">{t.language}</td>
                <td className="px-4 py-3 text-booth-textMuted">{t.category ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[t.status ?? ''] ?? 'default'}>{t.status ?? 'desconocido'}</Badge>
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-booth-textMuted">{t.body_preview ?? '—'}</td>
              </tr>
            ))}
            {(!templates || templates.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-booth-textMuted">
                  Todavía no se ha sincronizado ninguna plantilla desde Meta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
