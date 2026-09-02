'use client';

import { useState } from 'react';
import type { ContactFilters as ContactFiltersType } from '@/types/database';

// Panel de filtros de contactos, inspirado en el panel de filtros de Clientify
// (segmentos, nombre, ciudad, estado, etiquetas, fecha de creación, etc.)
const FILTER_GROUPS: { key: keyof ContactFiltersType; label: string }[] = [
  { key: 'search', label: 'Nombre / correo / teléfono' },
  { key: 'status', label: 'Estado del contacto' },
  { key: 'city', label: 'Ciudad' },
  { key: 'country', label: 'País' },
  { key: 'tagIds', label: 'Etiquetas' },
  { key: 'listId', label: 'Lista' },
  { key: 'eventId', label: 'Evento' },
  { key: 'createdFrom', label: 'Fecha de creación' },
];

export function ContactFilters({
  onApply,
}: {
  onApply: (filters: ContactFiltersType) => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>('search');
  const [filters, setFilters] = useState<ContactFiltersType>({});

  return (
    <div className="w-72 shrink-0 rounded-xl border border-booth-border bg-booth-surface">
      <div className="border-b border-booth-border px-4 py-3 text-sm font-medium">Filtros</div>

      <div className="max-h-[65vh] overflow-y-auto">
        {FILTER_GROUPS.map((group) => (
          <div key={group.key} className="border-b border-booth-border">
            <button
              onClick={() => setOpenGroup(openGroup === group.key ? null : group.key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-booth-border/40"
            >
              {group.label}
              <span className="text-booth-textMuted">{openGroup === group.key ? '−' : '+'}</span>
            </button>

            {openGroup === group.key && (
              <div className="px-4 pb-3">
                <input
                  type="text"
                  placeholder={`Filtrar por ${group.label.toLowerCase()}`}
                  className="w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-1.5 text-sm outline-none focus:border-booth-accent"
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, [group.key]: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 p-3">
        <button
          onClick={() => {
            setFilters({});
            onApply({});
          }}
          className="flex-1 rounded-lg border border-booth-border py-2 text-sm text-booth-textMuted hover:text-white"
        >
          Limpiar filtros
        </button>
        <button
          onClick={() => onApply(filters)}
          className="flex-1 rounded-lg bg-booth-accent py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
