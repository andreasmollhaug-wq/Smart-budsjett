'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type StripeSubscriptionRow = {
  status: string
} | null

/**
 * Vises når Stripe-status er past_due (grace): brukeren har fortsatt tilgang, men bør oppdatere kort.
 */
export default function SubscriptionPastDueBanner() {
  const [stripeSub, setStripeSub] = useState<StripeSubscriptionRow | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/stripe/subscription')
        if (!res.ok) {
          if (!cancelled) setStripeSub(null)
          return
        }
        const data = (await res.json()) as { subscription?: { status: string } | null }
        if (!cancelled) setStripeSub(data.subscription ?? null)
      } catch {
        if (!cancelled) setStripeSub(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (stripeSub === undefined || stripeSub === null) return null
  if (stripeSub.status !== 'past_due') return null

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
