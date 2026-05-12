import Link from 'next/link'
import type { ForumHomeThreadRow } from '@/lib/forum/home'
import { formatForumActivityTs } from '@/lib/forum/home'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

export interface ForumThreadTopicRowsProps {
  rows: ForumHomeThreadRow[]
  /** Når false: skjul kategori-kolonne (tabell) og kategori-pille (mobil). */
  showCategoryColumn?: boolean
  emptyLabel?: string
}

export default function ForumThreadTopicRows({
  rows,
  showCategoryColumn = true,
  emptyLabel = 'Ingen tråder å vise.',
}: ForumThreadTopicRowsProps) {
  const desktopGrid = showCategoryColumn
    ? 'md:grid md:grid-cols-[minmax(0,1.45fr)_minmax(2.75rem,0.42fr)_minmax(2.75rem,0.42fr)_minmax(4.85rem,0.48fr)] md:items-center md:gap-x-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(7rem,0.95fr)_minmax(2.75rem,0.38fr)_minmax(2.75rem,0.38fr)_minmax(4.85rem,0.44fr)] lg:gap-x-4'
    : 'md:grid md:grid-cols-[minmax(0,1.45fr)_minmax(2.75rem,0.45fr)_minmax(2.75rem,0.45fr)_minmax(4.85rem,0.5fr)] md:items-center md:gap-x-3 lg:gap-x-4'

  return (
    <div className="min-w-0">
      <div
        className="hidden min-w-0 overflow-hidden rounded-xl border text-left text-sm md:block"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className={[
            'border-b px-4 py-3.5',
            desktopGrid,
          ].join(' ')}
          style={{
            background: 'var(--primary-pale)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          <div className="min-w-0 text-xs font-semibold uppercase tracking-wide sm:text-[13px]">
            Emne
          </div>
          {showCategoryColumn ? (
            <div className="hidden min-w-0 text-left text-xs font-semibold uppercase tracking-wide lg:block lg:text-[13px]">
              Kategori
            </div>
          ) : null}
          <div className="text-right text-xs font-semibold uppercase tracking-wide tabular-nums sm:text-[13px]">
            Svar
          </div>
          <div className="text-right text-xs font-semibold uppercase tracking-wide tabular-nums sm:text-[13px]">
            Visn.
          </div>
          <div className="text-right text-xs font-semibold uppercase tracking-wide sm:text-[13px]">
            Aktivitet
          </div>
        </div>

        {rows.length === 0 ? (
          <div
            className="border-b px-4 py-10 text-center text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {emptyLabel}
          </div>
        ) : (
          rows.map((r, i) => (
            <div
              key={r.thread_id}
              className={[
                'group relative border-b px-4 py-3.5 transition-[background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none',
                'hover:bg-[color-mix(in_srgb,var(--primary-pale)_55%,var(--surface))]',
                'hover:shadow-[inset_3px_0_0_var(--primary)]',
                i % 2 === 1
                  ? 'bg-[color-mix(in_srgb,var(--bg)_35%,var(--surface))]'
                  : 'bg-[var(--surface)]',
              ].join(' ')}
              style={{ borderColor: 'var(--border)' }}
            >
              <Link
                href={`${FORUM_BASE_PATH}/trad/${r.thread_id}`}
                prefetch={false}
                className="absolute inset-0 z-0 rounded-lg outline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 touch-manipulation"
                aria-label={`Åpne tråd: ${r.thread_title}`}
              />
              <div className={['relative z-10 min-w-0', desktopGrid].join(' ')}>
                <div className="min-w-0 pointer-events-none">
                  <span
                    className="block min-w-0 font-semibold leading-snug break-words underline-offset-4 transition-[color] duration-200 ease-out group-hover:text-[var(--primary)] motion-reduce:transition-none"
                    style={{ color: 'var(--text)' }}
                  >
                    {r.thread_title}
                  </span>
                  {r.excerpt?.trim() ? (
                    <p
                      className="mt-1 line-clamp-2 text-xs leading-snug break-words"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {r.excerpt}
                    </p>
                  ) : null}
                </div>
                {showCategoryColumn ? (
                  <div className="hidden min-w-0 lg:block">
                    <Link
                      href={`${FORUM_BASE_PATH}/kategori/${r.category_slug}`}
                      prefetch={false}
                      className="pointer-events-auto inline-block max-w-full truncate rounded-lg px-2.5 py-1 text-xs font-medium touch-manipulation"
                      style={{
                        background: 'var(--primary-pale)',
                        border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
                        color: 'var(--primary)',
                      }}
                      title={r.category_title}
                    >
                      {r.category_title}
                    </Link>
                  </div>
                ) : null}
                <div
                  className="text-right text-sm tabular-nums font-medium pointer-events-none"
                  style={{ color: 'var(--text)' }}
                >
                  {r.reply_count}
                </div>
                <div
                  className="text-right text-sm tabular-nums font-medium pointer-events-none"
                  style={{ color: 'var(--text)' }}
                >
                  {r.view_count}
                </div>
                <div
                  className="text-right text-xs tabular-nums whitespace-nowrap pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {formatForumActivityTs(r.last_activity_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ul className="min-w-0 space-y-3 md:hidden">
        {rows.length === 0 ? (
          <li
            className="rounded-xl border px-4 py-8 text-center text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}
          >
            {emptyLabel}
          </li>
        ) : (
          rows.map((r) => (
            <li
              key={r.thread_id}
              className="group relative min-w-0 rounded-xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--primary)_38%,var(--border))] hover:shadow-[0_1px_0_rgba(255,255,255,0.06),0_6px_20px_-4px_rgba(30,43,79,0.12)] motion-reduce:transition-none"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--surface) 92%, var(--bg))',
              }}
            >
              <Link
                href={`${FORUM_BASE_PATH}/trad/${r.thread_id}`}
                prefetch={false}
                className="absolute inset-0 z-0 rounded-xl outline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 touch-manipulation"
                aria-label={`Åpne tråd: ${r.thread_title}`}
              />
              <div className="relative z-10 min-w-0 pointer-events-none">
                <span className="block min-w-0 text-base font-bold leading-snug break-words text-[var(--text)] underline-offset-4 transition-[color] duration-200 ease-out group-hover:text-[var(--primary)] motion-reduce:transition-none">
                  {r.thread_title}
                </span>
                {r.excerpt?.trim() ? (
                  <p
                    className="mt-2 text-xs leading-snug line-clamp-3 break-words"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {r.excerpt}
                  </p>
                ) : null}
              </div>
              <div
                className="relative z-10 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3 text-xs"
                style={{ borderColor: 'var(--border)' }}
              >
                {showCategoryColumn ? (
                  <Link
                    href={`${FORUM_BASE_PATH}/kategori/${r.category_slug}`}
                    className="pointer-events-auto inline-flex max-w-full min-h-[44px] min-w-0 shrink touch-manipulation items-center truncate rounded-lg px-2 py-1 font-semibold"
                    style={{
                      background: 'var(--primary-pale)',
                      color: 'var(--primary)',
                      border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
                    }}
                  >
                    {r.category_title}
                  </Link>
                ) : null}
                <span className="pointer-events-none tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                  {r.reply_count} svar
                </span>
                <span className="pointer-events-none tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                  {r.view_count} visn.
                </span>
                <span className="pointer-events-none tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {formatForumActivityTs(r.last_activity_at)}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
