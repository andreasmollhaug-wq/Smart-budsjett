import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ForumInfoBanner from '@/components/forum/ForumInfoBanner'
import ForumSearchStripe from '@/components/forum/ForumSearchStripe'
import ForumProfileForm from '@/components/forum/ForumProfileForm'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

export default async function ForumProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/logg-inn')

  const { data: profile } = await supabase
    .from('forum_profile')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const displayName =
    profile && typeof (profile as { display_name?: unknown }).display_name === 'string'
      ? (profile as { display_name: string }).display_name
      : ''

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-24 sm:pb-28">
      <Header
        title="Forumprofil"
        subtitle={
          <Link href={FORUM_BASE_PATH} className="underline font-medium" style={{ color: 'var(--primary)' }}>
            Tilbake til forum
          </Link>
        }
      />
      <ForumSearchStripe />
      <div className="min-w-0 flex-1 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-8 max-w-xl">
        <ForumInfoBanner />
        <ForumProfileForm initialDisplayName={displayName ?? ''} />
      </div>
    </div>
  )
}
