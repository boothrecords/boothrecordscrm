import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';

export default async function ListsPage() {
  const supabase = createClient();
  const { data: lists } = await supabase
    .from('lists')
    .select('id, name, description, is_dynamic, created_at, list_contacts(count)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Listas</h1>
        <Button variant="primary">+ Nueva lista</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(lists ?? []).map((list: any) => (
          <div key={list.id} className="rounded-xl border border-booth-border bg-booth-surface p-5">
            <h2 className="font-medium">{list.name}</h2>
            <p className="mt-1 text-sm text-booth-textMuted">{list.description || 'Sin descripción'}</p>
            <p className="mt-4 text-sm text-booth-textMuted">
              {list.list_contacts?.[0]?.count ?? 0} contactos · {list.is_dynamic ? 'lista dinámica' : 'lista estática'}
            </p>
          </div>
        ))}

        {(!lists || lists.length === 0) && (
          <div className="col-span-full flex h-40 items-center justify-center rounded-xl border border-dashed border-booth-border text-sm text-booth-textMuted">
            Todavía no has creado ninguna lista.
          </div>
        )}
      </div>
    </div>
  );
}
