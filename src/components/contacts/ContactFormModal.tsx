'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { ContactStatus, ListRecord } from '@/types/database';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

export function ContactFormModal({
  open,
  onClose,
  onCreated,
  lists,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  lists: Pick<ListRecord, 'id' | 'name'>[];
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    source: '',
    status: 'activo' as ContactStatus,
    notes: '',
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleList(id: string) {
    setSelectedLists((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  }

  function resetAndClose() {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      source: '',
      status: 'activo',
      notes: '',
    });
    setSelectedLists([]);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() && !form.phone.trim()) {
      setError('Ingresa al menos un correo o un teléfono.');
      return;
    }

    setSaving(true);

    const { data: contact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        email: form.email.trim() ? form.email.trim().toLowerCase() : null,
        phone: form.phone.trim() || null,
        city: form.city || null,
        country: form.country || null,
        source: form.source || 'manual',
        status: form.status,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'Ya existe un contacto con ese correo o teléfono.'
          : insertError.message
      );
      setSaving(false);
      return;
    }

    if (selectedLists.length > 0 && contact) {
      await supabase
        .from('list_contacts')
        .insert(selectedLists.map((listId) => ({ list_id: listId, contact_id: contact.id })));
    }

    setSaving(false);
    resetAndClose();
    onCreated();
  }

  return (
    <Modal open={open} onClose={resetAndClose} title="Nuevo contacto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              className={inputClass}
              value={form.first_name}
              onChange={(e) => update('first_name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Apellido</label>
            <input
              className={inputClass}
              value={form.last_name}
              onChange={(e) => update('last_name', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Correo</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="nombre@correo.com"
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono (WhatsApp)</label>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+57 300 000 0000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Ciudad</label>
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>País</label>
            <input
              className={inputClass}
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Origen</label>
            <input
              className={inputClass}
              value={form.source}
              onChange={(e) => update('source', e.target.value)}
              placeholder="Ej. evento, landing, referido..."
            />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => update('status', e.target.value as ContactStatus)}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notas</label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>

        {lists.length > 0 && (
          <div>
            <label className={labelClass}>Agregar a listas</label>
            <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-lg border border-booth-border p-2">
              {lists.map((list) => (
                <label key={list.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(list.id)}
                    onChange={() => toggleList(list.id)}
                  />
                  {list.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear contacto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
