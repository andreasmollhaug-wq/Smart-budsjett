-- Kjør i Supabase SQL Editor eller via CLI. Tabell for app-tilstand per innlogget bruker.

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

create policy "Users read own state"
  on public.user_app_state for select
  using (auth.uid() = user_id);

create policy "Users insert own state"
  on public.user_app_state for insert
  with check (auth.uid() = user_id);

create policy "Users update own state"
  on public.user_app_state for update
  using (auth.uid() = user_id);
