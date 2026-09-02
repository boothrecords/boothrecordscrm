-- Booth Platform — migración 0002: campos personalizados de contactos.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).

create type custom_field_type as enum ('text', 'number', 'date', 'select');

create table custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  field_key text not null unique, -- generado a partir del nombre, usado como llave dentro de contacts.custom_fields
  type custom_field_type not null default 'text',
  options jsonb, -- lista de opciones cuando type = 'select'
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table contacts
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

alter table custom_field_definitions enable row level security;

create policy "authenticated read/write: custom_field_definitions" on custom_field_definitions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
