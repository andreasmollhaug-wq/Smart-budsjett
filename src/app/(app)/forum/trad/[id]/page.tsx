import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'
import ForumInfoBanner from '@/components/forum/ForumInfoBanner'
import ForumSearchStripe from '@/components/forum/ForumSearchStripe'
import ForumReplyAndPosts from '@/components/forum/ForumReplyAndPosts'
import type { ForumPostAttachmentRow, ForumThreadPostRow } from '@/lib/forum/types'
import { forumAttachmentPublicUrl } from '@/lib/forum/uploadAttachments'
import { FORUM_BASE_PATH, FORUM_THREAD_POSTS_PAGE_SIZE } from '@/lib/forum/constants'
import { hasEligibleForumDisplayName } from '@/lib/forum/forumDisplayName'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ side?: string }>
}

interface ThreadRowEmbed {
  id: string
  title: string
  author_id: string
  category_id?: string | null
  created_at?: string | null
  last_activity_at?: string | null
  view_count?: number | null
  /** Supabase join may serialize as single row or array depending on client typings */
  forum_category:
    | { slug: string | null; title?: string | null }
    | { slug: string | null; title?: string | null }[]
    | null
    | undefined
  is_locked?: boolean | null
  is_pinned?: boolean | null
}

interface PostRowSrc {
  id: string
  author_id: string
  body: string
  deleted_at: string | null
  created_at: string
  is_first_post: boolean
  edited_at: string | null
}

