-- Forum: fulltekstsøk + enkel rate-limit per bruker/minutt.
-- Tittel vektes høyere enn brødtekst via ts_rank_cd-multiplikator på titteltreff.

CREATE INDEX IF NOT EXISTS forum_thread_title_fts_idx
  ON public.forum_thread USING gin (to_tsvector('norwegian', title));

CREATE INDEX IF NOT EXISTS forum_post_body_fts_idx
  ON public.forum_post USING gin (to_tsvector('norwegian', body));

CREATE TABLE IF NOT EXISTS public.forum_search_burst (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  minute_bucket timestamptz NOT NULL,
  search_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, minute_bucket)
);

ALTER TABLE public.forum_search_burst ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.forum_search_burst IS
  'Teller forum-søk per bruker/minutt; oppdateres fra forum_search_threads (SECURITY DEFINER).';

CREATE OR REPLACE FUNCTION public.forum_search_threads(
  p_query text,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
  thread_id uuid,
  thread_title text,
  category_slug text,
  category_title text,
  last_activity_at timestamptz,
  rank real,
  snippet text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_trim text;
  v_tsq tsquery;
  v_lim int;
  v_off int;
  v_cnt int;
  v_bucket timestamptz;
  v_max_per_min constant int := 40;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_trim := trim(both FROM coalesce(p_query, ''));
  IF length(v_trim) < 2 THEN
    RAISE EXCEPTION 'query_too_short';
  END IF;
  IF length(v_trim) > 200 THEN
    RAISE EXCEPTION 'query_too_long';
  END IF;

  v_bucket := date_trunc('minute', timezone('UTC', now()));

  SELECT search_count INTO v_cnt
  FROM public.forum_search_burst
  WHERE user_id = v_uid AND minute_bucket = v_bucket;

  IF coalesce(v_cnt, 0) >= v_max_per_min THEN
    RAISE EXCEPTION 'search_rate_limited';
  END IF;

  INSERT INTO public.forum_search_burst AS b (user_id, minute_bucket, search_count)
  VALUES (v_uid, v_bucket, 1)
  ON CONFLICT (user_id, minute_bucket) DO UPDATE
  SET search_count = public.forum_search_burst.search_count + 1;

  BEGIN
    v_tsq := plainto_tsquery('norwegian', v_trim);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN;
  END;

  IF v_tsq = ''::tsquery THEN
    RETURN;
  END IF;

  v_lim := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_off := greatest(coalesce(p_offset, 0), 0);

  RETURN QUERY
  WITH meta AS (
    SELECT
      t.id AS id,
      t.title AS thread_title,
      t.last_activity_at AS la,
      fc.slug AS cslug,
      fc.title AS ctitle
    FROM public.forum_thread t
    INNER JOIN public.forum_category fc ON fc.id = t.category_id
    WHERE t.deleted_at IS NULL
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
  ),
  title_hit AS (
    SELECT
      t.id AS tid,
      (ts_rank_cd(to_tsvector('norwegian', t.title), v_tsq)::double precision * 2.8) AS trk,
      ts_headline(
        'norwegian',
        t.title,
        v_tsq,
        'StartSel=** ,StopSel=**, MaxFragments=2, MaxWords=18, MinWords=8'
      ) AS tsnip
    FROM public.forum_thread t
    WHERE t.deleted_at IS NULL
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
      AND to_tsvector('norwegian', t.title) @@ v_tsq
  ),
  body_hit AS (
    SELECT
      p.thread_id AS tid,
      max(ts_rank_cd(to_tsvector('norwegian', p.body), v_tsq))::double precision AS brk,
      (array_agg(
        ts_headline(
          'norwegian',
          substring(p.body FROM 1 FOR 2600),
          v_tsq,
          'StartSel=** ,StopSel=**, MaxFragments=2, MaxWords=26, MinWords=10'
        )
        ORDER BY ts_rank_cd(to_tsvector('norwegian', p.body), v_tsq) DESC
      ))[1] AS bsnip
    FROM public.forum_post p
    INNER JOIN public.forum_thread t ON t.id = p.thread_id AND t.deleted_at IS NULL
    WHERE p.deleted_at IS NULL
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
      AND to_tsvector('norwegian', p.body) @@ v_tsq
    GROUP BY p.thread_id
  ),
  joined AS (
    SELECT
      coalesce(ti.tid, bi.tid) AS tid,
      CASE
        WHEN ti.trk IS NULL THEN bi.brk
        WHEN bi.brk IS NULL THEN ti.trk
        ELSE GREATEST(ti.trk, bi.brk)
      END AS best_r,
      CASE
        WHEN ti.trk IS NULL THEN bi.bsnip
        WHEN bi.brk IS NULL THEN ti.tsnip
        WHEN bi.brk > ti.trk THEN bi.bsnip
        ELSE ti.tsnip
      END AS best_snip
    FROM title_hit ti
    FULL OUTER JOIN body_hit bi ON bi.tid = ti.tid
  )
  SELECT
    m.id,
    m.thread_title::text,
    m.cslug::text,
    m.ctitle::text,
    m.la,
    j.best_r::real,
    coalesce(nullif(trim(j.best_snip), ''), left(m.thread_title::text, 140))::text
  FROM joined j
  INNER JOIN meta m ON m.id = j.tid
  ORDER BY j.best_r DESC, m.la DESC NULLS LAST
  LIMIT v_lim OFFSET v_off;
END;
$$;

COMMENT ON FUNCTION public.forum_search_threads(text, integer, integer, uuid) IS
  'Forum fulltekstsøk (tittel vektet). Krever innlogget bruker. Rate-limit: forum_search_burst.';

GRANT EXECUTE ON FUNCTION public.forum_search_threads(text, integer, integer, uuid) TO authenticated;
