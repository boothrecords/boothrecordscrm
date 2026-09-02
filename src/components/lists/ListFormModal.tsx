'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

export function ListFormModal({
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
  const [description, setDescription] = useState('');

  function resetAndClose() {
    setName('');
    setDescription('');
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ponle un nombre a la lista.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('lists').insert({
      name: name.trim(),
      description: description.trim() || null,
      is_dynamic: false,
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
    <Modal open={open} onClose={resetAndClose} title="Nueva lista">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nombre</label>
          <input
            autoFocus
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Asistentes Booth Nights - Septiembre"
          />
        </div>
        <div>
          <label className={labelClass}>Descripción (opcional)</label>
          <textarea
            className={inputClass}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear lista'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
