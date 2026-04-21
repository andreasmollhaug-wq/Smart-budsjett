'use client'

import Link from 'next/link'

type Props = {
  open: boolean
  onClose: () => void
}

export default function UpgradeSubscriptionModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Lukk"
        onClick={onClose}
      />
      <div
        className="relative max-w-md w-full min-w-0 max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 shadow-xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Oppgrader abonnement
        </h2>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          For å legge til flere personer i husholdningen trenger du Familie-planen. Da får hver person egen budsjett- og transaksjonsoversikt, og dere kan enkelt bytte mellom dem.
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row flex-wrap gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium w-full sm:w-auto touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Lukk
          </button>
          <Link
            href="/konto/betalinger"
            onClick={onClose}
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white w-full sm:w-auto touch-manipulation"
            style={{ background: 'var(--primary)' }}
          >
            Se abonnement
          </Link>
        </div>
      </div>
    </div>
  )
}
