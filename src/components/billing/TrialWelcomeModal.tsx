'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { subscriptionPlanCopy } from '@/lib/subscriptionPlans'

const STORAGE_KEY = 'trialWelcomeModalDismissed'

function dismissTrialWelcomeModalPersist(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, '1')
}

type Props = {
  open: boolean
  trialDays: number | null
  loadingPlan: 'solo' | 'family' | null
  portalLoading?: boolean
  onClose: () => void
  onStartSolo: () => void
  onStartFamily: () => void
}

export default function TrialWelcomeModal({
  open,
  trialDays,
  loadingPlan,
  portalLoading = false,
  onClose,
  onStartSolo,
  onStartFamily,
}: Props) {
  if (!open) return null

  const busy = loadingPlan !== null || portalLoading

  const trialLine =
    trialDays != null && trialDays > 0 ? (
      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
        Du får <strong style={{ color: 'var(--text)' }}>{trialDays} dager gratis</strong>. Legg inn betalingskort i
        neste steg — du kan si opp når som helst før perioden slutter, i tråd med Stripe og våre vilkår.
      </p>
    ) : (
      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
        Legg inn betalingskort i neste steg for å starte. Du kan si opp i tråd med våre vilkår.
      </p>
    )

  const soloLabel = `${subscriptionPlanCopy.solo.title} (${subscriptionPlanCopy.solo.price}${subscriptionPlanCopy.solo.period})`
  const familyLabel = `${subscriptionPlanCopy.family.title} (${subscriptionPlanCopy.family.price}${subscriptionPlanCopy.family.period})`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'color-mix(in srgb, #000 45%, transparent)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-welcome-title"
    >
      <div
        className="w-full max-w-lg min-w-0 max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 shadow-lg pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 id="trial-welcome-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Start prøveperioden
        </h2>
        {trialLine}
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Les mer i{' '}
          <Link href="/vilkar" className="underline" style={{ color: 'var(--primary)' }}>
            vilkår
          </Link>
          .
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              dismissTrialWelcomeModalPersist()
              onStartSolo()
            }}
            className="w-full min-h-[44px] rounded-xl px-4 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 touch-manipulation"
            style={{ background: 'linear-gradient(135deg, #364FC7, #4C6EF5)' }}
          >
            {loadingPlan === 'solo' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kobler til Stripe…
              </>
            ) : (
              `Legg til kort og start — ${soloLabel}`
            )}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              dismissTrialWelcomeModalPersist()
              onStartFamily()
            }}
            className="w-full min-h-[44px] rounded-xl px-4 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 touch-manipulation"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            {loadingPlan === 'family' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kobler til Stripe…
              </>
            ) : (
              `Legg til kort og start — ${familyLabel}`
            )}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              dismissTrialWelcomeModalPersist()
              onClose()
            }}
            className="w-full min-h-[44px] rounded-xl px-4 py-3 text-sm font-semibold touch-manipulation"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text)',
              background: 'var(--bg)',
            }}
          >
            Se priser nedenfor
          </button>
        </div>
      </div>
    </div>
  )
}
