import Link from 'next/link'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ForumInfoBanner from '@/components/forum/ForumInfoBanner'
import ForumSearchHits from '@/components/forum/ForumSearchHits'
import ForumSearchStripe from '@/components/forum/ForumSearchStripe'
import { createClient } from '@/lib/supabase/server'
import { forumSearchRpcParams, parseForumSearchRpcRows } from '@/lib/forum/search'
import { forumSearchUrlSchema } from '@/lib/forum/searchSchema'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

type Props = {
  searchParams: Promise<{ q?: string; page?: string; kategori?: string }>
}

function mapSearchRpcError(msg: string | undefined): string {
  const m = msg ?? ''
  if (m.includes('query_too_short')) return 'Søket må ha minst to tegn.'
  if (m.includes('query_too_long')) return 'Søket er for langt.'
  if (m.includes('search_rate_limited')) return 'For mange søk akkurat nå. Vent et øyeblikk og prøv igjen.'
  if (m.includes('not authenticated')) return 'Du må være innlogget.'
  return m || 'Kunne ikke søke.'
}

export default async function ForumSearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/logg-inn?redirectTo=${encodeURIComponent(`${FORUM_BASE_PATH}/sok`)}`)
  }

  const rawQ = (sp.q ?? '').trim()

  let categoryId: string | null = null
  const slug = (sp.kategori ?? '').trim()
  if (slug) {
    const { data: cat } = await supabase.from('forum_category').select('id').eq('slug', slug).maybeSingle()
    if (cat && typeof (cat as { id?: unknown }).id === 'string') {
      categoryId = (cat as { id: string }).id
    }
  }

  if (rawQ.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto pb-24 sm:pb-28">
        <Header
          title="Søk i forum"
          subtitle={
            <Link href={FORUM_BASE_PATH} className="font-medium underline" style={{ color: 'var(--primary)' }}>
              Tilbake til forum
            </Link>
          }
        />
        <ForumSearchStripe defaultQuery="" />
        <div className="min-w-0 flex-1 space-y-4 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-8">
          <ForumInfoBanner />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Skriv minst to tegn i søkefeltet over og trykk <strong>Søk</strong>. Du kan søke i trådtitler og i alle synlige
            innlegg.
          </p>
        </div>
      </div>
    )
  }

  const parsed = forumSearchUrlSchema.safeParse({
    q: rawQ,
    page: sp.page,
    kategori: slug || undefined,
  })

  let errors: string[] = []
  let rows = parseForumSearchRpcRows([])
  let rpcError: string | null = null

  if (!parsed.success) {
    errors = Object.values(parsed.error.flatten().fieldErrors).flat().filter(Boolean) as string[]
  } else {
    const rpcArgs = forumSearchRpcParams(parsed.data, categoryId)
    const { data, error } = await supabase.rpc('forum_search_threads', {
      p_query: rpcArgs.p_query,
      p_limit: rpcArgs.p_limit,
      p_offset: rpcArgs.p_offset,
      p_category_id: rpcArgs.p_category_id,
    })

    if (error) {
      rpcError = mapSearchRpcError(error.message)
    } else {
      rows = parseForumSearchRpcRows(data)
    }
  }

  const hasNext = rows.length === 20 && parsed.success && !rpcError && errors.length === 0
  const hasPrev =
    parsed.success && parsed.data.page > 1 && !rpcError && errors.length === 0

  const nextHref =
    parsed.success && hasNext
      ? `${FORUM_BASE_PATH}/sok?q=${encodeURIComponent(parsed.data.q)}&page=${parsed.data.page + 1}${slug ? `&kategori=${encodeURIComponent(slug)}` : ''}`
      : null
  const prevHref =
    parsed.success && hasPrev
      ? `${FORUM_BASE_PATH}/sok?q=${encodeURIComponent(parsed.data.q)}&page=${parsed.data.page - 1}${slug ? `&kategori=${encodeURIComponent(slug)}` : ''}`
      : null

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-24 sm:pb-28">
      <Header
        title="Søk i forum"
        subtitle={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href={FORUM_BASE_PATH} className="font-medium underline" style={{ color: 'var(--primary)' }}>
              Alle kategorier
            </Link>
            {slug ? (
              <Link
                href={`${FORUM_BASE_PATH}/kategori/${encodeURIComponent(slug)}`}
                className="font-medium underline"
                style={{ color: 'var(--primary)' }}
              >
                Kategori
              </Link>
            ) : null}
          </span>
        }
      />
      <ForumSearchStripe categorySlug={slug || undefined} defaultQuery={rawQ} />

      <div className="min-w-0 flex-1 space-y-4 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-8">
        <ForumInfoBanner />

        {errors.length > 0 ? (
          <div
            className="rounded-xl border px-3 py-2 text-sm"
            role="alert"
            style={{
              borderColor: 'color-mix(in srgb, #fca5a5 55%, var(--border))',
              background: 'color-mix(in srgb, #fef2f2 88%, var(--surface))',
              color: '#991b1b',
            }}
          >
            {errors.join(' ')}
          </div>
        ) : null}

        {rpcError ? (
          <div
            className="rounded-xl border px-3 py-2 text-sm"
            role="alert"
            style={{
              borderColor: 'color-mix(in srgb, #fca5a5 55%, var(--border))',
              background: 'color-mix(in srgb, #fef2f2 88%, var(--surface))',
              color: '#991b1b',
            }}
          >
            {rpcError}
          </div>
        ) : null}

        {!rpcError && errors.length === 0 ? (
          <>
            <ForumSearchHits rows={rows} />
            {(nextHref || prevHref) && (
              <nav
                className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t"
                style={{ borderColor: 'var(--border)' }}
                aria-label="Søkeresultat sidevisning"
              >
                {prevHref ? (
                  <Link
                    href={prevHref}
                    prefetch={false}
                    className="inline-flex min-h-[44px] items-center px-4 rounded-xl border text-sm font-semibold touch-manipulation"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    Forrige
                  </Link>
                ) : (
                  <span />
                )}
                {parsed.success ? (
                  <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    Side {parsed.data.page}
                  </span>
                ) : null}
                {nextHref ? (
                  <Link
                    href={nextHref}
                    prefetch={false}
                    className="inline-flex min-h-[44px] items-center px-4 rounded-xl border text-sm font-semibold touch-manipulation"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    Neste
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
