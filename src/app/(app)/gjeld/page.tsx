'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { useActivePersonFinance } from '@/lib/store'
import { formatNOK, generateId } from '@/lib/utils'
import { debtTypeLabels, debtIcons, debtColors } from '@/lib/debtDisplay'
import { isDebtPauseActive, annualInterestCost } from '@/lib/debtHelpers'
import { effectiveIncludeInSnowball } from '@/lib/snowball'
import AddDebtForm, { type AddDebtFormPayload } from '@/components/debt/AddDebtForm'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import DebtDetailModal from '@/components/debt/DebtDetailModal'
import GjeldSubnav from '@/components/debt/GjeldSubnav'
import { Plus, Trash2, PauseCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipPayload } from 'recharts'

function truncateChartName(name: string, maxLen = 18): string {
  const t = name.trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`
}

type BarRow = {
  name: string
  fullName: string
  gjenstående: number
  total: number
}

function DebtBarTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as BarRow | undefined
  const title = row?.fullName ?? row?.name ?? ''
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm max-w-[min(100vw-2rem,20rem)]"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <p className="font-medium mb-1.5 truncate" style={{ color: 'var(--text)' }} title={title}>
        {title}
      </p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex justify-between gap-4" style={{ color: 'var(--text-muted)' }}>
          <span>{p.name}</span>
          <span className="tabular-nums" style={{ color: 'var(--text)' }}>
            {formatNOK(p.value == null ? 0 : Number(p.value))}
          </span>
        </p>
      ))}
    </div>
  )
}

export default function GjeldPage() {
  const {
    debts,
    addDebt,
    removeDebt,
    updateDebt,
    isHouseholdAggregate,
  } = useActivePersonFinance()
  const readOnly = isHouseholdAggregate

  const [showForm, setShowForm] = useState(false)

  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const selectedDebt = selectedDebtId ? debts.find((d) => d.id === selectedDebtId) ?? null : null

  const totalDebt = debts.reduce((a, b) => a + b.remainingAmount, 0)
  const totalMonthly = debts.reduce((a, b) => a + b.monthlyPayment, 0)
  const highestRate = debts.reduce((max, d) => (d.interestRate > max ? d.interestRate : max), 0)
  const totalAnnualInterest = debts.reduce((a, d) => a + annualInterestCost(d), 0)

  const barData: BarRow[] = debts.map((d) => ({
    name: truncateChartName(d.name),
    fullName: d.name,
    gjenstående: d.remainingAmount,
    total: d.totalAmount,
  }))

  const handleAddDebt = (payload: AddDebtFormPayload) => {
    addDebt({
      id: generateId(),
      ...payload,
    })
    setShowForm(false)
  }

  const openDetail = (id: string) => setSelectedDebtId(id)

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Gjeld" subtitle="Oversikt over all gjeld og nedbetalingsplan" />
      <GjeldSubnav />
      <div
        className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pt-6 lg:px-8 lg:py-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            className="rounded-2xl p-4 sm:p-5 min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Total gjeld
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--danger)' }}>
              {formatNOK(totalDebt)}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 sm:p-5 min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Månedlige avdrag
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>
              {formatNOK(totalMonthly)}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 sm:p-5 min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Høyeste rente
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--warning)' }}>
              {debts.length ? `${highestRate}%` : '—'}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 sm:p-5 min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ca. årlig rentekostnad
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>
              {debts.length ? formatNOK(totalAnnualInterest) : '—'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Restgjeld × rente / 100
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
          <div
            className="rounded-2xl p-4 sm:p-6 space-y-4 min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
              Gjeldsdetaljer
            </h2>

            {debts.length === 0 && (
              <div
                className="rounded-xl p-6 sm:p-8 text-center"
                style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {readOnly
                    ? 'Ingen gjeld i denne visningen.'
                    : 'Ingen gjeld registrert ennå. Bruk «Legg til gjeld» nederst i listen.'}
                </p>
              </div>
            )}

            {debts.map((debt) => {
              const Icon = debtIcons[debt.type]
              const color = debtColors[debt.type]
              const paidOff =
                debt.totalAmount > 0
                  ? Math.min(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100, 100)
                  : 0
              const pauseActive = isDebtPauseActive(debt)

              return (
                <div
                  key={debt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(debt.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openDetail(debt.id)
                    }
                  }}
                  className="p-4 rounded-xl space-y-3 text-left w-full min-w-0 cursor-pointer outline-none touch-manipulation focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)]"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: color + '20' }}
                      >
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
                          {debt.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {debtTypeLabels[debt.type]} · {debt.interestRate}% rente
                        </p>
                        {pauseActive && (
                          <span
                            className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium px-2 py-0.5 rounded-md"
                            style={{
                              background: 'var(--warning)',
                              color: 'var(--text)',
                              opacity: 0.95,
                            }}
                          >
                            <PauseCircle size={12} aria-hidden />
                            {debt.pauseEndDate
                              ? `Pause til ${debt.pauseEndDate}`
                              : 'Avdrag pauset'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--danger)' }}>
                        {formatNOK(debt.remainingAmount)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatNOK(debt.monthlyPayment)}/mnd
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    <div
                      className="flex items-center gap-2 min-h-[44px] touch-manipulation"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <label className="flex items-center gap-2 cursor-pointer text-xs flex-1 min-w-0 py-1">
                        <input
                          type="checkbox"
                          checked={effectiveIncludeInSnowball(debt)}
                          onChange={(e) => updateDebt(debt.id, { includeInSnowball: e.target.checked })}
                          className="rounded shrink-0"
                        />
                        <span style={{ color: 'var(--text-muted)' }}>Ta med i snøball</span>
                      </label>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between text-xs mb-1 gap-2 min-w-0" style={{ color: 'var(--text-muted)' }}>
                      <span className="shrink-0">Nedbetalt: {Math.round(paidOff)}%</span>
                      <span className="truncate text-right">Totalt: {formatNOK(debt.totalAmount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--primary-pale)' }}>
                      <div className="h-full rounded-full" style={{ width: `${paidOff}%`, background: color }} />
                    </div>
                  </div>
                  {!readOnly && (
                    <div
                      className="flex items-center gap-2 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <FormattedAmountInput
                        value={debt.remainingAmount}
                        onChange={(n) => updateDebt(debt.id, { remainingAmount: n })}
                        className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-lg text-sm"
                        placeholder="Oppdater restgjeld"
                        aria-label={`Restgjeld for ${debt.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeDebt(debt.id)}
                        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl touch-manipulation"
                        aria-label={`Slett ${debt.name}`}
                      >
                        <Trash2 size={16} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            <div
              className={debts.length > 0 ? 'pt-4 mt-2 border-t' : 'pt-2'}
              style={{ borderColor: 'var(--border)' }}
            >
              {readOnly ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  I husholdningsvisning kan du se gjeld for alle profiler, men ikke legge til eller redigere her. Bytt til
                  én profil for å administrere gjeld.
                </p>
              ) : showForm ? (
                <AddDebtForm
                  heading="Legg til gjeld"
                  onSubmit={handleAddDebt}
                  onCancel={() => setShowForm(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white transition-colors w-full sm:w-auto touch-manipulation"
                  style={{ background: 'var(--primary)' }}
                >
                  <Plus size={16} aria-hidden />
                  Legg til gjeld
                </button>
              )}
            </div>
          </div>

          <div
            className="rounded-2xl p-4 sm:p-6 min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="mb-4">
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                Gjeldsoversikt
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Sammenligner opprinnelig lånebeløp med gjenstående restgjeld per lån.
              </p>
            </div>
            {debts.length === 0 ? (
              <p className="text-sm py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                Ingen data å vise i diagrammet.
              </p>
            ) : (
              <div className="h-[280px] w-full min-w-0 sm:h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 4, right: 8, bottom: 8, left: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--primary-pale)" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `${v / 1000}k`}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      width={104}
                    />
                    <Tooltip content={<DebtBarTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }}
                    />
                    <Bar dataKey="total" fill="var(--primary-pale)" name="Opprinnelig beløp" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="gjenstående" fill="var(--primary)" name="Restgjeld" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <DebtDetailModal
          debt={selectedDebt}
          open={selectedDebtId !== null}
          onClose={() => setSelectedDebtId(null)}
          readOnly={readOnly}
          householdHint={readOnly}
          onSave={(id, data) => updateDebt(id, data)}
          onDelete={removeDebt}
        />
      </div>
    </div>
  )
}
