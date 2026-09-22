'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent';
const labelClass = 'mb-1 block text-sm text-booth-textMuted';

export default function AceptarInvitacionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Escribe tu nombre completo.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);

    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      setSaving(false);
      setError(passwordError.message);
      return;
    }

    const res = await fetch('/api/users/complete-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: fullName.trim() }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo completar tu registro.');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-booth-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-booth-border bg-booth-surface p-6">
        <h1 className="mb-1 text-xl font-semibold">Bienvenido a Booth</h1>
        <p className="mb-6 text-sm text-booth-textMuted">
          Completa tu registro para acceder a la plataforma.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre completo</label>
            <input
              autoFocus
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className={labelClass}>Contraseña</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className={labelClass}>Confirmar contraseña</label>
            <input
              type="password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-booth-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Crear mi cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
