import type { ForumSearchUrlInput } from '@/lib/forum/searchSchema'

export type ForumSearchHitRow = {
  thread_id: string
  thread_title: string
  category_slug: string
  category_title: string
  last_activity_at: string
  rank: number
  snippet: string
}

export function parseForumSearchRpcRows(data: unknown): ForumSearchHitRow[] {
  if (!Array.isArray(data)) return []
  return data
    .map((row) => row as Record<string, unknown>)
    .map((row) => ({
      thread_id: String(row.thread_id ?? ''),
      thread_title: String(row.thread_title ?? ''),
      category_slug: String(row.category_slug ?? ''),
      category_title: String(row.category_title ?? ''),
      last_activity_at: String(row.last_activity_at ?? ''),
      rank: typeof row.rank === 'number' ? row.rank : Number(row.rank ?? 0),
      snippet: String(row.snippet ?? ''),
    }))
    .filter((r) => r.thread_id.length > 0)
}

export function forumSearchRpcParams(parsed: ForumSearchUrlInput, categoryId: string | null) {
  const limit = 20
  const offset = (parsed.page - 1) * limit
  return {
    p_query: parsed.q,
    p_limit: limit,
    p_offset: offset,
    p_category_id: categoryId,
  } as const
}
