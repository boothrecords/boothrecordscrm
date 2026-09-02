'use client';

import { useMemo, useState } from 'react';
import { Filter, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { ContactFilters as ContactFiltersType, ListRecord, Tag } from '@/types/database';

const inputClass =
  'w-full rounded-lg border border-booth-border bg-booth-bg px-3 py-1.5 text-sm outline-none focus:border-booth-accent';

type DatePreset =
  | 'cualquiera'
  | 'hoy'
  | 'ayer'
  | 'esta_semana'
  | 'semana_pasada'
  | 'este_mes'
  | 'mes_pasado'
  | 'ultimos_7'
  | 'ultimos_30'
  | 'hace_3_meses'
  | 'hace_6_meses'
  | 'hace_1_anio'
  | 'antes_de'
  | 'despues_de'
  | 'entre';

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  cualquiera: 'En cualquier momento',
  hoy: 'Hoy',
  ayer: 'Ayer',
  esta_semana: 'Esta semana',
  semana_pasada: 'La semana pasada',
  este_mes: 'Este mes',
  mes_pasado: 'El mes pasado',
  ultimos_7: 'Últimos 7 días',
  ultimos_30: 'Últimos 30 días',
  hace_3_meses: 'Hace 3 meses',
  hace_6_meses: 'Hace 6 meses',
  hace_1_anio: 'Hace 1 año',
  antes_de: 'Antes de...',
  despues_de: 'Después de...',
  entre: 'Entre...',
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // lunes = 0
  return addDays(x, -day);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function computePresetRange(preset: DatePreset, before?: string, after?: string) {
  const now = new Date();
  switch (preset) {
    case 'hoy':
      return { from: startOfDay(now).toISOString(), to: undefined };
    case 'ayer':
      return { from: startOfDay(addDays(now, -1)).toISOString(), to: startOfDay(now).toISOString() };
    case 'esta_semana':
      return { from: startOfWeek(now).toISOString(), to: undefined };
    case 'semana_pasada':
      return {
        from: startOfWeek(addDays(now, -7)).toISOString(),
        to: startOfWeek(now).toISOString(),
      };
    case 'este_mes':
      return { from: startOfMonth(now).toISOString(), to: undefined };
    case 'mes_pasado': {
      const firstThisMonth = startOfMonth(now);
      const firstLastMonth = new Date(firstThisMonth.getFullYear(), firstThisMonth.getMonth() - 1, 1);
      return { from: firstLastMonth.toISOString(), to: firstThisMonth.toISOString() };
    }
    case 'ultimos_7':
      return { from: addDays(now, -7).toISOString(), to: undefined };
    case 'ultimos_30':
      return { from: addDays(now, -30).toISOString(), to: undefined };
    case 'hace_3_meses':
      return { from: addDays(now, -90).toISOString(), to: undefined };
    case 'hace_6_meses':
      return { from: addDays(now, -180).toISOString(), to: undefined };
    case 'hace_1_anio':
      return { from: addDays(now, -365).toISOString(), to: undefined };
    case 'antes_de':
      return { from: undefined, to: before ? new Date(before).toISOString() : undefined };
    case 'despues_de':
      return { from: after ? new Date(after).toISOString() : undefined, to: undefined };
    case 'entre':
      return {
        from: after ? new Date(after).toISOString() : undefined,
        to: before ? new Date(before).toISOString() : undefined,
      };
    default:
      return { from: undefined, to: undefined };
  }
}

export function ContactFilters({
  onApply,
  lists,
  tags,
}: {
  onApply: (filters: ContactFiltersType) => void;
  lists: Pick<ListRecord, 'id' | 'name'>[];
  tags: Tag[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [source, setSource] = useState('');
  const [listId, setListId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('cualquiera');
  const [dateBefore, setDateBefore] = useState('');
  const [dateAfter, setDateAfter] = useState('');

  const activeCount = useMemo(() => {
    let n = 0;
    if (status) n++;
    if (city) n++;
    if (country) n++;
    if (source) n++;
    if (listId) n++;
    if (tagIds.length > 0) n++;
    if (datePreset !== 'cualquiera') n++;
    return n;
  }, [status, city, country, source, listId, tagIds, datePreset]);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function apply() {
    const { from, to } = computePresetRange(datePreset, dateBefore, dateAfter);
    onApply({
      status: (status as ContactFiltersType['status']) || undefined,
      city: city || undefined,
      country: country || undefined,
      source: source || undefined,
      listId: listId || undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
      createdFrom: from,
      createdTo: to,
    });
  }

  function clear() {
    setStatus('');
    setCity('');
    setCountry('');
    setSource('');
    setListId('');
    setTagIds([]);
    setDatePreset('cualquiera');
    setDateBefore('');
    setDateAfter('');
    onApply({});
  }

  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-booth-border bg-booth-surface py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="relative mb-4 flex h-8 w-8 items-center justify-center rounded-lg text-booth-textMuted hover:bg-white/5 hover:text-white"
          aria-label="Expandir filtros"
        >
          <Filter size={16} />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-booth-accent px-1 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setCollapsed(false)}
          className="text-booth-textMuted hover:text-white"
          aria-label="Expandir filtros"
        >
          <ChevronsRight size={16} />
        </button>
        <span className="mt-3 rotate-180 text-xs tracking-wide text-booth-textMuted [writing-mode:vertical-rl]">
          Filtros
        </span>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 rounded-xl border border-booth-border bg-booth-surface">
      <div className="flex items-center justify-between border-b border-booth-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter size={15} />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-booth-accent px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-booth-textMuted hover:text-white"
          aria-label="Colapsar filtros"
        >
          <ChevronsLeft size={16} />
        </button>
      </div>

      <div className="max-h-[65vh] space-y-4 overflow-y-auto p-4">
        <div>
          <label className="mb-1 block text-xs text-booth-textMuted">Estado del contacto</label>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-booth-textMuted">Ciudad</label>
          <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-xs text-booth-textMuted">País</label>
          <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-xs text-booth-textMuted">Origen</label>
          <input className={inputClass} value={source} onChange={(e) => setSource(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-xs text-booth-textMuted">Lista</label>
          <select className={inputClass} value={listId} onChange={(e) => setListId(e.target.value)}>
            <option value="">Todas</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-booth-textMuted">Etiquetas</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const active = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                    active
                      ? 'border-booth-accent bg-booth-accentMuted text-white'
                      : 'border-booth-border text-booth-textMuted hover:text-white'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
            {tags.length === 0 && <span className="text-xs text-booth-textMuted">Sin etiquetas aún.</span>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-booth-textMuted">Fecha de creación</label>
          <select
            className={inputClass}
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
          >
            {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((key) => (
              <option key={key} value={key}>
                {DATE_PRESET_LABELS[key]}
              </option>
            ))}
          </select>

          {(datePreset === 'antes_de' || datePreset === 'entre') && (
            <input
              type="date"
              className={`${inputClass} mt-2`}
              value={dateBefore}
              onChange={(e) => setDateBefore(e.target.value)}
              placeholder="Antes de"
            />
          )}
          {(datePreset === 'despues_de' || datePreset === 'entre') && (
            <input
              type="date"
              className={`${inputClass} mt-2`}
              value={dateAfter}
              onChange={(e) => setDateAfter(e.target.value)}
              placeholder="Después de"
            />
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-booth-border p-3">
        <button
          onClick={clear}
          className="flex-1 rounded-lg border border-booth-border py-2 text-sm text-booth-textMuted hover:text-white"
        >
          Limpiar filtros
        </button>
        <button
          onClick={apply}
          className="flex-1 rounded-lg bg-booth-accent py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
