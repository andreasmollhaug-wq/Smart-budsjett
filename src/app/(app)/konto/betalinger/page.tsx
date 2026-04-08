'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Check, ExternalLink, Loader2 } from 'lucide-react'
import { useActivePersonFinance } from '@/lib/store'
import { hasSubscriptionAccess } from '@/lib/stripe/subscriptionAccess'
import { subscriptionPlanCopy } from '@/lib/subscriptionPlans'
import { useSubscriptionReadOnly } from '@/components/app/SubscriptionReadOnlyProvider'
import TrialWelcomeModal from '@/components/billing/TrialWelcomeModal'
import { householdSingleLoginNote } from '@/lib/kontoCopy'

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

/** Inkluderer abonnementsfakturaer og evt. engangskjøp (f.eks. AI-kreditter) på samme Stripe-kunde. */
type StripeInvoiceRow = {
  id: string
  created: number
  amount_paid: number
  currency: string
  hosted_invoice_url: string | null
  invoice_pdf: string | null
  description: string | null
}

function formatStripeInvoiceAmount(amountPaid: number, currency: string): string {
  const c = currency.toUpperCase()
  const zeroDecimal = new Set([
    'BIF',
    'CLP',
    'DJF',
    'GNF',
    'JPY',
    'KMF',
    'KRW',
    'MGA',
    'PYG',
    'RWF',
    'UGX',
    'VND',
    'VUV',
    'XAF',
    'XOF',
    'XPF',
  ])
  const divisor = zeroDecimal.has(c) ? 1 : 100
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: c }).format(amountPaid / divisor)
}

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const reason = searchParams.get('reason')
  const trialWelcome = searchParams.get('trial')

  const { trialPeriodDays } = useSubscriptionReadOnly()
  const [trialModalOpen, setTrialModalOpen] = useState(false)

  const { subscriptionPlan, setSubscriptionPlan } = useActivePersonFinance()
  const [downgradeError, setDowngradeError] = useState(false)
  const [stripeSub, setStripeSub] = useState<StripeSubscriptionRow | undefined>(undefined)
  const [checkoutLoading, setCheckoutLoading] = useState<'solo' | 'family' | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [canOpenBillingPortal, setCanOpenBillingPortal] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<StripeInvoiceRow[] | undefined>(undefined)
  const [paidCount, setPaidCount] = useState<number | undefined>(undefined)
  const [invoicesError, setInvoicesError] = useState<string | null>(null)

  const loadStripeSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/subscription')
      if (!res.ok) {
        setStripeSub(null)
        setCanOpenBillingPortal(false)
        return
      }
      const data = (await res.json()) as {
        subscription?: StripeSubscriptionRow
        canOpenBillingPortal?: boolean
      }
      setStripeSub(data.subscription ?? null)
      setCanOpenBillingPortal(Boolean(data.canOpenBillingPortal))
    } catch {
      setStripeSub(null)
      setCanOpenBillingPortal(false)
    }
  }, [])

  const loadInvoices = useCallback(async () => {
    setInvoicesError(null)
    try {
      const res = await fetch('/api/stripe/invoices')
      if (!res.ok) {
        setInvoices(undefined)
        setPaidCount(undefined)
        setInvoicesError('Kunne ikke hente betalingshistorikk.')
        return
      }
      const data = (await res.json()) as { paidCount?: number; invoices?: StripeInvoiceRow[]; error?: string }
      if (data.error) {
        setInvoicesError(data.error)
        setInvoices(undefined)
        setPaidCount(undefined)
        return
      }
      setPaidCount(data.paidCount ?? 0)
      setInvoices(data.invoices ?? [])
    } catch {
      setInvoicesError('Kunne ikke hente betalingshistorikk.')
      setInvoices(undefined)
      setPaidCount(undefined)
    }
  }, [])

  useEffect(() => {
    void loadStripeSubscription()
    void loadInvoices()
  }, [loadStripeSubscription, loadInvoices])

  useEffect(() => {
    if (checkout === 'success') {
      void loadStripeSubscription()
      void loadInvoices()
    }
  }, [checkout, loadStripeSubscription, loadInvoices])

  const paidActive = stripeSub && hasSubscriptionAccess(stripeSub.status)

  useEffect(() => {
    if (paidActive) {
      setTrialModalOpen(false)
      return
    }
    if (typeof window !== 'undefined' && sessionStorage.getItem('trialWelcomeModalDismissed') === '1') {
      setTrialModalOpen(false)
      return
    }
    if (trialWelcome === 'welcome' || reason === 'subscription') {
      setTrialModalOpen(true)
    }
  }, [paidActive, trialWelcome, reason])

  const closeTrialModal = useCallback(() => {
    setTrialModalOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('trial')
    const q = params.toString()
    router.replace(q ? `/konto/betalinger?${q}` : '/konto/betalinger')
  }, [router, searchParams])

  /** Setter app-plan (profiler) og sender til Stripe Checkout – én handling per kort. */
  const subscribeWithPlan = async (plan: 'solo' | 'family') => {
    setDowngradeError(false)
    setCheckoutError(null)
    if (plan === 'solo') {
      const r = setSubscriptionPlan('solo')
      if (!r.ok) {
        setDowngradeError(true)
        return
      }
    } else {
      setSubscriptionPlan('family')
    }
    await startStripeCheckout(plan)
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

  const openBillingPortal = async () => {
    setPortalError(null)
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/billing-portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) {
        setPortalError(data.error ?? 'Kunne ikke åpne kundeportal.')
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setPortalError('Manglende lenke fra Stripe.')
    } catch {
      setPortalError('Nettverksfeil ved oppstart av kundeportal.')
    } finally {
      setPortalLoading(false)
    }
  }

  const invoicesSorted =
    invoices?.slice().sort((a, b) => b.created - a.created) ?? []

  return (
    <>
      <TrialWelcomeModal
        open={trialModalOpen}
        trialDays={trialPeriodDays}
        loadingPlan={checkoutLoading}
        portalLoading={portalLoading}
        onClose={closeTrialModal}
        onStartSolo={() => void subscribeWithPlan('solo')}
        onStartFamily={() => void subscribeWithPlan('family')}
      />
      {reason === 'subscription' && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{
            background: 'color-mix(in srgb, #E03131 10%, transparent)',
            border: '1px solid #E03131',
            color: 'var(--text)',
          }}
          role="alert"
        >
          Abonnementet er ikke aktivt. Registrer betaling under for å fortsette å bruke Smart Budsjett med dine egne
          tall. Dataene dine er lagret.
        </div>
      )}
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

      {stripeSub && (paidActive || canOpenBillingPortal) && (
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
              {stripeSub.status === 'trialing' ? 'Prøveperioden avsluttes' : 'Periode slutter'}{' '}
              {new Date(stripeSub.current_period_end).toLocaleDateString('nb-NO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          ) : null}
          {canOpenBillingPortal ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <button
                type="button"
                onClick={() => void openBillingPortal()}
                disabled={portalLoading || checkoutLoading !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #364FC7, #4C6EF5)' }}
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Åpner Stripe…
                  </>
                ) : (
                  <>
                    Administrer abonnement
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </button>
              <span className="text-xs sm:max-w-md" style={{ color: 'var(--text-muted)' }}>
                Kort, oppsigelse og fakturaer håndteres i Stripes kundeportal.
              </span>
            </div>
          ) : null}
          {portalError ? (
            <p className="mt-2 text-sm" style={{ color: '#E03131' }}>
              {portalError}
            </p>
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
          Velg Solo eller Familie og betal med kort via Stripe. Valget styrer både abonnement og hvordan husholdningen
          settes opp i appen (lagret på enheten).
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
              onClick={() => void subscribeWithPlan('solo')}
              disabled={checkoutLoading !== null || portalLoading}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #364FC7, #4C6EF5)' }}
            >
              {checkoutLoading === 'solo' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kobler til Stripe…
                </>
              ) : (
                'Abonnér på Solo'
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
            <p
              className="mt-4 pt-4 text-sm border-t"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {householdSingleLoginNote}
            </p>
            <button
              type="button"
              onClick={() => void subscribeWithPlan('family')}
              disabled={checkoutLoading !== null || portalLoading}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              {checkoutLoading === 'family' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kobler til Stripe…
                </>
              ) : (
                'Abonnér på Familie'
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
          Når du abonnerer via Stripe over, registreres kortet der. Oppdatering av kort og abonnement skjer i Stripes
          kundeportal via knappen «Administrer abonnement» over (når du har et aktivt Stripe-kundeforhold).
        </p>
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ border: '1px dashed var(--border)', background: 'var(--bg)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {paidActive
              ? 'Abonnement er knyttet til Stripe.'
              : canOpenBillingPortal
                ? 'Du har en Stripe-kunde — bruk «Administrer abonnement» over for kort og oppsigelse.'
                : 'Ingen aktiv Stripe-betaling registrert ennå'}
          </span>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Betalingshistorikk
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Oversikt over vellykkede trekk registrert i Stripe (abonnement og eventuelle tilleggskjøp på samme konto).
        </p>
        {invoicesError && (
          <p className="text-sm mb-4" style={{ color: '#E03131' }}>
            {invoicesError}
          </p>
        )}
        {paidCount === undefined && !invoicesError && (
          <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Laster…
          </p>
        )}
        {paidCount !== undefined && paidCount === 0 && !invoicesError && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen registrerte betalinger ennå.
          </p>
        )}
        {paidCount !== undefined && paidCount > 0 && (
          <>
            <p className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>
              Du har blitt trukket {paidCount} {paidCount === 1 ? 'gang' : 'ganger'}.
            </p>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                    <th className="px-4 py-3 font-medium">Dato</th>
                    <th className="px-4 py-3 font-medium">Beløp</th>
                    <th className="px-4 py-3 font-medium w-32">Kvittering</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesSorted.map((inv) => (
                    <tr key={inv.id} style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(inv.created * 1000).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">{formatStripeInvoiceAmount(inv.amount_paid, inv.currency)}</td>
                      <td className="px-4 py-3">
                        {inv.hosted_invoice_url ? (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium underline"
                            style={{ color: 'var(--primary)' }}
                          >
                            Åpne
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : inv.invoice_pdf ? (
                          <a
                            href={inv.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium underline"
                            style={{ color: 'var(--primary)' }}
                          >
                            PDF
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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