export default async function ForumThreadPage({ params, searchParams }: Props) {
  const { id } = await params
  const q = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/logg-inn?next=${encodeURIComponent(`${FORUM_BASE_PATH}/trad/${id}`)}`)
  }

  const { data: viewerProf } = await supabase
    .from('forum_profile')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()
  const viewerDn =
    viewerProf && typeof (viewerProf as { display_name?: unknown }).display_name === 'string'
      ? (viewerProf as { display_name: string }).display_name
      : null
  const viewerHasForumDisplayName = hasEligibleForumDisplayName(viewerDn)

  const tr = await supabase
    .from('forum_thread')
    .select(
      `
      id,
      title,
      author_id,
      category_id,
      created_at,
      last_activity_at,
      view_count,
      is_locked,
      is_pinned,
      forum_category(slug, title)
    `,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  let threadRow: ThreadRowEmbed | null =
    tr.data !== null && tr.data !== undefined ? (tr.data as ThreadRowEmbed) : null

  const hint = String(tr.error?.message ?? '')
  const missingForumCols =
    tr.error !== null &&
    tr.error !== undefined &&
    !threadRow &&
    (hint.includes('column') || hint.includes('does not exist') || hint.includes('is_locked'))

  if (missingForumCols) {
    const fb = await supabase
      .from('forum_thread')
      .select('id, title, author_id, category_id, forum_category(slug, title)')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()
    if (fb.error || !fb.data) notFound()
    threadRow = {
      ...(fb.data as ThreadRowEmbed),
      is_locked: false,
      is_pinned: false,
      view_count: 0,
    }
  } else if (tr.error || !threadRow?.id) {
    notFound()
  }

  if (!threadRow?.id) notFound()

  const threadData = threadRow

  await supabase.rpc('forum_increment_thread_view', { p_thread_id: threadData.id })

  const categorySlugRaw = threadData.forum_category
  const embedCat = Array.isArray(categorySlugRaw) ? categorySlugRaw[0] : categorySlugRaw
  const slug =
    embedCat &&
    typeof embedCat === 'object' &&
    'slug' in embedCat &&
    typeof (embedCat as { slug?: unknown }).slug === 'string'
      ? ((embedCat as { slug: string }).slug ?? 'generelt')
      : null
  const categoryTitle =
    embedCat &&
    typeof embedCat === 'object' &&
    'title' in embedCat &&
    typeof (embedCat as { title?: unknown }).title === 'string'
      ? ((embedCat as { title: string }).title ?? null)
      : null

  const postsCountPromise = supabase
    .from('forum_post')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', id)

  const { count: postCountMaybe } = await postsCountPromise
  const totalPosts = postCountMaybe ?? 0
  const pageSize = FORUM_THREAD_POSTS_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize))

  let pageRequested = Number.parseInt(q.side ?? `${totalPages}`, 10)
  if (Number.isNaN(pageRequested) || pageRequested < 1) pageRequested = 1
  if (pageRequested > totalPages) pageRequested = totalPages
  const offset = (pageRequested - 1) * pageSize

  const { data: postRowsRaw, error: postsErr } = await supabase
    .from('forum_post')
    .select('id, author_id, body, deleted_at, created_at, is_first_post, edited_at')
    .eq('thread_id', id)
    .order('created_at', { ascending: true })
    .range(offset, offset + pageSize - 1)

  let rawPostsList = ((postRowsRaw ?? []) as PostRowSrc[])
  if (postsErr && String(postsErr.message).includes('edited_at')) {
    const fb = await supabase
      .from('forum_post')
      .select('id, author_id, body, deleted_at, created_at, is_first_post')
      .eq('thread_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1)
    rawPostsList = ((fb.data ?? []) as Omit<PostRowSrc, 'edited_at'>[]).map((p) => ({
      ...p,
      edited_at: null as string | null,
    }))
  } else if (postsErr) {
    return (
      <div className="p-6 text-sm" style={{ color: '#991b1b' }}>
        {postsErr.message}
      </div>
    )
  }

  const rawPosts = rawPostsList
  const postIds = rawPosts.map((p) => p.id).filter(Boolean)

  const attachmentsByPost = new Map<string, ForumPostAttachmentRow[]>()
  if (postIds.length > 0) {
    const { data: attsRaw } = await supabase
      .from('forum_post_attachment')
      .select('id, post_id, storage_path, file_name, mime_type, bytes')
      .in('post_id', postIds)
      .order('sort_order', { ascending: true })

    const rows = attsRaw ?? []

    const pdfPaths = new Set<string>()
    for (const row of rows) {
      const rec = row as Record<string, unknown>
      const mimeRaw = typeof rec.mime_type === 'string' ? rec.mime_type : ''
      const pathRaw = typeof rec.storage_path === 'string' ? rec.storage_path : ''
      if (mimeRaw === 'application/pdf' && pathRaw) pdfPaths.add(pathRaw)
    }

    const pdfHrefByPath = new Map<string, string>()
    if (pdfPaths.size > 0) {
      await Promise.all(
        [...pdfPaths].map(async (storagePath) => {
          const signed = await supabase.storage.from('forum_attachments').createSignedUrl(storagePath, 3600)
          pdfHrefByPath.set(storagePath, signed.data?.signedUrl ?? forumAttachmentPublicUrl(storagePath))
        }),
      )
    }

    for (const row of rows) {
      const rec = row as Record<string, unknown>
      const postId = typeof rec.post_id === 'string' ? rec.post_id : ''
      const aid = typeof rec.id === 'string' ? rec.id : ''
      const path = typeof rec.storage_path === 'string' ? rec.storage_path : ''
      const fname = typeof rec.file_name === 'string' ? rec.file_name : ''
      const mime = typeof rec.mime_type === 'string' ? rec.mime_type : ''
      const bytes = typeof rec.bytes === 'number' ? rec.bytes : Number(rec.bytes ?? 0)
      if (!postId || !aid || !path) continue

      let href: string | undefined
      if (mime === 'application/pdf') {
        href = pdfHrefByPath.get(path)
      }

      const list = attachmentsByPost.get(postId) ?? []
      list.push({
        id: aid,
        post_id: postId,
        storage_path: path,
        file_name: fname,
        mime_type: mime,
        bytes,
        ...(href ? { href } : {}),
      })
      attachmentsByPost.set(postId, list)
    }
  }

  const authorIds = new Set<string>()
  authorIds.add(threadData.author_id)
  rawPosts.forEach((p) => authorIds.add(p.author_id))

  const profileDisplayByUserId: Record<string, string | undefined> = {}

  try {
    const { data: profs } = await supabase.from('forum_profile').select('user_id, display_name').in('user_id', [...authorIds])
    for (const pr of profs ?? []) {
      const r = pr as { user_id?: string; display_name?: string | null }
      if (typeof r.user_id === 'string' && r.display_name && r.display_name.trim().length >= 2) {
        profileDisplayByUserId[r.user_id] = r.display_name.trim()
      }
    }
  } catch {
    /** forum_profile tabell finnes først etter migrering 020 */
  }

  let isSubscribedToThread = false
  try {
    const { data: sub } = await supabase
      .from('forum_thread_subscription')
      .select('thread_id')
      .eq('thread_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (sub) isSubscribedToThread = true
  } catch {
    //
  }

  let isModerator = false
  try {
    const mod = await supabase.from('forum_moderator').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!mod.error && mod.data) isModerator = true
  } catch {
    //
  }

  const posts: ForumThreadPostRow[] = rawPosts.map((p) => ({
    ...p,
    attachments: attachmentsByPost.get(p.id) ?? [],
  }))

  const postIdsForVotes = posts.map((p) => p.id).filter(Boolean)
  const upvoteCountByPostId: Record<string, number> = {}
  const viewerUpvotedPostIds: string[] = []

  if (postIdsForVotes.length > 0) {
    try {
      const { data: cntData, error: cntErr } = await supabase.rpc('forum_post_upvote_counts', {
        p_post_ids: postIdsForVotes,
      })
      if (!cntErr && Array.isArray(cntData)) {
        for (const row of cntData) {
          const r = row as { post_id?: unknown; cnt?: unknown }
          const pid = typeof r.post_id === 'string' ? r.post_id : ''
          const c = typeof r.cnt === 'number' ? r.cnt : Number(r.cnt ?? 0)
          if (pid) upvoteCountByPostId[pid] = Number.isFinite(c) ? c : 0
        }
      }
    } catch {
      //
    }
    try {
      const { data: mine, error: mErr } = await supabase
        .from('forum_post_upvote')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIdsForVotes)
      if (!mErr && mine) {
        for (const row of mine) {
          const pid =
            typeof (row as { post_id?: unknown }).post_id === 'string'
              ? (row as { post_id: string }).post_id
              : ''
          if (pid) viewerUpvotedPostIds.push(pid)
        }
      }
    } catch {
      //
    }
  }

  const isLocked = !!(threadData as { is_locked?: boolean }).is_locked
  const isPinned = !!(threadData as { is_pinned?: boolean }).is_pinned

  const prevHref = pageRequested > 1 ? `${FORUM_BASE_PATH}/trad/${id}?side=${pageRequested - 1}` : null
  const nextHref = pageRequested < totalPages ? `${FORUM_BASE_PATH}/trad/${id}?side=${pageRequested + 1}` : null

  const threadCreatedAt = typeof threadData.created_at === 'string' ? threadData.created_at : ''
  const threadLastActivityAt =
    typeof threadData.last_activity_at === 'string' ? threadData.last_activity_at : threadCreatedAt
  const threadViewCount =
    typeof threadData.view_count === 'number' && Number.isFinite(threadData.view_count)
      ? threadData.view_count
      : 0
  const replyCount = Math.max(0, totalPosts - 1)

  const threadAbout = {
    createdAt: threadCreatedAt,
    lastActivityAt: threadLastActivityAt,
    viewCount: threadViewCount,
    totalPosts,
    replyCount,
    categoryHref: slug ? `${FORUM_BASE_PATH}/kategori/${slug}` : null,
    categoryTitle: categoryTitle ?? (slug ? slug : null),
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-24 sm:pb-28">
        <Header
          title={threadData.title ?? 'Tråd'}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link href={FORUM_BASE_PATH} style={{ color: 'var(--primary)' }} className="underline font-medium">
                Alle kategorier
              </Link>
              {slug ? (
                <Link
                  href={`${FORUM_BASE_PATH}/kategori/${slug}`}
                  style={{ color: 'var(--primary)' }}
                  className="underline font-medium"
                >
                  Kategori
                </Link>
              ) : null}
            </span>
          }
        />

        <ForumSearchStripe categorySlug={slug ?? undefined} />

        <div className="min-w-0 space-y-6 py-5 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:py-8 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
          <ForumInfoBanner />

          {isPinned ? (
            <p
              className="rounded-xl px-3 py-2 text-xs font-semibold border"
              style={{ borderColor: 'var(--primary)', background: 'var(--primary-pale)', color: 'var(--text)' }}
              role="status"
            >
              Festet tråd
            </p>
          ) : null}

          {isLocked ? (
            <p
              className="rounded-xl px-3 py-2 text-xs font-semibold border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
              role="status"
            >
              Denne tråden er låst for nye svar.
            </p>
          ) : null}

          {totalPosts > pageSize ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Viser side {pageRequested} av {totalPages} (maks {pageSize} innlegg per side). Alle innlegg vises i
              kronologisk rekkefølge på hver side.
            </p>
          ) : null}

          <ForumReplyAndPosts
            threadId={threadData.id}
            threadTitle={threadData.title ?? 'Tråd'}
            starterAuthorId={threadData.author_id}
            currentUserId={user.id}
            posts={posts}
            isThreadLocked={isLocked}
            isPinned={isPinned}
            isSubscribedToThread={isSubscribedToThread}
            isModerator={isModerator}
            profileDisplayByUserId={profileDisplayByUserId}
            upvoteCountByPostId={upvoteCountByPostId}
            viewerUpvotedPostIds={viewerUpvotedPostIds}
            threadAbout={threadAbout}
            viewerForumDisplayNameDraft={viewerDn ?? ''}
            viewerHasForumDisplayName={viewerHasForumDisplayName}
            pagination={{
              page: pageRequested,
              totalPages,
              prevHref,
              nextHref,
              totalPosts,
              pageSize,
            }}
          />
        </div>
      </div>
    </div>
  )
}
