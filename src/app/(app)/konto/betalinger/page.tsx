'use client'

import { useState } from 'react'
import { CreditCard, Check } from 'lucide-react'
import { useActivePersonFinance } from '@/lib/store'
import { subscriptionPlanCopy } from '@/lib/subscriptionPlans'

const soloFeatures = ['Én brukerkonto', 'Full tilgang til alle funksjoner', 'Passer deg som styrer økonomien alene']
const familyFeatures = [
  'Opp til fem brukere i samme husholdning',
  'Felles oversikt og individuelle visninger',
  'Ideelt for par og familier',
]

export default function KontoBetalingerPage() {
  const { subscriptionPlan, setSubscriptionPlan, profiles } = useActivePersonFinance()
  const [downgradeError, setDowngradeError] = useState(false)

  const chooseSolo = () => {
    setDowngradeError(false)
    const r = setSubscriptionPlan('solo')
    if (!r.ok) setDowngradeError(true)
  }

  const chooseFamily = () => {
    setDowngradeError(false)
    setSubscriptionPlan('family')
  }

  return (
    <>
      {downgradeError && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: 'color-mix(in srgb, #E03131 12%, transparent)', border: '1px solid #E03131', color: 'var(--text)' }}
        >
          Du kan ikke bytte til Solo mens du har mer enn én profil. Familie-planen passer flere brukere i samme
          husholdning; for Solo må du kun ha én profil.
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
          Velg Solo for én person eller Familie for flere brukere i samme husholdning. Endring lagres i denne enheten
          (ekte fakturering kobles til senere).
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
              {subscriptionPlan === 'solo' ? 'Valgt' : 'Velg Solo'}
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
              {subscriptionPlan === 'family' ? 'Valgt' : 'Velg Familie'}
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
          Legg til eller oppdater kort for fornyelse av abonnementet (kommer med betalingsleverandør).
        </p>
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ border: '1px dashed var(--border)', background: 'var(--bg)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen betalingsmetode lagret ennå
          </span>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white opacity-60 cursor-not-allowed"
            style={{ background: 'var(--primary)' }}
            disabled
          >
            Legg til kort
          </button>
        </div>
      </div>
    </>
  )
}
