-- Forum: created_at på forum_profile for «nyeste medlemmer» på forsiden.

ALTER TABLE public.forum_profile
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.forum_profile fp
SET created_at = COALESCE(
  (
    SELECT MIN(ts)
    FROM (
      SELECT created_at AS ts
      FROM public.forum_thread
      WHERE author_id = fp.user_id
        AND deleted_at IS NULL
      UNION ALL
      SELECT created_at AS ts
      FROM public.forum_post
      WHERE author_id = fp.user_id
        AND deleted_at IS NULL
    ) u
  ),
  fp.updated_at
)
WHERE created_at IS NULL;

UPDATE public.forum_profile
SET created_at = NOW()
WHERE created_at IS NULL;

ALTER TABLE public.forum_profile
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.forum_profile
  ALTER COLUMN created_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS forum_profile_created_at_idx
  ON public.forum_profile (created_at DESC);

CREATE OR REPLACE FUNCTION public.forum_profile_touch_insert_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_profile_touch_ins_created ON public.forum_profile;
CREATE TRIGGER forum_profile_touch_ins_created
  BEFORE INSERT ON public.forum_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.forum_profile_touch_insert_created();

COMMENT ON COLUMN public.forum_profile.created_at IS
  'Når forumprofilen ble opprettet (backfill fra første synlige forumaktivitet der mulig).';
