import ForumSearchBar from '@/components/forum/ForumSearchBar'

export default function ForumSearchStripe({
  categorySlug,
  defaultQuery,
  /** Under `Header`: kant-til-kant med egen padding. `embedded`: inne i innholdskolonne (unngår dobbel side-padding). */
  variant = 'fullWidth',
}: {
  categorySlug?: string
  defaultQuery?: string
  variant?: 'fullWidth' | 'embedded'
}) {
  if (variant === 'embedded') {
    return (
      <div
        className="min-w-0 rounded-xl border p-3 sm:p-4 mb-4 sm:mb-5"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: '0 1px 2px rgba(30,43,79,0.06)',
        }}
      >
        <ForumSearchBar defaultCategorySlug={categorySlug} defaultQuery={defaultQuery} />
      </div>
    )
  }

  return (
    <div
      className="border-b py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:py-4 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]"
      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <ForumSearchBar defaultCategorySlug={categorySlug} defaultQuery={defaultQuery} />
    </div>
  )
}
