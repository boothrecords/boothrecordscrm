import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default async function UsersPage() {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: true });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <Button variant="primary">+ Invitar usuario</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-booth-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-booth-surface text-booth-textMuted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Desde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-booth-border">
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-booth-surface/60">
                <td className="px-4 py-3 font-medium">{p.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-booth-textMuted">{p.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.role === 'admin' ? 'activo' : 'default'}>{p.role}</Badge>
                </td>
                <td className="px-4 py-3 text-booth-textMuted">
                  {new Date(p.created_at).toLocaleDateString('es-CO')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
