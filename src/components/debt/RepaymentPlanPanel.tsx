'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatNOK } from '@/lib/utils'
import type { PayoffSimResult } from '@/lib/payoffSimulation'

type RepaymentPlanPanelProps = {
  strategy: PayoffSimResult
  debtFreeLabel: string
  queueLoanCount: number
}

export default function RepaymentPlanPanel({
  strategy,
  debtFreeLabel,
  queueLoanCount,
}: RepaymentPlanPanelProps) {
  const [open, setOpen] = useState(false)
  const contentId = useId()
  const { monthly, loanPayoffs, monthsToDebtFree, incomplete } = strategy

  const summaryParts: string[] = []
  summaryParts.push(`Gjeldsfri (estimat): ${debtFreeLabel}`)
  summaryParts.push(`${queueLoanCount} lån i køen`)
  if (monthsToDebtFree !== null) {
    summaryParts.push(`${monthsToDebtFree} måneder i simulering`)
  } else if (incomplete) {
    summaryParts.push('Simulering ufullstendig innen maks horisont')
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <button
        type="button"
        id={`${contentId}-trigger`}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left flex flex-wrap items-start justify-between gap-3 rounded-xl -m-1 p-1 transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--primary)]"
      >
        <div className="min-w-0 space-y-1 flex-1">
          <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
            Nedbetalingsplan
            <ChevronDown
              size={18}
              className="shrink-0 transition-transform"
              style={{ transform: open ? 'rotate(180deg)' : undefined, color: 'var(--text-muted)' }}
              aria-hidden
            />
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Veiledende modell — samme som graf og KPI over (registrerte renter og avdrag).
          </p>
          {!open && (
            <p className="text-sm pt-1" style={{ color: 'var(--text)' }}>
              {summaryParts.join(' · ')}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div id={contentId} role="region" aria-labelledby={`${contentId}-trigger`} className="space-y-6 pt-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Milepæler
            </h3>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>
                      Lån
                    </th>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>
                      Estimert ferdig
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loanPayoffs.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        Ingen nedbetalte lån i perioden (sjekk at avdrag og renter gir mening).
                      </td>
                    </tr>
                  ) : (
                    loanPayoffs.map((row) => (
                      <tr key={`${row.debtId}-${row.monthIndex}`} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-3 py-2" style={{ color: 'var(--text)' }}>
                          {row.name}
                        </td>
                        <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                          {row.label}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Månedlig oversikt (estimat)
            </h3>
            <div
              className="overflow-x-auto rounded-xl border max-h-[min(360px,50vh)] overflow-y-auto"
              style={{ borderColor: 'var(--border)' }}
            >
              <table className="w-full text-sm min-w-[520px]">
                <thead className="sticky top-0 z-[1]">
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>
                      Måned
                    </th>
                    <th className="text-right px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text)' }}>
                      Renter
                    </th>
                    <th className="text-right px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text)' }}>
                      Mot fokus
                    </th>
                    <th className="text-right px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text)' }}>
                      Restgjeld i kø
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        Ingen måneder i simuleringen.
                      </td>
                    </tr>
                  ) : (
                    monthly.map((row) => (
                      <tr key={row.monthIndex} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--text)' }}>
                          {row.label}
                        </td>
                        <td className="text-right px-3 py-1.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {formatNOK(row.interestLine)}
                        </td>
                        <td className="text-right px-3 py-1.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {formatNOK(row.snowballBar)}
                        </td>
                        <td className="text-right px-3 py-1.5 tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                          {formatNOK(row.totalRemainingInQueue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
