'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

// Botón "+ Invitar usuario" de la página de Usuarios, con su modal.
// Al enviar, Supabase manda un correo con un enlace para que la persona cree
// su contraseña. Entra con rol "user" (no admin) por defecto.
export function InviteUserButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function resetAndClose() {
    setEmail('');
    setFullName('');
    setError(null);
    setSuccess(false);
    setOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Escribe el correo de la persona que quieres invitar.');
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), fullName: fullName.trim() }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo enviar la invitación.');
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        + Invitar usuario
      </Button>

      <Modal open={open} onClose={resetAndClose} title="Invitar usuario">
        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-booth-textMuted">
              Invitación enviada a <span className="text-white">{email}</span>. Le llegará un
              correo para crear su contraseña y entrar a Booth.
            </p>
            <div className="flex justify-end">
              <Button variant="primary" onClick={resetAndClose}>
                Listo
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Nombre (opcional)</label>
              <input
                autoFocus
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre de la persona"
              />
            </div>
            <div>
              <label className={labelClass}>Correo</label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <p className="text-xs text-booth-textMuted">
              Se le enviará un correo para que cree su contraseña. Entrará con rol de usuario
              (no administrador).
            </p>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Enviando...' : 'Enviar invitación'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
