import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Aggregerer forum-bidrag pr. bruker.
 *
 * Statistikk:
 * - **Tråder startet**: rader i `forum_thread` der du er `author_id` og `deleted_at IS NULL`.
 * - **Svar**: rader i `forum_post` der du er `author_id`, `is_first_post = false`, `deleted_at IS NULL`.
 *   (Første innlegget i en tråd har `is_first_post = true` og telles ikke som «svar».)
 */
export async function fetchForumContributionCounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ threadCount: number; replyCount: number } | null> {
  const [threadRes, replyRes] = await Promise.all([
    supabase
      .from('forum_thread')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .is('deleted_at', null),
    supabase
      .from('forum_post')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('is_first_post', false)
      .is('deleted_at', null),
  ])

  if (threadRes.error || replyRes.error) {
    return null
  }

  return {
    threadCount: threadRes.count ?? 0,
    replyCount: replyRes.count ?? 0,
  }
}
