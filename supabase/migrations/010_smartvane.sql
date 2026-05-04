/*
  SmartVane: månedsplan, vaner, fullføringer, RLS. Kjør 013 etter for profile_id.
  Gjenkjørbar ved delvise kjøringer (type / tabeller / policies).
*/

do $$
begin
  create type public.smartvane_habit_kind as enum ('daily', 'weekly', 'monthly');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.smartvane_month_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year smallint not null check (year between 2000 and 2100),
  month smallint not null check (month between 1 and 12),
  daily_goal_total int not null default 10 check (daily_goal_total between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint smartvane_month_plan_user_id_year_month_key unique (user_id, year, month)
);

create table if not exists public.smartvane_habit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month_plan_id uuid not null references public.smartvane_month_plan (id) on delete cascade,
  kind public.smartvane_habit_kind not null,
  sort_order int not null default 0,
  name text not null,
  note text,
  target_days int null check (target_days is null or target_days between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.smartvane_completion_daily (
  habit_id uuid not null references public.smartvane_habit (id) on delete cascade,
  completed_on date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (habit_id, completed_on)
);

create table if not exists public.smartvane_completion_weekly (
  habit_id uuid not null references public.smartvane_habit (id) on delete cascade,
  week_row smallint not null check (week_row between 0 and 4),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (habit_id, week_row)
);

create table if not exists public.smartvane_completion_monthly (
  habit_id uuid not null references public.smartvane_habit (id) on delete cascade,
  slot smallint not null check (slot in (0, 1)),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (habit_id, slot)
);

create index if not exists smartvane_habit_plan_idx on public.smartvane_habit (month_plan_id);
create index if not exists smartvane_habit_user_idx on public.smartvane_habit (user_id);
create index if not exists smartvane_completion_daily_user_date_idx on public.smartvane_completion_daily (user_id, completed_on);

alter table public.smartvane_month_plan enable row level security;
alter table public.smartvane_habit enable row level security;
alter table public.smartvane_completion_daily enable row level security;
alter table public.smartvane_completion_weekly enable row level security;
alter table public.smartvane_completion_monthly enable row level security;

drop policy if exists smartvane_month_plan_select_own on public.smartvane_month_plan;
drop policy if exists smartvane_month_plan_insert_own on public.smartvane_month_plan;
drop policy if exists smartvane_month_plan_update_own on public.smartvane_month_plan;
drop policy if exists smartvane_month_plan_delete_own on public.smartvane_month_plan;
create policy smartvane_month_plan_select_own on public.smartvane_month_plan for select using (auth.uid() = user_id);
create policy smartvane_month_plan_insert_own on public.smartvane_month_plan for insert with check (auth.uid() = user_id);
create policy smartvane_month_plan_update_own on public.smartvane_month_plan for update using (auth.uid() = user_id);
create policy smartvane_month_plan_delete_own on public.smartvane_month_plan for delete using (auth.uid() = user_id);

drop policy if exists smartvane_habit_select_own on public.smartvane_habit;
drop policy if exists smartvane_habit_insert_own on public.smartvane_habit;
drop policy if exists smartvane_habit_update_own on public.smartvane_habit;
drop policy if exists smartvane_habit_delete_own on public.smartvane_habit;
create policy smartvane_habit_select_own on public.smartvane_habit for select using (auth.uid() = user_id);
create policy smartvane_habit_insert_own on public.smartvane_habit for insert with check (auth.uid() = user_id);
create policy smartvane_habit_update_own on public.smartvane_habit for update using (auth.uid() = user_id);
create policy smartvane_habit_delete_own on public.smartvane_habit for delete using (auth.uid() = user_id);

drop policy if exists smartvane_completion_daily_select_own on public.smartvane_completion_daily;
drop policy if exists smartvane_completion_daily_insert_own on public.smartvane_completion_daily;
drop policy if exists smartvane_completion_daily_delete_own on public.smartvane_completion_daily;
create policy smartvane_completion_daily_select_own on public.smartvane_completion_daily for select using (auth.uid() = user_id);
create policy smartvane_completion_daily_insert_own on public.smartvane_completion_daily for insert with check (auth.uid() = user_id);
create policy smartvane_completion_daily_delete_own on public.smartvane_completion_daily for delete using (auth.uid() = user_id);

drop policy if exists smartvane_completion_weekly_select_own on public.smartvane_completion_weekly;
drop policy if exists smartvane_completion_weekly_insert_own on public.smartvane_completion_weekly;
drop policy if exists smartvane_completion_weekly_delete_own on public.smartvane_completion_weekly;
create policy smartvane_completion_weekly_select_own on public.smartvane_completion_weekly for select using (auth.uid() = user_id);
create policy smartvane_completion_weekly_insert_own on public.smartvane_completion_weekly for insert with check (auth.uid() = user_id);
create policy smartvane_completion_weekly_delete_own on public.smartvane_completion_weekly for delete using (auth.uid() = user_id);

drop policy if exists smartvane_completion_monthly_select_own on public.smartvane_completion_monthly;
drop policy if exists smartvane_completion_monthly_insert_own on public.smartvane_completion_monthly;
drop policy if exists smartvane_completion_monthly_delete_own on public.smartvane_completion_monthly;
create policy smartvane_completion_monthly_select_own on public.smartvane_completion_monthly for select using (auth.uid() = user_id);
create policy smartvane_completion_monthly_insert_own on public.smartvane_completion_monthly for insert with check (auth.uid() = user_id);
create policy smartvane_completion_monthly_delete_own on public.smartvane_completion_monthly for delete using (auth.uid() = user_id);
