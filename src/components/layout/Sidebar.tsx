'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/contactos', label: 'Contactos' },
  { href: '/listas', label: 'Listas' },
  { href: '/campanas', label: 'Campañas' },
  { href: '/plantillas/email', label: 'Plantillas de email' },
  { href: '/plantillas/whatsapp', label: 'Plantillas de Meta' },
  { href: '/usuarios', label: 'Usuarios' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-booth-border bg-booth-surface">
      <div className="flex items-center gap-2 border-b border-booth-border px-5 py-5">
        <Image src="/logo-booth-white.png" alt="Booth" width={28} height={28} className="h-7 w-7 object-contain" />
        <span className="text-sm font-semibold tracking-wide">BOOTH</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? 'bg-booth-accentMuted text-white'
                  : 'text-booth-textMuted hover:bg-booth-border hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
