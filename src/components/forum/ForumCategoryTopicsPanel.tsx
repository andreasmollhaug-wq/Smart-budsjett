import type { ForumHomeSort, ForumHomeThreadRow } from '@/lib/forum/home'
import { forumHomeSortHeadingNb, forumHomeSortSubtitleNb } from '@/lib/forum/home'
import ForumThreadTopicRows from '@/components/forum/ForumThreadTopicRows'
import ForumThreadViewCountDetails from '@/components/forum/ForumThreadViewCountDetails'
import ForumCategorySortSelect from '@/components/forum/ForumCategorySortSelect'

export default function ForumCategoryTopicsPanel({
  categorySlug,
  activeSort,
  rows,
  emptyLabel,
}: {
  categorySlug: string
  activeSort: ForumHomeSort
  rows: ForumHomeThreadRow[]
  emptyLabel?: string
}) {
  const heading = forumHomeSortHeadingNb(activeSort)
  const subtitle = forumHomeSortSubtitleNb(activeSort)

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

      <ForumCategorySortSelect categorySlug={categorySlug} activeSort={activeSort} />

      <div className="mt-5 min-w-0">
        <ForumThreadTopicRows rows={rows} showCategoryColumn={false} emptyLabel={emptyLabel} />
      </div>

      <ForumThreadViewCountDetails />
    </article>
  )
}
