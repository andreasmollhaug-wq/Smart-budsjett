-- Visningsnavn i forum: maks 20 tegn (kortere, tydelig i lister).

UPDATE public.forum_profile
SET display_name = NULL
WHERE display_name IS NOT NULL
  AND length(trim(display_name)) < 2;

UPDATE public.forum_profile
SET display_name = left(trim(display_name), 20)
WHERE display_name IS NOT NULL
  AND length(trim(display_name)) > 20;

ALTER TABLE public.forum_profile DROP CONSTRAINT IF EXISTS forum_profile_display_len;
ALTER TABLE public.forum_profile
  ADD CONSTRAINT forum_profile_display_len
  CHECK (
    display_name IS NULL
    OR (length(trim(display_name)) >= 2 AND length(display_name) <= 20)
  );
