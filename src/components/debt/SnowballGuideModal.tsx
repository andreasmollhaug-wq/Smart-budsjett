'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Snowflake,
  TrendingDown,
  Target,
  Wallet,
  ListOrdered,
  BarChart3,
  Users,
  type LucideIcon,
} from 'lucide-react'
import GuideModalShell from '@/components/ui/GuideModalShell'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import {
  snowballArticleLink,
  snowballDottirFeatures,
  snowballGuideDisclaimer,
  snowballGuideHero,
  snowballGuideTabs,
  snowballHouseholdNote,
  snowballHowToStepCards,
  snowballMethodWhen,
  snowballStrategyCards,
  type SnowballGuideTabId,
} from '@/lib/snowballGuideCopy'

const TITLE_ID = 'snowball-guide-title'

export type SnowballGuideSnapshot = {
  debtCount: number
  queueLength: number
  queueRestSum: number
  focusName: string | null
  snowballExtraMonthly: number
  debtFreeLabel: string | null
  readOnly: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  snapshot: SnowballGuideSnapshot
  initialTab?: SnowballGuideTabId
}

const DOTTIR_ICONS: LucideIcon[] = [Wallet, ListOrdered, Target, BarChart3]

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

function StrategyCard({
  card,
  icon: Icon,
  accent,
}: {
  card: (typeof snowballStrategyCards)['snowball']
  icon: LucideIcon
  accent: string
}) {
  return (
    <div
      className="rounded-xl p-4 min-w-0 flex-1"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg mb-3"
        style={{ background: accent + '22', color: accent }}
      >
        <Icon size={18} aria-hidden />
      </span>
      <p className="text-sm font-semibold m-0 mb-0.5" style={{ color: 'var(--text)' }}>
        {card.title}
      </p>
      <p className="text-xs font-medium m-0 mb-3" style={{ color: 'var(--primary)' }}>
        {card.tagline}
      </p>
      <ul className="text-xs space-y-2 m-0 pl-0 list-none" style={{ color: 'var(--text-muted)' }}>
        {card.points.map((point) => (
          <li key={point} className="break-words leading-relaxed pl-0">
            {point}
          </li>
        ))}
      </ul>
    </div>
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

function PersonalSummary({
  snapshot,
  formatNOK,
}: {
  snapshot: SnowballGuideSnapshot
  formatNOK: (n: number) => string
}) {
  const { queueLength, queueRestSum, focusName, snowballExtraMonthly, debtFreeLabel } = snapshot
  if (queueLength === 0) return null

  return (
    <div
      className="rounded-xl px-4 py-3 mb-4 space-y-1.5"
      style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide m-0" style={{ color: 'var(--primary)' }}>
        Dine tall nå
      </p>
      <p className="text-sm m-0 break-words" style={{ color: 'var(--text)' }}>
        <strong>{queueLength}</strong> lån i køen · <strong>{formatNOK(queueRestSum)}</strong> restgjeld
      </p>
      {focusName && (
        <p className="text-sm m-0 break-words" style={{ color: 'var(--text)' }}>
          Neste fokus: <strong>{focusName}</strong>
        </p>
      )}
      {snowballExtraMonthly > 0 && debtFreeLabel && debtFreeLabel !== '—' && (
        <p className="text-xs m-0 break-words" style={{ color: 'var(--text-muted)' }}>
          Med {formatNOK(snowballExtraMonthly)}/mnd ekstra: gjeldsfri ca. <strong>{debtFreeLabel}</strong>
        </p>
      )}
    </div>
  )
}

export default function SnowballGuideModal({ open, onClose, snapshot, initialTab = 'steps' }: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const [tab, setTab] = useState<SnowballGuideTabId>(initialTab)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  const showGjeldCta = !snapshot.readOnly && snapshot.debtCount === 0

  return (
    <GuideModalShell open={open} onClose={onClose} title="Slik fungerer snøball" titleId={TITLE_ID}>
      <div
        className="rounded-xl px-4 py-4 mb-4"
        style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
      >
        <p className="text-base font-semibold m-0 mb-2 leading-snug" style={{ color: 'var(--text)' }}>
          {snowballGuideHero.title}
        </p>
        <p className="text-sm m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {snowballGuideHero.lead}
        </p>
      </div>

      <PersonalSummary snapshot={snapshot} formatNOK={formatNOK} />

      {snapshot.readOnly && (
        <div
          className="flex gap-2 rounded-xl px-3 py-2.5 mb-4 text-xs break-words leading-relaxed"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <Users size={16} className="shrink-0 mt-0.5" aria-hidden />
          <span>{snowballHouseholdNote}</span>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Snøball-veiledning"
        className="mb-4 grid grid-cols-3 gap-2 min-w-0"
      >
        {snowballGuideTabs.map((t) => (
          <TabButton key={t.id} label={t.label} selected={tab === t.id} onSelect={() => setTab(t.id)} />
        ))}
      </div>

      <div key={tab} role="tabpanel" className="min-w-0 animate-[mfaHowToFade_0.28s_ease-out_both]">
        {tab === 'steps' && (
          <div className="space-y-2.5">
            {snowballHowToStepCards.map((step, i) => (
              <StepCard key={step.title} index={i + 1} title={step.title} body={step.body} />
            ))}
          </div>
        )}

        {tab === 'method' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 min-w-0">
              <StrategyCard card={snowballStrategyCards.snowball} icon={Snowflake} accent="#3B5BDB" />
              <StrategyCard card={snowballStrategyCards.avalanche} icon={TrendingDown} accent="#0CA678" />
            </div>
            <p className="text-sm m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {snowballMethodWhen}
            </p>
          </div>
        )}

        {tab === 'dottir' && (
          <div className="space-y-2.5">
            {snowballDottirFeatures.map((feature, i) => {
              const Icon = DOTTIR_ICONS[i] ?? Wallet
              return (
                <div
                  key={feature.title}
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
                      {feature.title}
                    </p>
                    <p className="text-xs m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {feature.body}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div
        className="mt-5 pt-4 border-t space-y-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-xs m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {snowballGuideDisclaimer}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {showGjeldCta && (
            <Link
              href="/gjeld"
              onClick={onClose}
              className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-white min-h-[44px] touch-manipulation"
              style={{ background: 'var(--primary)' }}
            >
              Gå til Gjeld
            </Link>
          )}
          <Link
            href={snowballArticleLink.href}
            onClick={onClose}
            className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {snowballArticleLink.label}
          </Link>
        </div>
      </div>
    </GuideModalShell>
  )
}
