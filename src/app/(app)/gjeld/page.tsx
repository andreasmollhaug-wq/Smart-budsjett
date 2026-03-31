'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { useActivePersonFinance, Debt } from '@/lib/store'
import { formatNOK, generateId } from '@/lib/utils'
import { debtTypeLabels, debtIcons, debtColors } from '@/lib/debtDisplay'
import { isDebtPauseActive, annualInterestCost } from '@/lib/debtHelpers'
import { effectiveIncludeInSnowball } from '@/lib/snowball'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import DebtDetailModal from '@/components/debt/DebtDetailModal'
import { Plus, Trash2, PauseCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  const [form, setForm] = useState({
    name: '',
    totalAmount: 0,
    remainingAmount: 0,
    interestRate: 0,
    monthlyPayment: 0,
    type: 'loan' as Debt['type'],
  })

  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const selectedDebt = selectedDebtId ? debts.find((d) => d.id === selectedDebtId) ?? null : null

  const totalDebt = debts.reduce((a, b) => a + b.remainingAmount, 0)
  const totalMonthly = debts.reduce((a, b) => a + b.monthlyPayment, 0)
  const highestRate = debts.reduce((max, d) => (d.interestRate > max ? d.interestRate : max), 0)
  const totalAnnualInterest = debts.reduce((a, d) => a + annualInterestCost(d), 0)

  const barData = debts.map((d) => ({
    name: d.name,
    gjenstående: d.remainingAmount,
    total: d.totalAmount,
  }))

  const handleAdd = () => {
    if (!form.name.trim() || form.remainingAmount <= 0) return
    addDebt({
      id: generateId(),
      name: form.name.trim(),
      totalAmount: form.totalAmount,
      remainingAmount: form.remainingAmount,
      interestRate: form.interestRate,
      monthlyPayment: form.monthlyPayment,
      type: form.type,
      includeInSnowball: form.type !== 'mortgage',
    })
    setForm({
      name: '',
      totalAmount: 0,
      remainingAmount: 0,
      interestRate: 0,
      monthlyPayment: 0,
      type: 'loan',
    })
    setShowForm(false)
  }

  const openDetail = (id: string) => setSelectedDebtId(id)

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Gjeld" subtitle="Oversikt over all gjeld og nedbetalingsplan" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="rounded-2xl p-5"
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
            className="rounded-2xl p-5"
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
            className="rounded-2xl p-5"
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
            className="rounded-2xl p-5"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
              Gjeldsdetaljer
            </h2>

            {debts.length === 0 && (
              <div
                className="rounded-xl p-8 text-center"
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
                  className="p-4 rounded-xl space-y-3 text-left w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)]"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
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
                    <div className="text-right shrink-0">
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
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={effectiveIncludeInSnowball(debt)}
                          onChange={(e) => updateDebt(debt.id, { includeInSnowball: e.target.checked })}
                          className="rounded"
                        />
                        <span style={{ color: 'var(--text-muted)' }}>Ta med i snøball</span>
                      </label>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      <span>Nedbetalt: {Math.round(paidOff)}%</span>
                      <span>Totalt: {formatNOK(debt.totalAmount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--primary-pale)' }}>
                      <div className="h-full rounded-full" style={{ width: `${paidOff}%`, background: color }} />
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <FormattedAmountInput
                        value={debt.remainingAmount}
                        onChange={(n) => updateDebt(debt.id, { remainingAmount: n })}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                        placeholder="Oppdater restgjeld"
                        aria-label={`Restgjeld for ${debt.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeDebt(debt.id)}
                        className="p-1.5 rounded-lg"
                        aria-label={`Slett ${debt.name}`}
                      >
                        <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
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
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Legg til gjeld
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      placeholder="Navn"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as Debt['type'] })}
                      className="px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="mortgage">Boliglån</option>
                      <option value="loan">Lån</option>
                      <option value="student_loan">Studielån</option>
                      <option value="credit_card">Kredittkort</option>
                      <option value="other">Annet</option>
                    </select>
                    <FormattedAmountInput
                      value={form.totalAmount}
                      onChange={(n) => setForm({ ...form, totalAmount: n })}
                      className="px-3 py-2 rounded-xl text-sm"
                      placeholder="Opprinnelig beløp"
                    />
                    <FormattedAmountInput
                      value={form.remainingAmount}
                      onChange={(n) => setForm({ ...form, remainingAmount: n })}
                      className="px-3 py-2 rounded-xl text-sm"
                      placeholder="Restgjeld"
                    />
                    <input
                      placeholder="Rente (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.interestRate || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          interestRate: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      className="px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                    <FormattedAmountInput
                      value={form.monthlyPayment}
                      onChange={(n) => setForm({ ...form, monthlyPayment: n })}
                      className="px-3 py-2 rounded-xl text-sm"
                      placeholder="Månedlig avdrag"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                      style={{ background: 'var(--primary)' }}
                    >
                      Legg til
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white transition-colors w-full sm:w-auto"
                  style={{ background: 'var(--primary)' }}
                >
                  <Plus size={16} aria-hidden />
                  Legg til gjeld
                </button>
              )}
            </div>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Gjeldsoversikt
            </h2>
            {debts.length === 0 ? (
              <p className="text-sm py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                Ingen data å vise i diagrammet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${v / 1000}k`}
                    tick={{ fill: '#6B7A99', fontSize: 11 }}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#6B7A99', fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v) => formatNOK(v == null ? 0 : Number(v))} />
                  <Bar dataKey="total" fill="#E0E7FF" name="Totalt" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="gjenstående" fill="#3B5BDB" name="Gjenstående" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
