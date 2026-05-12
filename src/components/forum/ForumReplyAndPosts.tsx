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
  /** Antall tommel opp per innlegg (kun synlige poster på siden). */
  upvoteCountByPostId?: Record<string, number>
  /** Post-ider brukeren har stemt på (gjeldende side). */
  viewerUpvotedPostIds?: string[]
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

function PostMeta({
  badge,
  isOwn,
  isFirst,
  createdAt,
  editedAt,
}: {
  badge: string
  isOwn: boolean
  isFirst: boolean
  createdAt: string
  editedAt: string | null
}) {
  return (
    <div className="text-xs flex flex-wrap items-center gap-2 min-w-0">
      <span className="min-w-0" style={{ color: 'var(--text-muted)' }}>
        Bidrag{' '}
        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{badge}</span>
        {isOwn ? (
          <span
            className={`${chipBase} ml-1`}
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
            className={`${chipBase} ml-1`}
            style={{
              background: 'color-mix(in srgb, var(--text-muted) 12%, var(--surface))',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            Trådstart
          </span>
        ) : null}
      </span>
      <span className="tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
        {formatForumDate(createdAt)}
      </span>
      {editedAt ? (
        <span className="shrink-0 italic" style={{ color: 'var(--text-muted)' }}>
          · redigert {formatForumDate(editedAt)}
        </span>
      ) : null}
    </div>
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
  upvoteCountByPostId = {},
  viewerUpvotedPostIds = [],
}: ForumReplyAndPostsProps) {
  const viewerVoteSet = new Set(viewerUpvotedPostIds)
  void _isPinned
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { hasSubscriptionAccess, appReadOnly } = useSubscriptionReadOnly()
  const canWriteBase = hasSubscriptionAccess && !appReadOnly
  const canReply = canWriteBase && !isThreadLocked

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

  const markedOp = posts.find((p) => p.is_first_post)
  const opPost = markedOp ?? (posts.length ? posts[0] : null)
  const replies = markedOp ? posts.filter((p) => !p.is_first_post) : posts.length > 1 ? posts.slice(1) : []

  const msgOk = msg?.startsWith('Takk') || msg?.includes('Lagret')

  return (
    <div className="min-w-0 space-y-4">
      <ForumHashScroll />

      {msg ? (
        <div
          className="text-sm rounded-xl px-3 py-2 break-words border min-w-0"
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

      {(pagination.prevHref !== null || pagination.nextHref !== null) && pagination.totalPosts > pagination.pageSize ? (
        <nav
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          aria-label="Innlegg sidevisning"
        >
          {pagination.prevHref ? (
            <Link
              href={pagination.prevHref}
              prefetch={false}
              className="inline-flex min-h-[44px] items-center px-4 rounded-xl border text-xs font-semibold touch-manipulation"
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
              className="inline-flex min-h-[44px] items-center px-4 rounded-xl border text-xs font-semibold touch-manipulation"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              Nyere innlegg
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <article
        className="min-w-0 overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
        }}
        aria-label="Samtale og svar"
      >
        <section aria-label="Innhold" className="min-w-0">
          <div className="min-w-0 space-y-0">
            {posts.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                Ingen innlegg på denne siden.
              </p>
            ) : opPost ? (
              <>
                {/* Åpningsinnlegg */}
                <div
                  id={`post-${opPost.id}`}
                  className="min-w-0 scroll-mt-28 -mx-5 -mt-5 mb-0 border-b px-5 py-5 sm:-mx-6 sm:-mt-6 sm:px-6 sm:py-6"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'color-mix(in srgb, var(--primary-pale) 42%, var(--surface))',
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3 min-w-0">
                    <PostMeta
                      badge={forumAuthorDisplay(opPost.author_id, profileDisplayByUserId)}
                      isOwn={opPost.author_id === currentUserId}
                      isFirst
                      createdAt={opPost.created_at}
                      editedAt={opPost.edited_at}
                    />
                    <PostToolbar
                      postId={opPost.id}
                      deleted={!!opPost.deleted_at}
                      isOwn={opPost.author_id === currentUserId}
                      pending={pending}
                      onQuote={onQuote}
                      onStartEdit={(pid) => {
                        const p = posts.find((x) => x.id === pid)
                        if (p && !p.deleted_at) {
                          setEditPostId(pid)
                          setEditDraft(p.body)
                        }
                      }}
                      onToggleReport={toggleReport}
                      onSoftDeletePost={softDeletePost}
                    />
                  </div>
                  {titleEditOpen && isStarter ? (
                    <div className="mb-3 space-y-2">
                      <input
                        value={titleDraft}
                        disabled={pending}
                        onChange={(ev) => setTitleDraft(ev.target.value)}
                        className="w-full min-h-[44px] rounded-xl border px-3 py-2 text-sm"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                        maxLength={240}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onPointerDown={saveTitle}
                          className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-white bg-[var(--primary)] touch-manipulation"
                        >
                          Lagre tittel
                        </button>
                        <button
                          type="button"
                          onPointerDown={() => {
                            setTitleEditOpen(false)
                            setTitleDraft(threadTitle)
                          }}
                          className="min-h-[44px] px-4 rounded-xl text-xs touch-manipulation border"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : isStarter ? (
                    <button
                      type="button"
                      onPointerDown={() => {
                        setTitleEditOpen(true)
                        setTitleDraft(threadTitle)
                      }}
                      className="mb-3 text-xs font-semibold underline touch-manipulation"
                      style={{ color: 'var(--primary)' }}
                    >
                      Endre trådstittel
                    </button>
                  ) : null}
                  {opPost.deleted_at ? (
                    <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                      [Dette innlegget er fjernet av forfatteren.]
                    </p>
                  ) : editPostId === opPost.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editDraft}
                        disabled={pending}
                        onChange={(ev) => setEditDraft(ev.target.value)}
                        rows={6}
                        className="w-full rounded-xl border p-3 text-sm min-w-0"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending || editDraft.trim().length < 1}
                          onPointerDown={saveEditPost}
                          className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-white bg-[var(--primary)] touch-manipulation"
                        >
                          Lagre
                        </button>
                        <button
                          type="button"
                          onPointerDown={() => {
                            setEditPostId(null)
                            setEditDraft('')
                          }}
                          className="min-h-[44px] px-4 rounded-xl text-xs border touch-manipulation"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ForumMarkdown text={opPost.body} />
                      <ForumPostAttachmentsDisplay attachments={opPost.attachments} />
                      <ForumPostUpvoteButton
                        postId={opPost.id}
                        threadId={threadId}
                        initialCount={upvoteCountByPostId[opPost.id] ?? 0}
                        initialUpvoted={viewerVoteSet.has(opPost.id)}
                      />
                    </>
                  )}
                  {reportOpenId === opPost.id && !opPost.deleted_at && (
                    <ForumReportForm
                      reason={reportReason}
                      pending={pending}
                      onReason={setReportReason}
                      onCancel={() => {
                        setReportOpenId(null)
                        setReportReason('')
                      }}
                      onSubmit={() => submitReport(opPost.id)}
                      label="Melding til admin"
                    />
                  )}
                </div>

                {/* Svar */}
                {replies.length > 0 ? (
                  <div className="mt-0 min-w-0 pt-3 sm:pt-4">
                    <h3 className="sr-only">Svar</h3>
                    <ul className="min-w-0 list-none space-y-0">
                      {replies.map((p, replyIdx) => {
                        const deleted = !!p.deleted_at
                        const borderSep =
                          replyIdx === 0
                            ? ''
                            : 'border-t border-[color-mix(in_srgb,var(--text-muted)_22%,transparent)] pt-4'
                        return (
                          <li
                            key={p.id}
                            className={['min-w-0 py-4 first:pt-3 sm:first:pt-4 list-none', borderSep]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <div
                              id={`post-${p.id}`}
                              className="min-w-0 border-l-2 pl-3 sm:pl-4 scroll-mt-28"
                              style={{
                                borderColor: 'color-mix(in srgb, var(--primary) 28%, var(--border))',
                              }}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3 mb-2 min-w-0">
                                <PostMeta
                                  badge={forumAuthorDisplay(p.author_id, profileDisplayByUserId)}
                                  isOwn={p.author_id === currentUserId}
                                  isFirst={false}
                                  createdAt={p.created_at}
                                  editedAt={p.edited_at}
                                />
                                <PostToolbar
                                  postId={p.id}
                                  deleted={deleted}
                                  isOwn={p.author_id === currentUserId}
                                  pending={pending}
                                  onQuote={onQuote}
                                  onStartEdit={(pid) => {
                                    const row = posts.find((x) => x.id === pid)
                                    if (row && !row.deleted_at) {
                                      setEditPostId(pid)
                                      setEditDraft(row.body)
                                    }
                                  }}
                                  onToggleReport={toggleReport}
                                  onSoftDeletePost={softDeletePost}
                                />
                              </div>
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
                                    rows={5}
                                    className="w-full rounded-xl border p-3 text-sm min-w-0"
                                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={pending || editDraft.trim().length < 1}
                                      onPointerDown={saveEditPost}
                                      className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-white bg-[var(--primary)] touch-manipulation"
                                    >
                                      Lagre
                                    </button>
                                    <button
                                      type="button"
                                      onPointerDown={() => {
                                        setEditPostId(null)
                                        setEditDraft('')
                                      }}
                                      className="min-h-[44px] px-4 rounded-xl text-xs border touch-manipulation"
                                      style={{
                                        borderColor: 'var(--border)',
                                        background: 'var(--surface)',
                                      }}
                                    >
                                      Avbryt
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <ForumMarkdown text={p.body} compact />
                                  <ForumPostAttachmentsDisplay attachments={p.attachments} />
                                  <ForumPostUpvoteButton
                                    postId={p.id}
                                    threadId={threadId}
                                    initialCount={upvoteCountByPostId[p.id] ?? 0}
                                    initialUpvoted={viewerVoteSet.has(p.id)}
                                  />
                                </>
                              )}
                              {reportOpenId === p.id && !deleted && (
                                <ForumReportForm
                                  reason={reportReason}
                                  pending={pending}
                                  onReason={setReportReason}
                                  onCancel={() => {
                                    setReportOpenId(null)
                                    setReportReason('')
                                  }}
                                  onSubmit={() => submitReport(p.id)}
                                  label="Send melding til admin"
                                />
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                Ingen innlegg å vise.
              </p>
            )}
          </div>
        </section>

        <footer className="mt-5 min-w-0 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
          {!canReply ? (
            <p className="text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
              {isThreadLocked
                ? 'Tråden er låst — du kan ikke legge til flere svar.'
                : 'Du kan ikke legge til svar i skrivebeskyttet modus.'}
            </p>
          ) : (
            <form onSubmit={onReply} className="space-y-3 min-w-0">
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
                className="w-full min-h-[120px] px-3 py-2.5 rounded-xl text-sm resize-y min-w-0 max-w-full touch-manipulation border"
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
                className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 touch-manipulation"
                style={{ background: 'var(--cta-gradient)' }}
              >
                {pending ? 'Sender…' : 'Send svar'}
              </button>
            </form>
          )}
        </footer>

        <section
          className="mt-5 rounded-xl border p-4 min-w-0"
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
              className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-xs font-semibold border touch-manipulation"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              {subscribed ? 'Slutt å følge tråd' : 'Varsle ved nye svar (følg tråd)'}
            </button>
            {!canWriteBase ? (
              <p className="text-sm mt-2 w-full" style={{ color: 'var(--text-muted)' }}>
                Ikke aktivt å skrive:{' '}
                <Link href="/konto/betalinger" className="underline font-medium" style={{ color: 'var(--primary)' }}>
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
              className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-xs font-medium touch-manipulation border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            >
              Rapporter hele tråden
            </button>
            {isModerator ? (
              <button
                type="button"
                disabled={pending}
                onPointerDown={toggleModeratorLock}
                className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-xs font-semibold touch-manipulation border border-amber-700 text-amber-900"
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
                className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 touch-manipulation border"
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
      </article>
    </div>
  )
}
