'use client'

import { useRouter } from 'next/navigation'
import type { ForumHomeSort } from '@/lib/forum/home'
import { forumCategoryListPath } from '@/lib/forum/categoryUrl'

const SELECT_ID = 'forum-category-sort-select'

export default function ForumCategorySortSelect({
  categorySlug,
  activeSort,
}: {
  categorySlug: string
  activeSort: ForumHomeSort
}) {
  const router = useRouter()

  return (
    <div className="mt-5 min-w-0">
      <label
        htmlFor={SELECT_ID}
        className="block text-xs font-semibold mb-2"
        style={{ color: 'var(--text)' }}
      >
        Sorter tråder
      </label>
      <select
        id={SELECT_ID}
        value={activeSort}
        onChange={(e) => {
          const next = e.target.value as ForumHomeSort
          if (next !== 'latest' && next !== 'hot' && next !== 'views') return
          router.push(forumCategoryListPath(categorySlug, { sort: next, page: 1 }))
        }}
        className="w-full max-w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base touch-manipulation bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
        aria-label="Sorter tråder i kategorien"
      >
        <option value="latest">Siste aktivitet</option>
        <option value="hot">Mest diskutert</option>
        <option value="views">Mest lest</option>
      </select>
    </div>
  )
}
