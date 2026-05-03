-- SmartVane: Web Push-påminnelser (prefs + abonnement per enhet).

create table if not exists public.smartvane_notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reminders_enabled boolean not null default false,
  reminder_hour_local smallint not null default 20 check (reminder_hour_local >= 0 and reminder_hour_local <= 23),
  timezone text not null default 'Europe/Oslo',
  last_reminder_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.smartvane_push_subscription (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint smartvane_push_subscription_endpoint_unique unique (endpoint)
);

create index if not exists smartvane_push_subscription_user_idx
  on public.smartvane_push_subscription (user_id);

alter table public.smartvane_notification_prefs enable row level security;
alter table public.smartvane_push_subscription enable row level security;

create policy "smartvane_notification_prefs select own"
  on public.smartvane_notification_prefs for select using (auth.uid() = user_id);
create policy "smartvane_notification_prefs upsert own"
  on public.smartvane_notification_prefs for insert with check (auth.uid() = user_id);
create policy "smartvane_notification_prefs update own"
  on public.smartvane_notification_prefs for update using (auth.uid() = user_id);
create policy "smartvane_notification_prefs delete own"
  on public.smartvane_notification_prefs for delete using (auth.uid() = user_id);

create policy "smartvane_push_subscription select own"
  on public.smartvane_push_subscription for select using (auth.uid() = user_id);
create policy "smartvane_push_subscription insert own"
  on public.smartvane_push_subscription for insert with check (auth.uid() = user_id);
create policy "smartvane_push_subscription update own"
  on public.smartvane_push_subscription for update using (auth.uid() = user_id);
create policy "smartvane_push_subscription delete own"
  on public.smartvane_push_subscription for delete using (auth.uid() = user_id);
