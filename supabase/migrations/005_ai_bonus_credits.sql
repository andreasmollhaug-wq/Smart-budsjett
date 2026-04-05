-- Ekstra AI-meldinger kjøpt via Stripe (bonus-pool per bruker, utløper ikke).

create table if not exists public.user_ai_bonus_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  credits int not null default 0,
  updated_at timestamptz not null default now(),
  constraint user_ai_bonus_credits_non_negative check (credits >= 0)
);

alter table public.user_ai_bonus_credits enable row level security;

create policy "Users read own bonus credits"
  on public.user_ai_bonus_credits for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.user_ai_bonus_credits from authenticated;
grant select on public.user_ai_bonus_credits to authenticated;

-- Idempotens for Stripe-webhook (én behandling per Checkout-økt)
create table if not exists public.ai_credit_purchase_log (
  stripe_checkout_session_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  credits_added int not null,
  created_at timestamptz not null default now()
);

alter table public.ai_credit_purchase_log enable row level security;
-- Ingen policies for authenticated — kun service_role

create or replace function public.complete_ai_credit_purchase_from_stripe(
  p_session_id text,
  p_user_id uuid,
  p_amount int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id text;
begin
  if p_session_id is null or p_user_id is null or p_amount is null or p_amount <= 0 then
    return false;
  end if;

  insert into public.ai_credit_purchase_log (stripe_checkout_session_id, user_id, credits_added)
  values (p_session_id, p_user_id, p_amount)
  on conflict (stripe_checkout_session_id) do nothing
  returning stripe_checkout_session_id into inserted_id;

  if inserted_id is null then
    return false;
  end if;

  insert into public.user_ai_bonus_credits (user_id, credits)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
  set
    credits = public.user_ai_bonus_credits.credits + p_amount,
    updated_at = now();

  return true;
end;
$$;

revoke all on function public.complete_ai_credit_purchase_from_stripe(text, uuid, int) from public;
grant execute on function public.complete_ai_credit_purchase_from_stripe(text, uuid, int) to service_role;

create or replace function public.decrement_ai_bonus_credit()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  new_count int;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'not authenticated';
  end if;

  update public.user_ai_bonus_credits
  set
    credits = credits - 1,
    updated_at = now()
  where user_id = uid and credits > 0
  returning credits into new_count;

  if new_count is null then
    raise exception 'no bonus credits';
  end if;

  return json_build_object('credits_remaining', new_count);
end;
$$;

grant execute on function public.decrement_ai_bonus_credit() to authenticated;
