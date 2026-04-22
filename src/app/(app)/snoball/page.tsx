'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import { useActivePersonFinance, type DebtPayoffStrategy } from '@/lib/store'
import { formatNOK, generateId } from '@/lib/utils'
import { debtTypeLabels, debtIcons, debtColors } from '@/lib/debtDisplay'
import { isDebtPauseActive } from '@/lib/debtHelpers'
import {
  sortPayoffQueue,
  getPayoffFocus,
  debtsExcludedFromSnowballQueue,
  effectiveIncludeInSnowball,
  isDebtInSnowball,
} from '@/lib/snowball'
import { sampleMonthlyForChart, simulatePayoffSchedule } from '@/lib/payoffSimulation'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import AddDebtForm, { type AddDebtFormPayload } from '@/components/debt/AddDebtForm'
import DebtDetailModal from '@/components/debt/DebtDetailModal'
import RepaymentPlanPanel from '@/components/debt/RepaymentPlanPanel'
import {
  Plus,
  HelpCircle,
  Wallet,
  CreditCard,
  Percent,
  Calendar,
  TrendingDown,
  PiggyBank,
} from 'lucide-react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

function debtFreeLabel(monthIndex: number | null, incomplete: boolean): string {
  if (incomplete || monthIndex === null) return '—'
  const d = new Date(2026, monthIndex + 1, 1)
  return d.toLocaleDateString('nb-NO', { month: 'short', year: 'numeric' })
}

