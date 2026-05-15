'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import {
  forumCreateReplyAction,
  forumEditPostAction,
  forumEditThreadTitleAction,
  forumModeratorSetLockedAction,
  forumSetThreadSubscriptionAction,
  forumSoftDeletePostAction,
  forumSoftDeleteThreadAction,
  forumSubmitReportAction,
} from '@/lib/forum/actions'
import { forumAuthorDisplay } from '@/lib/forum/formatAuthor'
import type { ForumThreadPostRow } from '@/lib/forum/types'
import { partitionForumAttachments, uploadForumPostAttachments } from '@/lib/forum/uploadAttachments'
import { createClient } from '@/lib/supabase/client'
import ForumAttachmentPicker from '@/components/forum/ForumAttachmentPicker'
import ForumPostAttachmentsDisplay from '@/components/forum/ForumPostAttachmentsDisplay'
import ForumMarkdown from '@/components/forum/ForumMarkdown'
import ForumHashScroll from '@/components/forum/ForumHashScroll'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'
import { useSubscriptionReadOnly } from '@/components/app/SubscriptionReadOnlyProvider'
import ForumReportForm from '@/components/forum/ForumReportForm'
import ForumPostUpvoteButton from '@/components/forum/ForumPostUpvoteButton'
import ForumThreadAboutPanel from '@/components/forum/ForumThreadAboutPanel'
import type { ForumThreadAboutData } from '@/components/forum/ForumThreadAboutPanel'
import ForumDisplayNameQuickForm from '@/components/forum/ForumDisplayNameQuickForm'
import ForumDisplayNameRequiredDialog from '@/components/forum/ForumDisplayNameRequiredDialog'

export type ForumThreadPaginationInfo = {
  page: number
  totalPages: number
  prevHref: string | null
  nextHref: string | null
  totalPosts: number
  pageSize: number
}

interface ForumReplyAndPostsProps {
  threadId: string
  threadTitle: string
  starterAuthorId: string
  currentUserId: string
  posts: ForumThreadPostRow[]
  isThreadLocked: boolean
  isPinned: boolean
  isSubscribedToThread: boolean
  isModerator: boolean
  profileDisplayByUserId: Record<string, string | null | undefined>
  pagination: ForumThreadPaginationInfo
  threadAbout: ForumThreadAboutData
  /** Antall tommel opp per innlegg (kun synlige poster på siden). */
  upvoteCountByPostId?: Record<string, number>
  /** Post-ider brukeren har stemt på (gjeldende side). */
  viewerUpvotedPostIds?: string[]
  /** Minst to tegn i forum_profile.display_name — kreves for svar og nye stemmer. */
  /** Rå forum_profile.display_name (kan være tom eller for kort for deltakelse). */
  viewerForumDisplayNameDraft?: string
  viewerHasForumDisplayName: boolean
}

function formatForumDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function quoteFromBody(body: string): string {
  const lines = body.trim().split('\n').slice(0, 4)
  const chunk = lines.join('\n').slice(0, 700)
  if (!chunk) return ''
  return chunk.split('\n').map((l) => `> ${l}`).join('\n') + '\n\n'
}

const chipBase =
  'inline-flex items-center shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-semibold border'

