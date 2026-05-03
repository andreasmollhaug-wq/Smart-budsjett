-- SmartVane: månedsplan per budsjettprofil (samme innloggede konto).
-- Eksisterende rader får profile_id = default (hovedprofil). Unik-indeksen for
-- (user_id, profile_id, year, month) dekker også oppslag på (user_id, profile_id) via venstre prefiks.
-- Idempotent: trygg å kjøre flere ganger (f.eks. i SQL Editor).

alter table public.smartvane_month_plan
  add column if not exists profile_id text not null default 'default';

comment on column public.smartvane_month_plan.profile_id is
  'Budsjettprofil (samme ID som i appens Zustand). «default» = hovedprofil.';

alter table public.smartvane_month_plan
  drop constraint if exists smartvane_month_plan_user_id_year_month_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'smartvane_month_plan'
      and c.conname = 'smartvane_month_plan_user_profile_year_month_key'
  ) then
    alter table public.smartvane_month_plan
      add constraint smartvane_month_plan_user_profile_year_month_key
      unique (user_id, profile_id, year, month);
  end if;
end $$;
