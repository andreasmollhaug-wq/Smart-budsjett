-- Neonomics v1.6: logg per sync (cron / manuell).

create table if not exists public.bank_sync_log (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.bank_connections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id text not null,
  bank_id text not null,
  trigger text not null check (trigger in ('cron', 'manual')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count int,
  imported_count int,
  skipped_unmapped int,
  duplicate_count int,
  error text
);

create index if not exists bank_sync_log_user_id_idx on public.bank_sync_log (user_id);
create index if not exists bank_sync_log_connection_id_idx on public.bank_sync_log (connection_id);

alter table public.bank_sync_log enable row level security;

create policy "Users read own bank_sync_log"
  on public.bank_sync_log for select
  using (auth.uid() = user_id);

create policy "Users insert own bank_sync_log"
  on public.bank_sync_log for insert
  with check (auth.uid() = user_id);
