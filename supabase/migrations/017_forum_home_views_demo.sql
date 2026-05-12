-- Forum: forsideslister (siste / mest diskutert / mest lest) og visningstelling (view_count).
-- Kjør etter 015 (+ 016 om aktuelt). Idempotent der det lar seg gjøre.

-- ---------------------------------------------------------------------------
-- Triggere: tillat eksplisitt author_id ved migrasjon/seed (auth.uid() er NULL)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.forum_thread_touch_author_updated()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.author_id := auth.uid();
    ELSIF NEW.author_id IS NULL THEN
      RAISE EXCEPTION 'forum_thread: author_id mangler';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.forum_post_touch_author_updated()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.author_id := auth.uid();
    ELSIF NEW.author_id IS NULL THEN
      RAISE EXCEPTION 'forum_post: author_id mangler';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Visningsteller (enkel «mest lest» — kan misbrukes; vurder validering/ratelimit i app)
-- ---------------------------------------------------------------------------

ALTER TABLE public.forum_thread
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0);

CREATE INDEX IF NOT EXISTS forum_thread_view_count_idx ON public.forum_thread (view_count DESC);

CREATE OR REPLACE FUNCTION public.forum_increment_thread_view(p_thread_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
  UPDATE public.forum_thread
     SET view_count = view_count + 1
   WHERE id = p_thread_id
     AND deleted_at IS NULL;
$$;

COMMENT ON FUNCTION public.forum_increment_thread_view(UUID) IS
  'Øker view_count med 1 for synlig tråd; definer for å unngå RLS på forum_thread UPDATE.';

REVOKE ALL ON FUNCTION public.forum_increment_thread_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_increment_thread_view(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Forside-liste (Discourse-inspirert): latest / hot / views
-- Merk: base-funksjonen må opprettes før forum_home_threads.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.forum_home_threads_base()
RETURNS TABLE (
  thread_id UUID,
  thread_title TEXT,
  category_slug TEXT,
  category_title TEXT,
  last_activity_at TIMESTAMPTZ,
  view_count INT,
  reply_count BIGINT,
  excerpt TEXT
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
  SELECT
    t.id,
    t.title,
    c.slug,
    c.title,
    t.last_activity_at,
    t.view_count,
    COALESCE((
      SELECT COUNT(*)::BIGINT
      FROM public.forum_post p
      WHERE p.thread_id = t.id
        AND p.deleted_at IS NULL
        AND p.is_first_post = FALSE
    ), 0),
    COALESCE((
      SELECT LEFT(TRIM(p.body), 160)
      FROM public.forum_post p
      WHERE p.thread_id = t.id
        AND p.deleted_at IS NULL
        AND p.is_first_post = TRUE
      ORDER BY p.created_at ASC
      LIMIT 1
    ), '')
  FROM public.forum_thread t
  JOIN public.forum_category c ON c.id = t.category_id
  WHERE t.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.forum_home_threads(p_mode TEXT DEFAULT 'latest', p_limit INT DEFAULT 15)
RETURNS TABLE (
  thread_id UUID,
  thread_title TEXT,
  category_slug TEXT,
  category_title TEXT,
  last_activity_at TIMESTAMPTZ,
  view_count INT,
  reply_count BIGINT,
  excerpt TEXT
)
LANGUAGE PLPGSQL
STABLE
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
DECLARE
  lim INT := GREATEST(1, LEAST(COALESCE(p_limit, 15), 50));
  mode TEXT := lower(trim(both from COALESCE(p_mode, 'latest')));
BEGIN
  IF mode IS NULL OR mode NOT IN ('latest', 'hot', 'views') THEN
    mode := 'latest';
  END IF;

  IF mode = 'latest' THEN
    RETURN QUERY
    SELECT b.thread_id, b.thread_title, b.category_slug, b.category_title,
           b.last_activity_at, b.view_count, b.reply_count, b.excerpt
    FROM public.forum_home_threads_base() b
    ORDER BY b.last_activity_at DESC NULLS LAST
    LIMIT lim;
  ELSIF mode = 'hot' THEN
    RETURN QUERY
    SELECT b.thread_id, b.thread_title, b.category_slug, b.category_title,
           b.last_activity_at, b.view_count, b.reply_count, b.excerpt
    FROM public.forum_home_threads_base() b
    ORDER BY b.reply_count DESC, b.last_activity_at DESC NULLS LAST
    LIMIT lim;
  ELSE
    RETURN QUERY
    SELECT b.thread_id, b.thread_title, b.category_slug, b.category_title,
           b.last_activity_at, b.view_count, b.reply_count, b.excerpt
    FROM public.forum_home_threads_base() b
    ORDER BY b.view_count DESC, b.last_activity_at DESC NULLS LAST
    LIMIT lim;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.forum_home_threads_base() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_home_threads_base() TO authenticated;

REVOKE ALL ON FUNCTION public.forum_home_threads(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_home_threads(TEXT, INT) TO authenticated;
