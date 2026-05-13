-- Forum: aggreger tråder per kategori for forside (unngår henting av alle category_id-rader).
-- SECURITY INVOKER: RLS på forum_thread gjelder — samme synlige tråder som ved direkte SELECT.

CREATE OR REPLACE FUNCTION public.forum_thread_counts_by_category()
RETURNS TABLE (
  category_id UUID,
  thread_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET SEARCH_PATH = public
AS $$
  SELECT
    t.category_id,
    COUNT(*)::bigint AS thread_count
  FROM public.forum_thread t
  WHERE t.deleted_at IS NULL
  GROUP BY t.category_id;
$$;

REVOKE ALL ON FUNCTION public.forum_thread_counts_by_category() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_thread_counts_by_category() TO authenticated;

COMMENT ON FUNCTION public.forum_thread_counts_by_category() IS
  'Antall ikke-slettede tråder per kategori for innlogget bruker. RLS på forum_thread avgjør hvilke rader som telles (synlige tråder). Kategorier uten tråder returneres ikke.';
