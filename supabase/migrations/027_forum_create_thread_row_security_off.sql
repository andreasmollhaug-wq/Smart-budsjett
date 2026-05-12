-- forum_create_thread er SECURITY DEFINER, men i flere Postgres/Supabase-oppsett
-- evalueres RLS fortsatt mot session-brukeren ved INSERT. Ingen INSERT-policy finnes på
-- forum_thread (med vilje). Slå av row_security i funksjonen slik at den atomiske
-- tråd+første-innlegg-logikken fungerer som tenkt.

CREATE OR REPLACE FUNCTION public.forum_create_thread(
  p_category_id UUID,
  p_title TEXT,
  p_body TEXT
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_tid UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.user_has_app_write_access() THEN
    RAISE EXCEPTION 'subscription_required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.forum_category c WHERE c.id = p_category_id
  ) THEN
    RAISE EXCEPTION 'invalid_forum_category';
  END IF;
  INSERT INTO public.forum_thread (category_id, author_id, title)
  VALUES (
    p_category_id,
    v_uid,
    left(trim(both from p_title), 240)
  )
  RETURNING id INTO v_tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post)
  VALUES (v_tid, v_uid, trim(both from p_body), TRUE);
  RETURN v_tid;
END;
$$;

COMMENT ON FUNCTION public.forum_create_thread(UUID, TEXT, TEXT) IS
  'Forum: oppretter tråd og første innlegg i én transaksjon; krever user_has_app_write_access(). RLS av i funksjonen for INSERT.';

GRANT EXECUTE ON FUNCTION public.forum_create_thread(UUID, TEXT, TEXT) TO authenticated;
