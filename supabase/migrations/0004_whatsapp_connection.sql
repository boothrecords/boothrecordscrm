create table if not exists whatsapp_connection (
  id smallint primary key default 1 check (id = 1),
  phone_number_id text,
  waba_id text,
  business_name text,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table whatsapp_connection enable row level security;

create policy "authenticated read/write: whatsapp_connection" on whatsapp_connection
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
