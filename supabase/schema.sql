-- Booth Platform — esquema inicial de Supabase (Postgres)
-- Ejecutar en el SQL editor de Supabase (o via supabase db push).

-- =========================================================
-- Extensiones
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- Enums
-- =========================================================
create type user_role as enum ('admin', 'user');
create type contact_status as enum ('activo', 'inactivo', 'baja');
create type campaign_channel as enum ('whatsapp', 'email');
create type campaign_status as enum ('draft', 'scheduled', 'sending', 'sent', 'failed');
create type recipient_status as enum ('pending', 'sent', 'delivered', 'read', 'replied', 'bounced', 'failed', 'opted_out');
create type import_status as enum ('processing', 'completed', 'failed');
create type custom_field_type as enum ('text', 'number', 'date', 'select');

-- =========================================================
-- Perfiles (1:1 con auth.users)
-- =========================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  role user_role not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Eventos
-- =========================================================
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date,
  city text,
  country text,
  status text default 'planificado',
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- Contactos
-- =========================================================
create table contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  phone text, -- formato E.164, requerido para WhatsApp
  city text,
  state text,
  country text,
  source text, -- de dónde vino el contacto (landing, evento, importación, manual...)
  status contact_status not null default 'activo',
  whatsapp_opt_in boolean not null default true,
  email_opt_in boolean not null default true,
  owner_id uuid references profiles (id),
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_email_or_phone check (email is not null or phone is not null)
);

create index contacts_email_idx on contacts (lower(email));
create index contacts_phone_idx on contacts (phone);
create index contacts_status_idx on contacts (status);

create table contact_events (
  contact_id uuid references contacts (id) on delete cascade,
  event_id uuid references events (id) on delete cascade,
  relation text default 'asistente', -- asistente | comprador | lead | staff
  created_at timestamptz not null default now(),
  primary key (contact_id, event_id)
);

-- =========================================================
-- Etiquetas
-- =========================================================
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text default '#2563eb'
);

create table contact_tags (
  contact_id uuid references contacts (id) on delete cascade,
  tag_id uuid references tags (id) on delete cascade,
  primary key (contact_id, tag_id)
);

-- =========================================================
-- Listas personalizadas
-- =========================================================
create table lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_dynamic boolean not null default false, -- true = lista por filtro guardado
  filter_json jsonb, -- filtro guardado cuando is_dynamic = true
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table list_contacts (
  list_id uuid references lists (id) on delete cascade,
  contact_id uuid references contacts (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, contact_id)
);

-- =========================================================
-- Plantillas
-- =========================================================
create table whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  meta_template_name text not null,
  meta_template_id text,
  language text not null default 'es',
  category text, -- MARKETING | UTILITY | AUTHENTICATION
  status text, -- APPROVED | PENDING | REJECTED (sincronizado desde Meta)
  body_preview text,
  variables jsonb, -- ejemplo de variables/placeholders
  synced_at timestamptz not null default now()
);

create table email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  html_content text not null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Campañas
-- =========================================================
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel campaign_channel not null,
  status campaign_status not null default 'draft',
  list_id uuid references lists (id),
  whatsapp_template_id uuid references whatsapp_templates (id),
  email_template_id uuid references email_templates (id),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  constraint campaign_template_matches_channel check (
    (channel = 'whatsapp' and whatsapp_template_id is not null and email_template_id is null)
    or
    (channel = 'email' and email_template_id is not null and whatsapp_template_id is null)
  )
);

create table campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns (id) on delete cascade,
  contact_id uuid references contacts (id) on delete cascade,
  status recipient_status not null default 'pending',
  provider_message_id text, -- id devuelto por Meta o Resend
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  unique (campaign_id, contact_id)
);

create index campaign_recipients_campaign_idx on campaign_recipients (campaign_id);
create index campaign_recipients_status_idx on campaign_recipients (status);

-- =========================================================
-- Campos personalizados de contactos
-- =========================================================
create table custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  field_key text not null unique,
  type custom_field_type not null default 'text',
  options jsonb,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- Importaciones
-- =========================================================
create table imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  status import_status not null default 'processing',
  total_rows int default 0,
  processed_rows int default 0,
  error_rows int default 0,
  column_mapping jsonb,
  errors jsonb,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table profiles enable row level security;
alter table events enable row level security;
alter table contacts enable row level security;
alter table contact_events enable row level security;
alter table tags enable row level security;
alter table contact_tags enable row level security;
alter table lists enable row level security;
alter table list_contacts enable row level security;
alter table whatsapp_templates enable row level security;
alter table email_templates enable row level security;
alter table campaigns enable row level security;
alter table campaign_recipients enable row level security;
alter table imports enable row level security;
alter table custom_field_definitions enable row level security;

-- Helper: rol del usuario autenticado
create or replace function auth_role() returns user_role
language sql stable as $$
  select role from profiles where id = auth.uid();
$$;

-- Cualquier usuario autenticado (admin o user) puede leer/escribir sobre
-- los datos operativos de Booth; solo admin gestiona usuarios.
create policy "profiles: self read" on profiles
  for select using (auth.uid() = id or auth_role() = 'admin');
create policy "profiles: admin manage" on profiles
  for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "authenticated read/write: events" on events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: contacts" on contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: contact_events" on contact_events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: tags" on tags
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: contact_tags" on contact_tags
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: lists" on lists
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: list_contacts" on list_contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: whatsapp_templates" on whatsapp_templates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: email_templates" on email_templates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: campaigns" on campaigns
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: campaign_recipients" on campaign_recipients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: imports" on imports
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write: custom_field_definitions" on custom_field_definitions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Nota: estas policies dan acceso amplio a cualquier usuario autenticado como
-- punto de partida. Antes de producción, ajustar según el nivel de permisos
-- real que se quiera dar al rol 'user' (por ejemplo, restringir borrado de
-- contactos o gestión de plantillas solo a 'admin').

-- =========================================================
-- Trigger: crear profile automáticamente al registrarse
-- =========================================================
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
