import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ForumHomeSort, ForumHomeThreadRow } from '@/lib/forum/home'
import {
  formatForumActivityTs,
  forumHomeSortHeadingNb,
  forumHomeSortSubtitleNb,
} from '@/lib/forum/home'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

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
      className="min-w-0 rounded-2xl border p-5 shadow-sm sm:p-6"
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

      <div className="mt-5 min-w-0">
        {/* Desktop tabell */}
        <div
          className="hidden min-w-0 overflow-hidden rounded-xl border md:block"
          style={{ borderColor: 'var(--border)' }}
        >
          <table className="w-full min-w-0 border-collapse text-left text-sm">
            <thead>
              <tr
                className="border-b"
                style={{
                  background: 'var(--primary-pale)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <th className="min-w-0 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide sm:text-[13px]" scope="col">
                  Emne
                </th>
                <th
                  className="hidden px-3 py-3.5 text-xs font-semibold uppercase tracking-wide lg:table-cell lg:text-[13px]"
                  scope="col"
                >
                  Kategori
                </th>
                <th className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide tabular-nums sm:text-[13px]" scope="col">
                  Svar
                </th>
                <th className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide tabular-nums sm:text-[13px]" scope="col">
                  Visn.
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide sm:text-[13px]" scope="col">
                  Aktivitet
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="border-b px-4 py-10 text-center text-sm"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    Ingen tråder å vise.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.thread_id}
                    className={[
                      'group border-b transition-[background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none',
                      'hover:bg-[color-mix(in_srgb,var(--primary-pale)_55%,var(--surface))]',
                      'hover:shadow-[inset_3px_0_0_var(--primary)]',
                      i % 2 === 1
                        ? 'bg-[color-mix(in_srgb,var(--bg)_35%,var(--surface))]'
                        : 'bg-[var(--surface)]',
                    ].join(' ')}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="min-w-0 px-4 py-3.5 align-top">
                      <Link
                        href={`${FORUM_BASE_PATH}/trad/${r.thread_id}`}
                        prefetch={false}
                        className={
                          '-mx-1 block min-w-0 rounded-lg px-1 py-1 font-semibold leading-snug break-words ' +
                          'text-[var(--text)] underline-offset-4 transition-[color,text-decoration-color,background-color] duration-200 ease-out ' +
                          'hover:bg-[color-mix(in_srgb,var(--primary-pale)_85%,transparent)] hover:text-[var(--primary)] hover:underline hover:decoration-[var(--primary)] ' +
                          'group-hover:text-[var(--primary)] motion-reduce:transition-none'
                        }
                      >
                        {r.thread_title}
                      </Link>
                      {r.excerpt?.trim() ? (
                        <p
                          className="mt-1 line-clamp-2 text-xs leading-snug break-words"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {r.excerpt}
                        </p>
                      ) : null}
                    </td>
                    <td className="hidden align-top px-3 py-3.5 lg:table-cell">
                      <Link
                        href={`${FORUM_BASE_PATH}/kategori/${r.category_slug}`}
                        prefetch={false}
                        className="inline-block max-w-full truncate rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: 'var(--primary-pale)',
                          border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
                          color: 'var(--primary)',
                        }}
                        title={r.category_title}
                      >
                        {r.category_title}
                      </Link>
                    </td>
                    <td
                      className="px-3 py-3.5 text-right tabular-nums text-sm font-medium align-top"
                      style={{ color: 'var(--text)' }}
                    >
                      {r.reply_count}
                    </td>
                    <td
                      className="px-3 py-3.5 text-right tabular-nums text-sm font-medium align-top"
                      style={{ color: 'var(--text)' }}
                    >
                      {r.view_count}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-xs tabular-nums whitespace-nowrap align-top"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatForumActivityTs(r.last_activity_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobil: underkort per tråd */}
        <ul className="min-w-0 space-y-3 md:hidden">
          {rows.length === 0 ? (
            <li
              className="rounded-xl border px-4 py-8 text-center text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}
            >
              Ingen tråder å vise.
            </li>
          ) : (
            rows.map((r) => (
              <li
                key={r.thread_id}
                className="min-w-0 rounded-xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--primary)_38%,var(--border))] hover:shadow-[0_1px_0_rgba(255,255,255,0.06),0_6px_20px_-4px_rgba(30,43,79,0.12)] motion-reduce:transition-none"
                style={{
                  borderColor: 'var(--border)',
                  background: 'color-mix(in srgb, var(--surface) 92%, var(--bg))',
                }}
              >
                <Link
                  href={`${FORUM_BASE_PATH}/trad/${r.thread_id}`}
                  prefetch={false}
                  className="-mx-1 block min-w-0 rounded-lg px-1 py-1 text-base font-bold leading-snug break-words text-[var(--text)] underline-offset-4 transition-[color,background-color] duration-200 ease-out active:bg-[color-mix(in_srgb,var(--primary-pale)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary-pale)_70%,transparent)] hover:text-[var(--primary)] hover:underline hover:decoration-[var(--primary)] motion-reduce:transition-none touch-manipulation"
                >
                  {r.thread_title}
                </Link>
                {r.excerpt?.trim() ? (
                  <p
                    className="mt-2 text-xs leading-snug line-clamp-3 break-words"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {r.excerpt}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3 text-xs" style={{ borderColor: 'var(--border)' }}>
                  <Link
                    href={`${FORUM_BASE_PATH}/kategori/${r.category_slug}`}
                    className="inline-flex max-w-full items-center truncate rounded-lg px-2 py-1 font-semibold min-h-[44px] min-w-0 shrink"
                    style={{
                      background: 'var(--primary-pale)',
                      color: 'var(--primary)',
                      border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
                    }}
                  >
                    {r.category_title}
                  </Link>
                  <span className="tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                    {r.reply_count} svar
                  </span>
                  <span className="tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                    {r.view_count} visn.
                  </span>
                  <span className="tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {formatForumActivityTs(r.last_activity_at)}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <details
        className="group mt-5 rounded-xl border px-4 py-3 text-sm open:bg-[color-mix(in_srgb,var(--surface),var(--bg)_30%)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden [&::marker]:hidden min-h-[44px] touch-manipulation">
          <span
            className="inline-block text-[var(--text-muted)] transition-transform group-open:rotate-90"
            aria-hidden
          >
            ▸
          </span>
          <span style={{ color: 'var(--text)' }}>Hvordan visning teller</span>
        </summary>
        <div className="mt-3 space-y-2 border-t pt-3 text-xs leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <p>
            Under <strong style={{ color: 'var(--text)' }}>Mest lest</strong> øker tallene når en innlogget bruker åpner en
            tråd (én gang per sidevisning på server).
          </p>
          <p className="font-mono text-[11px] opacity-90">forum_increment_thread_view</p>
        </div>
      </details>
    </article>
  )
}
