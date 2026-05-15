import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'
import ForumInfoBanner from '@/components/forum/ForumInfoBanner'
import ForumSearchStripe from '@/components/forum/ForumSearchStripe'
import {
  ForumNewThreadDialogHost,
  ForumNewThreadModalOpenButton,
} from '@/components/forum/ForumNewThreadModal'
import ForumCategoryTopicsPanel from '@/components/forum/ForumCategoryTopicsPanel'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'
import { forumCategoryListPath } from '@/lib/forum/categoryUrl'
import {
  forumHomeSortFromSearchParam,
  mapForumFirstPostExcerpts,
  parseForumHomeRows,
} from '@/lib/forum/home'
import { hasEligibleForumDisplayName } from '@/lib/forum/forumDisplayName'

const PAGE_SIZE = 20

/** Stabil DOM-id for klient-modal (kun trygge slug-tegn fra DB). */
function newThreadDomId(categorySlug: string): string {
  const safe = encodeURIComponent(categorySlug).replace(/%/g, '_')
  return `forum-new-thread-modal-${safe}`
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; ny?: string; visning?: string }>
}

export default async function ForumCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams
  const page = Math.max(1, Number.parseInt(q.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE
  const activeSort = forumHomeSortFromSearchParam(q.visning)

  const supabase = await createClient()

  const { data: cat, error: catErr } = await supabase
    .from('forum_category')
    .select('id, slug, title, description')
    .eq('slug', slug)
    .maybeSingle()

  if (catErr || !cat?.id) notFound()

  const categoryTitle = cat.title as string
  const categoryId = cat.id as string

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let viewerHasForumDisplayName = false
  let viewerForumDisplayNameDraft = ''
  if (user?.id) {
    const { data: vProf } = await supabase
      .from('forum_profile')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()
    const vdn =
      vProf && typeof (vProf as { display_name?: unknown }).display_name === 'string'
        ? (vProf as { display_name: string }).display_name
        : null
    viewerForumDisplayNameDraft = vdn ?? ''
    viewerHasForumDisplayName = hasEligibleForumDisplayName(vdn)
  }

  const { data: allCats } = await supabase
    .from('forum_category')
    .select('id, slug, title, description, sort_order')
    .order('sort_order', { ascending: true })

  const forumCategoriesForModal =
    (allCats ?? []).flatMap((row) => {
      const rid = typeof (row as { id?: unknown }).id === 'string' ? String((row as { id: string }).id) : ''
      const s = typeof (row as { slug?: unknown }).slug === 'string' ? String((row as { slug: string }).slug) : ''
      const t = typeof (row as { title?: unknown }).title === 'string' ? String((row as { title: string }).title) : ''
      const dRaw = (row as { description?: unknown }).description
      const des = typeof dRaw === 'string' ? dRaw : null
      if (!rid || !s) return []
      return [{ id: rid, slug: s, title: t, description: des }]
    }) ?? []

  const dialogId = newThreadDomId(slug)

  const cleanupNavigateHref = forumCategoryListPath(slug, {
    page: page > 1 ? page : undefined,
    sort: activeSort,
  })

  const openNewNy = q.ny === '1'

  const { count: threadCount, error: countErr } = await supabase
    .from('forum_thread')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .is('deleted_at', null)

  if (countErr) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto pb-24">
        <Header title="Forum" subtitle="Kunne ikke laste tråder" />
        <p className="p-5 text-sm">{countErr.message}</p>
      </div>
    )
  }

  const total = threadCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const { data: rpcData, error: rpcErr } = await supabase.rpc('forum_category_threads', {
    p_category_id: categoryId,
    p_mode: activeSort,
    p_limit: PAGE_SIZE,
    p_offset: offset,
  })

  let topicRows = parseForumHomeRows(rpcData)

  if (rpcErr) {
    const fbRes = await supabase
      .from('forum_thread')
      .select(
        `
        id,
        title,
        last_activity_at,
        forum_category ( slug, title )
      `,
      )
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .order('last_activity_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    const fb = fbRes.data
    const fbErr = fbRes.error

    let list: ReturnType<typeof parseForumHomeRows> = []
    if (!fbErr) {
      const fbList = fb ?? []
      const threadIds = fbList
        .map((row) => (typeof (row as { id?: unknown }).id === 'string' ? (row as { id: string }).id : ''))
        .filter(Boolean)
      const excerptByThread = await mapForumFirstPostExcerpts(supabase, threadIds)

      list = fbList.map((row) => {
        const rid = typeof (row as { id?: unknown }).id === 'string' ? (row as { id: string }).id : ''
        const title = typeof (row as { title?: unknown }).title === 'string' ? (row as { title: string }).title : ''
        const lat =
          typeof (row as { last_activity_at?: unknown }).last_activity_at === 'string'
            ? (row as { last_activity_at: string }).last_activity_at
            : ''
        const catEmb = (row as {
          forum_category?: { slug?: string; title?: string } | { slug?: string; title?: string }[]
        }).forum_category
        const c0 = Array.isArray(catEmb) ? catEmb[0] : catEmb
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
    }

    topicRows = activeSort === 'latest' ? list : []
  }

  const showPanel = total > 0 || activeSort !== 'latest'

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-24 sm:pb-28">
      <Header
        title={categoryTitle}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={FORUM_BASE_PATH}
              className="underline font-medium"
              style={{ color: 'var(--primary)' }}
            >
              Alle kategorier
            </Link>
            <ForumNewThreadModalOpenButton
              dialogId={dialogId}
              label="Ny tråd"
              variant="link"
              viewerHasForumDisplayName={viewerHasForumDisplayName}
            />
          </span>
        }
      />

      <div className="min-w-0 flex-1 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-8">
        <ForumInfoBanner />

        <ForumNewThreadDialogHost
          dialogId={dialogId}
          categories={forumCategoriesForModal}
          defaultCategoryId={categoryId}
          autoOpenNy={openNewNy}
          cleanupNavigateHref={cleanupNavigateHref}
          viewerHasForumDisplayName={viewerHasForumDisplayName}
          viewerForumDisplayNameDraft={viewerForumDisplayNameDraft}
        />

        {cat.description ? (
          <p className="text-sm mb-4 max-w-prose" style={{ color: 'var(--text-muted)' }}>
            {String(cat.description)}
          </p>
        ) : null}

        {rpcErr ? (
          <div
            className="mb-4 rounded-xl p-4 text-sm"
            style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: 'var(--text)' }}
            role="status"
          >
            <p className="font-medium">Sortert kategoriliste er ikke tilgjengelig.</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Kjør migrasjon{' '}
              <code className="text-[11px] px-1 py-0.5 rounded bg-white/80">022_forum_category_threads.sql</code> i
              Supabase. Viser foreløpig kun «siste aktivitet»-fallback ved feil (
              <code className="text-[11px]">{rpcErr.message}</code>
              ).
            </p>
          </div>
        ) : null}

        <ForumSearchStripe variant="embedded" categorySlug={slug} />

        <div className="space-y-3 min-w-0 mt-4">
          {total === 0 ? (
            <p className="text-sm flex flex-wrap items-center gap-x-2 gap-y-2" style={{ color: 'var(--text-muted)' }}>
              Ingen tråder ennå.{' '}
              <ForumNewThreadModalOpenButton
                dialogId={dialogId}
                label="Start den første"
                variant="link"
                viewerHasForumDisplayName={viewerHasForumDisplayName}
              />
            </p>
          ) : null}

          {showPanel ? (
            <ForumCategoryTopicsPanel categorySlug={slug} activeSort={activeSort} rows={topicRows} />
          ) : null}
        </div>

        {total > 0 && totalPages > 1 ? (
          <nav aria-label="Trådlister paging" className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            {page > 1 ? (
              <Link
                href={forumCategoryListPath(slug, { page: page - 1, sort: activeSort })}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-3 rounded-xl font-medium touch-manipulation"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                Forrige
              </Link>
            ) : null}
            <span style={{ color: 'var(--text-muted)' }}>
              Side {page} av {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={forumCategoryListPath(slug, { page: page + 1, sort: activeSort })}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-3 rounded-xl font-medium touch-manipulation"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                Neste
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  )
}
