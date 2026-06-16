'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  buildDemoStrategyCompareBundle,
  cheaperStrategyLabel,
  formatDebtFreeLabel,
  snowballStrategyCompareDemo,
} from '@/lib/snowballStrategyCompare'

type Props = {
  formatNOK: (n: number) => string
  /** Vis tydelig «fiktivt eksempel»-banner øverst */
  showDemoBanner?: boolean
}

function SummaryTile({
  label,
  snowball,
  avalanche,
}: {
  label: string
  snowball: string
  avalanche: string
}) {
  return (
    <div
      className="rounded-xl p-4 min-w-0"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-medium m-0 mb-3" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm min-w-0">
        <div className="min-w-0">
          <p className="m-0 text-xs font-semibold mb-1" style={{ color: '#3B5BDB' }}>
            Snøball
          </p>
          <p className="m-0 break-words tabular-nums font-medium" style={{ color: 'var(--text)' }}>
            {snowball}
          </p>
        </div>
        <div className="min-w-0">
          <p className="m-0 text-xs font-semibold mb-1" style={{ color: '#0CA678' }}>
            Avalanche
          </p>
          <p className="m-0 break-words tabular-nums font-medium" style={{ color: 'var(--text)' }}>
            {avalanche}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SnowballDemoCompareVisuals({ formatNOK, showDemoBanner = false }: Props) {
  const bundle = useMemo(() => buildDemoStrategyCompareBundle(), [])
  const { summary, chartPoints, tableRows } = bundle
  const cheaper = cheaperStrategyLabel(summary)
  const interestDiffAbs = Math.abs(summary.interestDifference)

  const insight =
    cheaper === 'tie'
      ? 'I eksempelet gir Snøball og Avalanche omtrent samme estimat.'
      : cheaper === 'avalanche'
        ? `I eksempelet sparer Avalanche anslagsvis ${formatNOK(interestDiffAbs)} i total rente sammenlignet med Snøball.`
        : `I eksempelet sparer Snøball anslagsvis ${formatNOK(interestDiffAbs)} i total rente sammenlignet med Avalanche.`

  return (
    <div className="space-y-5 min-w-0">
      {showDemoBanner && (
        <p
          className="text-sm m-0 leading-relaxed rounded-xl px-4 py-3"
          style={{ background: 'var(--primary-pale)', color: 'var(--text-muted)' }}
        >
          <strong style={{ color: 'var(--text)' }}>Fiktivt eksempel</strong> — laget for å vise hvordan
          metodene utvikler seg over tid. Dine egne tall simuleres i Snøball-verktøyet.
        </p>
      )}

      <p className="text-sm m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {snowballStrategyCompareDemo.intro} {insight}
      </p>

      <div
        className="grid gap-2 sm:grid-cols-2 text-xs rounded-xl p-3 min-w-0"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <div className="min-w-0">
          <p className="m-0 font-semibold mb-1" style={{ color: '#3B5BDB' }}>
            Snøball — rekkefølge
          </p>
          <p className="m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {snowballStrategyCompareDemo.payoffOrder.snowball.join(' → ')}
          </p>
        </div>
        <div className="min-w-0">
          <p className="m-0 font-semibold mb-1" style={{ color: '#0CA678' }}>
            Avalanche — rekkefølge
          </p>
          <p className="m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {snowballStrategyCompareDemo.payoffOrder.avalanche.join(' → ')}
          </p>
        </div>
      </div>

      <div
        className="overflow-x-auto rounded-xl min-w-0"
        style={{ border: '1px solid var(--border)' }}
      >
        <table className="w-full min-w-[20rem] text-sm border-collapse">
          <thead style={{ background: 'var(--bg)' }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left font-medium px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                Lån
              </th>
              <th className="text-right font-medium px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                Restgjeld
              </th>
              <th className="text-right font-medium px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                Rente
              </th>
              <th className="text-right font-medium px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                Min/mnd
              </th>
            </tr>
          </thead>
          <tbody>
            {snowballStrategyCompareDemo.loans.map((loan) => (
              <tr key={loan.name} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>
                  {loan.name}
                </td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatNOK(loan.remainingAmount)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                  {loan.interestRate} %
                </td>
                <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {formatNOK(loan.monthlyPayment)}
                </td>
              </tr>
            ))}
            <tr style={{ background: 'var(--primary-pale)' }}>
              <td colSpan={4} className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>
                + {formatNOK(snowballStrategyCompareDemo.extraMonthly)}/mnd ekstra på begge metoder
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 min-w-0">
        <SummaryTile
          label="Total rente (estimat)"
          snowball={formatNOK(summary.snowballTotalInterest)}
          avalanche={formatNOK(summary.avalancheTotalInterest)}
        />
        <SummaryTile
          label="Gjeldsfri (estimat)"
          snowball={formatDebtFreeLabel(summary.snowballDebtFreeMonthIndex, summary.snowballIncomplete)}
          avalanche={formatDebtFreeLabel(summary.avalancheDebtFreeMonthIndex, summary.avalancheIncomplete)}
        />
      </div>

      <figure className="m-0 space-y-2 min-w-0">
        <figcaption className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Restgjeld over tid
        </figcaption>
        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Hvor raskt gjelden synker måned for måned i eksempelet.
        </p>
        <div
          className="h-[260px] w-full min-w-0 rounded-xl p-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
              <Tooltip
                formatter={(value, name) => [
                  formatNOK(typeof value === 'number' ? value : Number(value ?? 0)),
                  name === 'snowballRemaining' ? 'Snøball' : 'Avalanche',
                ]}
              />
              <Legend formatter={(value) => (value === 'snowballRemaining' ? 'Snøball' : 'Avalanche')} />
              <Line type="monotone" dataKey="snowballRemaining" stroke="#3B5BDB" strokeWidth={2.5} dot={false} name="snowballRemaining" />
              <Line type="monotone" dataKey="avalancheRemaining" stroke="#0CA678" strokeWidth={2.5} dot={false} name="avalancheRemaining" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <figure className="m-0 space-y-2 min-w-0">
        <figcaption className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Kumulert rente over tid
        </figcaption>
        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Sum betalt rente fra start — lavere kurve betyr mindre rentekostnad totalt.
        </p>
        <div
          className="h-[260px] w-full min-w-0 rounded-xl p-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
              <Tooltip
                formatter={(value, name) => [
                  formatNOK(typeof value === 'number' ? value : Number(value ?? 0)),
                  name === 'snowballCumulativeInterest' ? 'Snøball' : 'Avalanche',
                ]}
              />
              <Legend formatter={(value) => (value === 'snowballCumulativeInterest' ? 'Snøball' : 'Avalanche')} />
              <Line type="monotone" dataKey="snowballCumulativeInterest" stroke="#3B5BDB" strokeWidth={2.5} dot={false} name="snowballCumulativeInterest" />
              <Line type="monotone" dataKey="avalancheCumulativeInterest" stroke="#0CA678" strokeWidth={2.5} dot={false} name="avalancheCumulativeInterest" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <figure className="m-0 space-y-2 min-w-0">
        <figcaption className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Utvikling måned for måned
        </figcaption>
        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Restgjeld per metode. Forskjell = Avalanche minus Snøball.
        </p>
        <div
          className="overflow-x-auto rounded-xl min-w-0 max-h-[320px] overflow-y-auto"
          style={{ border: '1px solid var(--border)' }}
        >
          <table className="w-full min-w-[28rem] text-sm border-collapse">
            <thead className="sticky top-0 z-[1]" style={{ background: 'var(--surface)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left font-medium px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>
                  Måned
                </th>
                <th className="text-right font-medium px-4 py-2.5" style={{ color: '#3B5BDB' }}>
                  Snøball
                </th>
                <th className="text-right font-medium px-4 py-2.5" style={{ color: '#0CA678' }}>
                  Avalanche
                </th>
                <th className="text-right font-medium px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>
                  Forskjell
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.monthIndex} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: 'var(--text)' }}>
                    {row.label}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                    {formatNOK(row.snowballRemaining)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                    {formatNOK(row.avalancheRemaining)}
                  </td>
                  <td
                    className="px-4 py-2.5 text-right tabular-nums"
                    style={{
                      color:
                        row.differenceRemaining > 0
                          ? '#0CA678'
                          : row.differenceRemaining < 0
                            ? '#3B5BDB'
                            : 'var(--text-muted)',
                    }}
                  >
                    {row.differenceRemaining === 0
                      ? '—'
                      : `${row.differenceRemaining > 0 ? '+' : ''}${formatNOK(row.differenceRemaining)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    </div>
  )
}
