import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ForumInfoBanner from '@/components/forum/ForumInfoBanner'
import ForumSearchStripe from '@/components/forum/ForumSearchStripe'
import ForumProfileForm from '@/components/forum/ForumProfileForm'
import ForumContributorTierPanel from '@/components/forum/ForumContributorTierPanel'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'
import { fetchForumContributionCounts } from '@/lib/forum/counts'
import { forumContributorScore, forumContributorTier } from '@/lib/forum/contributorTier'
import { forumAuthorDisplay } from '@/lib/forum/formatAuthor'

export default async function ForumProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/logg-inn?next=${encodeURIComponent(`${FORUM_BASE_PATH}/profil`)}`)
  }

  const { data: profile } = await supabase
    .from('forum_profile')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const displayName =
    profile && typeof (profile as { display_name?: unknown }).display_name === 'string'
      ? (profile as { display_name: string }).display_name
      : ''

  const contrib = await fetchForumContributionCounts(supabase, user.id)
  const threadCount = contrib?.threadCount ?? 0
  const replyCount = contrib?.replyCount ?? 0
  const postCount = contrib?.postCount ?? 0
  const score = forumContributorScore(threadCount, replyCount)
  const tier = forumContributorTier(score)

  const publicLabel = forumAuthorDisplay(user.id, { [user.id]: displayName })

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
      <div className="min-w-0 flex-1 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-8 max-w-2xl">
        <ForumInfoBanner />

        <article
          className="min-w-0 rounded-2xl border p-5 shadow-sm sm:p-6 space-y-6"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <header className="min-w-0 space-y-1">
            <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
              Her styrer du hvordan du vises når du skriver i forumet, og ser en liten oversikt over aktiviteten din.
            </p>
          </header>

          <section aria-labelledby="forum-public-name-heading" className="min-w-0 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <h2 id="forum-public-name-heading" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Slik vises du i forumet
            </h2>
            <p className="mt-2 text-lg font-bold break-words" style={{ color: 'var(--text)' }}>
              {publicLabel}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Endre visningsnavn under — tomt felt gir kort kode i stedet for navn.
            </p>
          </section>

          {contrib ? (
            <section aria-labelledby="forum-stats-heading" className="min-w-0 space-y-3">
              <h2 id="forum-stats-heading" className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Dine tall
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 min-w-0">
                <div
                  className="min-w-0 rounded-xl border px-4 py-3"
                  style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, var(--bg))' }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Tråder startet
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                    {threadCount}
                  </p>
                </div>
                <div
                  className="min-w-0 rounded-xl border px-4 py-3"
                  style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, var(--bg))' }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Svar
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                    {replyCount}
                  </p>
                </div>
                <div
                  className="min-w-0 rounded-xl border px-4 py-3"
                  style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, var(--bg))' }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Alle innlegg
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                    {postCount}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Klarte ikke laste statistikk akkurat nå.
            </p>
          )}

          <ForumContributorTierPanel tier={tier} score={score} />

          <div className="min-w-0 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            <ForumProfileForm initialDisplayName={displayName ?? ''} />
          </div>
        </article>
      </div>
    </div>
  )
}
