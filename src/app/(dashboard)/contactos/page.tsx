'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ContactFilters } from '@/components/contacts/ContactFilters';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { Button } from '@/components/ui/Button';
import type { Contact, ContactFilters as ContactFiltersType } from '@/types/database';

export default function ContactsPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contactos</h1>
        <div className="flex gap-2">
          <Button variant="secondary">Importar CSV / Excel</Button>
          <Button variant="primary">+ Nuevo contacto</Button>
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
    </div>
  );
}
