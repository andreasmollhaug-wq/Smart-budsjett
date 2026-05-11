-- Vedlegg/bilder per forum-post (lagres i bucket forum_attachments).
-- Rekkefølge: først INSERT innlegg, deretter Klient-upload til `{uid}/{post_id}/{filnavn}`, deretter RPC for rad i forum_post_attachment.

CREATE TABLE IF NOT EXISTS public.forum_post_attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_post (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  bytes INT NOT NULL CHECK (bytes > 0 AND bytes <= 5242880),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT forum_post_attachment_path_unique UNIQUE (post_id, storage_path)
);

CREATE INDEX IF NOT EXISTS forum_post_attachment_post_idx ON public.forum_post_attachment (post_id);

COMMENT ON TABLE public.forum_post_attachment IS
  'Metadata for filer lagret under Storage-bucket forum_attachments (sti: uid/post_id/filnavn).';

COMMENT ON COLUMN public.forum_post_attachment.storage_path IS
  'Komplett object path i forum_attachments bucket.';

ALTER TABLE public.forum_post_attachment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forum attachment read authenticated" ON public.forum_post_attachment;
CREATE POLICY "Forum attachment read authenticated"
  ON public.forum_post_attachment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.forum_post p
      INNER JOIN public.forum_thread t ON t.id = p.thread_id
      WHERE p.id = forum_post_attachment.post_id
        AND p.deleted_at IS NULL
        AND t.deleted_at IS NULL
    )
  );

-- Rad opprettes kun via RPC som validerer stistruktur og grenser.
DROP POLICY IF EXISTS "Forum attachment no direct inserts" ON public.forum_post_attachment;
CREATE POLICY "Forum attachment no direct inserts"
  ON public.forum_post_attachment FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS "Forum attachment no direct deletes" ON public.forum_post_attachment;
CREATE POLICY "Forum attachment no direct deletes"
  ON public.forum_post_attachment FOR DELETE
  TO authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Forum attachment no direct updates" ON public.forum_post_attachment;
CREATE POLICY "Forum attachment no direct updates"
  ON public.forum_post_attachment FOR UPDATE
  TO authenticated
  USING (FALSE);

CREATE OR REPLACE FUNCTION public.forum_register_post_attachment(
  p_post_id UUID,
  p_path TEXT,
  p_original_name TEXT,
  p_mime TEXT,
  p_bytes INT
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_prefix TEXT;
  v_file TEXT;
  v_att_id UUID;
  v_cnt INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.user_has_app_write_access() THEN
    RAISE EXCEPTION 'subscription_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.forum_post p
    INNER JOIN public.forum_thread t ON t.id = p.thread_id
    WHERE p.id = p_post_id
      AND p.author_id = v_uid
      AND p.deleted_at IS NULL
      AND t.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'forbidden_or_invalid_post';
  END IF;

  IF p_mime IS NULL OR p_mime NOT IN (
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf'
  ) THEN
    RAISE EXCEPTION 'invalid_mime';
  END IF;

  IF p_bytes IS NULL OR p_bytes < 1 OR p_bytes > 5242880 THEN
    RAISE EXCEPTION 'invalid_size';
  END IF;

  SELECT COUNT(*) INTO v_cnt FROM public.forum_post_attachment WHERE post_id = p_post_id;
  IF v_cnt >= 10 THEN
    RAISE EXCEPTION 'too_many_attachments';
  END IF;

  IF p_original_name IS NULL OR length(trim(p_original_name)) < 1 OR length(p_original_name) > 240 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  v_prefix := v_uid::text || '/' || p_post_id::text || '/';
  IF p_path IS NULL OR char_length(p_path) < char_length(v_prefix) THEN
    RAISE EXCEPTION 'invalid path';
  END IF;
  IF left(p_path, char_length(v_prefix)) <> v_prefix THEN
    RAISE EXCEPTION 'invalid path';
  END IF;
  IF position('..' IN p_path) > 0 THEN
    RAISE EXCEPTION 'invalid path';
  END IF;

  v_file := substr(p_path, char_length(v_prefix) + 1);
  IF v_file = '' OR v_file LIKE '%/%' OR char_length(v_file) > 200 THEN
    RAISE EXCEPTION 'invalid filename';
  END IF;
  IF v_file !~ '^[a-zA-Z0-9._-]+$' THEN
    RAISE EXCEPTION 'invalid filename';
  END IF;

  INSERT INTO public.forum_post_attachment (post_id, storage_path, file_name, mime_type, bytes, sort_order)
  VALUES (
    p_post_id,
    p_path,
    left(trim(both FROM p_original_name), 240),
    p_mime,
    p_bytes,
    COALESCE(v_cnt, 0)
  )
  RETURNING id INTO v_att_id;

  RETURN v_att_id;
END;
$$;

COMMENT ON FUNCTION public.forum_register_post_attachment(UUID, TEXT, TEXT, TEXT, INT) IS
  'Forum: verifiserer eier/av sendt vedleggsmønster og reg; oppretter attachment-rad.';

REVOKE ALL ON FUNCTION public.forum_register_post_attachment(UUID, TEXT, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_register_post_attachment(UUID, TEXT, TEXT, TEXT, INT) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum_attachments',
  'forum_attachments',
  TRUE,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = excluded.public;

DROP POLICY IF EXISTS "forum_attachments insert own post folder" ON storage.objects;
CREATE POLICY "forum_attachments insert own post folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'forum_attachments'
    AND cardinality(string_to_array(trim(name, '/'), '/')) = 3
    AND (string_to_array(trim(name, '/'), '/'))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.forum_post p
      INNER JOIN public.forum_thread t ON t.id = p.thread_id
      WHERE p.id::text = (string_to_array(trim(name, '/'), '/'))[2]
        AND p.author_id = auth.uid()
        AND p.deleted_at IS NULL
        AND t.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "forum_attachments select authenticated" ON storage.objects;
CREATE POLICY "forum_attachments select authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'forum_attachments');
