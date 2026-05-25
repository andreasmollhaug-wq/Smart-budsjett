'use client'

import InfoPopover from '@/components/ui/InfoPopover'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatNokCurrencyDisplay } from '@/lib/money/nokDisplayFormat'
import { useStore } from '@/lib/store'

function formatDeltaNOK(diff: number): string {
  const show = useStore.getState().showAmountDecimals
  if (diff === 0) return formatNokCurrencyDisplay(0, show)
  const sign = diff > 0 ? '+' : '−'
  return `${sign} ${formatNokCurrencyDisplay(Math.abs(diff), show)}`
}

type RateScenario = {
  delta: number
  monthly: number
  diff: number
}

export default function RateSensitivityPanel({
  scenarios,
  disclaimer = 'Indikativ. Avtale og faktisk rente hos utlåner bestemmer betaling.',
}: {
  scenarios: RateScenario[]
  disclaimer?: string
}) {
  const { formatNOK } = useNokDisplayFormatters()
  if (scenarios.length === 0) return null

  return (
    <div
      className="rounded-2xl border p-0 shadow-sm transition-shadow duration-300 ease-out min-w-0"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--surface)',
      }}
    >
      <div
        className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-medium tracking-tight" style={{ color: 'var(--text)' }}>
            Hva om renta endrer seg?
          </p>
          <InfoPopover
            title="Rentesensitivitet"
            text="Omtrent ny månedlig betaling hvis den nominelle årsrenten endres og lån/løpetid ellers er uendret. For scenarier — ikke en prognose."
          />
        </div>
      </div>
      <p className="px-4 sm:px-5 pt-2 text-[0.7rem] sm:text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {disclaimer}
      </p>
      <div className="p-2 sm:p-3 space-y-1.5 min-w-0" role="list">
        {scenarios.map(({ delta, monthly, diff }) => (
          <div
            key={delta}
            role="listitem"
            className="rounded-xl px-3 py-2.5 sm:py-2.5 transition-colors duration-200 ease-out min-w-0"
            style={{ background: 'var(--bg)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 sm:items-center gap-1.5 sm:gap-3 text-sm min-w-0">
              <div className="sm:col-span-3 tabular-nums text-xs sm:text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                {delta < 0 ? '−' : '+'}
                {Math.abs(delta)} % punkt
              </div>
              <div
                className="sm:col-span-4 font-semibold tabular-nums min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]"
                style={{ color: 'var(--text)' }}
              >
                {formatNOK(monthly)}{' '}
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  pr. md.
                </span>
              </div>
              <div
                className="sm:col-span-5 sm:text-right text-left tabular-nums text-sm min-w-0 break-words"
                style={{
                  color: diff > 0 ? 'var(--danger)' : diff < 0 ? 'var(--success)' : 'var(--text-muted)',
                }}
              >
                {diff === 0 ? 'Ingen endring' : formatDeltaNOK(diff) + ' pr. md.'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
