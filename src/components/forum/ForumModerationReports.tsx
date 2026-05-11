'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { forumModeratorSetReportStatusAction } from '@/lib/forum/actions'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

type ReportRow = {
  id: string
  reason: string
  status: string
  created_at: string
  post_id: string | null
  thread_id: string | null
  reporter_id: string
  forum_post: { body: string; thread_id: string } | { body: string; thread_id: string }[] | null
  forum_thread: { title: string } | { title: string }[] | null
}

function embedOne<T extends object>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export default function ForumModerationReports({ reports }: { reports: ReportRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const setStatus = (id: string, status: 'open' | 'dismissed' | 'resolved') => {
    startTransition(async () => {
      const r = await forumModeratorSetReportStatusAction({ reportId: id, status })
      if (!r.ok) window.alert(r.error)
      router.refresh()
    })
  }

  if (!reports.length) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ingen rapporter i køen.</p>
  }

  return (
    <ul className="min-w-0 list-none space-y-4 p-0">
      {reports.map((rep) => {
        const postEmb = embedOne(rep.forum_post)
        const threadEmb = embedOne(rep.forum_thread)
        const resolvedThreadId = rep.thread_id ?? postEmb?.thread_id ?? ''
        const link =
          rep.post_id != null && resolvedThreadId
            ? `${FORUM_BASE_PATH}/trad/${resolvedThreadId}#post-${rep.post_id}`
            : resolvedThreadId
              ? `${FORUM_BASE_PATH}/trad/${resolvedThreadId}`
              : FORUM_BASE_PATH
        return (
          <li
            key={rep.id}
            className="rounded-2xl border p-4 min-w-0 shadow-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                {rep.status}
              </span>
              <span className="tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(rep.created_at).toLocaleString('nb-NO')}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium break-words" style={{ color: 'var(--text)' }}>
              {threadEmb?.title ? `«${threadEmb.title}»` : 'Tråd'}
              {rep.post_id ? ` · Innlegg` : ` · Trådmelding`}
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Reporter: {rep.reporter_id.slice(0, 8)}…
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--text)' }}>
              {rep.reason}
            </p>
            {postEmb?.body ? (
              <p className="mt-2 text-xs border-t pt-2 whitespace-pre-wrap break-words" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                Kontekst: {postEmb.body.slice(0, 400)}
                {postEmb.body.length > 400 ? '…' : ''}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={link}
                className="inline-flex min-h-[44px] items-center px-3 rounded-xl text-xs font-semibold border touch-manipulation"
                style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                prefetch={false}
              >
                Åpne
              </Link>
              <button
                type="button"
                disabled={pending || rep.status === 'dismissed'}
                onPointerDown={() => setStatus(rep.id, 'dismissed')}
                className="inline-flex min-h-[44px] px-3 rounded-xl text-xs font-medium border touch-manipulation"
                style={{ borderColor: 'var(--border)' }}
              >
                Avvis
              </button>
              <button
                type="button"
                disabled={pending || rep.status === 'resolved'}
                onPointerDown={() => setStatus(rep.id, 'resolved')}
                className="inline-flex min-h-[44px] px-3 rounded-xl text-xs font-semibold text-white bg-emerald700 touch-manipulation"
              >
                Løst
              </button>
              <button
                type="button"
                disabled={pending || rep.status === 'open'}
                onPointerDown={() => setStatus(rep.id, 'open')}
                className="inline-flex min-h-[44px] px-3 rounded-xl text-xs border touch-manipulation"
                style={{ borderColor: 'var(--border)' }}
              >
                Gjenåpne
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
