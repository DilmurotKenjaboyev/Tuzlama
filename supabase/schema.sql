create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product text not null,
  qty numeric not null,
  unit text not null,
  price numeric not null,
  dt timestamptz not null default now(),
  paid boolean not null default false
);

alter table stores enable row level security;
alter table entries enable row level security;

create policy "logged in users" on stores for all to authenticated using (true) with check (true);
create policy "logged in users" on entries for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table stores, entries;
