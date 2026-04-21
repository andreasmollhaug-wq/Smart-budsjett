'use client'

import { forwardRef } from 'react'
import { REPORT_GROUP_LABELS } from '@/lib/bankReportData'
import type { MonthlyInsightPayload } from '@/lib/monthlyInsightCompute'
import { formatNOK, formatPercent } from '@/lib/utils'

export interface MonthlyInsightDocumentProps {
  generatedAt: Date
  payload: MonthlyInsightPayload
  summary: string
}

const tableClass = 'w-full text-sm border-collapse'
const thClass = 'text-left py-2 px-3 font-semibold border-b'
const tdClass = 'py-2 px-3 border-b'
const sectionTitle = 'text-lg font-bold mt-8 mb-3'
const cardGrid = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6'

const MONTH_NAMES_FULL = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
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
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
    </div>
  )
}

function pctLine(pct: number | null): string {
  if (pct == null) return '—'
  return formatPercent(pct)
}

const MonthlyInsightDocument = forwardRef<HTMLDivElement, MonthlyInsightDocumentProps>(
  function MonthlyInsightDocument({ generatedAt, payload, summary }, ref) {
    const dateStr = generatedAt.toLocaleString('nb-NO', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
    const monthName = MONTH_NAMES_FULL[payload.reportMonthIndex] ?? String(payload.reportMonthIndex + 1)
    const { kpis } = payload

    return (
      <div
        ref={ref}
        className="bank-report-document report-document rounded-2xl p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 max-w-4xl mx-auto min-w-0"
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
            Månedsinnsikt
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Faktisk mot budsjett, trender og kort oppsummering (EnkelExcel AI)
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Periode:
              </span>{' '}
              {monthName} {payload.reportYear}
            </span>
            <span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Omfang:
              </span>{' '}
              {payload.scopeLabel}
            </span>
            <span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Generert:
              </span>{' '}
              {dateStr}
            </span>
          </div>
        </header>

        <section aria-label="Nøkkeltall">
          <h2 className={sectionTitle} style={{ color: 'var(--text)' }}>
            Overordnet status
          </h2>
          <div className={cardGrid}>
            <KpiCard
              label="Inntekt (faktisk)"
              value={formatNOK(kpis.actualIncome)}
              sub={`Budsjett ${formatNOK(kpis.budgetedIncome)} · avvik ${formatNOK(kpis.incomeVariance)} (${pctLine(kpis.incomeVariancePct)})`}
            />
            <KpiCard
              label="Kostnader (faktisk)"
              value={formatNOK(kpis.actualExpense)}
              sub={`Budsjett ${formatNOK(kpis.budgetedExpense)} · avvik ${formatNOK(kpis.expenseVariance)} (${pctLine(kpis.expenseVariancePct)})`}
            />
            <KpiCard
              label="Netto (faktisk)"
              value={formatNOK(kpis.netActual)}
              sub="Inntekt − kostnader"
            />
            <KpiCard
              label="Kostnader vs snitt hittil i år"
              value={
                kpis.expenseVsYtdAvgPct != null ? formatPercent(kpis.expenseVsYtdAvgPct) : '—'
              }
              sub={
                kpis.ytdAvgMonthlyExpense != null
                  ? `Snitt jan–${MONTH_NAMES_FULL[payload.reportMonthIndex - 1]?.slice(0, 3) ?? ''}: ${formatNOK(kpis.ytdAvgMonthlyExpense)}`
                  : 'Ingen tidligere måneder i året før valgt måned'
              }
            />
          </div>
          {payload.incomeDetail ? (
            <div
              className="mt-4 rounded-xl p-4 text-sm space-y-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                Inntekt: brutto og forenklet trekk
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Beløpene er basert på innstillingene i appen (forenklet modell, ikke offisiell skatteberegning).
                Sammenligning mot budsjett bruker netto som i kortene over.
              </p>
              <div className="grid grid-cols-1 gap-4 min-w-0">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Budsjett (måned)
                  </p>
                  <p>Brutto: {formatNOK(payload.incomeDetail.budgeted.gross)}</p>
                  <p>Forenklet trekk: {formatNOK(payload.incomeDetail.budgeted.withholding)}</p>
                  <p className="font-medium">Netto: {formatNOK(payload.incomeDetail.budgeted.net)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Faktisk (måned)
                  </p>
                  <p>Brutto: {formatNOK(payload.incomeDetail.actual.gross)}</p>
                  <p>Forenklet trekk: {formatNOK(payload.incomeDetail.actual.withholding)}</p>
                  <p className="font-medium">Netto: {formatNOK(payload.incomeDetail.actual.net)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section aria-label="Sammendrag">
          <h2 className={sectionTitle} style={{ color: 'var(--text)' }}>
            Sammendrag
          </h2>
          <div
            className="text-sm whitespace-pre-wrap leading-relaxed rounded-xl p-4"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {summary}
          </div>
        </section>

        <section aria-label="Kostnader over budsjett">
          <h2 className={sectionTitle} style={{ color: 'var(--text)' }}>
            Kostnader over budsjett
          </h2>
          {payload.overBudget.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen kategorier med positivt avvik mot budsjett for måneden.
            </p>
          ) : (
            <table className={tableClass}>
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className={thClass}>Kategori</th>
                  <th className={thClass}>Gruppe</th>
                  <th className={thClass}>Budsjett</th>
                  <th className={thClass}>Faktisk</th>
                  <th className={thClass}>Avvik (kr)</th>
                  <th className={thClass}>Avvik (%)</th>
                </tr>
              </thead>
              <tbody>
                {payload.overBudget.map((r) => (
                  <tr key={r.categoryId}>
                    <td className={tdClass}>{r.name}</td>
                    <td className={tdClass}>{REPORT_GROUP_LABELS[r.parentCategory]}</td>
                    <td className={tdClass}>{formatNOK(r.budgeted)}</td>
                    <td className={tdClass}>{formatNOK(r.actual)}</td>
                    <td className={tdClass}>{formatNOK(r.variance)}</td>
                    <td className={tdClass}>{pctLine(r.variancePct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section aria-label="Kostnader under budsjett">
          <h2 className={sectionTitle} style={{ color: 'var(--text)' }}>
            Kostnader under budsjett
          </h2>
          {payload.underBudget.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen kategorier med lavere utgift enn budsjett for måneden.
            </p>
          ) : (
            <table className={tableClass}>
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className={thClass}>Kategori</th>
                  <th className={thClass}>Gruppe</th>
                  <th className={thClass}>Budsjett</th>
                  <th className={thClass}>Faktisk</th>
                  <th className={thClass}>Avvik (kr)</th>
                  <th className={thClass}>Avvik (%)</th>
                </tr>
              </thead>
              <tbody>
                {payload.underBudget.map((r) => (
                  <tr key={r.categoryId}>
                    <td className={tdClass}>{r.name}</td>
                    <td className={tdClass}>{REPORT_GROUP_LABELS[r.parentCategory]}</td>
                    <td className={tdClass}>{formatNOK(r.budgeted)}</td>
                    <td className={tdClass}>{formatNOK(r.actual)}</td>
                    <td className={tdClass}>{formatNOK(r.variance)}</td>
                    <td className={tdClass}>{pctLine(r.variancePct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    )
  },
)

export default MonthlyInsightDocument
