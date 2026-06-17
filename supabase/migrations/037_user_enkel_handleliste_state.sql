-- Enkel handleliste (intern modul): egen tilstand per bruker.
-- Krever 007_subscription_gate.sql (user_has_app_write_access).

create table if not exists public.user_enkel_handleliste_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{"version":1,"groups":[],"lists":[],"items":[],"settings":{"capitalizeWords":false,"showQuantity":true,"shakeToSortEnabled":true},"activity":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_enkel_handleliste_state enable row level security;

create policy "Users read own enkel handleliste state"
  on public.user_enkel_handleliste_state for select
  using (auth.uid() = user_id);

create policy "Users insert own enkel handleliste state with subscription"
  on public.user_enkel_handleliste_state for insert
  with check (auth.uid() = user_id and public.user_has_app_write_access());

create policy "Users update own enkel handleliste state with subscription"
  on public.user_enkel_handleliste_state for update
  using (auth.uid() = user_id and public.user_has_app_write_access());

-- Realtime sync mellom enheter (samme konto)
alter publication supabase_realtime add table public.user_enkel_handleliste_state;
