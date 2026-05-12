import Link from 'next/link'
import type { ReactNode } from 'react'
import { formatForumActivityTs } from '@/lib/forum/home'

export type ForumThreadAboutData = {
  createdAt: string
  lastActivityAt: string
  viewCount: number
  totalPosts: number
  replyCount: number
  categoryHref: string | null
  categoryTitle: string | null
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-[color-mix(in_srgb,var(--border)_85%,transparent)] py-2 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="max-w-[55%] text-right text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
        {value}
      </span>
    </div>
  )
}

function formatWhen(iso: string): string {
  if (!iso?.trim()) return '—'
  const d = formatForumActivityTs(iso)
  return d || '—'
}

export default function ForumThreadAboutPanel({
  data,
}: {
  data: ForumThreadAboutData
}) {
  return (
    <section
      className="min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      aria-labelledby="forum-thread-about-heading"
    >
      <h2 id="forum-thread-about-heading" className="text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
        Om denne tråden
      </h2>
      <div className="mt-3">
        {data.categoryHref && data.categoryTitle ? (
          <div className="mb-3 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Kategori: </span>
            <Link
              href={data.categoryHref}
              prefetch={false}
              className="touch-manipulation font-semibold underline-offset-2 hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {data.categoryTitle}
            </Link>
          </div>
        ) : null}
        <Row label="Opprettet" value={formatWhen(data.createdAt)} />
        <Row label="Siste aktivitet" value={formatWhen(data.lastActivityAt)} />
        <Row label="Innlegg totalt" value={data.totalPosts} />
        <Row label="Svar" value={data.replyCount} />
        <Row label="Visninger" value={data.viewCount} />
      </div>
    </section>
  )
}
