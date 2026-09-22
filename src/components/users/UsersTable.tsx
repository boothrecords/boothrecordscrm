'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Profile, UserRole } from '@/types/database';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

export function UsersTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveEdit(fullName: string, role: UserRole) {
    if (!editing) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/users/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, role }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo guardar los cambios.');
      return;
    }

    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/users/${deleting.id}`, { method: 'DELETE' });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo eliminar al usuario.');
      return;
    }

    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-booth-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-booth-surface text-booth-textMuted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Desde</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-booth-border">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-booth-surface/60">
                <td className="px-4 py-3 font-medium">
                  {p.full_name ?? '—'} {p.id === currentUserId && <span className="text-booth-textMuted">(tú)</span>}
                </td>
                <td className="px-4 py-3 text-booth-textMuted">{p.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.role === 'admin' ? 'activo' : 'default'}>{p.role}</Badge>
                </td>
                <td className="px-4 py-3 text-booth-textMuted">
                  {new Date(p.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setError(null);
                        setEditing(p);
                      }}
                    >
                      Editar
                    </Button>
                    {p.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => {
                          setError(null);
                          setDeleting(p);
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditUserModal
        key={editing?.id ?? 'none'}
        profile={editing}
        isSelf={editing?.id === currentUserId}
        saving={saving}
        error={error}
        onClose={() => {
          setEditing(null);
          setError(null);
        }}
        onSave={handleSaveEdit}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar usuario">
        <div className="space-y-4">
          <p className="text-sm text-booth-textMuted">
            ¿Seguro que quieres eliminar a{' '}
            <span className="text-white">{deleting?.full_name ?? deleting?.email}</span>? Perderá acceso
            a Booth de inmediato. Esta acción no se puede deshacer.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:opacity-90"
              disabled={saving}
              onClick={handleDelete}
            >
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function EditUserModal({
  profile,
  isSelf,
  saving,
  error,
  onClose,
  onSave,
}: {
  profile: Profile | null;
  isSelf: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (fullName: string, role: UserRole) => void;
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'user');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave(fullName.trim(), role);
  }

  return (
    <Modal open={!!profile} onClose={onClose} title="Editar usuario">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nombre completo</label>
          <input
            autoFocus
            className={inputClass}
            defaultValue={profile?.full_name ?? ''}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Correo</label>
          <input className={inputClass} value={profile?.email ?? ''} disabled />
        </div>
        <div>
          <label className={labelClass}>Rol</label>
          <select
            className={inputClass}
            defaultValue={profile?.role ?? 'user'}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
          {isSelf && (
            <p className="mt-1 text-xs text-booth-textMuted">
              No puedes cambiar tu propio rol. Pídele a otro admin que lo haga.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
