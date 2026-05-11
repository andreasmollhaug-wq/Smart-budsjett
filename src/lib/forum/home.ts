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
