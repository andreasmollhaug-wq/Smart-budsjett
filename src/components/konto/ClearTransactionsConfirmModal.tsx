'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  profileName: string
  transactionCount: number
  onClose: () => void
  onConfirm: () => void
}

export default function ClearTransactionsConfirmModal({
  open,
  profileName,
  transactionCount,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Lukk"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl p-5 shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-transactions-title"
      >
        <h3 id="clear-transactions-title" className="font-semibold text-sm pr-8" style={{ color: 'var(--text)' }}>
          Slette alle transaksjoner for «{profileName}»?
        </h3>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            OBS:
          </span>{' '}
          Slettingen er <span className="font-semibold" style={{ color: 'var(--text)' }}>permanent</span> og kan ikke
          angres.{' '}
          <span className="tabular-nums font-medium" style={{ color: 'var(--text)' }}>
            {transactionCount}
          </span>{' '}
          transaksjon{transactionCount === 1 ? '' : 'er'} fjernes for denne profilen.
        </p>
        <ul
          className="text-xs mt-3 space-y-1 list-disc pl-4 leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          <li>Budsjettplan, sparemål, gjeld, investeringer og abonnement beholdes</li>
          <li>«Brukt» i budsjettet og koblede sparemål oppdateres</li>
          <li>Import-historikk under Min konto kan fortsatt vise tidligere kjøringer</li>
        </ul>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white min-h-[44px] touch-manipulation"
            style={{ background: '#c92a2a' }}
            onClick={onConfirm}
          >
            Ja, slett alle transaksjoner
          </button>
        </div>
      </div>
    </div>
  )
}
