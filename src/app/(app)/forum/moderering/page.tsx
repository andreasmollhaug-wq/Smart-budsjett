import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import ForumSearchStripe from '@/components/forum/ForumSearchStripe'
import ForumModerationReports from '@/components/forum/ForumModerationReports'
import { createClient } from '@/lib/supabase/server'
import ForumInfoBanner from '@/components/forum/ForumInfoBanner'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

export default async function ForumModereringPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const mod = await supabase.from('forum_moderator').select('user_id').eq('user_id', user.id).maybeSingle()

  const isMod =
    !(mod?.error ?? null) &&
    mod.data !== null &&
    typeof (mod.data as { user_id?: unknown }).user_id === 'string'

  if (!isMod) notFound()

  const reportsRes = await supabase
    .from('forum_report')
    .select(
      `
      id,
      reason,
      status,
      created_at,
      post_id,
      thread_id,
      reporter_id,
      forum_post ( body, thread_id ),
      forum_thread ( title )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(200)

  const reports = reportsRes.data ?? []

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-24 sm:pb-28">
      <Header
        title="Forum moderering"
        subtitle={
          <Link href={FORUM_BASE_PATH} className="underline font-medium" style={{ color: 'var(--primary)' }}>
            Tilbake til forum
          </Link>
        }
      />
      <ForumSearchStripe />
      <div className="min-w-0 flex-1 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-8 space-y-4">
        <ForumInfoBanner />
        {reportsRes.error ? (
          <p className="text-sm" style={{ color: '#991b1b' }}>
            {reportsRes.error.message}
          </p>
        ) : (
          <ForumModerationReports reports={reports as never} />
        )}
      </div>
    </div>
  )
}
