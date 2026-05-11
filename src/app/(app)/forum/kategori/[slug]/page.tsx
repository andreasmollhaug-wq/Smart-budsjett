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
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

const PAGE_SIZE = 20

/** Stabil DOM-id for klient-modal (kun trygge slug-tegn fra DB). */
function newThreadDomId(categorySlug: string): string {
  const safe = encodeURIComponent(categorySlug).replace(/%/g, '_')
  return `forum-new-thread-modal-${safe}`
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; ny?: string }>
}

export default async function ForumCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams
  const page = Math.max(1, Number.parseInt(q.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  const { data: cat, error: catErr } = await supabase
    .from('forum_category')
    .select('id, slug, title, description')
    .eq('slug', slug)
    .maybeSingle()

  if (catErr || !cat?.id) notFound()

  const categoryTitle = cat.title as string
  const categoryId = cat.id as string

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

  /** URL uten legacy `ny=1`; beholder aktiv side for paginering */
  const cleanupNavigateHref =
    page > 1
      ? `${FORUM_BASE_PATH}/kategori/${encodeURIComponent(slug)}?page=${page}`
      : `${FORUM_BASE_PATH}/kategori/${encodeURIComponent(slug)}`

  const openNewNy = q.ny === '1'

  const threadsQuery = await supabase
    .from('forum_thread')
    .select('id, title, author_id, last_activity_at, created_at', { count: 'exact' })
    .eq('category_id', categoryId)
    .is('deleted_at', null)
    .order('last_activity_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (threadsQuery.error) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto pb-24">
        <Header title="Forum" subtitle="Kunne ikke laste tråder" />
        <p className="p-5 text-sm">{threadsQuery.error.message}</p>
      </div>
    )
  }

  const total = threadsQuery.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const threads = threadsQuery.data ?? []

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
            <ForumNewThreadModalOpenButton dialogId={dialogId} label="Ny tråd" variant="link" />
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
        />

        {cat.description ? (
          <p className="text-sm mb-4 max-w-prose" style={{ color: 'var(--text-muted)' }}>
            {String(cat.description)}
          </p>
        ) : null}

        <ForumSearchStripe variant="embedded" categorySlug={slug} />

        <div className="space-y-3 min-w-0">
          {threads.length === 0 ? (
            <p className="text-sm flex flex-wrap items-center gap-x-2 gap-y-2" style={{ color: 'var(--text-muted)' }}>
              Ingen tråder ennå.{' '}
              <ForumNewThreadModalOpenButton dialogId={dialogId} label="Start den første" variant="link" />
            </p>
          ) : null}

          <ul className="divide-y rounded-xl border min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            {threads.map((t) => {
              const tid = t.id as string
              const tt = t.title as string
              const act = t.last_activity_at as string
              const d = new Date(act)

              return (
                <li key={tid} className="min-w-0">
                  <Link
                    href={`${FORUM_BASE_PATH}/trad/${tid}`}
                    prefetch={false}
                    className="block min-w-0 px-4 py-3.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:inset focus-visible:ring-[var(--primary)] touch-manipulation"
                  >
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                      {tt}
                    </p>
                    <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {!Number.isNaN(d.getTime())
                        ? `Sist aktiv: ${d.toLocaleString('nb-NO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : null}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {totalPages > 1 ? (
          <nav aria-label="Trådlister paging" className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            {page > 1 ? (
              <Link
                href={`${FORUM_BASE_PATH}/kategori/${slug}?page=${page - 1}`}
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
                href={`${FORUM_BASE_PATH}/kategori/${slug}?page=${page + 1}`}
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
