-- Én generering av månedsinnsikt (AI) per kalendermåned per bruker (Europe/Oslo).

create table if not exists public.monthly_insight_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  year_month text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, year_month),
  constraint monthly_insight_usage_year_month_format check (year_month ~ '^\d{4}-\d{2}$')
);

create index if not exists monthly_insight_usage_user_idx on public.monthly_insight_usage (user_id);

alter table public.monthly_insight_usage enable row level security;

create policy "Users read own monthly insight usage"
  on public.monthly_insight_usage for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.monthly_insight_usage from authenticated;
grant select on public.monthly_insight_usage to authenticated;

-- Første vellykkede insert per (bruker, kalendermåned) lykkes; duplikat gir ok=false.
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

-- Kalles fra API hvis OpenAI feiler etter vellykket try_insert (samme kalendermåned).
create or replace function public.refund_monthly_insight_generation(p_year_month text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from public.monthly_insight_usage
  where user_id = uid and year_month = p_year_month;
end;
$$;

grant execute on function public.refund_monthly_insight_generation(text) to authenticated;
