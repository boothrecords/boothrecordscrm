import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();

  const [{ count: contactsCount }, { count: listsCount }, { count: campaignsCount }] =
    await Promise.all([
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('lists').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    ]);

  const stats = [
    { label: 'Contactos', value: contactsCount ?? 0 },
    { label: 'Listas', value: listsCount ?? 0 },
    { label: 'Campañas', value: campaignsCount ?? 0 },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Buenos días</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-booth-border bg-booth-surface p-5">
            <p className="text-sm text-booth-textMuted">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
