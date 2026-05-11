import Link from 'next/link'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

export default async function ForumBetaNav({
  unreadForumCount,
  isModerator,
}: {
  unreadForumCount: number
  isModerator: boolean
}) {
  return (
    <nav
      className="border-b px-[max(1rem,env(safe-area-inset-left))] py-2 flex flex-wrap gap-x-4 gap-y-2 items-center text-xs sm:text-sm sm:px-[max(1.5rem,env(safe-area-inset-left))]"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      aria-label="Forum hurtignavigasjon"
    >
      <Link
        href={FORUM_BASE_PATH}
        className="inline-flex min-h-[40px] items-center font-semibold underline-offset-4 hover:underline touch-manipulation"
        style={{ color: 'var(--primary)' }}
        prefetch={false}
      >
        Forum-forside
      </Link>
      <Link
        href={`${FORUM_BASE_PATH}/varsler`}
        className="inline-flex min-h-[40px] items-center font-medium underline-offset-4 hover:underline touch-manipulation"
        style={{ color: 'var(--text)' }}
        prefetch={false}
      >
        Forumvarsler
        {unreadForumCount > 0 ? (
          <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white bg-[var(--primary)]">
            {unreadForumCount > 9 ? '9+' : unreadForumCount}
          </span>
        ) : null}
      </Link>
      <Link
        href={`${FORUM_BASE_PATH}/profil`}
        className="inline-flex min-h-[40px] items-center font-medium underline-offset-4 hover:underline touch-manipulation"
        style={{ color: 'var(--text)' }}
        prefetch={false}
      >
        Forumprofil (visningsnavn)
      </Link>
      {isModerator ? (
        <Link
          href={`${FORUM_BASE_PATH}/moderering`}
          className="inline-flex min-h-[40px] items-center font-semibold underline-offset-4 hover:underline touch-manipulation text-amber-900"
          prefetch={false}
        >
          Moderering
        </Link>
      ) : null}
    </nav>
  )
}
