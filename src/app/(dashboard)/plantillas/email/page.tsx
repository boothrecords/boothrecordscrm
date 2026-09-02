import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';

export default async function EmailTemplatesPage() {
  const supabase = createClient();
  const { data: templates } = await supabase
    .from('email_templates')
    .select('id, name, subject, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plantillas de email</h1>
        <Button variant="primary">+ Nueva plantilla</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(templates ?? []).map((t) => (
          <div key={t.id} className="rounded-xl border border-booth-border bg-booth-surface p-5">
            <h2 className="font-medium">{t.name}</h2>
            <p className="mt-1 text-sm text-booth-textMuted">{t.subject}</p>
            <p className="mt-4 text-xs text-booth-textMuted">
              Actualizada {new Date(t.updated_at).toLocaleDateString('es-CO')}
            </p>
          </div>
        ))}

        {(!templates || templates.length === 0) && (
          <div className="col-span-full flex h-40 items-center justify-center rounded-xl border border-dashed border-booth-border text-sm text-booth-textMuted">
            Todavía no has creado ninguna plantilla de email.
          </div>
        )}
      </div>
    </div>
  );
}
