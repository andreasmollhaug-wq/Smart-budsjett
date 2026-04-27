-- Roadmap: valgfritt bilde (Storage) + image_path + RPC (ingen generell bruker-UPDATE på feature_request)
-- Sletting av feature_request legger ikke til automatisk storage-sletting (v1); rydding kan gjøres i dashboard ved behov.

alter table public.feature_request
  add column if not exists image_path text;

comment on column public.feature_request.image_path is
  'Object path in bucket feature_request_images: {user_id}/{request_id}/{filename}. Settes kun via set_feature_request_image.';

-- Vedlegg: eierskap + abonnement + sti-validering; forhindrer omskaping av annen rads felt.
create or replace function public.set_feature_request_image(
  p_request_id uuid,
  p_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_created_by uuid;
  v_existing text;
  v_prefix text;
  v_file text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if not public.user_has_app_write_access() then
    raise exception 'subscription required';
  end if;

  select fr.created_by, fr.image_path
  into v_created_by, v_existing
  from public.feature_request fr
  where fr.id = p_request_id
  for update;

  if not found then
    raise exception 'not found';
  end if;
  if v_created_by <> v_uid then
    raise exception 'forbidden';
  end if;
  if v_existing is not null then
    raise exception 'image already set';
  end if;

  v_prefix := v_uid::text || '/' || p_request_id::text || '/';
  if p_path is null or char_length(p_path) < char_length(v_prefix) then
    raise exception 'invalid path';
  end if;
  if left(p_path, char_length(v_prefix)) <> v_prefix then
    raise exception 'invalid path';
  end if;
  if position('..' in p_path) > 0 then
    raise exception 'invalid path';
  end if;

  v_file := substr(p_path, char_length(v_prefix) + 1);
  if v_file = '' or v_file like '%/%' or char_length(v_file) > 200 then
    raise exception 'invalid filename';
  end if;
  if v_file !~ '^[a-zA-Z0-9._-]+$' then
    raise exception 'invalid filename';
  end if;

  update public.feature_request
  set
    image_path = p_path,
    updated_at = now()
  where id = p_request_id;
end;
$$;

comment on function public.set_feature_request_image is
  'Setter image_path når eier er innlogget, har app-skrivetilgang, stien følger mønster og image_path fortsatt er null.';

revoke all on function public.set_feature_request_image from public;
grant execute on function public.set_feature_request_image to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feature_request_images',
  'feature_request_images',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = excluded.public;

-- policy-navn: unike per bucket-operasjon
drop policy if exists "feature_request_images insert own request folder" on storage.objects;
create policy "feature_request_images insert own request folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'feature_request_images'
    and cardinality(string_to_array(trim(name, '/'), '/')) = 3
    and (string_to_array(trim(name, '/'), '/'))[1] = auth.uid()::text
    and exists (
      select 1
      from public.feature_request fr
      where
        fr.id = ((string_to_array(trim(name, '/'), '/'))[2])::uuid
        and fr.created_by = auth.uid()
    )
  );

drop policy if exists "feature_request_images select authenticated" on storage.objects;
create policy "feature_request_images select authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'feature_request_images');
