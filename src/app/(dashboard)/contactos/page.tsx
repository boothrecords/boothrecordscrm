'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ContactFilters } from '@/components/contacts/ContactFilters';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { Button } from '@/components/ui/Button';
import type { Contact, ContactFilters as ContactFiltersType, ListRecord } from '@/types/database';

export default function ContactsPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<Pick<ListRecord, 'id' | 'name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadContacts(filters: ContactFiltersType = {}) {
    setLoading(true);
    let query = supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(100);

    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters.country) query = query.ilike('country', `%${filters.country}%`);

    const { data, error } = await query;
    if (!error) setContacts((data as Contact[]) ?? []);
    setLoading(false);
  }

  async function loadLists() {
    const { data } = await supabase.from('lists').select('id, name').order('name');
    setLists(data ?? []);
  }

  useEffect(() => {
    loadContacts();
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contactos</h1>
        <div className="flex gap-2">
          <Button variant="secondary">Importar CSV / Excel</Button>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            + Nuevo contacto
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <ContactFilters onApply={loadContacts} />
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
          loadContacts();
          loadLists();
        }}
        lists={lists}
      />
    </div>
  );
}
