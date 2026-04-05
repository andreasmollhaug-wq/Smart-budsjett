-- Roadmap: forslag og stemming (innloggede brukere). Status endres av admin i Supabase eller via service role.

create table if not exists public.feature_request (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'in_progress', 'done', 'rejected')),
  vote_count integer not null default 0 check (vote_count >= 0),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feature_request_status_idx on public.feature_request (status);
create index if not exists feature_request_created_at_idx on public.feature_request (created_at desc);

alter table public.feature_request enable row level security;

create policy "Authenticated read feature requests"
  on public.feature_request for select
  to authenticated
  using (true);

create policy "Authenticated insert own feature requests"
  on public.feature_request for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Hindre at klient setter vote_count ved innsending (oppdateres kun via trigger på stemmer).
create or replace function public.feature_request_reset_vote_count_on_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.vote_count := 0;
  return new;
end;
$$;

drop trigger if exists feature_request_vote_count_guard on public.feature_request;
create trigger feature_request_vote_count_guard
  before insert on public.feature_request
  for each row execute function public.feature_request_reset_vote_count_on_insert();

create table if not exists public.feature_vote (
  request_id uuid not null references public.feature_request (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (request_id, user_id)
);

create index if not exists feature_vote_user_id_idx on public.feature_vote (user_id);

alter table public.feature_vote enable row level security;

create policy "Users read own votes"
  on public.feature_vote for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own votes"
  on public.feature_vote for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users delete own votes"
  on public.feature_vote for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.feature_vote_sync_request_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.feature_request
      set vote_count = vote_count + 1,
          updated_at = now()
      where id = new.request_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.feature_request
      set vote_count = greatest(0, vote_count - 1),
          updated_at = now()
      where id = old.request_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists feature_vote_sync_count on public.feature_vote;
create trigger feature_vote_sync_count
  after insert or delete on public.feature_vote
  for each row execute function public.feature_vote_sync_request_count();
