'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ListFormModal } from '@/components/lists/ListFormModal';

export default function ListsPage() {
  const supabase = createClient();
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadLists() {
    setLoading(true);
    const { data } = await supabase
      .from('lists')
      .select('id, name, description, is_dynamic, created_at, list_contacts(count)')
      .order('created_at', { ascending: false });
    setLists(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Listas</h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + Nueva lista
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-booth-textMuted">
          Cargando listas...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <div key={list.id} className="rounded-xl border border-booth-border bg-booth-surface p-5">
              <h2 className="font-medium">{list.name}</h2>
              <p className="mt-1 text-sm text-booth-textMuted">{list.description || 'Sin descripción'}</p>
              <p className="mt-4 text-sm text-booth-textMuted">
                {list.list_contacts?.[0]?.count ?? 0} contactos ·{' '}
                {list.is_dynamic ? 'lista dinámica' : 'lista estática'}
              </p>
            </div>
          ))}

          {lists.length === 0 && (
            <div className="col-span-full flex h-40 items-center justify-center rounded-xl border border-dashed border-booth-border text-sm text-booth-textMuted">
              Todavía no has creado ninguna lista.
            </div>
          )}
        </div>
      )}

      <ListFormModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={loadLists} />
    </div>
  );
}
