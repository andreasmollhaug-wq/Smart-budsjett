import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ForumHomeSort, ForumHomeThreadRow } from '@/lib/forum/home'
import {
  forumHomeSortHeadingNb,
  forumHomeSortSubtitleNb,
} from '@/lib/forum/home'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'
import ForumThreadTopicRows from '@/components/forum/ForumThreadTopicRows'

interface ForumHomeTopicsProps {
  rows: ForumHomeThreadRow[]
  activeSort: ForumHomeSort
}

/** Segmentfane: aktiv «pill» på track med --bg */
function SegmentLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={[
        'inline-flex min-h-[44px] min-w-0 flex-1 snap-center items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-medium sm:text-sm',
        'touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        active ? 'shadow-sm' : 'hover:bg-[color-mix(in_srgb,var(--surface)_55%,transparent)]',
      ].join(' ')}
      style={
        active
          ? {
              background: 'var(--surface)',
              color: 'var(--text)',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(30,43,79,0.08)',
              border: '1px solid color-mix(in srgb, var(--primary) 35%, var(--border))',
            }
          : {
              color: 'var(--text-muted)',
              border: '1px solid transparent',
            }
      }
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}

export default function ForumHomeTopics({ rows, activeSort }: ForumHomeTopicsProps) {
  const heading = forumHomeSortHeadingNb(activeSort)
  const subtitle = forumHomeSortSubtitleNb(activeSort)

  const qSiste = ''
  const qDisk = '?visning=diskusjon'
  const qLest = '?visning=lest'

  return (
    <article
      className="min-w-0 rounded-2xl border p-5 shadow-sm sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <header className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl" style={{ color: 'var(--text)' }}>
          {heading}
        </h2>
        <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      </header>

      <nav
        aria-label="Sortering"
        className="mt-5 flex min-w-0 gap-1 overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-xl border p-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:snap-none"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg)',
          boxShadow: 'inset 0 1px 2px rgba(30,43,79,0.04)',
        }}
      >
        <SegmentLink href={`${FORUM_BASE_PATH}${qSiste}`} active={activeSort === 'latest'}>
          Siste aktivitet
        </SegmentLink>
        <SegmentLink href={`${FORUM_BASE_PATH}${qDisk}`} active={activeSort === 'hot'}>
          Mest diskutert
        </SegmentLink>
        <SegmentLink href={`${FORUM_BASE_PATH}${qLest}`} active={activeSort === 'views'}>
          Mest lest
        </SegmentLink>
      </nav>

      <div className="mt-5 min-w-0 lg:min-h-0 lg:flex-1">
        <ForumThreadTopicRows rows={rows} showCategoryColumn />
      </div>
    </article>
  )
}
