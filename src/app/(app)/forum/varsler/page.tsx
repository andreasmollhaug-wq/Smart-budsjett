import Link from 'next/link'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ForumSearchStripe from '@/components/forum/ForumSearchStripe'
import ForumInfoBanner from '@/components/forum/ForumInfoBanner'
import { createClient } from '@/lib/supabase/server'
import ForumNoticeList from '@/components/forum/ForumNoticeList'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

export default async function ForumVarslerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/logg-inn?next=${encodeURIComponent(`${FORUM_BASE_PATH}/varsler`)}`)
  }

  const { data: rows, error } = await supabase
    .from('forum_notice')
    .select(
      `
      id,
      thread_id,
      post_id,
      kind,
      created_at,
      read_at,
      forum_thread ( title )
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-24 sm:pb-28">
      <Header
        title="Forumvarsler"
        subtitle={
          <Link href={FORUM_BASE_PATH} className="underline font-medium" style={{ color: 'var(--primary)' }}>
            Tilbake til forum
          </Link>
        }
      />
      <ForumSearchStripe />
      <div className="min-w-0 flex-1 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-8 space-y-4">
        <ForumInfoBanner />
        {error ? (
          <p className="text-sm" style={{ color: '#991b1b' }}>
            {error.message}
          </p>
        ) : (
          <ForumNoticeList rows={rows ?? []} />
        )}
      </div>
    </div>
  )
}
