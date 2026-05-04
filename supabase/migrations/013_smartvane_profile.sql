/* Månedsplan per budsjettprofil (Zustand). Unik på (user_id, profile_id, år, måned). Kjør etter 010. */

alter table public.smartvane_month_plan
  add column if not exists profile_id text not null default 'default';

comment on column public.smartvane_month_plan.profile_id is
  'Budsjettprofil fra app (Zustand). «default» = hovedprofil.';

alter table public.smartvane_month_plan
  drop constraint if exists smartvane_month_plan_user_id_year_month_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'smartvane_month_plan'
      and c.conname = 'smartvane_month_plan_user_profile_year_month_key'
  ) then
    alter table public.smartvane_month_plan
      add constraint smartvane_month_plan_user_profile_year_month_key
      unique (user_id, profile_id, year, month);
  end if;
end $$;
