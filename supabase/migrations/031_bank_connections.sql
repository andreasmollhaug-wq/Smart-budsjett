-- Neonomics / open banking: bank session per user + profile (not in user_app_state JSONB).

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id text not null,
  provider text not null default 'neonomics',
  bank_id text not null,
  bank_display_name text not null default 'DNB',
  session_id text not null,
  device_id text not null,
  selected_account_id text,
  consent_ok_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, profile_id, provider)
);

create index if not exists bank_connections_user_id_idx on public.bank_connections (user_id);

alter table public.bank_connections enable row level security;

create policy "Users read own bank_connections"
  on public.bank_connections for select
  using (auth.uid() = user_id);

create policy "Users insert own bank_connections"
  on public.bank_connections for insert
  with check (auth.uid() = user_id);

create policy "Users update own bank_connections"
  on public.bank_connections for update
  using (auth.uid() = user_id);

create policy "Users delete own bank_connections"
  on public.bank_connections for delete
  using (auth.uid() = user_id);
