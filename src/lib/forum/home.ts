import type { SupabaseClient } from '@supabase/supabase-js'

/** Samme lengde som `LEFT(TRIM(body), …)` i `forum_home_threads_base` / `forum_category_threads_base`. */
export const FORUM_THREAD_EXCERPT_MAX_CHARS = 160

/** Utdrag av åpningsinnlegg (trim + maks tegn), matcher SQL-forhåndsvisning i lister. */
export function forumFirstPostExcerpt(body: string | null | undefined): string {
  if (body == null || typeof body !== 'string') return ''
  const t = body.trim()
  if (t.length <= FORUM_THREAD_EXCERPT_MAX_CHARS) return t
  return t.slice(0, FORUM_THREAD_EXCERPT_MAX_CHARS)
}

/** Hent forkortet brødtekst for første synlige innlegg per tråd (fallback når RPC mangler). */
export async function mapForumFirstPostExcerpts(
  supabase: SupabaseClient,
  threadIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const ids = [...new Set(threadIds.filter((id) => id.length > 0))]
  if (ids.length === 0) return out

  const { data, error } = await supabase
    .from('forum_post')
    .select('thread_id, body')
    .eq('is_first_post', true)
    .is('deleted_at', null)
    .in('thread_id', ids)

  if (error || !data) return out

  for (const row of data) {
    const rec = row as { thread_id?: unknown; body?: unknown }
    const tid = typeof rec.thread_id === 'string' ? rec.thread_id : ''
    if (!tid) continue
    const body = typeof rec.body === 'string' ? rec.body : ''
    out.set(tid, forumFirstPostExcerpt(body))
  }
  return out
}

/** Rader fra RPC `forum_home_threads` (kolonnenavn som i SQL). */
export type ForumHomeThreadRow = {
  thread_id: string
  thread_title: string
  category_slug: string
  category_title: string
  last_activity_at: string
  view_count: number
  reply_count: number
  excerpt: string
}

export function parseForumHomeRows(data: unknown): ForumHomeThreadRow[] {
  if (!Array.isArray(data)) return []
  return data
    .map((row) => row as Record<string, unknown>)
    .map((row) => ({
      thread_id: String(row.thread_id ?? ''),
      thread_title: String(row.thread_title ?? ''),
      category_slug: String(row.category_slug ?? ''),
      category_title: String(row.category_title ?? ''),
      last_activity_at: String(row.last_activity_at ?? ''),
      view_count: typeof row.view_count === 'number' ? row.view_count : Number(row.view_count ?? 0),
      reply_count:
        typeof row.reply_count === 'number' ? row.reply_count : Number(row.reply_count ?? 0),
      excerpt: String(row.excerpt ?? ''),
    }))
    .filter((r) => r.thread_id.length > 0)
}

export function formatForumActivityTs(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export type ForumHomeSort = 'latest' | 'hot' | 'views'

export function forumHomeSortFromSearchParam(visning: string | undefined): ForumHomeSort {
  if (visning === 'diskusjon') return 'hot'
  if (visning === 'lest') return 'views'
  return 'latest'
}

/** Overskrift for aktiv sortering (forum-forside). */
export function forumHomeSortHeadingNb(sort: ForumHomeSort): string {
  switch (sort) {
    case 'hot':
      return 'Mest diskutert'
    case 'views':
      return 'Mest lest'
    default:
      return 'Siste aktivitet'
  }
}

/** Én forklaringslinje under overskrift. */
export function forumHomeSortSubtitleNb(sort: ForumHomeSort): string {
  switch (sort) {
    case 'hot':
      return 'Sortert etter antall svar (svar telles ikke med første innlegget i tråden).'
    case 'views':
      return 'Sortert etter antall åpninger av trådsiden.'
    default:
      return 'Sortert etter siste aktivitet på tråden (nytt svar eller ny tråd).'
  }
}
