import Link from 'next/link'
import type { HTMLAttributes, ReactNode } from 'react'
import type { ForumHomeThreadRow } from '@/lib/forum/home'
import { formatForumMemberSinceDate } from '@/lib/forum/home'
import { forumAuthorDisplay } from '@/lib/forum/formatAuthor'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

export type ForumHomeSidebarStats = {
  topicCount: number
  postCount: number
  memberCount: number
}

export type ForumNewMemberRow = {
  userId: string
  displayName: string | null
  createdAt: string
}

type ForumHomeSidebarProps = {
  stats: ForumHomeSidebarStats | null
  popularRows: ForumHomeThreadRow[]
  popularOk: boolean
  newMembers: ForumNewMemberRow[]
  newMembersOk: boolean
}

function SidebarCard({ children, ...rest }: { children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <section
      className="min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      {...rest}
    >
      {children}
    </section>
  )
}

export default function ForumHomeSidebar({
  stats,
  popularRows,
  popularOk,
  newMembers,
  newMembersOk,
}: ForumHomeSidebarProps) {
  const profileByUserId = Object.fromEntries(
    newMembers.map((m) => [m.userId, m.displayName] as const),
  ) as Record<string, string | null | undefined>

  const statLine = (label: string, value: number | string) => (
    <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-[color-mix(in_srgb,var(--border)_85%,transparent)] py-2 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="tabular-nums text-sm font-semibold shrink-0" style={{ color: 'var(--text)' }}>
        {value}
      </span>
    </div>
  )

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:h-full lg:min-h-0">
      <SidebarCard aria-labelledby="forum-sidebar-stats-heading">
        <h2
          id="forum-sidebar-stats-heading"
          className="text-base font-bold tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          Forumstatistikk
        </h2>
        {stats ? (
          <div className="mt-3">
            {statLine('Emner', stats.topicCount)}
            {statLine('Innlegg', stats.postCount)}
            {statLine('Medlemmer', stats.memberCount)}
          </div>
        ) : (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Klarte ikke laste statistikk.
          </p>
        )}
      </SidebarCard>

      <SidebarCard aria-labelledby="forum-sidebar-popular-heading">
        <h2
          id="forum-sidebar-popular-heading"
          className="text-base font-bold tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          Populære emner
        </h2>
        <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
          Etter antall svar i tråden.
        </p>
        {!popularOk ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Klarte ikke laste listen.
          </p>
        ) : popularRows.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen tråder å vise ennå.
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {popularRows.map((r) => {
              const n = Number(r.reply_count)
              const svarLabel = n === 1 ? '1 svar' : `${n} svar`
              return (
                <li key={r.thread_id} className="min-w-0">
                  <Link
                    href={`${FORUM_BASE_PATH}/trad/${r.thread_id}`}
                    prefetch={false}
                    className="flex min-h-[44px] flex-col justify-center gap-0.5 rounded-lg px-2 py-2 touch-manipulation transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_88%,var(--primary)_12%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                  >
                    <span className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                      {r.thread_title}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {svarLabel}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </SidebarCard>

      <SidebarCard aria-labelledby="forum-sidebar-members-heading">
        <h2
          id="forum-sidebar-members-heading"
          className="text-base font-bold tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          Nyeste medlemmer
        </h2>
        <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
          Ti siste som har opprettet forumprofil.
        </p>
        {!newMembersOk ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Klarte ikke laste listen. Kjør forum-migrasjonene (bl.a.{' '}
            <code className="rounded bg-[color-mix(in_srgb,var(--bg)_90%,var(--border))] px-1 py-0.5 text-[11px]">
              029_forum_profile_created_at.sql
            </code>
            ).
          </p>
        ) : newMembers.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen medlemmer ennå.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {newMembers.map((m) => {
              const label = forumAuthorDisplay(m.userId, profileByUserId)
              const d = formatForumMemberSinceDate(m.createdAt)
              return (
                <li
                  key={m.userId}
                  className="flex min-h-[44px] min-w-0 flex-col justify-center gap-0.5 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] py-2 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {label}
                  </span>
                  {d ? (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      registrert {d}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </SidebarCard>
      <div className="hidden min-h-0 flex-1 lg:block" aria-hidden />
    </div>
  )
}
