'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

export function EmailTemplateFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState(
    '<p>Hola {{first_name}},</p>\n<p>Escribe aquí el contenido de tu correo.</p>'
  );

  function resetAndClose() {
    setName('');
    setSubject('');
    setHtml('<p>Hola {{first_name}},</p>\n<p>Escribe aquí el contenido de tu correo.</p>');
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !html.trim()) {
      setError('Completa el nombre, el asunto y el contenido.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('email_templates').insert({
      name: name.trim(),
      subject: subject.trim(),
      html_content: html,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    resetAndClose();
    onCreated();
  }

  return (
    <Modal open={open} onClose={resetAndClose} title="Nueva plantilla de email">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nombre de la plantilla</label>
          <input
            autoFocus
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Newsletter mensual"
          />
        </div>
        <div>
          <label className={labelClass}>Asunto del correo</label>
          <input
            className={inputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ej. Lo nuevo de Booth este mes 🎧"
          />
        </div>
        <div>
          <label className={labelClass}>Contenido (HTML)</label>
          <textarea
            className={`${inputClass} font-mono`}
            rows={10}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
          />
          <p className="mt-1 text-xs text-booth-textMuted">
            Puedes usar <code>{'{{first_name}}'}</code> para insertar el nombre del contacto automáticamente.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear plantilla'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
