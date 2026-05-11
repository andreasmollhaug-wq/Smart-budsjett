import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ForumBetaNav from './ForumBetaNav'

export const metadata: Metadata = {
  title: 'Forum (beta)',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ForumBetaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let unreadForumCount = 0
  let isModerator = false

  if (user) {
    const notices = await supabase
      .from('forum_notice')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)
    if (!notices.error) {
      unreadForumCount = notices.count ?? 0
    }

    const mod = await supabase.from('forum_moderator').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!mod.error && mod.data) {
      isModerator = true
    }
  }

  return (
    <>
      {user ? <ForumBetaNav unreadForumCount={unreadForumCount} isModerator={isModerator} /> : null}
      {children}
    </>
  )
}
