-- Frittstående prosjektmodul (oppussing): egen tilstand per bruker, ikke blandet med user_app_state.
-- Krever 007_subscription_gate.sql (user_has_app_write_access).

create table if not exists public.user_renovation_project_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{"version":1,"projects":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_renovation_project_state enable row level security;

create policy "Users read own renovation project state"
  on public.user_renovation_project_state for select
  using (auth.uid() = user_id);

create policy "Users insert own renovation project state with subscription"
  on public.user_renovation_project_state for insert
  with check (auth.uid() = user_id and public.user_has_app_write_access());

create policy "Users update own renovation project state with subscription"
  on public.user_renovation_project_state for update
  using (auth.uid() = user_id and public.user_has_app_write_access());
