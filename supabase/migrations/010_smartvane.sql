-- SmartVane: månedsplan, vaner (daglig / ukentlig / månedlig), fullføringer.

create type public.smartvane_habit_kind as enum ('daily', 'weekly', 'monthly');

create table if not exists public.smartvane_month_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year smallint not null check (year >= 2000 and year <= 2100),
  month smallint not null check (month >= 1 and month <= 12),
  daily_goal_total int not null default 10 check (daily_goal_total >= 1 and daily_goal_total <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create table if not exists public.smartvane_habit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month_plan_id uuid not null references public.smartvane_month_plan (id) on delete cascade,
  kind public.smartvane_habit_kind not null,
  sort_order int not null default 0,
  name text not null,
  note text,
  target_days int null check (target_days is null or (target_days >= 1 and target_days <= 31)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists smartvane_habit_plan_idx on public.smartvane_habit (month_plan_id);
create index if not exists smartvane_habit_user_idx on public.smartvane_habit (user_id);

create table if not exists public.smartvane_completion_daily (
  habit_id uuid not null references public.smartvane_habit (id) on delete cascade,
  completed_on date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (habit_id, completed_on)
);

create index if not exists smartvane_completion_daily_user_date_idx
  on public.smartvane_completion_daily (user_id, completed_on);

create table if not exists public.smartvane_completion_weekly (
  habit_id uuid not null references public.smartvane_habit (id) on delete cascade,
  week_row smallint not null check (week_row >= 0 and week_row <= 4),
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

alter table public.smartvane_month_plan enable row level security;
alter table public.smartvane_habit enable row level security;
alter table public.smartvane_completion_daily enable row level security;
alter table public.smartvane_completion_weekly enable row level security;
alter table public.smartvane_completion_monthly enable row level security;

create policy "smartvane_month_plan select own"
  on public.smartvane_month_plan for select using (auth.uid() = user_id);
create policy "smartvane_month_plan insert own"
  on public.smartvane_month_plan for insert with check (auth.uid() = user_id);
create policy "smartvane_month_plan update own"
  on public.smartvane_month_plan for update using (auth.uid() = user_id);
create policy "smartvane_month_plan delete own"
  on public.smartvane_month_plan for delete using (auth.uid() = user_id);

create policy "smartvane_habit select own"
  on public.smartvane_habit for select using (auth.uid() = user_id);
create policy "smartvane_habit insert own"
  on public.smartvane_habit for insert with check (auth.uid() = user_id);
create policy "smartvane_habit update own"
  on public.smartvane_habit for update using (auth.uid() = user_id);
create policy "smartvane_habit delete own"
  on public.smartvane_habit for delete using (auth.uid() = user_id);

create policy "smartvane_completion_daily select own"
  on public.smartvane_completion_daily for select using (auth.uid() = user_id);
create policy "smartvane_completion_daily insert own"
  on public.smartvane_completion_daily for insert with check (auth.uid() = user_id);
create policy "smartvane_completion_daily delete own"
  on public.smartvane_completion_daily for delete using (auth.uid() = user_id);

create policy "smartvane_completion_weekly select own"
  on public.smartvane_completion_weekly for select using (auth.uid() = user_id);
create policy "smartvane_completion_weekly insert own"
  on public.smartvane_completion_weekly for insert with check (auth.uid() = user_id);
create policy "smartvane_completion_weekly delete own"
  on public.smartvane_completion_weekly for delete using (auth.uid() = user_id);

create policy "smartvane_completion_monthly select own"
  on public.smartvane_completion_monthly for select using (auth.uid() = user_id);
create policy "smartvane_completion_monthly insert own"
  on public.smartvane_completion_monthly for insert with check (auth.uid() = user_id);
create policy "smartvane_completion_monthly delete own"
  on public.smartvane_completion_monthly for delete using (auth.uid() = user_id);
