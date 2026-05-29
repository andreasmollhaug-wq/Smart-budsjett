'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Wallet,
  ListOrdered,
  CalendarRange,
  Repeat,
  BarChart3,
  Users,
  LayoutGrid,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import GuideModalShell from '@/components/ui/GuideModalShell'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import {
  subscriptionBudgetFeatures,
  subscriptionDottirFeatures,
  subscriptionGuideDisclaimer,
  subscriptionGuideHero,
  subscriptionGuideTabs,
  subscriptionHouseholdNote,
  subscriptionHowToStepCards,
  type SubscriptionGuideTabId,
} from '@/lib/subscriptionGuideCopy'

const TITLE_ID = 'subscription-guide-title'

export type SubscriptionGuideSnapshot = {
  activeCount: number
  monthlyTotal: number
  yearlyTotal: number
  readOnly: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  snapshot: SubscriptionGuideSnapshot
  initialTab?: SubscriptionGuideTabId
}

const BUDGET_ICONS: LucideIcon[] = [Wallet, ListOrdered, CalendarRange, Repeat, BarChart3]
const DOTTIR_ICONS: LucideIcon[] = [BarChart3, LayoutGrid, Users, Sparkles]

function TabButton({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className="flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-xl px-2 py-2 text-xs sm:text-sm font-medium touch-manipulation transition-all duration-200"
      style={{
        background: selected ? 'var(--primary-pale)' : 'var(--bg)',
        border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
        color: selected ? 'var(--primary)' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  )
}

function StepCard({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <div
      className="flex gap-3 rounded-xl p-3 min-w-0"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold m-0 mb-1" style={{ color: 'var(--text)' }}>
          {title}
        </p>
        <p className="text-xs m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {body}
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ title, body, icon: Icon }: { title: string; body: string; icon: LucideIcon }) {
  return (
    <div
      className="flex gap-3 rounded-xl p-3 min-w-0"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
      >
        <Icon size={17} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold m-0 mb-1" style={{ color: 'var(--text)' }}>
          {title}
        </p>
        <p className="text-xs m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {body}
        </p>
      </div>
    </div>
  )
}

function PersonalSummary({
  snapshot,
  formatNOK,
}: {
  snapshot: SubscriptionGuideSnapshot
  formatNOK: (n: number) => string
}) {
  if (snapshot.activeCount === 0) return null

  return (
    <div
      className="rounded-xl px-4 py-3 mb-4 space-y-1.5"
      style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide m-0" style={{ color: 'var(--primary)' }}>
        Dine tall nå
      </p>
      <p className="text-sm m-0 break-words" style={{ color: 'var(--text)' }}>
        <strong>{snapshot.activeCount}</strong> aktive abonnement
      </p>
      <p className="text-sm m-0 break-words" style={{ color: 'var(--text)' }}>
        <strong>{formatNOK(snapshot.monthlyTotal)}</strong>/mnd · <strong>{formatNOK(snapshot.yearlyTotal)}</strong>/år
      </p>
    </div>
  )
}

export default function SubscriptionGuideModal({
  open,
  onClose,
  snapshot,
  initialTab = 'steps',
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const [tab, setTab] = useState<SubscriptionGuideTabId>(initialTab)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  return (
    <GuideModalShell open={open} onClose={onClose} title="Slik fungerer abonnementer" titleId={TITLE_ID}>
      <div
        className="rounded-xl px-4 py-4 mb-4"
        style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
      >
        <p className="text-base font-semibold m-0 mb-2 leading-snug" style={{ color: 'var(--text)' }}>
          {subscriptionGuideHero.title}
        </p>
        <p className="text-sm m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {subscriptionGuideHero.lead}
        </p>
      </div>

      <PersonalSummary snapshot={snapshot} formatNOK={formatNOK} />

      {snapshot.readOnly && (
        <div
          className="flex gap-2 rounded-xl px-3 py-2.5 mb-4 text-xs break-words leading-relaxed"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <Users size={16} className="shrink-0 mt-0.5" aria-hidden />
          <span>{subscriptionHouseholdNote}</span>
        </div>
      )}

      <div role="tablist" aria-label="Abonnement-veiledning" className="mb-4 grid grid-cols-3 gap-2 min-w-0">
        {subscriptionGuideTabs.map((t) => (
          <TabButton key={t.id} label={t.label} selected={tab === t.id} onSelect={() => setTab(t.id)} />
        ))}
      </div>

      <div key={tab} role="tabpanel" className="min-w-0 animate-[mfaHowToFade_0.28s_ease-out_both]">
        {tab === 'steps' && (
          <div className="space-y-2.5">
            {subscriptionHowToStepCards.map((step, i) => (
              <StepCard key={step.title} index={i + 1} title={step.title} body={step.body} />
            ))}
          </div>
        )}

        {tab === 'budget' && (
          <div className="space-y-2.5">
            {subscriptionBudgetFeatures.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                body={feature.body}
                icon={BUDGET_ICONS[i] ?? Wallet}
              />
            ))}
          </div>
        )}

        {tab === 'dottir' && (
          <div className="space-y-2.5">
            {subscriptionDottirFeatures.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                body={feature.body}
                icon={DOTTIR_ICONS[i] ?? BarChart3}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {subscriptionGuideDisclaimer}
        </p>
        <Link
          href="/abonnementer/sammendrag"
          onClick={onClose}
          className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          Gå til Sammendrag
        </Link>
      </div>
    </GuideModalShell>
  )
}
