'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function AdminRepairCheckoutPanel({
  onReload,
}: {
  onReload?: () => void | Promise<void>
}) {
  const [repairing, setRepairing] = useState(false)
  const [repairNote, setRepairNote] = useState<string | null>(null)

  async function repairCheckoutDates() {
    setRepairing(true)
    setRepairNote(null)
    try {
      const res = await fetch('/api/admin/repair-checkout-dates', { method: 'POST' })
      const body = (await res.json()) as { updated?: number; error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Reparasjon feilet')
      const n = body.updated ?? 0
      setRepairNote(
        n > 0
          ? `Checkout-datoer rettet fra Stripe (${n} rader). Oppdater tallene hvis de ikke endret seg.`
          : `Ingen rader trengte reparasjon (0 endret). Tallene skal da stemme med Stripe allerede.`,
      )
      await onReload?.()
    } catch (e) {
      setRepairNote(e instanceof Error ? e.message : 'Kunne ikke reparere checkout-datoer.')
    } finally {
      setRepairing(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Checkout per dag bruker første checkout-tidspunkt (<code className="text-xs">first_checkout_at</code>).
        Eldre rader kan ha feil dato etter databackfill — knappen henter riktig dato fra Stripe.
      </p>
      <button
        type="button"
        onClick={() => void repairCheckoutDates()}
        disabled={repairing}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium touch-manipulation disabled:opacity-60"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <RefreshCw size={16} className={repairing ? 'animate-spin' : undefined} aria-hidden />
        {repairing ? 'Synkroniserer…' : 'Synk checkout-datoer'}
      </button>
      {repairNote ? (
        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }} role="status">
          {repairNote}
        </p>
      ) : null}
    </div>
  )
}
