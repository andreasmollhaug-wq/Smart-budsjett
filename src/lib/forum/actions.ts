'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { FORUM_BASE_PATH as FORUM_BASE } from '@/lib/forum/constants'
import {
  forumEditPostSchema,
  forumEditThreadTitleSchema,
  forumModLockSchema,
  forumModReportStatusSchema,
  forumNoticeMarkReadSchema,
  forumProfileDisplaySchema,
  forumNewThreadSchema,
  forumReplySchema,
  forumReportSchema,
  forumToggleUpvoteSchema,
  type ForumNewThreadInput,
  type ForumReplyInput,
  type ForumReportInput,
} from '@/lib/forum/schema'

export type ForumActionResult = { ok: true } | { ok: false; error: string }

function mapForumError(message: string | undefined): string {
  const m = message ?? ''
  if (m.includes('subscription_required')) {
    return 'Du trenger aktiv prøveperiode eller abonnement for å skrive.'
  }
  if (m.includes('invalid_forum_category')) {
    return 'Ugyldig kategori.'
  }
  if (m.includes('not authenticated')) {
    return 'Du må være innlogget.'
  }
  if (m.includes('not_forum_moderator')) {
    return 'Du har ikke forum-moderator-tilgang.'
  }
  if (m.includes('search_rate_limited') || m.includes('rate_limited')) {
    return 'For mange forespørsler akkurat nå. Vent litt og prøv igjen.'
  }
  if (m.includes('too_many_attachments')) {
    return 'For mange vedlegg på dette innlegget.'
  }
  if (m.includes('invalid_mime')) {
    return 'Tillatte vedleggstyper er bilder (PNG, JPG, WebP, GIF) og PDF.'
  }
  if (m.includes('invalid_size')) {
    return 'Filen må være under 5 MB.'
  }
  if (m.includes('forbidden_or_invalid_post')) {
    return 'Kunne ikke knytte vedlegg til innlegget.'
  }
  if (m.includes('invalid filename') || m.includes('invalid path')) {
    return 'Ugyldig filnavn eller lagringssti for vedlegg.'
  }
  return m || 'Noe gikk galt.'
}

function slugFromForumCategoryEmbed(
  row: unknown,
): string | undefined {
  if (!row || typeof row !== 'object') return undefined
  const raw = (row as { forum_category?: unknown }).forum_category
  if (!raw) return undefined
  if (Array.isArray(raw)) {
    const first = raw[0]
    if (first && typeof first === 'object' && typeof (first as { slug?: unknown }).slug === 'string') {
      return (first as { slug: string }).slug
    }
    return undefined
  }
  if (typeof raw === 'object' && typeof (raw as { slug?: unknown }).slug === 'string') {
    return (raw as { slug: string }).slug
  }
  return undefined
}

async function revalidateForumSurfaces(threadId: string): Promise<void> {
  const supabase = await createClient()
  const { data: slugRow } = await supabase.from('forum_thread').select('forum_category(slug)').eq('id', threadId).maybeSingle()
  const catSlug = slugFromForumCategoryEmbed(slugRow)
  revalidatePath(`${FORUM_BASE}/trad/${threadId}`)
  if (catSlug) revalidatePath(`${FORUM_BASE}/kategori/${catSlug}`)
  revalidatePath(FORUM_BASE)
  revalidatePath(`${FORUM_BASE}/varsler`)
  revalidatePath(`${FORUM_BASE}/moderering`)
}

