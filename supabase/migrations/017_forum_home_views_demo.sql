-- Forum: forsideslister (siste / mest diskutert / mest lest), visningstelling, demodata.
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
-- Visningsteller (enkel «mest lest» – kan misbrukes, OK for MVP/demo)
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

-- ---------------------------------------------------------------------------
-- Demodata (~10 tråder, ~30 innlegg totalt) — kun hvis bruker finnes og ikke allerede seedet
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  uid UUID;
  cat_generelt UUID;
  cat_budsjett UUID;
  cat_sparing UUID;
  cat_gjeld UUID;
  tid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF uid IS NULL THEN
    RAISE NOTICE 'forum demo: ingen rad i auth.users — demodata hoppet over';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.forum_thread WHERE title LIKE '[Demo] %' LIMIT 1) THEN
    RAISE NOTICE 'forum demo: [Demo]-tråder finnes allerede — hoppet over';
    RETURN;
  END IF;

  SELECT id INTO cat_generelt FROM public.forum_category WHERE slug = 'generelt' LIMIT 1;
  SELECT id INTO cat_budsjett FROM public.forum_category WHERE slug = 'budsjett-tips' LIMIT 1;
  SELECT id INTO cat_sparing FROM public.forum_category WHERE slug = 'sparing' LIMIT 1;
  SELECT id INTO cat_gjeld FROM public.forum_category WHERE slug = 'gjeld' LIMIT 1;

  IF cat_generelt IS NULL OR cat_budsjett IS NULL OR cat_sparing IS NULL OR cat_gjeld IS NULL THEN
    RAISE NOTICE 'forum demo: mangler forventede kategorier — hoppet over';
    RETURN;
  END IF;

  -- Tråd 1
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_generelt, uid, '[Demo] Første måned med nullbudsjett – tips?', 142,
          NOW() - INTERVAL '2 hours')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Hei! Jeg vil prøve nullbudsjett i juni. Noen som har en enkel rutine for ukentlig gjennomgang?', TRUE),
    (tid, uid, 'Jeg setter av 15 min hver søndag og flytter «resten» til neste måneds buffer.', FALSE),
    (tid, uid, 'Jeg logger alt i appen samme dag – ellers hopper det over.', FALSE);

  -- Tråd 2
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_budsjett, uid, '[Demo] Faste vs variable utgifter – hvordan skiller dere?', 89,
          NOW() - INTERVAL '5 hours')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Lurer på om dere regner strøm som fast eller variabel hos dere.', TRUE),
    (tid, uid, 'Strøm = variabel hos oss; mat = variabel; husleie = fast.', FALSE),
    (tid, uid, 'Vi har egen linje til «vekter» på strøm hver måned så grafen ikke hopper.', FALSE);

  -- Tråd 3
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_sparing, uid, '[Demo] Bufferkonto: hvor mange måneders utgifter?', 201,
          NOW() - INTERVAL '1 day')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Målet vårt er tre måneder. Er det realistisk med boliglån og barnehage?', TRUE),
    (tid, uid, 'Vi bygget gradvis: først 1 måned, så 2, så 3.', FALSE),
    (tid, uid, 'Automatisk trekk rett etter lønn hjalp oss mest.', FALSE),
    (tid, uid, 'Husk at «buffer» er penger du ikke bruker til ferie – skille tydelig.', FALSE);

  -- Tråd 4
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_gjeld, uid, '[Demo] Snøball vs avdrag – hva valgte dere?', 56,
          NOW() - INTERVAL '3 days')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Vi har tre smågjeld og vil bli kvitt dem raskest mulig.', TRUE),
    (tid, uid, 'Snøball ga oss psykologisk mest effekt.', FALSE),
    (tid, uid, 'Rentemessig kan avdrag på dyreste først vinne – sjekk tallene dine.', FALSE);

  -- Tråd 5
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_budsjett, uid, '[Demo] Matbudsjett for familie på fem', 318,
          NOW() - INTERVAL '30 minutes')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Vi klarer ikke holde oss under 9k på mat. Tips til handel?', TRUE),
    (tid, uid, 'Ukesmeny + handleliste først. Mindre impulse i butikken.', FALSE),
    (tid, uid, 'Frys ned rester samme kveld – mindre takeaway.', FALSE);

  -- Tråd 6
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_sparing, uid, '[Demo] Pensjon IPS vs vanlig sparing', 44,
          NOW() - INTERVAL '8 days')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Lurer på om IPS er verdt maksgrensen hos oss som er 37.', TRUE),
    (tid, uid, 'Jeg fyler IPS først siden trekkordningen gjør det enkelt.', FALSE);

  -- Tråd 7
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_generelt, uid, '[Demo] Hvor ofte reviserer dere budsjettet?', 97,
          NOW() - INTERVAL '12 hours')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Månedlig mini-revisjon + større hvert kvartal. Overkill?', TRUE),
    (tid, uid, 'Vi gjør lett hver måned, stort ved lønnsoppgang eller rente.', FALSE);

  -- Tråd 8
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_gjeld, uid, '[Demo] Refinansiering – hva skal jeg sjekke?', 167,
          NOW() - INTERVAL '4 hours')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Fikk tilbud om lavere rente men gebyrer. Finner ikke fasiten.', TRUE),
    (tid, uid, 'Tegn opp effektiv rente INKL gebyrer og nedbetalingsplan.', FALSE),
    (tid, uid, 'Husk utsettelsesrett og forsikring – det kan vippe bildet.', FALSE);

  -- Tråd 9
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_budsjett, uid, '[Demo] Dugnad i lokallaget – må det i budsjetten?', 23,
          NOW() - INTERVAL '20 days')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Små klubbkontingenter og dugnadskaffe – mikrobeløp som likevel dukker opp.', TRUE),
    (tid, uid, 'Jeg setter 200 kr til «foreningsrot» og justerer når ting spiser det opp.', FALSE),
    (tid, uid, 'Kaffe og kaker ved dugnad havner lett i «resten». Eget punkt eller buffer.', FALSE),
    (tid, uid, 'Årlig kampanjerefusjon gjør også at det ikke står månedlig i budsjettet.', FALSE);

  -- Tråd 10
  INSERT INTO public.forum_thread (category_id, author_id, title, view_count, last_activity_at)
  VALUES (cat_sparing, uid, '[Demo] Felles sparing som par – én eller to kasser?', 76,
          NOW() - INTERVAL '6 hours')
  RETURNING id INTO tid;
  INSERT INTO public.forum_post (thread_id, author_id, body, is_first_post) VALUES
    (tid, uid, 'Vi vil spare til oppussing felles men ha hver vår «lommepenger».', TRUE),
    (tid, uid, 'Vi har mål konto for prosjekt + hver vår bufferkonto.', FALSE),
    (tid, uid, 'Tydelige regler for hva som er «felles» sparer masse diskusjon.', FALSE);

  RAISE NOTICE 'forum demo: 10 [Demo]-tråder med tilsammen 30 innlegg (første kjøring)';
END;
$$;
