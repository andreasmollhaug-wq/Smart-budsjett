export default function ForumReportForm({
  reason,
  pending,
  onReason,
  onCancel,
  onSubmit,
  label,
  className,
}: {
  reason: string
  pending: boolean
  onReason: (v: string) => void
  onCancel: () => void
  onSubmit: () => void
  label: string
  className?: string
}) {
  return (
    <div
      className={['rounded-xl border p-3 space-y-2 min-w-0', className].filter(Boolean).join(' ')}
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg)',
      }}
    >
      <label className="text-xs font-medium block" style={{ color: 'var(--text-muted)' }}>
        Hva er galt?
      </label>
      <textarea
        value={reason}
        disabled={pending}
        onChange={(ev) => onReason(ev.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg text-sm resize-y min-w-0 max-w-full border"
        placeholder="Forklar her (minst 10 tegn)…"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || reason.trim().length < 10}
          onPointerDown={() => onSubmit()}
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-xs font-semibold text-white touch-manipulation"
          style={{
            background: 'var(--text)',
          }}
        >
          {label}
        </button>
        <button
          type="button"
          onPointerDown={() => onCancel()}
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-xs font-medium touch-manipulation border"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
          }}
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
