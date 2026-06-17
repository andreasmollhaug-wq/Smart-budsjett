'use client'

import { Eye } from 'lucide-react'

export function HouseholdReadonlyBanner() {
  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
      role="status"
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
      >
        <Eye size={16} aria-hidden />
      </span>
      <span className="leading-snug">
        Du viser <strong>husholdning</strong> øverst i menyen. Bytt til én profil for å redigere handlelister.
      </span>
    </div>
  )
}
