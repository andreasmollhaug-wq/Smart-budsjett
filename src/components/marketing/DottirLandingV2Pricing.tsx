'use client'

import { useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Info } from 'lucide-react'
import DottirLandingV2PlanInfoModal from '@/components/marketing/DottirLandingV2PlanInfoModal'
import {
  LANDING_PLAN_COMPARISON_NOTE,
  LANDING_PLANS,
  LANDING_PRICING_INTRO,
  type LandingPlanId,
} from '@/components/marketing/landingPricingPlans'
import { CTA_HREF, landingHorizontalPadding } from '@/components/marketing/constants'

const DEFAULT_PLAN_ID: LandingPlanId = 'family'

export default function DottirLandingV2Pricing() {
  const [selectedPlanId, setSelectedPlanId] = useState<LandingPlanId>(DEFAULT_PLAN_ID)
  const [detailsPlanId, setDetailsPlanId] = useState<LandingPlanId | null>(null)
  const selectedPlan = LANDING_PLANS.find((plan) => plan.id === selectedPlanId) ?? LANDING_PLANS[0]

  const onPlanKeyDown = (event: KeyboardEvent<HTMLDivElement>, planId: LandingPlanId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedPlanId(planId)
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const index = LANDING_PLANS.findIndex((plan) => plan.id === planId)
    const nextIndex =
      event.key === 'ArrowRight'
        ? (index + 1) % LANDING_PLANS.length
        : (index - 1 + LANDING_PLANS.length) % LANDING_PLANS.length
    setSelectedPlanId(LANDING_PLANS[nextIndex]!.id)
  }

  const openPlanDetails = (planId: LandingPlanId) => {
    setDetailsPlanId(planId)
  }

  return (
    <>
      <section
        id="priser"
        className={`scroll-mt-24 border-t py-14 sm:py-20 ${landingHorizontalPadding}`}
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl" style={{ color: 'var(--text)' }}>
              Priser
            </h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
              {LANDING_PRICING_INTRO}
            </p>
          </div>

          <div
            className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8"
            role="radiogroup"
            aria-label="Velg abonnement"
          >
            {LANDING_PLANS.map((plan) => {
              const selected = selectedPlanId === plan.id

              return (
                <div
                  key={plan.id}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => setSelectedPlanId(plan.id)}
                  onKeyDown={(event) => onPlanKeyDown(event, plan.id)}
                  className={`relative flex min-w-0 cursor-pointer flex-col rounded-2xl p-6 text-left transition-all duration-200 ease-out touch-manipulation sm:p-8 ${
                    selected
                      ? 'scale-[1.02] shadow-lg ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]'
                      : 'scale-100 shadow-sm hover:scale-[1.01] hover:shadow-md'
                  }`}
                  style={
                    selected
                      ? {
                          background: 'var(--bg)',
                          border: '2px solid var(--primary)',
                          boxShadow: '0 16px 48px -16px color-mix(in srgb, var(--primary) 40%, transparent)',
                        }
                      : {
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                        }
                  }
                >
                  <span
                    className={`absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 sm:right-6 sm:top-6 ${
                      selected ? 'scale-100 opacity-100' : 'scale-90 opacity-40'
                    }`}
                    style={
                      selected
                        ? { borderColor: 'var(--primary)', background: 'var(--primary)', color: '#fff' }
                        : { borderColor: 'var(--border)', background: 'var(--surface)', color: 'transparent' }
                    }
                    aria-hidden
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>

                  {plan.badge ? (
                    <span
                      className="absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ background: 'var(--cta-gradient)' }}
                    >
                      {plan.badge}
                    </span>
                  ) : null}

                  <div className="flex items-start justify-between gap-2 pr-8">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                          {plan.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            openPlanDetails(plan.id)
                          }}
                          className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full transition-opacity hover:opacity-100"
                          style={{ color: 'var(--text-muted)' }}
                          aria-label={`Mer informasjon om ${plan.name}`}
                        >
                          <Info className="h-4 w-4 opacity-60" aria-hidden />
                        </button>
                      </div>
                      <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {plan.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6">
                    <span className="text-4xl font-bold tabular-nums sm:text-5xl" style={{ color: 'var(--text)' }}>
                      {plan.priceNok} kr
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      {' '}
                      / måned
                    </span>
                  </p>

                  <ul className="mt-8 flex flex-1 flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex min-w-0 items-start gap-2.5 text-sm sm:text-base"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" style={{ color: 'var(--success)' }} aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 text-xs font-medium sm:text-sm" style={{ color: selected ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {selected ? 'Valgt plan' : 'Trykk for å velge'}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mx-auto mt-8 flex max-w-md flex-col items-stretch gap-3">
            <Link
              href={CTA_HREF}
              className="inline-flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-95 sm:text-base"
              style={{ background: 'var(--cta-gradient)' }}
            >
              Start gratis med {selectedPlan.name}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Du har valgt {selectedPlan.name} ({selectedPlan.priceNok} kr/mnd etter prøveperioden).
            </p>
          </div>

          <p
            className="mx-auto mt-8 max-w-2xl rounded-xl border px-4 py-3 text-center text-sm leading-relaxed sm:text-base"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border))',
              background: 'color-mix(in srgb, var(--primary-pale) 35%, var(--bg))',
              color: 'var(--text-muted)',
            }}
          >
            {LANDING_PLAN_COMPARISON_NOTE}
            {' '}
            <a
              href="#oversikt"
              className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Se hva du får
            </a>
          </p>
        </div>
      </section>

      <DottirLandingV2PlanInfoModal planId={detailsPlanId} onClose={() => setDetailsPlanId(null)} />
    </>
  )
}
