'use client'

import { forwardRef } from 'react'
import type { SavingsReportData } from '@/lib/savingsReportData'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatPercent } from '@/lib/utils'

export interface SavingsGoalsReportDocumentProps {
  generatedAt: Date
  scopeLabel: string
  data: SavingsReportData
}

const tableClass = 'w-full text-sm border-collapse'
const thClass = 'text-left py-2 px-3 font-semibold border-b'
const tdClass = 'py-2 px-3 border-b'
const sectionTitle = 'text-lg font-bold mt-8 mb-3'
const cardGrid = 'grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6'

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>
        {value}
      </p>
    </div>
  )
}

function formatActivityDate(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SavingsGoalsReportDocument = forwardRef<HTMLDivElement, SavingsGoalsReportDocumentProps>(
  function SavingsGoalsReportDocument({ generatedAt, scopeLabel, data }, ref) {
    const { formatNOK } = useNokDisplayFormatters()
    const dateStr = generatedAt.toLocaleString('nb-NO', {
      dateStyle: 'long',
      timeStyle: 'short',
    })

    const { kpis, rows, activities, showPortfolioShare } = data
    const hasGoals = rows.length > 0

    return (
      <div
        ref={ref}
        className="bank-report-document report-document rounded-2xl p-8 max-w-4xl mx-auto"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <header className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            Smart Budsjett
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Sparemålrapport
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Oversikt over sparemål, fremdrift og nylig aktivitet
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Omfang:
              </span>{' '}
              {scopeLabel}
            </span>
            <span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Generert:
              </span>{' '}
              {dateStr}
            </span>
          </div>
        </header>

        {!hasGoals ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen sparemål å vise.
          </p>
        ) : (
          <>
            <section>
              <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
                Sammendrag
              </h3>
              <div className={cardGrid}>
                <KpiCard label="Antall mål" value={String(kpis.goalsCount)} />
                <KpiCard
                  label="Totalt spart / målbeløp"
                  value={`${formatNOK(kpis.totalSaved)} / ${formatNOK(kpis.totalTarget)}`}
                />
                <KpiCard label="Samlet fremdrift" value={formatPercent(kpis.overallProgressPct)} />
                <KpiCard label="Gjenstår totalt" value={formatNOK(kpis.totalRemaining)} />
              </div>
            </section>

            <section>
              <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
                Oversikt per mål
              </h3>
              <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)' }}>
                    <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                      Mål
                    </th>
                    <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                      Spart
                    </th>
                    <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                      Målbeløp
                    </th>
                    <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                      Fremdrift
                    </th>
                    <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                      Måldato
                    </th>
                    <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                      Kobling
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.goal.id}>
                      <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: r.goal.color }}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <span className="font-medium" style={{ color: 'var(--text)' }}>
                              {r.goal.name}
                            </span>
                            <div
                              className="mt-1 h-1.5 rounded-full overflow-hidden max-w-[180px]"
                              style={{ background: 'var(--primary-pale)' }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, r.progressPct)}%`,
                                  background: r.goal.color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                        {formatNOK(r.effectiveCurrent)}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                        {formatNOK(r.targetAmount)}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                        {formatPercent(r.progressPct)}
                      </td>
                      <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                        {r.targetDateLabel}
                      </td>
                      <td className={`${tdClass} text-sm`} style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        {r.linkedLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {showPortfolioShare && (
              <section>
                <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
                  Fordeling av sparing
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  Andel av samlet spart beløp per mål (når total sparing er over null).
                </p>
                <ul className="space-y-2 text-sm">
                  {rows.map((r) => (
                    <li key={r.goal.id} className="flex justify-between gap-4">
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: r.goal.color }}
                          aria-hidden
                        />
                        <span style={{ color: 'var(--text)' }}>{r.goal.name}</span>
                      </span>
                      <span className="tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {formatPercent(r.portfolioSharePct)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
                Nylig aktivitet
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Siste registrerte hendelser per mål (transaksjoner eller manuelle innskudd).
              </p>
              <div className="space-y-8">
                {activities.map((block) => (
                  <div key={block.goalId}>
                    <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                      {block.goalName}
                    </h4>
                    {block.items.length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Ingen aktivitet registrert ennå.
                      </p>
                    ) : (
                      <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-muted)' }}>
                            <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                              Dato
                            </th>
                            <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                              Beskrivelse
                            </th>
                            <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                              Beløp
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.items.map((item, idx) => (
                            <tr key={`${block.goalId}-${item.date}-${idx}`}>
                              <td className={`${tdClass} whitespace-nowrap`} style={{ borderColor: 'var(--border)' }}>
                                {formatActivityDate(item.date)}
                              </td>
                              <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                                <span className="text-xs mr-2" style={{ color: 'var(--text-muted)' }}>
                                  {item.kind === 'deposit' ? 'Innskudd' : 'Transaksjon'}
                                </span>
                                {item.label}
                              </td>
                              <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                                {formatNOK(item.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <p>
            Tallene i denne rapporten bygger på opplysninger du har registrert i Smart Budsjett. De er ment som
            oversikt og er ikke juridisk eller regnskapsmessig dokumentasjon.
          </p>
        </footer>
      </div>
    )
  },
)

export default SavingsGoalsReportDocument