export async function forumCreateThreadAction(
  input: ForumNewThreadInput,
): Promise<ForumActionResult & { threadId?: string; firstPostId?: string }> {
  const parsed = forumNewThreadSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg =
      Object.values(first).flat()[0] ??
      parsed.error.flatten().formErrors[0] ??
      'Valideringen feilet.'
    return { ok: false, error: msg }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  const { data: threadId, error } = await supabase.rpc('forum_create_thread', {
    p_category_id: parsed.data.categoryId,
    p_title: parsed.data.title,
    p_body: parsed.data.body,
  })

  if (error || typeof threadId !== 'string') {
    return { ok: false, error: mapForumError(error?.message ?? undefined) }
  }

  revalidatePath(FORUM_BASE)

  const { data: slugRow } = await supabase
    .from('forum_category')
    .select('slug')
    .eq('id', parsed.data.categoryId)
    .maybeSingle()

  const slug =
    slugRow &&
    typeof slugRow === 'object' &&
    typeof (slugRow as { slug?: unknown }).slug === 'string'
      ? (slugRow as { slug: string }).slug
      : undefined
  if (slug) {
    revalidatePath(`${FORUM_BASE}/kategori/${slug}`)
  }

  let firstPostId: string | undefined
  const { data: pidRow } = await supabase
    .from('forum_post')
    .select('id')
    .eq('thread_id', threadId)
    .eq('is_first_post', true)
    .maybeSingle()
  if (pidRow && typeof (pidRow as { id?: unknown }).id === 'string') {
    firstPostId = (pidRow as { id: string }).id
  }

  return { ok: true, threadId, firstPostId }
}

export async function forumCreateReplyAction(
  input: ForumReplyInput,
): Promise<ForumActionResult & { replyPostId?: string }> {
  const parsed = forumReplySchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg =
      Object.values(first).flat()[0] ??
      parsed.error.flatten().formErrors[0] ??
      'Valideringen feilet.'
    return { ok: false, error: msg }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  const threadIdStr = parsed.data.threadId

  const {
    data: inserted,
    error,
  }: { data: unknown; error: { message?: string } | null } = await supabase
    .from('forum_post')
    .insert({
      thread_id: threadIdStr,
      body: parsed.data.body,
      is_first_post: false,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: mapForumError(error.message) }
  }

  const replyPostId =
    inserted &&
    typeof inserted === 'object' &&
    typeof (inserted as { id?: unknown }).id === 'string'
      ? String((inserted as { id: string }).id)
      : undefined

  await revalidateForumSurfaces(threadIdStr)

  return { ok: true, replyPostId }
}

