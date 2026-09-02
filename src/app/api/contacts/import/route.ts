import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/contacts/import
// Recibe un archivo CSV o XLSX (multipart/form-data, campo "file") y un
// mapeo de columnas (JSON, campo "mapping": { first_name: "Nombre", email: "Correo", ... }).
// Crea un registro en `imports` y hace upsert de los contactos por email/teléfono.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const mappingRaw = formData.get('mapping') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'Falta el archivo a importar.' }, { status: 400 });
  }

  const mapping: Record<string, string> = mappingRaw ? JSON.parse(mappingRaw) : {};
  const buffer = Buffer.from(await file.arrayBuffer());

  let rows: Record<string, string>[] = [];

  if (file.name.endsWith('.csv')) {
    const parsed = Papa.parse(buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
    rows = parsed.data as Record<string, string>[];
  } else {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  const supabase = createServiceClient();

  const { data: importRecord } = await supabase
    .from('imports')
    .insert({ file_name: file.name, status: 'processing', total_rows: rows.length, column_mapping: mapping })
    .select()
    .single();

  const errors: { row: number; message: string }[] = [];
  let processed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const contact = {
      first_name: mapping.first_name ? row[mapping.first_name] : undefined,
      last_name: mapping.last_name ? row[mapping.last_name] : undefined,
      email: mapping.email ? row[mapping.email]?.trim().toLowerCase() || null : null,
      phone: mapping.phone ? row[mapping.phone]?.replace(/[^\d+]/g, '') || null : null,
      city: mapping.city ? row[mapping.city] : undefined,
      country: mapping.country ? row[mapping.country] : undefined,
      source: 'importacion',
    };

    if (!contact.email && !contact.phone) {
      errors.push({ row: i + 1, message: 'Sin correo ni teléfono, fila omitida.' });
      continue;
    }

    // Upsert por email (o por teléfono si no hay email) para evitar duplicados.
    const conflictTarget = contact.email ? 'email' : 'phone';
    const { error } = await supabase.from('contacts').upsert(contact, { onConflict: conflictTarget });

    if (error) {
      errors.push({ row: i + 1, message: error.message });
    } else {
      processed++;
    }
  }

  await supabase
    .from('imports')
    .update({
      status: 'completed',
      processed_rows: processed,
      error_rows: errors.length,
      errors,
    })
    .eq('id', importRecord?.id);

  return NextResponse.json({
    importId: importRecord?.id,
    totalRows: rows.length,
    processedRows: processed,
    errorRows: errors.length,
    errors,
  });
}
