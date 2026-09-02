'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Download, FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ContactFilters } from '@/components/contacts/ContactFilters';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { Button } from '@/components/ui/Button';
import type {
  Contact,
  ContactFilters as ContactFiltersType,
  CustomFieldDefinition,
  ListRecord,
  Tag,
} from '@/types/database';

export default function ContactsPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<Pick<ListRecord, 'id' | 'name'>[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const activeFiltersRef = useRef<ContactFiltersType>({});

  const loadContacts = useCallback(async (filters: ContactFiltersType = {}) => {
    setLoading(true);

    // Etiquetas y listas viven en tablas puente, así que primero resolvemos
    // qué contactos cumplen esos filtros antes de armar la consulta principal.
    let contactIdFilter: string[] | null = null;

    if (filters.tagIds && filters.tagIds.length > 0) {
      const { data: tagRows } = await supabase
        .from('contact_tags')
        .select('contact_id')
        .in('tag_id', filters.tagIds);
      contactIdFilter = Array.from(new Set((tagRows ?? []).map((r) => r.contact_id as string)));
    }

    if (filters.listId) {
      const { data: listRows } = await supabase
        .from('list_contacts')
        .select('contact_id')
        .eq('list_id', filters.listId);
      const ids = new Set((listRows ?? []).map((r) => r.contact_id as string));
      contactIdFilter = contactIdFilter ? contactIdFilter.filter((id) => ids.has(id)) : Array.from(ids);
    }

    if (contactIdFilter && contactIdFilter.length === 0) {
      setContacts([]);
      setLoading(false);
      return;
    }

    let query = supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(200);

    if (contactIdFilter) query = query.in('id', contactIdFilter);
    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters.country) query = query.ilike('country', `%${filters.country}%`);
    if (filters.source) query = query.ilike('source', `%${filters.source}%`);
    if (filters.createdFrom) query = query.gte('created_at', filters.createdFrom);
    if (filters.createdTo) query = query.lte('created_at', filters.createdTo);

    const { data, error } = await query;
    if (!error) setContacts((data as Contact[]) ?? []);
    setLoading(false);
  }, [supabase]);

  async function loadLists() {
    const { data } = await supabase.from('lists').select('id, name').order('name');
    setLists(data ?? []);
  }

  async function loadTags() {
    const { data } = await supabase.from('tags').select('id, name, color').order('name');
    setTags((data as Tag[]) ?? []);
  }

  async function loadCustomFieldDefs() {
    const { data } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .order('created_at', { ascending: false });
    setCustomFieldDefs((data as CustomFieldDefinition[]) ?? []);
  }

  useEffect(() => {
    loadContacts();
    loadLists();
    loadTags();
    loadCustomFieldDefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters(filters: ContactFiltersType) {
    const merged = { ...filters, search: searchTerm || undefined };
    activeFiltersRef.current = filters;
    loadContacts(merged);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadContacts({ ...activeFiltersRef.current, search: searchTerm || undefined });
  }

  function handleTagCreated(tag: Tag) {
    setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contactos</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="secondary" onClick={() => setTemplatesOpen((v) => !v)}>
              Importar CSV / Excel
            </Button>
            {templatesOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTemplatesOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-booth-border bg-booth-panel p-3 shadow-xl">
                  <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-booth-textMuted">
                    Descargar plantilla de importación
                  </p>
                  <a
                    href="/plantillas-importacion/plantilla-contactos.csv"
                    download
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-booth-text hover:bg-white/5"
                  >
                    <Download size={15} />
                    Plantilla CSV
                  </a>
                  <a
                    href="/plantillas-importacion/plantilla-contactos.xlsx"
                    download
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-booth-text hover:bg-white/5"
                  >
                    <FileSpreadsheet size={15} />
                    Plantilla Excel (.xlsx)
                  </a>
                  <p className="mt-2 px-1 text-xs text-booth-textMuted">
                    Llena la plantilla con tus contactos y súbela desde el módulo de importación.
                  </p>
                </div>
              </>
            )}
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            + Nuevo contacto
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-booth-textMuted"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full rounded-lg border border-booth-border bg-booth-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-booth-accent"
          />
        </div>
      </form>

      <div className="flex gap-6">
        <ContactFilters onApply={handleApplyFilters} lists={lists} tags={tags} />
        <div className="flex-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-booth-textMuted">
              Cargando contactos...
            </div>
          ) : (
            <ContactsTable contacts={contacts} />
          )}
        </div>
      </div>

      <ContactFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          loadContacts(activeFiltersRef.current);
          loadLists();
        }}
        lists={lists}
        tags={tags}
        onTagCreated={handleTagCreated}
        customFieldDefs={customFieldDefs}
      />
    </div>
  );
}