export async function forumSoftDeletePostAction(postId: string): Promise<ForumActionResult> {
  if (!postId || typeof postId !== 'string') {
    return { ok: false, error: 'Mangler innleggs-ID.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  const { data: row, error: fetchErr } = await supabase
    .from('forum_post')
    .select('thread_id')
    .eq('id', postId)
    .maybeSingle()

  if (fetchErr || !row?.thread_id || typeof row.thread_id !== 'string') {
    return { ok: false, error: fetchErr?.message ?? 'Fant ikke innlegget.' }
  }

  const threadIdStr = row.thread_id

  const { error } = await supabase
    .from('forum_post')
    .update({
      deleted_at: new Date().toISOString(),
      body: '',
    })
    .eq('id', postId)

  if (error) {
    return { ok: false, error: mapForumError(error.message) }
  }

  await revalidateForumSurfaces(threadIdStr)

  return { ok: true }
}

export async function forumSoftDeleteThreadAction(threadId: string): Promise<ForumActionResult> {
  if (!threadId || typeof threadId !== 'string') {
    return { ok: false, error: 'Mangler tråd-ID.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  const { data: threadRow, error: prefErr } = await supabase
    .from('forum_thread')
    .select('forum_category(slug)')
    .eq('id', threadId)
    .maybeSingle()

  const catSlug = slugFromForumCategoryEmbed(threadRow)

  if (prefErr) {
    return { ok: false, error: prefErr.message }
  }

  const { error } = await supabase
    .from('forum_thread')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', threadId)

  if (error) {
    return { ok: false, error: mapForumError(error.message) }
  }

  revalidatePath(`${FORUM_BASE}/trad/${threadId}`)
  if (catSlug) {
    revalidatePath(`${FORUM_BASE}/kategori/${catSlug}`)
  }
  revalidatePath(FORUM_BASE)
  revalidatePath(`${FORUM_BASE}/varsler`)
  revalidatePath(`${FORUM_BASE}/moderering`)

  return { ok: true }
}

export async function forumSubmitReportAction(input: ForumReportInput): Promise<ForumActionResult> {
  const parsed = forumReportSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg =
      Object.values(first).flat()[0] ??
      parsed.error.flatten().formErrors[0] ??
      'Valideringen feilet.'
    return { ok: false, error: msg }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  const insertPayload =
    parsed.data.kind === 'post'
      ? { post_id: parsed.data.postId, reason: parsed.data.reason }
      : { thread_id: parsed.data.threadId, reason: parsed.data.reason }

  const { error } = await supabase.from('forum_report').insert(insertPayload)

  if (error) {
    return { ok: false, error: mapForumError(error.message) }
  }

  revalidatePath(`${FORUM_BASE}/moderering`)
  return { ok: true }
}

export async function forumEditPostAction(
  input: unknown,
): Promise<ForumActionResult> {
  const parsed = forumEditPostSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg =
      Object.values(first).flat()[0] ??
      parsed.error.flatten().formErrors[0] ??
      'Valideringen feilet.'
    return { ok: false, error: msg }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  const { data: row, error: fetchErr } = await supabase
    .from('forum_post')
    .select('thread_id, author_id, deleted_at, is_first_post')
    .eq('id', parsed.data.postId)
    .maybeSingle()

  if (fetchErr || !row || typeof row.thread_id !== 'string') {
    return { ok: false, error: 'Fant ikke innlegget.' }
  }
  if (row.deleted_at) {
    return { ok: false, error: 'Kan ikke redigere et slettet innlegg.' }
  }
  if (row.author_id !== user.id) {
    return { ok: false, error: 'Du kan bare redigere egne innlegg.' }
  }

  const { error } = await supabase
    .from('forum_post')
    .update({
      body: parsed.data.body,
      edited_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.postId)

  if (error) {
    return { ok: false, error: mapForumError(error.message) }
  }

  await revalidateForumSurfaces(row.thread_id)
  return { ok: true }
}

export async function forumEditThreadTitleAction(input: unknown): Promise<ForumActionResult> {
  const parsed = forumEditThreadTitleSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg =
      Object.values(first).flat()[0] ??
      parsed.error.flatten().formErrors[0] ??
      'Valideringen feilet.'
    return { ok: false, error: msg }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  const { data: row, error: fetchErr } = await supabase
    .from('forum_thread')
    .select('id, author_id, deleted_at')
    .eq('id', parsed.data.threadId)
    .maybeSingle()

  if (fetchErr || !row) {
    return { ok: false, error: 'Fant ikke tråden.' }
  }
  if (row.deleted_at) {
    return { ok: false, error: 'Tråden er fjernet.' }
  }
  if (row.author_id !== user.id) {
    return { ok: false, error: 'Du kan bare endre egne tråders tittel.' }
  }

  const { error } = await supabase
    .from('forum_thread')
    .update({
      title: parsed.data.title,
      edited_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.threadId)

  if (error) {
    return { ok: false, error: mapForumError(error.message) }
  }

  await revalidateForumSurfaces(parsed.data.threadId)
  return { ok: true }
}

export async function forumSetProfileDisplayAction(input: unknown): Promise<ForumActionResult> {
  const parsed = forumProfileDisplaySchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg =
      Object.values(first).flat()[0] ??
      parsed.error.flatten().formErrors[0] ??
      'Valideringen feilet.'
    return { ok: false, error: msg }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  const display_name = parsed.data.displayName

  const { error } = await supabase.from('forum_profile').upsert(
    {
      user_id: user.id,
      display_name,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { ok: false, error: mapForumError(error.message) }
  }

  revalidatePath(FORUM_BASE)
  revalidatePath(`${FORUM_BASE}/profil`)
  return { ok: true }
}

export async function forumSetThreadSubscriptionAction(
  threadId: string,
  subscribed: boolean,
): Promise<ForumActionResult> {
  if (!threadId || typeof threadId !== 'string') {
    return { ok: false, error: 'Mangler tråd-ID.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Ikke innlogget.' }
  }

  if (subscribed) {
    const { error } = await supabase.from('forum_thread_subscription').upsert(
      { user_id: user.id, thread_id: threadId },
      { onConflict: 'user_id,thread_id' },
    )
    if (error) return { ok: false, error: mapForumError(error.message) }
  } else {
    const { error } = await supabase
      .from('forum_thread_subscription')
      .delete()
      .eq('user_id', user.id)
      .eq('thread_id', threadId)
    if (error) return { ok: false, error: mapForumError(error.message) }
  }

  revalidatePath(`${FORUM_BASE}/trad/${threadId}`)
  revalidatePath(`${FORUM_BASE}/varsler`)
  return { ok: true }
}

export async function forumMarkNoticeReadAction(input: unknown): Promise<ForumActionResult> {
  const parsed = forumNoticeMarkReadSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Ugyldig varsel.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Ikke innlogget.' }

  const { error } = await supabase
    .from('forum_notice')
    .update({ read_at: new Date().toISOString() })
    .eq('id', parsed.data.noticeId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: mapForumError(error.message) }
  revalidatePath(`${FORUM_BASE}/varsler`)
  revalidatePath(FORUM_BASE)
  return { ok: true }
}

export async function forumMarkAllForumNoticesReadAction(): Promise<ForumActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Ikke innlogget.' }

  const { error } = await supabase
    .from('forum_notice')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) return { ok: false, error: mapForumError(error.message) }
  revalidatePath(`${FORUM_BASE}/varsler`)
  revalidatePath(FORUM_BASE)
  return { ok: true }
}

export async function forumModeratorSetLockedAction(input: unknown): Promise<ForumActionResult> {
  const parsed = forumModLockSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg = Object.values(first).flat()[0] ?? 'Ugyldig data.'
    return { ok: false, error: String(msg) }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('forum_mod_set_thread_locked', {
    p_thread_id: parsed.data.threadId,
    p_locked: parsed.data.locked,
  })
  if (error) return { ok: false, error: mapForumError(error.message) }

  await revalidateForumSurfaces(parsed.data.threadId)
  return { ok: true }
}

export async function forumModeratorSetReportStatusAction(input: unknown): Promise<ForumActionResult> {
  const parsed = forumModReportStatusSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg = Object.values(first).flat()[0] ?? 'Ugyldig data.'
    return { ok: false, error: String(msg) }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('forum_mod_set_report_status', {
    p_report_id: parsed.data.reportId,
    p_status: parsed.data.status,
  })
  if (error) return { ok: false, error: mapForumError(error.message) }

  revalidatePath(`${FORUM_BASE}/moderering`)
  return { ok: true }
}

export async function forumTogglePostUpvoteAction(
  postId: string,
  threadId: string,
): Promise<ForumActionResult & { upvoted?: boolean }> {
  const parsed = forumToggleUpvoteSchema.safeParse({ postId, threadId })
  if (!parsed.success) {
    return { ok: false, error: 'Ugyldig innlegg.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Ikke innlogget.' }

  const pid = parsed.data.postId
  const tid = parsed.data.threadId

  const { data: postRow, error: postErr } = await supabase
    .from('forum_post')
    .select('id, thread_id, deleted_at')
    .eq('id', pid)
    .maybeSingle()

  if (postErr || !postRow || typeof (postRow as { thread_id?: unknown }).thread_id !== 'string') {
    return { ok: false, error: 'Fant ikke innlegget.' }
  }
  if ((postRow as { thread_id: string }).thread_id !== tid) {
    return { ok: false, error: 'Innlegget hører ikke til denne tråden.' }
  }
  if ((postRow as { deleted_at?: string | null }).deleted_at) {
    return { ok: false, error: 'Kan ikke stemme på et fjernet innlegg.' }
  }

  const { data: existing, error: exErr } = await supabase
    .from('forum_post_upvote')
    .select('post_id')
    .eq('post_id', pid)
    .eq('user_id', user.id)
    .maybeSingle()

  if (exErr) {
    return { ok: false, error: mapForumError(exErr.message) }
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from('forum_post_upvote')
      .delete()
      .eq('post_id', pid)
      .eq('user_id', user.id)
    if (delErr) return { ok: false, error: mapForumError(delErr.message) }
    revalidatePath(`${FORUM_BASE}/trad/${tid}`)
    return { ok: true, upvoted: false }
  }

  const { error: insErr } = await supabase.from('forum_post_upvote').insert({ post_id: pid, user_id: user.id })
  if (insErr) return { ok: false, error: mapForumError(insErr.message) }
  revalidatePath(`${FORUM_BASE}/trad/${tid}`)
  return { ok: true, upvoted: true }
}
