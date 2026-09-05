'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function SyncTemplatesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/whatsapp/sync-templates', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo sincronizar con Meta.');
      setResult(
        `Se sincronizaron ${json.synced} plantilla${json.synced === 1 ? '' : 's'}.` +
          (json.errors?.length ? ` (${json.errors.length} con error)` : '')
      );
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <Button variant="secondary" onClick={handleClick} disabled={loading}>
        {loading ? 'Sincronizando...' : 'Sincronizar con Meta'}
      </Button>
      {error && <p className="mt-1 max-w-xs text-xs text-red-400">{error}</p>}
      {result && <p className="mt-1 text-xs text-booth-textMuted">{result}</p>}
    </div>
  );
}
