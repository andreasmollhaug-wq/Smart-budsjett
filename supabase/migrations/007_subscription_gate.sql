-- Tilgangskontroll: full app-skriving krever aktiv Stripe-prøve/abonnement eller legacy_grandfathered (engangsmigrering).

-- Brukes i RLS og i AI-RPC-er (security definer).
create or replace function public.user_has_app_write_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_subscription s
    where s.user_id = auth.uid()
      and s.status in ('active', 'trialing', 'past_due', 'legacy_grandfathered')
  );
$$;

comment on function public.user_has_app_write_access() is
  'True når brukeren har full skrivetilgang til appdata (Stripe grace-statuser eller legacy_grandfathered).';

-- Bestefar: eksisterende brukere uten rad i user_subscription får varig tilgang uten kort.
insert into public.user_subscription (user_id, status, updated_at)
select u.id, 'legacy_grandfathered', now()
from auth.users u
where not exists (
  select 1 from public.user_subscription s where s.user_id = u.id
);

-- Eksisterende rader uten Stripe-abonnement (typisk inaktiv/avsluttet uten treff i webhook).
-- Unngå `incomplete` — kan være pågående Checkout.
update public.user_subscription
set status = 'legacy_grandfathered',
    updated_at = now()
where stripe_subscription_id is null
  and status in ('inactive', 'canceled', 'unpaid', 'incomplete_expired');

-- user_app_state: erstatt insert/update policies
drop policy if exists "Users insert own state" on public.user_app_state;
drop policy if exists "Users update own state" on public.user_app_state;

create policy "Users insert own state with subscription"
  on public.user_app_state for insert
  with check (auth.uid() = user_id and public.user_has_app_write_access());

create policy "Users update own state with subscription"
  on public.user_app_state for update
  using (auth.uid() = user_id and public.user_has_app_write_access());

-- Roadmap: skriving bak samme gate som appdata
drop policy if exists "Authenticated insert own feature requests" on public.feature_request;
create policy "Authenticated insert own feature requests"
  on public.feature_request for insert
  to authenticated
  with check (auth.uid() = created_by and public.user_has_app_write_access());

drop policy if exists "Users insert own votes" on public.feature_vote;
drop policy if exists "Users delete own votes" on public.feature_vote;

create policy "Users insert own votes"
  on public.feature_vote for insert
  to authenticated
  with check (auth.uid() = user_id and public.user_has_app_write_access());

create policy "Users delete own votes"
  on public.feature_vote for delete
  to authenticated
  using (auth.uid() = user_id and public.user_has_app_write_access());

-- AI-RPC: blokk direkte kall uten tilgang (API sjekker også; dette er ekstra lag).
create or replace function public.increment_ai_monthly_usage()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  ym text;
  uid uuid;
  new_count int;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if not public.user_has_app_write_access() then
    raise exception 'subscription required';
  end if;

  ym := to_char(timezone('Europe/Oslo', now()), 'YYYY-MM');

  insert into public.ai_monthly_usage (user_id, year_month, message_count)
  values (uid, ym, 1)
  on conflict (user_id, year_month) do update
  set
    message_count = public.ai_monthly_usage.message_count + 1,
    updated_at = now()
  returning public.ai_monthly_usage.message_count into new_count;

  return json_build_object('year_month', ym, 'message_count', new_count);
end;
$$;

grant execute on function public.increment_ai_monthly_usage() to authenticated;

create or replace function public.try_insert_monthly_insight_generation()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  ym text;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if not public.user_has_app_write_access() then
    raise exception 'subscription required';
  end if;

  ym := to_char(timezone('Europe/Oslo', now()), 'YYYY-MM');

  begin
    insert into public.monthly_insight_usage (user_id, year_month)
    values (uid, ym);
    return jsonb_build_object('ok', true, 'year_month', ym);
  exception
    when unique_violation then
      return jsonb_build_object('ok', false, 'year_month', ym, 'error', 'limit_reached');
  end;
end;
$$;

grant execute on function public.try_insert_monthly_insight_generation() to authenticated;
