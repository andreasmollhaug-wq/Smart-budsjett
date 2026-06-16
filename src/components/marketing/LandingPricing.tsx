import Link from 'next/link'
import { Check } from 'lucide-react'
import { LANDING_PLANS, LANDING_PRICING_INTRO } from '@/components/marketing/landingPricingPlans'
import { CTA_HREF, landingHorizontalPadding } from './constants'

export default function LandingPricing() {
  return (
    <section id="priser" className={`scroll-mt-24 py-16 ${landingHorizontalPadding}`}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Velg plan
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          {LANDING_PRICING_INTRO}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {LANDING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl p-5 sm:p-8${plan.highlighted ? ' relative' : ''}`}
              style={
                plan.highlighted
                  ? {
                      background: 'var(--surface)',
                      border: '2px solid var(--primary)',
                      boxShadow: '0 12px 40px -12px color-mix(in srgb, var(--primary) 35%, transparent)',
                    }
                  : { background: 'var(--surface)', border: '1px solid var(--border)' }
              }
            >
              {plan.badge ? (
                <span
                  className="absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: 'var(--cta-gradient)' }}
                >
                  {plan.badge}
                </span>
              ) : null}
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {plan.name}
              </h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {plan.tagline}
              </p>
              <p className="mt-6">
                <span className="text-4xl font-bold" style={{ color: 'var(--text)' }}>
                  {plan.priceNok} kr
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  {' '}
                  / måned
                </span>
              </p>
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={CTA_HREF}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                style={{ background: 'var(--cta-gradient)' }}
              >
                {plan.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
