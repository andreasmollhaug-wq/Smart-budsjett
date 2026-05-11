-- Reparasjon hvis 015 allerede er kjørt: invoker-trigger blokkerer svar fra ikke-forfatter (RLS på forum_thread UPDATE).
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
