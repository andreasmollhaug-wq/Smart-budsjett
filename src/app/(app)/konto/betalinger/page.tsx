'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditCard, Check, Loader2 } from 'lucide-react'
import { useActivePersonFinance } from '@/lib/store'
import { subscriptionPlanCopy } from '@/lib/subscriptionPlans'

const soloFeatures = ['Én brukerkonto', 'Full tilgang til alle funksjoner', 'Passer deg som styrer økonomien alene']
const familyFeatures = [
  'Opp til fem brukere i samme husholdning',
  'Felles oversikt og individuelle visninger',
  'Ideelt for par og familier',
]

type StripeSubscriptionRow = {
  status: string
  plan: 'solo' | 'family' | null
  stripe_price_id: string | null
  current_period_end: string | null
  updated_at: string
} | null

function statusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Aktivt'
    case 'trialing':
      return 'Prøveperiode'
    case 'past_due':
      return 'Forfalt betaling'
    case 'canceled':
      return 'Avsluttet'
    case 'unpaid':
      return 'Ikke betalt'
    case 'incomplete':
    case 'incomplete_expired':
      return 'Ufullstendig'
    case 'inactive':
      return 'Ikke i gang'
    default:
      return status
  }
}

function BetalingerContent() {
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')

  const { subscriptionPlan, setSubscriptionPlan, profiles } = useActivePersonFinance()
  const [downgradeError, setDowngradeError] = useState(false)
  const [stripeSub, setStripeSub] = useState<StripeSubscriptionRow | undefined>(undefined)
  const [checkoutLoading, setCheckoutLoading] = useState<'solo' | 'family' | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const loadStripeSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/subscription')
      if (!res.ok) {
        setStripeSub(null)
        return
      }
      const data = (await res.json()) as { subscription?: StripeSubscriptionRow }
      setStripeSub(data.subscription ?? null)
    } catch {
      setStripeSub(null)
    }
  }, [])

  useEffect(() => {
    void loadStripeSubscription()
  }, [loadStripeSubscription])

  useEffect(() => {
    if (checkout === 'success') {
      void loadStripeSubscription()
    }
  }, [checkout, loadStripeSubscription])

  const chooseSolo = () => {
    setDowngradeError(false)
    const r = setSubscriptionPlan('solo')
    if (!r.ok) setDowngradeError(true)
  }

  const chooseFamily = () => {
    setDowngradeError(false)
    setSubscriptionPlan('family')
  }

  const startStripeCheckout = async (plan: 'solo' | 'family') => {
    setCheckoutError(null)
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) {
        setCheckoutError(data.error ?? 'Kunne ikke starte betaling.')
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setCheckoutError('Manglende redirect-URL fra Stripe.')
    } catch {
      setCheckoutError('Nettverksfeil ved oppstart av betaling.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const paidActive =
    stripeSub &&
    (stripeSub.status === 'active' || stripeSub.status === 'trialing' || stripeSub.status === 'past_due')

  return (
    <>
      {checkout === 'success' && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{
            background: 'color-mix(in srgb, #2F9E44 12%, transparent)',
            border: '1px solid #2F9E44',
            color: 'var(--text)',
          }}
        >
          Betalingen er registrert. Abonnementsstatus oppdateres vanligvis innen noen sekunder.
        </div>
      )}
      {checkout === 'canceled' && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{
            background: 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          Du avbrøt betalingen. Ingen belastning er gjort.
        </div>
      )}

      {downgradeError && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: 'color-mix(in srgb, #E03131 12%, transparent)', border: '1px solid #E03131', color: 'var(--text)' }}
        >
          Du kan ikke bytte til Solo mens du har mer enn én profil. Familie-planen passer flere brukere i samme
          husholdning; for Solo må du kun ha én profil.
        </div>
      )}

      {checkoutError && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: 'color-mix(in srgb, #E03131 12%, transparent)', border: '1px solid #E03131', color: 'var(--text)' }}
        >
          {checkoutError}
        </div>
      )}

      {paidActive && stripeSub && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{
            background: 'color-mix(in srgb, #3B5BDB 10%, transparent)',
            border: '1px solid var(--primary)',
            color: 'var(--text)',
          }}
        >
          <span className="font-medium">Stripe-abonnement:</span> {statusLabel(stripeSub.status)}
          {stripeSub.plan ? (
            <>
              {' '}
              — plan {stripeSub.plan === 'solo' ? 'Solo' : 'Familie'}
            </>
          ) : null}
          {stripeSub.current_period_end ? (
            <span className="block mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Periode slutter{' '}
              {new Date(stripeSub.current_period_end).toLocaleDateString('nb-NO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          ) : null}
        </div>
      )}

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <CreditCard size={16} style={{ color: 'var(--primary)' }} />
          Abonnement
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Velg Solo for én person eller Familie for flere brukere i samme husholdning. App-innstilling for plan
          (profiler) lagres lokalt på enheten; faktisk abonnement og betaling styres via Stripe når du bruker knappene
          under.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div
            className="flex flex-col rounded-2xl p-6"
            style={{
              background: 'var(--bg)',
              border:
                subscriptionPlan === 'solo' ? '2px solid var(--primary)' : '1px solid var(--border)',
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {subscriptionPlanCopy.solo.title}
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {subscriptionPlanCopy.solo.subtitle}
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
                {subscriptionPlanCopy.solo.price}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {' '}
                {subscriptionPlanCopy.solo.period}
              </span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-2">
              {soloFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={chooseSolo}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                background: subscriptionPlan === 'solo' ? 'var(--primary-pale)' : 'var(--surface)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
            >
              {subscriptionPlan === 'solo' ? 'Valgt (app)' : 'Velg Solo (app)'}
            </button>
            <button
              type="button"
              onClick={() => void startStripeCheckout('solo')}
              disabled={checkoutLoading !== null}
              className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #364FC7, #4C6EF5)' }}
            >
              {checkoutLoading === 'solo' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kobler til Stripe…
                </>
              ) : (
                'Abonner med kort (Solo)'
              )}
            </button>
          </div>

          <div
            className="relative flex flex-col rounded-2xl p-6"
            style={{
              background: 'var(--bg)',
              border:
                subscriptionPlan === 'family' ? '2px solid var(--primary)' : '1px solid var(--border)',
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {subscriptionPlanCopy.family.title}
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {subscriptionPlanCopy.family.subtitle}
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
                {subscriptionPlanCopy.family.price}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {' '}
                {subscriptionPlanCopy.family.period}
              </span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-2">
              {familyFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={chooseFamily}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              {subscriptionPlan === 'family' ? 'Valgt (app)' : 'Velg Familie (app)'}
            </button>
            <button
              type="button"
              onClick={() => void startStripeCheckout('family')}
              disabled={checkoutLoading !== null}
              className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 border disabled:opacity-60"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
            >
              {checkoutLoading === 'family' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kobler til Stripe…
                </>
              ) : (
                'Abonner med kort (Familie)'
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
          Betalingsmetode
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Når du abonnerer via Stripe over, registreres kortet der. Du kan senere legge til kundeportal for
          oppdatering av kort (valgfritt videre steg).
        </p>
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ border: '1px dashed var(--border)', background: 'var(--bg)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {paidActive ? 'Abonnement er knyttet til Stripe.' : 'Ingen aktiv Stripe-betaling registrert ennå'}
          </span>
        </div>
      </div>
    </>
  )
}

export default function KontoBetalingerPage() {
  return (
    <Suspense fallback={null}>
      <BetalingerContent />
    </Suspense>
  )
}
