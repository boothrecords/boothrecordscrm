'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { ContactStatus, CustomFieldDefinition, ListRecord, Tag } from '@/types/database';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

export function ContactFormModal({
  open,
  onClose,
  onCreated,
  lists,
  tags,
  onTagCreated,
  customFieldDefs,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  lists: Pick<ListRecord, 'id' | 'name'>[];
  tags: Tag[];
  onTagCreated: (tag: Tag) => void;
  customFieldDefs: CustomFieldDefinition[];
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
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

  function toggleTag(id: string) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;
    setCreatingTag(true);
    const { data, error: tagError } = await supabase.from('tags').insert({ name }).select().single();
    setCreatingTag(false);
    if (tagError || !data) return;
    onTagCreated(data as Tag);
    setSelectedTags((prev) => [...prev, data.id]);
    setNewTagName('');
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
    setSelectedTags([]);
    setCustomValues({});
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
        custom_fields: customValues,
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

    if (contact) {
      if (selectedLists.length > 0) {
        await supabase
          .from('list_contacts')
          .insert(selectedLists.map((listId) => ({ list_id: listId, contact_id: contact.id })));
      }
      if (selectedTags.length > 0) {
        await supabase
          .from('contact_tags')
          .insert(selectedTags.map((tagId) => ({ tag_id: tagId, contact_id: contact.id })));
      }
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

        <div>
          <label className={labelClass}>Etiquetas</label>
          <div className="flex flex-wrap gap-2 rounded-lg border border-booth-border p-2">
            {tags.map((tag) => {
              const active = selectedTags.includes(tag.id);
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    active
                      ? 'border-booth-accent bg-booth-accentMuted text-white'
                      : 'border-booth-border text-booth-textMuted hover:text-white'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
            {tags.length === 0 && (
              <span className="text-xs text-booth-textMuted">Todavía no hay etiquetas creadas.</span>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className={inputClass}
              placeholder="Crear nueva etiqueta..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
            />
            <Button type="button" variant="secondary" disabled={creatingTag} onClick={handleCreateTag}>
              + Agregar
            </Button>
          </div>
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

        {customFieldDefs.length > 0 && (
          <div className="space-y-3 rounded-lg border border-booth-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-booth-textMuted">
              Campos personalizados
            </p>
            {customFieldDefs.map((field) => (
              <div key={field.id}>
                <label className={labelClass}>{field.name}</label>
                {field.type === 'select' ? (
                  <select
                    className={inputClass}
                    value={customValues[field.field_key] ?? ''}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))
                    }
                  >
                    <option value="">Selecciona...</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    className={inputClass}
                    value={customValues[field.field_key] ?? ''}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
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
