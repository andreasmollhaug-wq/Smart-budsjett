-- Forum: maks én visningstelling per bruker, tråd og kalenderdag (Europe/Oslo).
-- Reduserer kunstig inflated «mest lest» ved refresh og sidevisning i samme tråd.

CREATE TABLE IF NOT EXISTS public.forum_thread_view_dedup (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.forum_thread (id) ON DELETE CASCADE,
  view_day DATE NOT NULL,
  PRIMARY KEY (user_id, thread_id, view_day)
);

CREATE INDEX IF NOT EXISTS forum_thread_view_dedup_thread_day_idx
  ON public.forum_thread_view_dedup (thread_id, view_day);

ALTER TABLE public.forum_thread_view_dedup ENABLE ROW LEVEL SECURITY;

-- Kun RPC (SECURITY DEFINER) skal skrive; ingen direkte klienttilgang.
REVOKE ALL ON public.forum_thread_view_dedup FROM PUBLIC;

DROP POLICY IF EXISTS "Forum view dedup no client" ON public.forum_thread_view_dedup;
CREATE POLICY "Forum view dedup no client"
  ON public.forum_thread_view_dedup
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.forum_thread_view_dedup IS
  'Én rad per (bruker, tråd, dato) for å begrense forum_increment_thread_view til én teller per dag.';

CREATE OR REPLACE FUNCTION public.forum_increment_thread_view(p_thread_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_day DATE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;
  v_day := (timezone('Europe/Oslo', now()))::date;

  INSERT INTO public.forum_thread_view_dedup (user_id, thread_id, view_day)
  VALUES (v_uid, p_thread_id, v_day)
  ON CONFLICT (user_id, thread_id, view_day) DO NOTHING;

  IF FOUND THEN
    UPDATE public.forum_thread
       SET view_count = view_count + 1
     WHERE id = p_thread_id
       AND deleted_at IS NULL;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.forum_increment_thread_view(UUID) IS
  'Øker view_count med 1 høyst én gang per bruker/tråd/dag (Europe/Oslo).';

REVOKE ALL ON FUNCTION public.forum_increment_thread_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_increment_thread_view(UUID) TO authenticated;
