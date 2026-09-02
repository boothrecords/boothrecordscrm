'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Home,
  Users,
  ListChecks,
  Send,
  Mail,
  MessageCircle,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

const RAIL_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/contactos', label: 'Contactos', icon: Users },
  { href: '/listas', label: 'Listas', icon: ListChecks },
  { href: '/campanas', label: 'Campañas', icon: Send },
];

const MODULE_GROUPS: {
  title: string;
  items: { href: string; label: string; icon: typeof Home }[];
}[] = [
  {
    title: 'General',
    items: [
      { href: '/', label: 'Inicio', icon: Home },
      { href: '/contactos', label: 'Contactos', icon: Users },
      { href: '/listas', label: 'Listas', icon: ListChecks },
    ],
  },
  {
    title: 'Campañas',
    items: [
      { href: '/campanas', label: 'Campañas', icon: Send },
      { href: '/plantillas/email', label: 'Plantillas de email', icon: Mail },
      { href: '/plantillas/whatsapp', label: 'Plantillas de Meta', icon: MessageCircle },
    ],
  },
  {
    title: 'Configuración',
    items: [{ href: '/usuarios', label: 'Usuarios', icon: ShieldCheck }],
  },
];

export function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [panelOpen, setPanelOpen] = useState(false);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      <aside className="relative z-20 flex h-screen w-[76px] shrink-0 flex-col items-center border-r border-booth-border bg-booth-rail py-5">
        <Link href="/" className="mb-6 block">
          <Image
            src="/logo-booth-white.png"
            alt="Booth"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
        </Link>

        <button
          onClick={() => setPanelOpen((v) => !v)}
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl transition ${
            panelOpen
              ? 'bg-booth-accent text-white'
              : 'text-booth-textMuted hover:bg-white/5 hover:text-white'
          }`}
          aria-label="Módulos"
        >
          <LayoutGrid size={20} />
        </button>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {RAIL_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                  active
                    ? 'bg-booth-accent text-white shadow-lg shadow-orange-900/30'
                    : 'text-booth-textMuted hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3 pt-4">
          <div
            title={profile?.full_name ?? profile?.email ?? 'Usuario'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-booth-accent text-xs font-semibold text-white"
          >
            {(profile?.full_name ?? profile?.email ?? 'U').slice(0, 1).toUpperCase()}
          </div>
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-booth-textMuted transition hover:bg-white/5 hover:text-red-400"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {panelOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setPanelOpen(false)} />
          <div className="fixed left-[76px] top-0 z-10 h-screen w-72 overflow-y-auto border-r border-booth-border bg-booth-panel p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-booth-textMuted">
                Módulos
              </span>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-booth-textMuted hover:text-white"
                aria-label="Cerrar panel"
              >
                <X size={18} />
              </button>
            </div>

            {MODULE_GROUPS.map((group) => (
              <div key={group.title} className="mb-6">
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-booth-textMuted/70">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setPanelOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                          active
                            ? 'bg-booth-accentMuted text-white'
                            : 'text-booth-textMuted hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon size={17} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
