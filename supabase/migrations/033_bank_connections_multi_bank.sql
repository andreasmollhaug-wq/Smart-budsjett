-- Neonomics v1.6: flere banker per profil, auto-sync toggle, pending-telling.

alter table public.bank_connections
  drop constraint if exists bank_connections_user_id_profile_id_provider_key;

alter table public.bank_connections
  add column if not exists auto_sync_enabled boolean not null default false,
  add column if not exists pending_unmapped_count int not null default 0;

alter table public.bank_connections
  add constraint bank_connections_user_id_profile_id_bank_id_key
  unique (user_id, profile_id, bank_id);

create index if not exists bank_connections_auto_sync_idx
  on public.bank_connections (auto_sync_enabled)
  where auto_sync_enabled = true and consent_ok_at is not null;
