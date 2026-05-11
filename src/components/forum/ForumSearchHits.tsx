import Link from 'next/link'
import { formatForumActivityTs } from '@/lib/forum/home'
import type { ForumSearchHitRow } from '@/lib/forum/search'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

function SnippetMarks({ text }: { text: string }) {
  const parts = text.split(/\*\*/)
  if (parts.length === 1) {
    return <span className="break-words">{text}</span>
  }
  return (
    <span className="break-words">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded px-0.5"
            style={{
              background: 'color-mix(in srgb, var(--primary-pale) 70%, transparent)',
              color: 'var(--text)',
            }}
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  )
}

export default function ForumSearchHits({ rows }: { rows: ForumSearchHitRow[] }) {
  if (!rows.length) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
        Ingen treff — prøv færre ord eller en annen formulering.
      </p>
    )
  }

  return (
    <ul className="min-w-0 list-none space-y-3 p-0">
      {rows.map((r) => (
        <li
          key={r.thread_id}
          className="min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex flex-wrap items-baseline justify-between gap-2">
            <Link
              href={`${FORUM_BASE_PATH}/trad/${r.thread_id}`}
              className="text-base font-semibold leading-snug underline-offset-2 hover:underline min-w-0 break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-sm"
              style={{ color: 'var(--text)' }}
              prefetch={false}
            >
              {r.thread_title}
            </Link>
            <span className="shrink-0 text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {formatForumActivityTs(r.last_activity_at)}
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {r.category_title}
            </span>
            {r.category_slug ? (
              <>
                {' · '}
                <Link
                  href={`${FORUM_BASE_PATH}/kategori/${encodeURIComponent(r.category_slug)}`}
                  className="underline font-medium min-h-[44px] inline-flex items-center touch-manipulation"
                  style={{ color: 'var(--primary)' }}
                  prefetch={false}
                >
                  Kategori
                </Link>
              </>
            ) : null}
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <SnippetMarks text={r.snippet} />
          </p>
        </li>
      ))}
    </ul>
  )
}
