-- Fjern eldre forum-seed (tråder med tittelprefiks [Demo], tidligere inkludert i 017).
-- Innlegg, varsler, vedlegg m.m. følger FK CASCADE fra forum_thread / forum_post.

DELETE FROM public.forum_thread
WHERE title LIKE '[Demo] %';
