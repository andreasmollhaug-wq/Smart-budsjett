-- Forum MVP (isolert modul — prefiks forum_*).
-- Rollback ved sletting av modulen (rekkefølge): DROP TABLE IF EXISTS public.forum_report;
-- DROP TRIGGER/funksjoner på forum_*; DROP TABLE public.forum_post; DROP TABLE public.forum_thread;
-- DROP TABLE public.forum_category;
-- CASCADE variant: DROP TABLE public.forum_report CASCADE; DROP TABLE public.forum_post CASCADE; DROP TABLE public.forum_thread CASCADE; DROP TABLE public.forum_category CASCADE;
-- DROP FUNCTION IF EXISTS public.forum_create_thread(uuid, text, text);

-- ---------------------------------------------------------------------------
-- Tabeller
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.forum_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_thread (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.forum_category (id) ON DELETE RESTRICT,
  author_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS forum_thread_category_activity_idx
  ON public.forum_thread (category_id, last_activity_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS forum_thread_author_idx ON public.forum_thread (author_id);

CREATE TABLE IF NOT EXISTS public.forum_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.forum_thread (id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_first_post BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT forum_post_body_visible_nonempty CHECK (
    deleted_at IS NOT NULL OR length(trim(body)) >= 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS forum_post_one_first_per_thread_idx
  ON public.forum_post (thread_id) WHERE is_first_post = TRUE;

CREATE INDEX IF NOT EXISTS forum_post_thread_created_idx ON public.forum_post (thread_id, created_at);
CREATE INDEX IF NOT EXISTS forum_post_author_idx ON public.forum_post (author_id);

CREATE TABLE IF NOT EXISTS public.forum_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_post (id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.forum_thread (id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (length(trim(reason)) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (post_id IS NOT NULL)::INTEGER + (thread_id IS NOT NULL)::INTEGER = 1
  )
);

CREATE INDEX IF NOT EXISTS forum_report_reporter_idx ON public.forum_report (reporter_id);

-- ---------------------------------------------------------------------------
-- Hjelpefunksjoner og triggere (author-immutability, aktivitetstidspunkt, updated_at)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.forum_thread_touch_author_updated()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.author_id := auth.uid();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_thread_touch_ins ON public.forum_thread;
CREATE TRIGGER forum_thread_touch_ins
  BEFORE INSERT OR UPDATE ON public.forum_thread
  FOR EACH ROW EXECUTE FUNCTION public.forum_thread_touch_author_updated();

CREATE OR REPLACE FUNCTION public.forum_post_touch_author_updated()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.author_id := auth.uid();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_post_touch_ins_upd ON public.forum_post;
CREATE TRIGGER forum_post_touch_ins_upd
  BEFORE INSERT OR UPDATE ON public.forum_post
  FOR EACH ROW EXECUTE FUNCTION public.forum_post_touch_author_updated();

CREATE OR REPLACE FUNCTION public.forum_post_immutable_identity()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF NEW.thread_id IS DISTINCT FROM OLD.thread_id THEN
    RAISE EXCEPTION 'cannot_move_forum_post';
  END IF;
  IF NEW.is_first_post IS DISTINCT FROM OLD.is_first_post THEN
    RAISE EXCEPTION 'cannot_change_first_post_flag';
  END IF;
  IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'cannot_change_forum_author';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_post_identity_guard ON public.forum_post;
CREATE TRIGGER forum_post_identity_guard
  BEFORE UPDATE ON public.forum_post
  FOR EACH ROW EXECUTE FUNCTION public.forum_post_immutable_identity();

-- SECURITY DEFINER: svar fra andre enn trådforfatter trenger å oppdatere `last_activity_at`
-- uten å passere RLS («Forum thread update own» krever author_id = auth.uid()).
CREATE OR REPLACE FUNCTION public.forum_after_post_refresh_thread()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_thread t
       SET last_activity_at = NOW(),
           updated_at = NOW()
     WHERE t.id = NEW.thread_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS forum_post_after_insert_refresh ON public.forum_post;
CREATE TRIGGER forum_post_after_insert_refresh
  AFTER INSERT ON public.forum_post
  FOR EACH ROW EXECUTE FUNCTION public.forum_after_post_refresh_thread();

CREATE OR REPLACE FUNCTION public.forum_thread_immutable_identity()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF NEW.category_id IS DISTINCT FROM OLD.category_id THEN
    RAISE EXCEPTION 'cannot_change_forum_thread_category';
  END IF;
  IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'cannot_change_forum_thread_author';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_thread_identity_guard ON public.forum_thread;
CREATE TRIGGER forum_thread_identity_guard
  BEFORE UPDATE ON public.forum_thread
  FOR EACH ROW EXECUTE FUNCTION public.forum_thread_immutable_identity();

CREATE OR REPLACE FUNCTION public.forum_report_touch_reporter()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.reporter_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forum_report_touch_ins ON public.forum_report;
CREATE TRIGGER forum_report_touch_ins
  BEFORE INSERT ON public.forum_report
  FOR EACH ROW EXECUTE FUNCTION public.forum_report_touch_reporter();

-- ---------------------------------------------------------------------------
-- RPC: Atomisk ny tråd + første innlegg (unngår hodeløse tråder)
-- Klient-insert av forum_post med is_first_post = true er IKKE tillatt via RLS.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.forum_create_thread(
  p_category_id UUID,
  p_title TEXT,
  p_body TEXT
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = public
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
  'Forum: oppretter tråd og første innlegg i én transaksjon; krever user_has_app_write_access()';

GRANT EXECUTE ON FUNCTION public.forum_create_thread(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed: kategorier (idempotent)
-- ---------------------------------------------------------------------------

INSERT INTO public.forum_category (slug, title, description, sort_order)
VALUES
  ('generelt', 'Generelt', 'Alt som ikke passer andre emner.', 10),
  ('budsjett-tips', 'Budsjett-tips', 'Praktiske tips og erfaring.', 20),
  ('sparing', 'Sparing og mål', 'Spare mål og vaner.', 30),
  ('gjeld', 'Gjeld', 'Prioriteringer og nedbetaling.', 40)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.forum_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_report ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forum category read authenticated" ON public.forum_category;
CREATE POLICY "Forum category read authenticated"
  ON public.forum_category FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Forum thread read authenticated" ON public.forum_thread;
CREATE POLICY "Forum thread read authenticated"
  ON public.forum_thread FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Forum thread update own subscribed" ON public.forum_thread;
CREATE POLICY "Forum thread update own subscribed"
  ON public.forum_thread FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND author_id = auth.uid()
    AND public.user_has_app_write_access()
  )
  WITH CHECK (
    author_id = auth.uid()
    AND public.user_has_app_write_access()
  );

-- Ingen INSERT/DELETE på forum_thread for authenticated (kun via forum_create_thread).
DROP POLICY IF EXISTS "Forum post read authenticated open thread" ON public.forum_post;
CREATE POLICY "Forum post read authenticated open thread"
  ON public.forum_post FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.forum_thread t
      WHERE t.id = forum_post.thread_id
        AND t.deleted_at IS NULL
    )
  );

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
    )
  );

DROP POLICY IF EXISTS "Forum post update own subscribed" ON public.forum_post;
CREATE POLICY "Forum post update own subscribed"
  ON public.forum_post FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND public.user_has_app_write_access()
  )
  WITH CHECK (
    author_id = auth.uid()
    AND public.user_has_app_write_access()
  );

-- Ingen DELETE på klient — myk sletting via UPDATE (deleted_at, body erstattet i app eller beholdt).

DROP POLICY IF EXISTS "Forum report insert own reason" ON public.forum_report;
CREATE POLICY "Forum report insert own reason"
  ON public.forum_report FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
  );

DROP POLICY IF EXISTS "Forum report select own" ON public.forum_report;
CREATE POLICY "Forum report select own"
  ON public.forum_report FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());
