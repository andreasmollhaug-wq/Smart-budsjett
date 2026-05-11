'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { forumMarkAllForumNoticesReadAction, forumMarkNoticeReadAction } from '@/lib/forum/actions'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

type Row = {
  id: string
  thread_id: string
  post_id: string
  kind: string
  created_at: string
  read_at: string | null
  forum_thread: { title: string } | { title: string }[] | null
}

function titleOf(r: Row): string {
  const t = r.forum_thread
  if (!t) return 'Tråd'
  const o = Array.isArray(t) ? t[0] : t
  return typeof o?.title === 'string' ? o.title : 'Tråd'
}

export default function ForumNoticeList({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const markOne = (id: string) => {
    startTransition(async () => {
      const r = await forumMarkNoticeReadAction({ noticeId: id })
      if (!r.ok) window.alert(r.error)
      router.refresh()
    })
  }

  const markAll = () => {
    startTransition(async () => {
      const r = await forumMarkAllForumNoticesReadAction()
      if (!r.ok) window.alert(r.error)
      router.refresh()
    })
  }

  if (!rows.length) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ingen forumvarsler ennå.</p>
  }

  const unread = rows.filter((r) => !r.read_at).length

  return (
    <div className="min-w-0 space-y-4">
      {unread > 0 ? (
        <button
          type="button"
          disabled={pending}
          onPointerDown={markAll}
          className="inline-flex min-h-[44px] px-4 rounded-xl text-sm font-semibold border touch-manipulation"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          Marker alle som lest
        </button>
      ) : null}
      <ul className="list-none space-y-3 p-0 min-w-0">
        {rows.map((r) => {
          const href = `${FORUM_BASE_PATH}/trad/${r.thread_id}#post-${r.post_id}`
          const isUnread = !r.read_at
          return (
            <li
              key={r.id}
              className="rounded-xl border p-4 min-w-0"
              style={{
                borderColor: 'var(--border)',
                background: isUnread ? 'color-mix(in srgb, var(--primary-pale) 35%, var(--surface))' : 'var(--surface)',
              }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Nytt svar i «{titleOf(r)}»
              </p>
              <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {new Date(r.created_at).toLocaleString('nb-NO')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={href}
                  className="inline-flex min-h-[44px] items-center px-4 rounded-xl text-xs font-semibold border touch-manipulation"
                  style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                  prefetch={false}
                >
                  Gå til innlegg
                </Link>
                {isUnread ? (
                  <button
                    type="button"
                    disabled={pending}
                    onPointerDown={() => markOne(r.id)}
                    className="inline-flex min-h-[44px] px-4 rounded-xl text-xs border touch-manipulation"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Marker lest
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