function PostToolbar({
  postId,
  deleted,
  isOwn,
  pending,
  onQuote,
  onStartEdit,
  onToggleReport,
  onSoftDeletePost,
}: {
  postId: string
  deleted: boolean
  isOwn: boolean
  pending: boolean
  onQuote: (id: string) => void
  onStartEdit: (id: string) => void
  onToggleReport: (id: string) => void
  onSoftDeletePost: (id: string) => void
}) {
  if (deleted) return null
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onPointerDown={() => onQuote(postId)}
        className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-xl text-xs font-medium transition-opacity hover:opacity-90 touch-manipulation border"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        Siter
      </button>
      {isOwn ? (
        <button
          type="button"
          disabled={pending}
          onPointerDown={() => onStartEdit(postId)}
          className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-xl text-xs font-medium transition-opacity hover:opacity-90 touch-manipulation border"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
          }}
        >
          Rediger
        </button>
      ) : null}
      <button
        type="button"
        onPointerDown={() => onToggleReport(postId)}
        className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-xl text-xs font-medium transition-opacity hover:opacity-90 touch-manipulation"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        Rapporter
      </button>
      {isOwn ? (
        <button
          type="button"
          disabled={pending}
          onPointerDown={() => onSoftDeletePost(postId)}
          className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-xl text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50 touch-manipulation border"
          style={{
            borderColor: 'color-mix(in srgb, #b91c1c 45%, var(--border))',
            background: 'color-mix(in srgb, #fef2f2 92%, var(--surface))',
            color: '#b91c1c',
          }}
        >
          Slett innlegg
        </button>
      ) : null}
    </div>
  )
}

