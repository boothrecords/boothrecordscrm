'use client';

import { useState, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const TARGET_FIELDS: { key: string; label: string }[] = [
  { key: 'first_name', label: 'Nombre' },
  { key: 'last_name', label: 'Apellido' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'city', label: 'Ciudad' },
  { key: 'country', label: 'País' },
];

type ImportResult = {
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errors: { row: number; message: string }[];
};

// Intenta adivinar a qué columna del archivo corresponde cada campo, comparando nombres comunes.
function guessMapping(headers: string[]): Record<string, string> {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  const candidates: Record<string, string[]> = {
    first_name: ['nombre', 'first name', 'firstname', 'first_name', 'nombres'],
    last_name: ['apellido', 'last name', 'lastname', 'last_name', 'apellidos'],
    email: ['correo', 'email', 'correo electronico', 'e-mail', 'mail'],
    phone: ['telefono', 'phone', 'celular', 'whatsapp', 'numero', 'número'],
    city: ['ciudad', 'city'],
    country: ['pais', 'country'],
  };
  const result: Record<string, string> = {};
  for (const [key, options] of Object.entries(candidates)) {
    const match = headers.find((h) => options.includes(normalize(h)));
    if (match) result[key] = match;
  }
  return result;
}

type Step = 'select' | 'map' | 'result';

export function ImportContactsModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [rowCount, setRowCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function resetAndClose() {
    setStep('select');
    setFile(null);
    setHeaders([]);
    setMapping({});
    setRowCount(0);
    setError(null);
    setResult(null);
    onClose();
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);

    try {
      let cols: string[] = [];
      let rows = 0;

      if (selected.name.toLowerCase().endsWith('.csv')) {
        const text = await selected.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        cols = (parsed.meta.fields ?? []) as string[];
        rows = (parsed.data as unknown[]).length;
      } else {
        const buffer = await selected.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsedRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[];
        cols = parsedRows.length > 0 ? Object.keys(parsedRows[0]) : [];
        rows = parsedRows.length;
      }

      if (cols.length === 0) {
        setError('No encontramos columnas en ese archivo. Revisa que tenga encabezados en la primera fila.');
        return;
      }

      setFile(selected);
      setHeaders(cols);
      setMapping(guessMapping(cols));
      setRowCount(rows);
      setStep('map');
    } catch {
      setError('No pudimos leer ese archivo. Revisa que sea un CSV o Excel (.xlsx) válido.');
    }
  }

  async function handleImport() {
    if (!file) return;
    if (!mapping.email && !mapping.phone) {
      setError('Debes mapear al menos la columna de Correo o la de Teléfono.');
      return;
    }

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      const res = await fetch('/api/contacts/import', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      setSaving(false);

      if (!res.ok) {
        setError(data.error ?? 'No se pudo importar el archivo.');
        return;
      }

      setResult(data as ImportResult);
      setStep('result');
      onImported();
    } catch {
      setSaving(false);
      setError('No se pudo importar el archivo. Revisa tu conexión e intenta de nuevo.');
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} title="Importar contactos">
      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-sm text-booth-textMuted">
            Sube un archivo CSV o Excel (.xlsx) con tus contactos. Si no tienes uno listo, primero descarga
            la plantilla desde el botón "Importar CSV / Excel".
          </p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelected}
            className="block w-full text-sm text-booth-textMuted file:mr-3 file:rounded-lg file:border-0 file:bg-booth-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-4">
          <p className="text-sm text-booth-textMuted">
            Encontramos <span className="text-white">{rowCount}</span> fila(s) en{' '}
            <span className="text-white">{file?.name}</span>. Dinos qué columna de tu archivo corresponde a
            cada dato (deja "No importar" si no aplica):
          </p>
          <div className="space-y-3">
            {TARGET_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <label className="w-24 shrink-0 text-sm text-booth-textMuted">{field.label}</label>
                <select
                  className="flex-1 rounded-lg border border-booth-border bg-booth-bg px-3 py-2 text-sm outline-none focus:border-booth-accent"
                  value={mapping[field.key] ?? ''}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                >
                  <option value="">No importar</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-xs text-booth-textMuted">
            Cada contacto necesita al menos correo o teléfono para poder guardarse. Si ya existe un
            contacto con ese correo o teléfono, se actualiza en vez de duplicarse.
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep('select')}>
              Volver
            </Button>
            <Button type="button" variant="primary" disabled={saving} onClick={handleImport}>
              {saving ? 'Importando...' : `Importar ${rowCount} contacto(s)`}
            </Button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <p className="text-sm text-booth-textMuted">
            Procesamos <span className="text-white">{result.totalRows}</span> fila(s):{' '}
            <span className="text-emerald-400">{result.processedRows} importados</span>
            {result.errorRows > 0 && (
              <>
                {' '}
                y <span className="text-red-400">{result.errorRows} con error</span>
              </>
            )}
            .
          </p>
          {result.errors.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-booth-border bg-booth-bg p-3 text-xs text-booth-textMuted">
              {result.errors.map((e, i) => (
                <p key={i}>
                  Fila {e.row}: {e.message}
                </p>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="primary" onClick={resetAndClose}>
              Listo
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
