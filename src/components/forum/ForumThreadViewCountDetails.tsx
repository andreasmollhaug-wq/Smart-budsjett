/** Forklaring av visningstelling (delt forum-forside og kategoriside). */
export default function ForumThreadViewCountDetails() {
  return (
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
      <div
        className="mt-3 space-y-2 border-t pt-3 text-xs leading-relaxed"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <p>
          Under <strong style={{ color: 'var(--text)' }}>Mest lest</strong> øker tallene når en innlogget
          bruker åpner en tråd (én gang per sidevisning på server).
        </p>
        <p className="font-mono text-[11px] opacity-90">forum_increment_thread_view</p>
      </div>
    </details>
  )
}