export default function SnoballPage() {
  const {
    debts,
    addDebt,
    removeDebt,
    updateDebt,
    isHouseholdAggregate,
    snowballExtraMonthly,
    setSnowballExtraMonthly,
    debtPayoffStrategy,
    setDebtPayoffStrategy,
  } = useActivePersonFinance()
  const readOnly = isHouseholdAggregate

  const effectiveStrategy: DebtPayoffStrategy = readOnly ? 'snowball' : debtPayoffStrategy

  const [showForm, setShowForm] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!helpOpen) return
    const close = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [helpOpen])

  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const selectedDebt = selectedDebtId ? debts.find((d) => d.id === selectedDebtId) ?? null : null

  const queue = sortPayoffQueue(debts, effectiveStrategy)
  const focus = getPayoffFocus(debts, effectiveStrategy)
  const excluded = debtsExcludedFromSnowballQueue(debts)

  const headerSubtitle =
    effectiveStrategy === 'avalanche'
      ? 'Høyeste rente først — ekstra beløp mot det dyreste lånet'
      : 'Minste restgjeld først — ekstra beløp ruller videre i køen'

  const queueLoans = queue
  const sumMinIQueue = queueLoans.reduce((a, d) => a + d.monthlyPayment, 0)
  /** Kun lån i nedbetalingskø (samme omfang som strategi og graf) */
  const queueRestSum = queueLoans.reduce((a, d) => a + d.remainingAmount, 0)
  const snittrenteVektet =
    queueRestSum > 0
      ? queueLoans.reduce((a, d) => a + d.remainingAmount * d.interestRate, 0) / queueRestSum
      : 0

  const snowballEligibleCount = debts.filter(isDebtInSnowball).length
  const debtsWithRestCount = debts.filter((d) => d.remainingAmount > 0).length
  const restDebtOutsideSnowballQueue = Math.max(0, debtsWithRestCount - queueLoans.length)

  /** Begge strategier med samme ekstra — brukes til KPI-sammenligning og til valgt strategi i graf/plan */
  const simBothStrategies = useMemo(() => {
    if (queue.length === 0) return null
    return {
      snowball: simulatePayoffSchedule(debts, 'snowball', snowballExtraMonthly),
      avalanche: simulatePayoffSchedule(debts, 'avalanche', snowballExtraMonthly),
    }
  }, [debts, snowballExtraMonthly, queue.length])

  const payoffCompare = useMemo(() => {
    if (!simBothStrategies) return null
    const strategySim = simBothStrategies[effectiveStrategy]
    const baselineSim = simulatePayoffSchedule(debts, effectiveStrategy, 0)
    const savedInterest = baselineSim.totalInterest - strategySim.totalInterest
    let monthsSaved: number | null = null
    if (strategySim.monthsToDebtFree !== null && baselineSim.monthsToDebtFree !== null) {
      monthsSaved = baselineSim.monthsToDebtFree - strategySim.monthsToDebtFree
    }
    return {
      strategy: strategySim,
      baseline: baselineSim,
      savedInterest,
      monthsSaved,
    }
  }, [debts, effectiveStrategy, simBothStrategies])

  const chartData = useMemo(() => {
    if (!payoffCompare) return []
    return sampleMonthlyForChart(payoffCompare.strategy.monthly, 56)
  }, [payoffCompare])

  const simKpi = payoffCompare && simBothStrategies
    ? (() => {
        const otherStrategy: DebtPayoffStrategy =
          effectiveStrategy === 'snowball' ? 'avalanche' : 'snowball'
        const otherLabel = otherStrategy === 'snowball' ? 'Snøball' : 'Avalanche'
        const currentTotal = simBothStrategies[effectiveStrategy].totalInterest
        const otherTotal = simBothStrategies[otherStrategy].totalInterest
        const diff = otherTotal - currentTotal
        const chosenLabel = effectiveStrategy === 'snowball' ? 'Snøball' : 'Avalanche'
        const totalInterestSub = 'Sum over simulering, køen'
        const totalInterestInfo =
          Math.abs(diff) < 1
            ? 'Snøball og Avalanche gir samme estimat her. Det er vanlig hvis du bare har ett lån i køen, eller hvis nedbetalingsrekkefølgen blir lik i simuleringen.'
            : `Estimert total rentekostnad med ${otherLabel} er ${formatNOK(otherTotal)}. Med valgt ${chosenLabel} er tallet ${formatNOK(currentTotal)} — altså ${diff > 0 ? 'lavere' : 'høyere'} rentekostnad med ${formatNOK(Math.abs(diff))} sammenlignet med ${otherLabel}.`
        const savedSub =
          snowballExtraMonthly <= 0 ? 'Ekstra nedbetaling er 0 kr' : 'Vs. kun minimum (samme strategi)'
        const savedInfo =
          'Viser hvor mye lavere total rente er med din ekstra nedbetaling sammenlignet med kun minimum — begge simuleringer bruker samme strategi som du har valgt. Det måler ikke forskjell mellom Snøball og Avalanche. Når ekstra er 0 kr, er dette tallet 0.'
        return {
          totalInterest: currentTotal,
          totalInterestSub,
          totalInterestInfo,
          savedInterest: Math.max(0, payoffCompare.savedInterest),
          savedSub,
          savedInfo,
          debtFreeLabel: debtFreeLabel(
            payoffCompare.strategy.debtFreeMonthIndex,
            payoffCompare.strategy.incomplete,
          ),
          monthsSaved:
            payoffCompare.monthsSaved !== null && payoffCompare.monthsSaved > 0
              ? payoffCompare.monthsSaved
              : null,
          incomplete: payoffCompare.strategy.incomplete,
        }
      })()
    : null

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
      <Header title="Nedbetalingsstrategi" subtitle={headerSubtitle} />
      <div className="p-8 space-y-6 max-w-6xl">
        {/* Strategi + hjelp */}
        <div
          className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Strategi
            </span>
            <div className="relative" ref={helpRef}>
              <button
                type="button"
                onClick={() => setHelpOpen((o) => !o)}
                className="p-1 rounded-lg"
                style={{ color: 'var(--text-muted)' }}
                aria-expanded={helpOpen}
                aria-label="Forklaring av strategier"
              >
                <HelpCircle size={18} />
              </button>
              {helpOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl p-4 text-sm shadow-lg"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <p className="font-medium mb-2">Snøball</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    Betaler minimum på alle lån i køen, og legger all ekstra nedbetaling på det minste lånet (lavest
                    restgjeld) til det er borte. Gir ofte rask psykologisk fremdrift.
                  </p>
                  <p className="font-medium mb-2">Avalanche</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    Samme minimum på alle, men ekstra går til lånet med høyest rente. Kan ofte redusere total
                    rentekostnad over tid (veiledende).
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Graf og KPI er estimater basert på registrerte renter og avdrag — ikke finansrådgivning.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setDebtPayoffStrategy('snowball')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              style={{
                background: effectiveStrategy === 'snowball' ? 'var(--primary)' : 'var(--bg)',
                color: effectiveStrategy === 'snowball' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              Snøball
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setDebtPayoffStrategy('avalanche')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              style={{
                background: effectiveStrategy === 'avalanche' ? 'var(--primary)' : 'var(--bg)',
                color: effectiveStrategy === 'avalanche' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              Avalanche
            </button>
          </div>
        </div>

        {readOnly && (
          <p
            className="text-sm rounded-xl px-4 py-3"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Du ser aggregert husholdning. Bytt til én profil for å redigere gjeld, strategi og ekstra beløp. KPI og graf
            er samlet estimat.
          </p>
        )}

        {/* Oppsummering gjeld */}
        {debts.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Restgjeld i kø"
              value={formatNOK(queueRestSum)}
              sub="Kun lån i nedbetalingskø"
              icon={Wallet}
              color="#3B5BDB"
            />
            <StatCard
              label="Lån i kø"
              value={String(queueLoans.length)}
              sub={
                snowballEligibleCount === 0
                  ? 'Ingen tildelt snøball med restgjeld'
                  : restDebtOutsideSnowballQueue > 0
                    ? `${restDebtOutsideSnowballQueue} med rest utenfor snøball-køen`
                    : `${snowballEligibleCount} tildelt snøball — alle i køen`
              }
              icon={CreditCard}
              color="#4C6EF5"
            />
            <StatCard
              label="Min. i kø (mnd)"
              value={formatNOK(sumMinIQueue)}
              sub="Sum minimum i køen"
              icon={PiggyBank}
              color="#7048E8"
            />
            <StatCard
              label="Snittrente (vektet)"
              value={queueRestSum > 0 ? `${snittrenteVektet.toFixed(1)}%` : '—'}
              sub="Etter restgjeld i kø"
              icon={Percent}
              color="#0CA678"
            />
          </div>
        )}

        {/* Ekstra nedbetaling */}
        {debts.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>
              {readOnly ? 'Ekstra nedbetaling per måned (samlet husholdning)' : 'Ekstra nedbetaling per måned'}
            </h2>
            {readOnly ? (
              <p className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>
                {formatNOK(snowballExtraMonthly)}
              </p>
            ) : (
              <FormattedAmountInput
                value={snowballExtraMonthly}
                onChange={(n) => setSnowballExtraMonthly(n)}
                className="max-w-xs px-3 py-2 rounded-xl text-sm"
                placeholder="0"
                aria-label="Ekstra nedbetaling per måned"
              />
            )}
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {readOnly
                ? 'Summen av alle profilers ekstra beløp.'
                : 'Legges mot fokuslånet i tillegg til minimum på alle i køen (og rullet avdrag).'}
            </p>
          </div>
        )}

        {debts.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center space-y-4"
            style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen gjeld registrert ennå. Legg til lån her eller under Gjeld — det er samme liste.
            </p>
            {!readOnly && showForm && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Fyll ut skjemaet nedenfor. Avbryt lukker skjemaet.
              </p>
            )}
            {!readOnly && !showForm && (
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  <Plus size={16} aria-hidden />
                  Legg til lån
                </button>
                <Link
                  href="/gjeld"
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  Gå til Gjeld
                </Link>
              </div>
            )}
          </div>
        )}

        {debts.length > 0 && queue.length === 0 && (
          <div
            className="rounded-2xl p-6 space-y-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="font-medium" style={{ color: 'var(--text)' }}>
              Ingen lån i nedbetalingskøen akkurat nå
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Huk av «Ta med i snøball» på et lån under Gjeld eller her, eller legg til mindre gjeld. Boliglån er som
              standard utenfor køen.
            </p>
          </div>
        )}

        {queue.length > 0 && (
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
              {effectiveStrategy === 'avalanche' ? 'Avalanche-kø' : 'Snøball-kø'}
            </h2>
            <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--text-muted)' }}>
              {queue.length} lån · {formatNOK(queueRestSum)} restgjeld · {formatNOK(sumMinIQueue)} min./mnd
            </p>
            {focus && snowballExtraMonthly > 0 && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'var(--primary-pale)', color: 'var(--text)' }}>
                <span className="font-medium" style={{ color: 'var(--primary)' }}>
                  {formatNOK(snowballExtraMonthly)}
                </span>{' '}
                ekstra per måned rettes mot <strong>{focus.name}</strong> (i tillegg til minimum{' '}
                {formatNOK(focus.monthlyPayment)}/mnd).
              </p>
            )}
            <ul className="space-y-3">
              {queue.map((debt, index) => {
                const Icon = debtIcons[debt.type]
                const color = debtColors[debt.type]
                const isFocus = focus?.id === debt.id
                return (
                  <li key={debt.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(debt.id)}
                      className="w-full text-left p-4 rounded-xl flex items-start gap-3 transition-opacity hover:opacity-95"
                      style={{
                        background: isFocus ? 'var(--primary-pale)' : 'var(--bg)',
                        border: `1px solid ${isFocus ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                        style={{ background: color + '22', color }}
                      >
                        {index + 1}
                      </span>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: color + '20' }}
                      >
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-medium" style={{ color: 'var(--text)' }}>
                            {debt.name}
                          </span>
                          {isFocus && (
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md"
                              style={{ background: 'var(--primary)', color: 'white' }}
                            >
                              Neste fokus
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {debtTypeLabels[debt.type]} · {debt.interestRate}% · Min. {formatNOK(debt.monthlyPayment)}/mnd
                        </p>
                        <p className="text-sm font-semibold mt-1" style={{ color: 'var(--danger)' }}>
                          {formatNOK(debt.remainingAmount)} restgjeld
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* KPI simulering + graf */}
        {queue.length > 0 && simKpi && chartData.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Totale renter (estimat)"
                value={formatNOK(simKpi.totalInterest)}
                sub={simKpi.totalInterestSub}
                info={simKpi.totalInterestInfo}
                icon={TrendingDown}
                color="#3B5BDB"
              />
              <StatCard
                label="Spart i renter (estimat)"
                value={formatNOK(simKpi.savedInterest)}
                sub={simKpi.savedSub}
                info={simKpi.savedInfo}
                icon={PiggyBank}
                color="#0CA678"
              />
              <StatCard
                label="Gjeldsfri dato (estimat)"
                value={simKpi.debtFreeLabel}
                sub={simKpi.incomplete ? 'Over maks horisont i simulering' : 'Basert på kø og ekstra'}
                icon={Calendar}
                color="#4C6EF5"
              />
              <StatCard
                label="Måneder spart (estimat)"
                value={simKpi.monthsSaved !== null ? String(simKpi.monthsSaved) : '—'}
                sub="Vs. uten ekstra beløp"
                icon={Wallet}
                color="#7048E8"
              />
            </div>

            <div
              className="rounded-2xl p-6 space-y-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                Snøballen vokser – rentene synker
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Veiledende modell.
              </p>
              <div className="h-[320px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={false} axisLine={false} width={0} />
                    <YAxis yAxisId="right" orientation="right" tick={false} axisLine={false} width={0} />
                    <Tooltip
                      formatter={(value, name) => {
                        const v = typeof value === 'number' ? value : Number(value ?? 0)
                        return [formatNOK(v), name === 'snowballBar' ? 'Snøballen' : 'Renter']
                      }}
                      labelStyle={{ color: 'var(--text)' }}
                    />
                    <Legend formatter={(value) => (value === 'snowballBar' ? 'Snøballen' : 'Renter')} />
                    <Bar yAxisId="left" dataKey="snowballBar" fill="#3B5BDB" name="snowballBar" radius={[4, 4, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="interestLine"
                      stroke="#F08C00"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={false}
                      name="interestLine"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {excluded.length > 0 && (
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Ikke med i køen
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Pausede lån, lån uten «ta med i snøball», eller andre som ikke kvalifiserer — fortsatt synlig under Gjeld.
            </p>
            <ul className="space-y-2">
              {excluded.map((debt) => {
                const pauseActive = isDebtPauseActive(debt)
                const notInSnoball = !effectiveIncludeInSnowball(debt)
                return (
                  <li
                    key={debt.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm px-3 py-2 rounded-lg"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <span style={{ color: 'var(--text)' }}>{debt.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {pauseActive
                        ? 'Pause'
                        : notInSnoball
                          ? 'Ikke valgt med i snøball'
                          : 'Utenfor kø'}
                      {' · '}
                      {formatNOK(debt.remainingAmount)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {queue.length > 0 && payoffCompare && (
          <RepaymentPlanPanel
            strategy={payoffCompare.strategy}
            debtFreeLabel={debtFreeLabel(
              payoffCompare.strategy.debtFreeMonthIndex,
              payoffCompare.strategy.incomplete,
            )}
            queueLoanCount={queue.length}
          />
        )}

        {!readOnly && (debts.length > 0 || showForm) && (
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {showForm ? (
              <AddDebtForm
                heading={debts.length === 0 ? 'Legg til gjeld' : 'Legg til lån (tas med i køen)'}
                onSubmit={handleAddDebt}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                <Plus size={16} aria-hidden />
                Legg til lån
              </button>
            )}
          </div>
        )}
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
  )
}
