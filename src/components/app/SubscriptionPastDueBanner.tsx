'use client'

import Link from 'next/link'
import { useSubscriptionReadOnly } from '@/components/app/SubscriptionReadOnlyProvider'

/**
 * Vises når Stripe-status er past_due (grace): brukeren har fortsatt tilgang, men bør oppdatere kort.
 */
export default function SubscriptionPastDueBanner() {
  const { loading, subscription } = useSubscriptionReadOnly()

  if (loading || subscription?.status !== 'past_due') return null

  return (
    <div
      className="w-full shrink-0 px-4 py-2.5 text-center text-sm font-medium border-b"
      style={{
        background: 'color-mix(in srgb, #F59F00 14%, var(--surface))',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
      role="alert"
    >
      Forfalt betaling — Stripe kunne ikke trekke abonnementet. Oppdater betalingskortet under{' '}
      <Link href="/konto/betalinger" className="underline font-semibold" style={{ color: 'var(--primary)' }}>
        Betalinger
      </Link>{' '}
      for å unngå avbrudd.
    </div>
  )
}
