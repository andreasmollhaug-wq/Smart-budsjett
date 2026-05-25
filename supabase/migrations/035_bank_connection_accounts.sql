-- Multi-account Neonomics sync: valgte kontoer + cache for UI.

alter table public.bank_connections
  add column if not exists sync_account_ids text[] not null default '{}',
  add column if not exists accounts_cache jsonb not null default '[]'::jsonb;

update public.bank_connections
set sync_account_ids = array[selected_account_id]::text[]
where selected_account_id is not null
  and (sync_account_ids is null or cardinality(sync_account_ids) = 0);

alter table public.bank_sync_log
  add column if not exists account_id text;

create index if not exists bank_sync_log_account_id_idx
  on public.bank_sync_log (connection_id, account_id)
  where account_id is not null;
