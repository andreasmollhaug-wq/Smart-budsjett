-- Månedlig AI-meldingskvote per bruker (kalendermåned Europe/Oslo).

create table if not exists public.ai_monthly_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  year_month text not null,
  message_count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, year_month),
  constraint ai_monthly_usage_year_month_format check (year_month ~ '^\d{4}-\d{2}$')
);

create index if not exists ai_monthly_usage_user_idx on public.ai_monthly_usage (user_id);

alter table public.ai_monthly_usage enable row level security;

create policy "Users read own ai usage"
  on public.ai_monthly_usage for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.ai_monthly_usage from authenticated;
grant select on public.ai_monthly_usage to authenticated;

-- Øker teller etter vellykket AI-svar; kun via server med brukerens JWT.
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
