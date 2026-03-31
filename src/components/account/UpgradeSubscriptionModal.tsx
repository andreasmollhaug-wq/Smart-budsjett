'use client'

import Link from 'next/link'

type Props = {
  open: boolean
  onClose: () => void
}

export default function UpgradeSubscriptionModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Lukk"
        onClick={onClose}
      />
      <div
        className="relative max-w-md w-full rounded-2xl p-6 shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Oppgrader abonnement
        </h2>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          For å legge til flere personer i husholdningen trenger du Familie-planen. Da får hver person egen budsjett- og transaksjonsoversikt, og dere kan enkelt bytte mellom dem.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Lukk
          </button>
          <Link
            href="/konto/betalinger"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Se abonnement
          </Link>
        </div>
      </div>
    </div>
  )
}