function PostCardHeader({
  postNumber,
  displayName,
  isOwn,
  isFirst,
  createdAt,
  editedAt,
}: {
  postNumber: number
  displayName: string
  isOwn: boolean
  isFirst: boolean
  createdAt: string
  editedAt: string | null
}) {
  return (
    <header className="mb-3 min-w-0 space-y-1">
      <p className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
        #{postNumber} · {formatForumDate(createdAt)}
      </p>
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold" style={{ color: 'var(--text)' }}>
          {displayName}
        </span>
        {isOwn ? (
          <span
            className={chipBase}
            style={{
              background: 'var(--primary-pale)',
              borderColor: 'color-mix(in srgb, var(--primary) 35%, var(--border))',
              color: 'var(--primary)',
            }}
          >
            Deg
          </span>
        ) : null}
        {isFirst ? (
          <span
            className={chipBase}
            style={{
              background: 'color-mix(in srgb, var(--text-muted) 12%, var(--surface))',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            Trådstart
          </span>
        ) : null}
        {editedAt ? (
          <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
            redigert {formatForumDate(editedAt)}
          </span>
        ) : null}
      </div>
    </header>
  )
}

export default function ForumReplyAndPosts({
  threadId,
  threadTitle,
  starterAuthorId,
  currentUserId,
  posts,
  isThreadLocked,
  isPinned: _isPinned,
  isSubscribedToThread: initialSub,
  isModerator,
  profileDisplayByUserId,
  pagination,
  threadAbout,
  upvoteCountByPostId = {},
  viewerUpvotedPostIds = [],
  viewerHasForumDisplayName,
  viewerForumDisplayNameDraft = '',
}: ForumReplyAndPostsProps) {
  const viewerVoteSet = new Set(viewerUpvotedPostIds)
  void _isPinned
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { hasSubscriptionAccess, appReadOnly } = useSubscriptionReadOnly()
  const canWriteBase = hasSubscriptionAccess && !appReadOnly
  const canReply = canWriteBase && !isThreadLocked

  const [displayNameDialogOpen, setDisplayNameDialogOpen] = useState(false)

  const [replyBody, setReplyBody] = useState('')
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const replyAttachId = useId()

  const [reportOpenId, setReportOpenId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [threadReportOpen, setThreadReportOpen] = useState(false)

  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [titleEditOpen, setTitleEditOpen] = useState(false)
  const [titleDraft, setTitleDraft] = useState(threadTitle)
  const [subscribed, setSubscribed] = useState(initialSub)

  useEffect(() => {
    setTitleDraft(threadTitle)
  }, [threadTitle])

  useEffect(() => {
    setSubscribed(initialSub)
  }, [initialSub])

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const onQuote = (postId: string) => {
    const body = posts.find((p) => p.id === postId)?.body ?? ''
    setReplyBody((prev) => quoteFromBody(body) + prev)
    setMsg(null)
    const el = document.getElementById('forum-reply-body')
    el?.focus()
  }

  const onReply = (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!canReply) {
      setMsg('Du kan ikke legge til svar på denne tråden.')
      return
    }

    startTransition(async () => {
      const fileChk = partitionForumAttachments(replyFiles)
      if (!fileChk.ok) {
        setMsg(fileChk.error)
        return
      }

      const result = await forumCreateReplyAction({ threadId, body: replyBody })
      if (!result.ok) {
        setMsg(result.error)
        return
      }

      let attachNote: string | null = null
      if (fileChk.files.length > 0 && result.replyPostId) {
        const sb = createClient()
        const upload = await uploadForumPostAttachments(sb, currentUserId, result.replyPostId, fileChk.files)
        if (!upload.ok) {
          attachNote = `Svaret ble lagret, men vedlegg ble ikke lastet opp: ${upload.error}`
        }
      } else if (fileChk.files.length > 0 && !result.replyPostId) {
        attachNote = 'Svaret ble lagret, men vedlegg kunne ikke knyttes til innlegget (manglende id).'
      }

      setReplyBody('')
      setReplyFiles([])

      if (attachNote) setMsg(attachNote)
      refresh()
    })
  }

  const softDeletePost = (postId: string) => {
    if (!confirm('Slette innlegget? Handlingen kan ikke angres.')) return
    startTransition(async () => {
      const result = await forumSoftDeletePostAction(postId)
      if (!result.ok) {
        setMsg(result.error)
        return
      }
      refresh()
    })
  }

  const softDeleteThread = () => {
    if (!confirm('Skjul hele tråden for alle? Handlingen kan ikke angres.')) return
    startTransition(async () => {
      const result = await forumSoftDeleteThreadAction(threadId)
      if (!result.ok) {
        setMsg(result.error)
        return
      }
      router.push(FORUM_BASE_PATH)
      router.refresh()
    })
  }

  const submitReport = (postId: string) => {
    startTransition(async () => {
      const result = await forumSubmitReportAction({
        kind: 'post',
        postId,
        reason: reportReason,
      })
      if (!result.ok) {
        setMsg(result.error)
        return
      }
      setReportOpenId(null)
      setReportReason('')
      setMsg('Takk — melding sendt.')
    })
  }

  const submitThreadReport = () => {
    startTransition(async () => {
      const result = await forumSubmitReportAction({
        kind: 'thread',
        threadId,
        reason: reportReason,
      })
      if (!result.ok) {
        setMsg(result.error)
        return
      }
      setThreadReportOpen(false)
      setReportReason('')
      setMsg('Takk — trådmelding sendt.')
    })
  }

  const saveEditPost = () => {
    if (!editPostId) return
    startTransition(async () => {
      const r = await forumEditPostAction({ postId: editPostId, body: editDraft })
      if (!r.ok) setMsg(r.error)
      else {
        setEditPostId(null)
        setEditDraft('')
        refresh()
      }
    })
  }

  const saveTitle = () => {
    startTransition(async () => {
      const r = await forumEditThreadTitleAction({ threadId, title: titleDraft })
      if (!r.ok) setMsg(r.error)
      else {
        setTitleEditOpen(false)
        refresh()
      }
    })
  }

  const toggleSubscribe = () => {
    startTransition(async () => {
      const next = !subscribed
      const r = await forumSetThreadSubscriptionAction(threadId, next)
      if (!r.ok) setMsg(r.error)
      else {
        setSubscribed(next)
        setMsg(next ? 'Du får nå varsling ved nye svar.' : 'Abonnementet er av.')
      }
    })
  }

  const toggleModeratorLock = () => {
    startTransition(async () => {
      const r = await forumModeratorSetLockedAction({ threadId, locked: !isThreadLocked })
      if (!r.ok) setMsg(r.error)
      else refresh()
    })
  }

  const toggleReport = (postId: string) => {
    setMsg(null)
    setThreadReportOpen(false)
    setReportOpenId((pid) => (pid === postId ? null : postId))
    setReportReason('')
  }

  const isStarter = starterAuthorId === currentUserId
  const baseIndex = (pagination.page - 1) * pagination.pageSize

  const msgOk = msg?.startsWith('Takk') || msg?.includes('Lagret')

  return (
    <div className="min-w-0 space-y-4">
      <ForumDisplayNameRequiredDialog
        open={displayNameDialogOpen}
        onClose={() => setDisplayNameDialogOpen(false)}
        initialDisplayName={viewerForumDisplayNameDraft}
      />
      <ForumHashScroll />

      {msg ? (
        <div
          className="min-w-0 break-words rounded-xl border px-3 py-2 text-sm"
          role="status"
          style={{
            background: msgOk
              ? 'color-mix(in srgb, var(--success) 10%, var(--surface))'
              : 'color-mix(in srgb, #fecaca 22%, var(--surface))',
            borderColor: msgOk
              ? 'color-mix(in srgb, var(--success) 38%, var(--border))'
              : 'color-mix(in srgb, #fca5a5 55%, var(--border))',
            color: 'var(--text)',
          }}
        >
          {msg}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_minmax(16rem,20rem)] lg:items-start lg:gap-8">
        <div className="order-1 min-w-0 space-y-4">
          {(pagination.prevHref !== null || pagination.nextHref !== null) &&
          pagination.totalPosts > pagination.pageSize ? (
            <nav
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              aria-label="Innlegg sidevisning"
            >
              {pagination.prevHref ? (
                <Link
                  href={pagination.prevHref}
                  prefetch={false}
                  className="inline-flex min-h-[44px] items-center rounded-xl border px-4 text-xs font-semibold touch-manipulation"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  Tidligere innlegg
                </Link>
              ) : (
                <span />
              )}
              <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                Side {pagination.page}/{pagination.totalPages}
              </span>
              {pagination.nextHref ? (
                <Link
                  href={pagination.nextHref}
                  prefetch={false}
                  className="inline-flex min-h-[44px] items-center rounded-xl border px-4 text-xs font-semibold touch-manipulation"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  Nyere innlegg
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}

          {posts.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen innlegg på denne siden.
            </p>
          ) : (
            <div className="flex min-w-0 flex-col gap-4" aria-label="Innlegg i tråden">
              {posts.map((p, i) => {
                const postNum = baseIndex + i + 1
                const deleted = !!p.deleted_at
                const isFirst = p.is_first_post
                return (
                  <article
                    key={p.id}
                    id={`post-${p.id}`}
                    className="min-w-0 scroll-mt-28 rounded-2xl border p-5 shadow-sm sm:p-6"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      ...(isFirst ? { borderTop: '3px solid var(--primary)' } : {}),
                    }}
                  >
                    <PostCardHeader
                      postNumber={postNum}
                      displayName={forumAuthorDisplay(p.author_id, profileDisplayByUserId)}
                      isOwn={p.author_id === currentUserId}
                      isFirst={isFirst}
                      createdAt={p.created_at}
                      editedAt={p.edited_at}
                    />

                    {p.is_first_post && titleEditOpen && isStarter ? (
                      <div className="mb-3 space-y-2">
                        <input
                          value={titleDraft}
                          disabled={pending}
                          onChange={(ev) => setTitleDraft(ev.target.value)}
                          className="min-h-[44px] w-full rounded-xl border px-3 py-2 text-sm"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          maxLength={240}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={pending}
                            onPointerDown={saveTitle}
                            className="min-h-[44px] rounded-xl bg-[var(--primary)] px-4 text-xs font-semibold text-white touch-manipulation"
                          >
                            Lagre tittel
                          </button>
                          <button
                            type="button"
                            onPointerDown={() => {
                              setTitleEditOpen(false)
                              setTitleDraft(threadTitle)
                            }}
                            className="min-h-[44px] rounded-xl border px-4 text-xs touch-manipulation"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : p.is_first_post && isStarter ? (
                      <button
                        type="button"
                        onPointerDown={() => {
                          if (!viewerHasForumDisplayName) {
                            setDisplayNameDialogOpen(true)
                            return
                          }
                          setTitleEditOpen(true)
                          setTitleDraft(threadTitle)
                        }}
                        className="mb-3 text-xs font-semibold underline touch-manipulation"
                        style={{ color: 'var(--primary)' }}
                      >
                        Endre trådstittel
                      </button>
                    ) : null}

                    {deleted ? (
                      <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                        [Dette innlegget er fjernet av forfatteren.]
                      </p>
                    ) : editPostId === p.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editDraft}
                          disabled={pending}
                          onChange={(ev) => setEditDraft(ev.target.value)}
                          rows={isFirst ? 6 : 5}
                          className="min-w-0 w-full rounded-xl border p-3 text-sm"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={pending || editDraft.trim().length < 1}
                            onPointerDown={saveEditPost}
                            className="min-h-[44px] rounded-xl bg-[var(--primary)] px-4 text-xs font-semibold text-white touch-manipulation"
                          >
                            Lagre
                          </button>
                          <button
                            type="button"
                            onPointerDown={() => {
                              setEditPostId(null)
                              setEditDraft('')
                            }}
                            className="min-h-[44px] rounded-xl border px-4 text-xs touch-manipulation"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ForumMarkdown text={p.body} compact={!isFirst} />
                        <ForumPostAttachmentsDisplay attachments={p.attachments} />
                      </>
                    )}

                    {!deleted && editPostId !== p.id ? (
                      <div
                        className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-center"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <PostToolbar
                          postId={p.id}
                          deleted={deleted}
                          isOwn={p.author_id === currentUserId}
                          pending={pending}
                          onQuote={onQuote}
                          onStartEdit={(pid) => {
                            if (!viewerHasForumDisplayName) {
                              setDisplayNameDialogOpen(true)
                              return
                            }
                            const row = posts.find((x) => x.id === pid)
                            if (row && !row.deleted_at) {
                              setEditPostId(pid)
                              setEditDraft(row.body)
                            }
                          }}
                          onToggleReport={toggleReport}
                          onSoftDeletePost={softDeletePost}
                        />
                        <ForumPostUpvoteButton
                          postId={p.id}
                          threadId={threadId}
                          initialCount={upvoteCountByPostId[p.id] ?? 0}
                          initialUpvoted={viewerVoteSet.has(p.id)}
                          viewerHasForumDisplayName={viewerHasForumDisplayName}
                          onRequireForumDisplayName={() => setDisplayNameDialogOpen(true)}
                        />
                      </div>
                    ) : null}

                    {reportOpenId === p.id && !p.deleted_at ? (
                      <ForumReportForm
                        reason={reportReason}
                        pending={pending}
                        onReason={setReportReason}
                        onCancel={() => {
                          setReportOpenId(null)
                          setReportReason('')
                        }}
                        onSubmit={() => submitReport(p.id)}
                        label={isFirst ? 'Melding til admin' : 'Send melding til admin'}
                        className="mt-4"
                      />
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}

          <footer className="min-w-0 rounded-2xl border p-5 shadow-sm sm:p-6" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            {!canReply ? (
              <p className="min-w-0 text-sm" style={{ color: 'var(--text-muted)' }}>
                {isThreadLocked
                  ? 'Tråden er låst — du kan ikke legge til flere svar.'
                  : 'Du kan ikke legge til svar i skrivebeskyttet modus.'}
              </p>
            ) : !viewerHasForumDisplayName ? (
              <div className="min-w-0 space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Nytt svar
                </h3>
                <div
                  className="rounded-xl border px-4 py-4 text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                >
                  <p className="mb-3" style={{ color: 'var(--text-muted)' }}>
                    Velg forumnavnet ditt her (minst to tegn) — da kan du skrive svar uten å forlate tråden.
                  </p>
                  <ForumDisplayNameQuickForm
                    initialDisplayName={viewerForumDisplayNameDraft}
                    onSaved={() => router.refresh()}
                    density="compact"
                    submitLabel="Lagre og fortsett"
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={onReply} className="min-w-0 space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Nytt svar
                </h3>
                <ForumAttachmentPicker id={replyAttachId} disabled={pending} files={replyFiles} onChangeFiles={setReplyFiles} />
                <textarea
                  id="forum-reply-body"
                  rows={5}
                  disabled={pending}
                  value={replyBody}
                  onChange={(ev) => setReplyBody(ev.target.value)}
                  className="min-h-[120px] w-full min-w-0 max-w-full resize-y rounded-xl border px-3 py-2.5 text-sm touch-manipulation"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                  placeholder="Markdown støttes (liste, fet, lenker …)"
                />
                <button
                  type="submit"
                  disabled={pending || replyBody.trim().length < 1}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-50 touch-manipulation"
                  style={{ background: 'var(--cta-gradient)' }}
                >
                  {pending ? 'Sender…' : 'Send svar'}
                </button>
              </form>
            )}
          </footer>

          <section
            className="min-w-0 rounded-xl border p-4"
            style={{
              borderColor: 'color-mix(in srgb, #f59e0b 35%, var(--border))',
              background: 'color-mix(in srgb, #f59e0b 9%, var(--surface))',
            }}
            aria-label="Trådbehandling"
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Trådbehandling
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onPointerDown={toggleSubscribe}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-xs font-semibold touch-manipulation"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {subscribed ? 'Slutt å følge tråd' : 'Varsle ved nye svar (følg tråd)'}
              </button>
              {!canWriteBase ? (
                <p className="mt-2 w-full text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ikke aktivt å skrive:{' '}
                  <Link href="/konto/betalinger" className="font-medium underline" style={{ color: 'var(--primary)' }}>
                    Betalinger
                  </Link>
                  .
                </p>
              ) : null}
              <button
                type="button"
                onPointerDown={() => {
                  setMsg(null)
                  setReportOpenId(null)
                  setThreadReportOpen((o) => !o)
                  setReportReason('')
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-xs font-medium touch-manipulation"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                Rapporter hele tråden
              </button>
              {isModerator ? (
                <button
                  type="button"
                  disabled={pending}
                  onPointerDown={toggleModeratorLock}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-amber-700 px-4 text-xs font-semibold text-amber-900 touch-manipulation"
                  style={{ background: 'color-mix(in srgb,#fef3c7 85%,transparent)' }}
                >
                  {isThreadLocked ? 'Moderator: åpne tråden' : 'Moderator: lås tråden'}
                </button>
              ) : null}
              {isStarter ? (
                <button
                  type="button"
                  disabled={pending}
                  onPointerDown={softDeleteThread}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 touch-manipulation"
                  style={{
                    borderColor: 'color-mix(in srgb, #b91c1c 45%, var(--border))',
                    background: 'color-mix(in srgb, #fef2f2 88%, var(--surface))',
                    color: '#b91c1c',
                  }}
                >
                  Skjul hele tråden for alle (myk sletting)
                </button>
              ) : null}
            </div>
            {threadReportOpen ? (
              <ForumReportForm
                reason={reportReason}
                pending={pending}
                onReason={setReportReason}
                onCancel={() => {
                  setThreadReportOpen(false)
                  setReportReason('')
                }}
                onSubmit={submitThreadReport}
                label="Send trådmelding til moderator"
                className="mt-4"
              />
            ) : null}
          </section>
        </div>

        <aside className="order-2 min-w-0 lg:sticky lg:top-5 lg:self-start">
          <ForumThreadAboutPanel data={threadAbout} />
        </aside>
      </div>
    </div>
  )
}
