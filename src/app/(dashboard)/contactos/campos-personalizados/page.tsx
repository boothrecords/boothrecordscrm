'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { CustomFieldDefinition, CustomFieldType } from '@/types/database';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

const TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Fecha',
  select: 'Lista de opciones',
};

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function CustomFieldsPage() {
  const supabase = createClient();
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('text');
  const [options, setOptions] = useState('');

  async function loadFields() {
    setLoading(true);
    const { data } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .order('created_at', { ascending: false });
    setFields((data as CustomFieldDefinition[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetAndClose() {
    setName('');
    setType('text');
    setOptions('');
    setError(null);
    setModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ponle un nombre al campo.');
      return;
    }
    const field_key = slugify(name);
    if (!field_key) {
      setError('Ese nombre no genera una llave válida, prueba con otro.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('custom_field_definitions').insert({
      name: name.trim(),
      field_key,
      type,
      options:
        type === 'select'
          ? options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : null,
    });

    setSaving(false);

    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'Ya existe un campo con ese nombre.'
          : insertError.message
      );
      return;
    }

    resetAndClose();
    loadFields();
  }

  return (
    <div>
      <div className="mb-2">
        <Link href="/contactos" className="text-sm text-booth-textMuted hover:text-white">
          ← Volver a Contactos
        </Link>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campos personalizados</h1>
          <p className="mt-1 text-sm text-booth-textMuted">
            Agrega campos propios a la ficha de contacto (ej. talla de camiseta, RUT, redes sociales...).
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + Nuevo campo
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-booth-textMuted">
          Cargando...
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-booth-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-booth-surface text-booth-textMuted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Llave</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Opciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-booth-border">
              {fields.map((f) => (
                <tr key={f.id} className="hover:bg-booth-surface/60">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-booth-textMuted">{f.field_key}</td>
                  <td className="px-4 py-3 text-booth-textMuted">{TYPE_LABELS[f.type]}</td>
                  <td className="px-4 py-3 text-booth-textMuted">{(f.options ?? []).join(', ') || '—'}</td>
                </tr>
              ))}
              {fields.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-booth-textMuted">
                    Todavía no has creado ningún campo personalizado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={resetAndClose} title="Nuevo campo personalizado">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre del campo</label>
            <input
              autoFocus
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Talla de camiseta"
            />
            {name && (
              <p className="mt-1 text-xs text-booth-textMuted">
                Se guardará internamente como: <code>{slugify(name)}</code>
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Tipo de dato</label>
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as CustomFieldType)}
            >
              <option value="text">Texto</option>
              <option value="number">Número</option>
              <option value="date">Fecha</option>
              <option value="select">Lista de opciones</option>
            </select>
          </div>
          {type === 'select' && (
            <div>
              <label className={labelClass}>Opciones (separadas por coma)</label>
              <input
                className={inputClass}
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Ej. S, M, L, XL"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={resetAndClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear campo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
