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
  const colCount = showCategoryColumn ? 5 : 4
  return (
    <div className="min-w-0">
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
              <th
                className="min-w-0 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide align-middle sm:text-[13px]"
                scope="col"
              >
                Emne
              </th>
              {showCategoryColumn ? (
                <th
                  className="hidden px-3 py-3.5 text-xs font-semibold uppercase tracking-wide align-middle lg:table-cell lg:text-[13px]"
                  scope="col"
                >
                  Kategori
                </th>
              ) : null}
              <th
                className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide tabular-nums align-middle sm:text-[13px]"
                scope="col"
              >
                Svar
              </th>
              <th
                className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide tabular-nums align-middle sm:text-[13px]"
                scope="col"
              >
                Visn.
              </th>
              <th
                className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide align-middle sm:text-[13px]"
                scope="col"
              >
                Aktivitet
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="border-b px-4 py-10 text-center text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {emptyLabel}
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
                  {showCategoryColumn ? (
                    <td className="hidden align-middle px-3 py-3.5 lg:table-cell">
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
                  ) : null}
                  <td
                    className="px-3 py-3.5 text-right tabular-nums text-sm font-medium align-middle"
                    style={{ color: 'var(--text)' }}
                  >
                    {r.reply_count}
                  </td>
                  <td
                    className="px-3 py-3.5 text-right tabular-nums text-sm font-medium align-middle"
                    style={{ color: 'var(--text)' }}
                  >
                    {r.view_count}
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-xs tabular-nums whitespace-nowrap align-middle"
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
              <div
                className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3 text-xs"
                style={{ borderColor: 'var(--border)' }}
              >
                {showCategoryColumn ? (
                  <Link
                    href={`${FORUM_BASE_PATH}/kategori/${r.category_slug}`}
                    className="inline-flex max-w-full items-center truncate rounded-lg px-2 py-1 font-semibold min-h-[44px] min-w-0 shrink touch-manipulation"
                    style={{
                      background: 'var(--primary-pale)',
                      color: 'var(--primary)',
                      border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
                    }}
                  >
                    {r.category_title}
                  </Link>
                ) : null}
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
  )
}
