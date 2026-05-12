-- Forum: trådliste per kategori med samme sortering som forsiden (latest / hot / views) og offset-paginering.
-- Forutsetter 017 (view_count, forum_home_threads-mønster).

CREATE OR REPLACE FUNCTION public.forum_category_threads_base(p_category_id uuid)
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
  WHERE t.deleted_at IS NULL
    AND t.category_id = p_category_id;
$$;

CREATE OR REPLACE FUNCTION public.forum_category_threads(
  p_category_id uuid,
  p_mode TEXT DEFAULT 'latest',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
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
  lim INT := GREATEST(1, LEAST(COALESCE(p_limit, 20), 50));
  off INT := GREATEST(COALESCE(p_offset, 0), 0);
  mode TEXT := lower(trim(both FROM COALESCE(p_mode, 'latest')));
BEGIN
  IF mode IS NULL OR mode NOT IN ('latest', 'hot', 'views') THEN
    mode := 'latest';
  END IF;

  IF mode = 'latest' THEN
    RETURN QUERY
    SELECT b.thread_id, b.thread_title, b.category_slug, b.category_title,
           b.last_activity_at, b.view_count, b.reply_count, b.excerpt
    FROM public.forum_category_threads_base(p_category_id) b
    ORDER BY b.last_activity_at DESC NULLS LAST
    LIMIT lim OFFSET off;
  ELSIF mode = 'hot' THEN
    RETURN QUERY
    SELECT b.thread_id, b.thread_title, b.category_slug, b.category_title,
           b.last_activity_at, b.view_count, b.reply_count, b.excerpt
    FROM public.forum_category_threads_base(p_category_id) b
    ORDER BY b.reply_count DESC, b.last_activity_at DESC NULLS LAST
    LIMIT lim OFFSET off;
  ELSE
    RETURN QUERY
    SELECT b.thread_id, b.thread_title, b.category_slug, b.category_title,
           b.last_activity_at, b.view_count, b.reply_count, b.excerpt
    FROM public.forum_category_threads_base(p_category_id) b
    ORDER BY b.view_count DESC, b.last_activity_at DESC NULLS LAST
    LIMIT lim OFFSET off;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.forum_category_threads_base(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_category_threads_base(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.forum_category_threads(UUID, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_category_threads(UUID, TEXT, INT, INT) TO authenticated;

COMMENT ON FUNCTION public.forum_category_threads(UUID, TEXT, INT, INT) IS
  'Forum kategoriside: tråder med forsidenes sortering og paginering (limit/offset).';
