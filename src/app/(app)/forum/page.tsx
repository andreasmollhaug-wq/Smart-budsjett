import Link from 'next/link'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'
import ForumHomeTopics from '@/components/forum/ForumHomeTopics'
import ForumHomeSidebar from '@/components/forum/ForumHomeSidebar'
import ForumInfoBanner from '@/components/forum/ForumInfoBanner'
import ForumSearchStripe from '@/components/forum/ForumSearchStripe'
import { ForumNewThreadHomeButton } from '@/components/forum/ForumNewThreadModal'
import { fetchForumContributionCounts } from '@/lib/forum/counts'
import {
  forumHomeSortFromSearchParam,
  mapForumFirstPostExcerpts,
  parseForumHomeRows,
} from '@/lib/forum/home'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

const HOME_LIMIT = 10
const SIDEBAR_POPULAR_LIMIT = 8

type Props = {
  searchParams: Promise<{ visning?: string }>
}

export default async function ForumBetaHomePage({ searchParams }: Props) {
  const q = await searchParams
  const activeSort = forumHomeSortFromSearchParam(q.visning)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    mainRpcResult,
    sidebarThreadCountRes,
    sidebarPostCountRes,
    sidebarProfileCountRes,
    hotRpcResult,
    newestProfilesRes,
    categoriesResult,
    threadRowsResult,
  ] = await Promise.all([
    supabase.rpc('forum_home_threads', { p_mode: activeSort, p_limit: HOME_LIMIT }),
    supabase.from('forum_thread').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('forum_post').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('forum_profile').select('*', { count: 'exact', head: true }),
    supabase.rpc('forum_home_threads', { p_mode: 'hot', p_limit: SIDEBAR_POPULAR_LIMIT }),
    supabase
      .from('forum_profile')
      .select('user_id, display_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('forum_category').select('id, slug, title, description, sort_order').order('sort_order', {
      ascending: true,
    }),
    supabase.from('forum_thread').select('category_id').is('deleted_at', null),
  ])

  const { data: rpcData, error: rpcErr } = mainRpcResult

  let topicRows = parseForumHomeRows(rpcData)

  /** Fallback om forum_home_threads-RPC ikke finnes: enkel liste med utdrag fra åpningsinnlegg; ingen reply-/visningstall fra RPC */
  if (rpcErr) {
    const { data: fb } = await supabase
      .from('forum_thread')
      .select(
        `
        id,
        title,
        last_activity_at,
        forum_category ( slug, title )
      `,
      )
      .is('deleted_at', null)
      .order('last_activity_at', { ascending: false })
      .limit(HOME_LIMIT)

    const fbList = fb ?? []
    const threadIds = fbList
      .map((row) => (typeof (row as { id?: unknown }).id === 'string' ? (row as { id: string }).id : ''))
      .filter(Boolean)
    const excerptByThread = await mapForumFirstPostExcerpts(supabase, threadIds)

    topicRows = fbList.map((row) => {
      const rid = typeof (row as { id?: unknown }).id === 'string' ? (row as { id: string }).id : ''
      const title = typeof (row as { title?: unknown }).title === 'string' ? (row as { title: string }).title : ''
      const lat =
        typeof (row as { last_activity_at?: unknown }).last_activity_at === 'string'
          ? (row as { last_activity_at: string }).last_activity_at
          : ''
      const cat = (row as { forum_category?: { slug?: string; title?: string } | { slug?: string; title?: string }[] })
        .forum_category
      const c0 = Array.isArray(cat) ? cat[0] : cat
      return {
        thread_id: rid,
        thread_title: title,
        category_slug: typeof c0?.slug === 'string' ? c0.slug : '',
        category_title: typeof c0?.title === 'string' ? c0.title : '',
        last_activity_at: lat,
        view_count: 0,
        reply_count: 0,
        excerpt: excerptByThread.get(rid) ?? '',
      }
    })
    if (activeSort !== 'latest') {
      topicRows = []
    }
  }

  const { data: categories, error: catErr } = categoriesResult
  const { data: threadRows } = threadRowsResult

  const statsOk = !(
    sidebarThreadCountRes.error ||
    sidebarPostCountRes.error ||
    sidebarProfileCountRes.error
  )
  const sidebarStats = statsOk
    ? {
        topicCount: sidebarThreadCountRes.count ?? 0,
        postCount: sidebarPostCountRes.count ?? 0,
        memberCount: sidebarProfileCountRes.count ?? 0,
      }
    : null

  const popularRows = parseForumHomeRows(hotRpcResult.data)
  const popularOk = !hotRpcResult.error

  const newMembers = (newestProfilesRes.data ?? [])
    .map((row) => {
      const r = row as { user_id?: unknown; display_name?: unknown; created_at?: unknown }
      const uid = typeof r.user_id === 'string' ? r.user_id : ''
      const createdAt = typeof r.created_at === 'string' ? r.created_at : ''
      const dn = r.display_name
      const displayName = dn === null || typeof dn === 'string' ? dn : null
      return {
        userId: uid,
        displayName,
        createdAt,
      }
    })
    .filter((m) => m.userId.length > 0)
  const newMembersOk = !newestProfilesRes.error

  const contrib = user ? await fetchForumContributionCounts(supabase, user.id) : null

  const counts = new Map<string, number>()
  for (const r of threadRows ?? []) {
    const cid = (r as { category_id?: string }).category_id
    if (!cid) continue
    counts.set(cid, (counts.get(cid) ?? 0) + 1)
  }

  const categoriesList = categories ?? []

  const slugOf = (c: unknown): string | null => {
    if (!c || typeof c !== 'object') return null
    const s = (c as { slug?: unknown }).slug
    return typeof s === 'string' && s.length > 0 ? s : null
  }
  const idOf = (c: unknown): string | null => {
    if (!c || typeof c !== 'object') return null
    const id = (c as { id?: unknown }).id
    return typeof id === 'string' ? id : null
  }

  const genereltRow = categoriesList.find((c) => slugOf(c) === 'generelt')

  const defaultNewCategoryId = idOf(genereltRow) ?? idOf(categoriesList[0]) ?? ''

  const forumCategoriesForModal = categoriesList.flatMap((row) => {
    const id = idOf(row)
    const slug = slugOf(row)
    if (!id || !slug) return []
    const titleRaw = (row as { title?: unknown }).title
    const title = typeof titleRaw === 'string' ? titleRaw : ''
    const descRaw = (row as { description?: unknown }).description
    const description = typeof descRaw === 'string' ? descRaw : null
    return [{ id, slug, title, description }]
  })

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-24 sm:pb-28">
      <Header title="Forum" subtitle="For innloggede brukere." />

      <div className="min-w-0 flex-1 space-y-6 py-5 pb-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:py-8 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <ForumInfoBanner />

        {rpcErr ? (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: 'var(--text)' }}
            role="status"
          >
            <p className="font-medium">Utvidet forsideliste er ikke tilgjengelig.</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Kjør forum-migrasjonene (bl.a.{' '}
              <code className="text-[11px] px-1 py-0.5 rounded bg-white/80">017_forum_home_views_demo.sql</code>) i
              Supabase for forside-sortering (siste / mest diskutert / mest lest). Viser foreløpig kun enkel
              «siste aktivitet»-liste ved feil (<code className="text-[11px]">{rpcErr.message}</code>).
            </p>
          </div>
        ) : null}

        {catErr ? (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#991b1b' }}
          >
            <p className="font-medium">Klarte ikke laste forumkategorier.</p>
            <pre className="mt-3 text-[11px] overflow-x-auto">{catErr.message}</pre>
          </div>
        ) : null}

        {user && contrib && (
          <div
            className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-2 justify-between text-sm"
            style={{ background: '#f8fafc', border: '1px solid var(--border)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              <span className="font-medium text-[var(--text)]">Dine bidrag:</span>{' '}
              {contrib.threadCount} tråder · {contrib.replyCount} svar
            </span>
          </div>
        )}

        {!catErr && forumCategoriesForModal.length > 0 && defaultNewCategoryId ? (
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-2">
            <ForumNewThreadHomeButton
              categories={forumCategoriesForModal}
              defaultCategoryId={defaultNewCategoryId}
              label="Opprett innlegg"
            />
          </div>
        ) : null}

        <ForumSearchStripe variant="embedded" />

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_minmax(16rem,20rem)] lg:gap-x-8 lg:items-stretch">
          <div className="order-1 flex min-w-0 flex-col lg:col-start-1 lg:row-start-1 lg:h-full lg:min-h-0">
            <section
              className="flex min-h-0 flex-col lg:flex-1"
              aria-labelledby="forum-topics-heading"
            >
              <h2 id="forum-topics-heading" className="sr-only">
                Aktuelle tråder
              </h2>
              <ForumHomeTopics rows={topicRows} activeSort={activeSort} />
            </section>
          </div>

          <aside
            className="order-2 flex min-w-0 flex-col lg:col-start-2 lg:row-start-1 lg:h-full lg:min-h-0"
            aria-label="Forum — oversikt"
          >
            <ForumHomeSidebar
              stats={sidebarStats}
              popularRows={popularRows}
              popularOk={popularOk}
              newMembers={newMembers}
              newMembersOk={newMembersOk}
            />
          </aside>

          <section
            aria-labelledby="forum-categories-heading"
            className="order-3 min-w-0 lg:col-span-2 lg:row-start-2 mt-2 space-y-3 border-t pt-8"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 id="forum-categories-heading" className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Kategorier
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(categories ?? []).map((cat) => {
                const slug = typeof cat.slug === 'string' ? cat.slug : ''
                const tid = typeof (cat as { id?: unknown }).id === 'string' ? String((cat as { id: string }).id) : ''
                const n = counts.get(tid) ?? 0
                const titleOk =
                  typeof (cat as { title?: unknown }).title === 'string'
                    ? String((cat as { title: string }).title)
                    : 'Kategori'
                const description =
                  typeof (cat as { description?: unknown }).description === 'string'
                    ? (cat as { description: string }).description
                    : null

                return (
                  <Link
                    key={tid || slug || titleOk}
                    href={`${FORUM_BASE_PATH}/kategori/${slug}`}
                    prefetch={false}
                    className="group block min-w-0 rounded-xl border p-4 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 touch-manipulation"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>
                          {titleOk}
                        </h3>
                        {description?.trim() ? (
                          <p className="mt-1 text-sm break-words" style={{ color: 'var(--text-muted)' }}>
                            {description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className="shrink-0 tabular-nums text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
                      >
                        {n} tråd{n === 1 ? '' : 'er'}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium truncate" style={{ color: 'var(--primary)' }}>
                      Åpne kategori <span aria-hidden>→</span>
                    </p>
                  </Link>
                )
              })}
            </div>
            {(categories ?? []).length === 0 && !catErr ? (
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Ingen kategorier i databasen.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
