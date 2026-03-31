-- Stripe-abonnement per bruker (oppdateres kun via webhook med service role).

create table if not exists public.user_subscription (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  status text not null default 'inactive',
  stripe_price_id text,
  plan text check (plan is null or plan in ('solo', 'family')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists user_subscription_stripe_subscription_id_idx
  on public.user_subscription (stripe_subscription_id);

alter table public.user_subscription enable row level security;

create policy "Users read own subscription"
  on public.user_subscription for select
  using (auth.uid() = user_id);
