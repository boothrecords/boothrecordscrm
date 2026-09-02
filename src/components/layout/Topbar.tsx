import type { Profile } from '@/types/database';

export function Topbar({ profile }: { profile: Profile | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-booth-border px-6">
      <div className="text-sm text-booth-textMuted">
        {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">{profile?.full_name ?? profile?.email ?? 'Usuario'}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-booth-accent text-xs font-semibold text-white">
          {(profile?.full_name ?? profile?.email ?? 'U').slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
