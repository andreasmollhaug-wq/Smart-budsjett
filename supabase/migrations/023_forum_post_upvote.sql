-- Tommel opp på foruminnlegg: én stemme per bruker per innlegg.

CREATE TABLE IF NOT EXISTS public.forum_post_upvote (
  post_id UUID NOT NULL REFERENCES public.forum_post (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS forum_post_upvote_post_id_idx ON public.forum_post_upvote (post_id);

ALTER TABLE public.forum_post_upvote ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.forum_post_upvote IS 'Forum: én tommel opp per bruker per innlegg.';

DROP POLICY IF EXISTS "Forum upvote select authenticated" ON public.forum_post_upvote;
CREATE POLICY "Forum upvote select authenticated"
  ON public.forum_post_upvote FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Forum upvote insert own valid post" ON public.forum_post_upvote;
CREATE POLICY "Forum upvote insert own valid post"
  ON public.forum_post_upvote FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.user_has_app_write_access()
    AND EXISTS (
      SELECT 1
      FROM public.forum_post p
      WHERE p.id = forum_post_upvote.post_id
        AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Forum upvote delete own" ON public.forum_post_upvote;
CREATE POLICY "Forum upvote delete own"
  ON public.forum_post_upvote FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.forum_post_upvote FROM PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.forum_post_upvote TO authenticated;

CREATE OR REPLACE FUNCTION public.forum_post_upvote_counts(p_post_ids uuid[])
RETURNS TABLE (post_id uuid, cnt bigint)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT u.post_id, COUNT(*)::bigint AS cnt
  FROM public.forum_post_upvote u
  WHERE p_post_ids IS NOT NULL
    AND array_length(p_post_ids, 1) IS NOT NULL
    AND u.post_id = ANY (p_post_ids)
  GROUP BY u.post_id;
$$;

COMMENT ON FUNCTION public.forum_post_upvote_counts(uuid[]) IS
  'Antall tommel opp per innlegg for gitte post_id (tom tabell om tom input).';

REVOKE ALL ON FUNCTION public.forum_post_upvote_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_post_upvote_counts(uuid[]) TO authenticated;
