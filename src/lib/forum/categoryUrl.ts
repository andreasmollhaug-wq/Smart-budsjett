import type { ForumHomeSort } from '@/lib/forum/home'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

/** Lenke til kategoriliste med valgfri side og sortering (samme `visning=` som forsiden). */
export function forumCategoryListPath(
  slug: string,
  opts: { page?: number; sort?: ForumHomeSort } = {},
): string {
  const p = new URLSearchParams()
  const sort = opts.sort ?? 'latest'
  if (sort === 'hot') p.set('visning', 'diskusjon')
  if (sort === 'views') p.set('visning', 'lest')
  const page = opts.page ?? 1
  if (page > 1) p.set('page', String(page))
  const qs = p.toString()
  const base = `${FORUM_BASE_PATH}/kategori/${encodeURIComponent(slug)}`
  return qs ? `${base}?${qs}` : base
}
