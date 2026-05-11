-- Forum: profil (visningsnavn), redigeringsstempel, lås/fest tråd,
-- rapporter-status, abonnement og in-app-varsler, moderator-tabell.

-- ---------------------------------------------------------------------------
-- Profiler (valgfritt visningsnavn)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.forum_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT forum_profile_display_len CHECK (
    display_name IS NULL
    OR (length(trim(display_name)) >= 2 AND length(display_name) <= 80)
  )
);

ALTER TABLE public.forum_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forum profile read all" ON public.forum_profile;
CREATE POLICY "Forum profile read all"
  ON public.forum_profile FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Forum profile insert own" ON public.forum_profile;
CREATE POLICY "Forum profile insert own"
  ON public.forum_profile FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Forum profile update own" ON public.forum_profile;
CREATE POLICY "Forum profile update own"
  ON public.forum_profile FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.forum_profile_touch_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_profile_touch ON public.forum_profile;
CREATE TRIGGER forum_profile_touch
  BEFORE UPDATE ON public.forum_profile
  FOR EACH ROW EXECUTE FUNCTION public.forum_profile_touch_updated();

COMMENT ON TABLE public.forum_profile IS
  'Forum: valgfritt visningsnavn per bruker.';

-- ---------------------------------------------------------------------------
-- Moderatorer (sett manuelt INSERT i forum_moderator)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.forum_moderator (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.forum_moderator ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.forum_moderator FROM PUBLIC;

-- Les for egen sjekk i app (skjult hvis ikke moderator – bruk server query)
DROP POLICY IF EXISTS "Forum moderator self read" ON public.forum_moderator;
CREATE POLICY "Forum moderator self read"
  ON public.forum_moderator FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Utvidelser tråd / innlegg
-- ---------------------------------------------------------------------------

ALTER TABLE public.forum_thread
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.forum_post
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

COMMENT ON COLUMN public.forum_thread.is_locked IS 'Moderator: ingen nye svar når sann.';
COMMENT ON COLUMN public.forum_thread.is_pinned IS 'Visuell vekt i lister (Sortering håndteres i app eller senere view).';

-- ---------------------------------------------------------------------------
-- Rapportstatus
-- ---------------------------------------------------------------------------

ALTER TABLE public.forum_report
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

UPDATE public.forum_report SET status = 'open' WHERE status IS NULL;

ALTER TABLE public.forum_report
  DROP CONSTRAINT IF EXISTS forum_report_status_check;

ALTER TABLE public.forum_report
  ADD CONSTRAINT forum_report_status_check
  CHECK (status IN ('open', 'dismissed', 'resolved'));

-- Kombinert les: egen reporter eller moderator
DROP POLICY IF EXISTS "Forum report select own" ON public.forum_report;
CREATE POLICY "Forum report select own or mod"
  ON public.forum_report FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.forum_moderator m WHERE m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Forum report update mod" ON public.forum_report;
CREATE POLICY "Forum report update mod"
  ON public.forum_report FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forum_moderator m WHERE m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.forum_moderator m WHERE m.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Følg tråd + varsler
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.forum_thread_subscription (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.forum_thread (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

ALTER TABLE public.forum_thread_subscription ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS forum_thread_subscription_thread_idx
  ON public.forum_thread_subscription (thread_id);

DROP POLICY IF EXISTS "Forum subscription read own" ON public.forum_thread_subscription;
CREATE POLICY "Forum subscription read own"
  ON public.forum_thread_subscription FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Forum subscription insert own" ON public.forum_thread_subscription;
CREATE POLICY "Forum subscription insert own"
  ON public.forum_thread_subscription FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Forum subscription delete own" ON public.forum_thread_subscription;
CREATE POLICY "Forum subscription delete own"
  ON public.forum_thread_subscription FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.forum_notice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.forum_thread (id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.forum_post (id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'reply' CHECK (kind IN ('reply')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE (user_id, post_id)
);

ALTER TABLE public.forum_notice ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS forum_notice_user_unread_idx
  ON public.forum_notice (user_id, created_at DESC)
  WHERE read_at IS NULL;

DROP POLICY IF EXISTS "Forum notice read own" ON public.forum_notice;
CREATE POLICY "Forum notice read own"
  ON public.forum_notice FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Forum notice update own" ON public.forum_notice;
CREATE POLICY "Forum notice update own"
  ON public.forum_notice FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.forum_notice FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.forum_notice TO authenticated;

CREATE OR REPLACE FUNCTION public.forum_after_reply_notify_subscribers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;
  IF NEW.is_first_post IS TRUE THEN
    RETURN NEW;
  END IF;
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.forum_notice (user_id, thread_id, post_id, kind)
  SELECT s.user_id, NEW.thread_id, NEW.id, 'reply'
  FROM public.forum_thread_subscription s
  WHERE s.thread_id = NEW.thread_id
    AND s.user_id <> NEW.author_id
  ON CONFLICT (user_id, post_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_post_notify_subscribers ON public.forum_post;
CREATE TRIGGER forum_post_notify_subscribers
  AFTER INSERT ON public.forum_post
  FOR EACH ROW EXECUTE FUNCTION public.forum_after_reply_notify_subscribers();

-- ---------------------------------------------------------------------------
-- Ingen nye svar i låst tråd
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Forum post insert replies subscribed" ON public.forum_post;
CREATE POLICY "Forum post insert replies subscribed"
  ON public.forum_post FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND is_first_post = FALSE
    AND public.user_has_app_write_access()
    AND EXISTS (
      SELECT 1
      FROM public.forum_thread t
      WHERE t.id = forum_post.thread_id
        AND t.deleted_at IS NULL
        AND COALESCE(t.is_locked, FALSE) IS NOT TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- Moderator: lås / rapportstatus (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.forum_mod_set_thread_locked(
  p_thread_id UUID,
  p_locked BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.forum_moderator m WHERE m.user_id = v_uid) THEN
    RAISE EXCEPTION 'not_forum_moderator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.forum_thread t WHERE t.id = p_thread_id AND t.deleted_at IS NULL) THEN
    RAISE EXCEPTION 'forum_thread_not_found';
  END IF;

  UPDATE public.forum_thread
  SET is_locked = COALESCE(p_locked, FALSE),
      updated_at = NOW()
  WHERE id = p_thread_id;
END;
$$;

COMMENT ON FUNCTION public.forum_mod_set_thread_locked(UUID, BOOLEAN) IS
  'Forum moderator: åpner/låser tråd for nye svar.';

CREATE OR REPLACE FUNCTION public.forum_mod_set_report_status(
  p_report_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.forum_moderator m WHERE m.user_id = v_uid) THEN
    RAISE EXCEPTION 'not_forum_moderator';
  END IF;

  IF p_status NOT IN ('open', 'dismissed', 'resolved') THEN
    RAISE EXCEPTION 'invalid_report_status';
  END IF;

  UPDATE public.forum_report
  SET status = p_status,
      reviewed_at = CASE WHEN p_status = 'open' THEN NULL ELSE NOW() END
  WHERE id = p_report_id;
END;
$$;

COMMENT ON FUNCTION public.forum_mod_set_report_status(UUID, TEXT) IS
  'Forum moderator: setter rapportstatus.';

GRANT EXECUTE ON FUNCTION public.forum_mod_set_thread_locked(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.forum_mod_set_report_status(UUID, TEXT) TO authenticated;
