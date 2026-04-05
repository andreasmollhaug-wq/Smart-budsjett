'use client'

type BudsjettOpenArchiveModalProps = {
  viewingYear: number
  budgetYear: number
  onClose: () => void
  onConfirm: () => void
}

export default function BudsjettOpenArchiveModal({
  viewingYear,
  budgetYear,
  onClose,
  onConfirm,
}: BudsjettOpenArchiveModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="open-archive-title"
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 id="open-archive-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Åpne {viewingYear} for redigering?
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Planen for aktivt år ({budgetYear}) lagres i arkiv. Deretter blir {viewingYear} det året du redigerer.
          Transaksjoner endres ikke. Du kan senere bytte tilbake på samme måte.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
            onClick={onConfirm}
          >
            Bekreft
          </button>
        </div>
      </div>
    </div>
  )
}
