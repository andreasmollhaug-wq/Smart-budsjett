-- Neonomics: spor sist vellykket henting (manuell sync / senere cron).

alter table public.bank_connections
  add column if not exists last_sync_at timestamptz,
  add column if not exists last_sync_fetched_count int,
  add column if not exists last_sync_error text;
