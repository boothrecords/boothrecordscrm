'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { EmailTemplateFormModal } from '@/components/templates/EmailTemplateFormModal';
import type { EmailTemplate } from '@/types/database';

export default function EmailTemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadTemplates() {
    setLoading(true);
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('updated_at', { ascending: false });
    setTemplates((data as EmailTemplate[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plantillas de email</h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + Nueva plantilla
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-booth-textMuted">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-booth-border bg-booth-surface p-5">
              <h2 className="font-medium">{t.name}</h2>
              <p className="mt-1 text-sm text-booth-textMuted">{t.subject}</p>
              <p className="mt-4 text-xs text-booth-textMuted">
                Actualizada {new Date(t.updated_at).toLocaleDateString('es-CO')}
              </p>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full flex h-40 items-center justify-center rounded-xl border border-dashed border-booth-border text-sm text-booth-textMuted">
              Todavía no has creado ninguna plantilla de email.
            </div>
          )}
        </div>
      )}

      <EmailTemplateFormModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={loadTemplates} />
    </div>
  );
}
