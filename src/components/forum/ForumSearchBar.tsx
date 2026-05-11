interface ForumSearchBarProps {
  defaultCategorySlug?: string
  defaultQuery?: string
}

import { FORUM_BASE_PATH } from '@/lib/forum/constants'

const FORUM_SOK = `${FORUM_BASE_PATH}/sok`

/** Server-komponent — enkel GET-form uten klient-tilstand (progressivt OK). */
export default function ForumSearchBar({ defaultCategorySlug, defaultQuery = '' }: ForumSearchBarProps) {
  return (
    <form
      action={FORUM_SOK}
      method="get"
      className="flex min-w-0 flex-col gap-2 touch-manipulation sm:flex-row sm:items-stretch"
      role="search"
      aria-label="Søk i forum"
    >
      {defaultCategorySlug ? <input type="hidden" name="kategori" value={defaultCategorySlug} /> : null}
      <div className="min-w-0 flex-1">
        <label htmlFor="forum-global-search" className="sr-only">
          Søk i tråder og innlegg
        </label>
        <input
          id="forum-global-search"
          name="q"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          minLength={2}
          maxLength={200}
          required
          defaultValue={defaultQuery}
          placeholder="Søk i forum (tittel og innlegg)…"
          className="w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-[var(--primary)] shadow-[inset_0_1px_2px_rgba(30,43,79,0.06)]"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: '#ffffff',
            color: '#1e293b',
          }}
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border px-4 text-sm font-semibold text-white touch-manipulation outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        style={{
          borderColor: 'transparent',
          background: 'var(--cta-gradient)',
        }}
      >
        Søk
      </button>
    </form>
  )
}
