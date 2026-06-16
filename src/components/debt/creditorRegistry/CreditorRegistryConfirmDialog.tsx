'use client'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function CreditorRegistryConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Avbryt',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border p-4 sm:p-5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cr-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cr-confirm-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {message}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-xl border text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-xl text-sm font-medium text-white touch-manipulation"
            style={{ background: danger ? 'var(--danger)' : 'var(--primary)' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
