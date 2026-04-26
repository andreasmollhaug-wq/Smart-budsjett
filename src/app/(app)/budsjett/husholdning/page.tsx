'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BudsjettSubnav from '@/components/budget/BudsjettSubnav'
import HouseholdActualsTable from '@/components/budget/household/HouseholdActualsTable'
import HouseholdIncomeSplit from '@/components/budget/household/HouseholdIncomeSplit'
import StatCard from '@/components/ui/StatCard'
import {
  BUDGET_MONTH_LABELS,
  periodHelpText,
  periodRange,
  periodSubtitle,
  type PeriodMode,
} from '@/lib/budgetPeriod'
import { buildHouseholdPeriodData } from '@/lib/householdDashboardData'
import { useActivePersonFinance, useStore } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { Home, Percent, PiggyBank, Scale, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'

export default function BudsjettHusholdningPage() {
  const { formatNOK } = useNokDisplayFormatters()
  const router = useRouter()
  const {
    transactions,
    budgetYear,
    archivedBudgetsByYear,
    profiles,
    isHouseholdAggregate,
  } = useActivePersonFinance()
  const people = useStore((s) => s.people)

  const [year, setYear] = useState(budgetYear)
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')

  useEffect(() => {
    setYear(budgetYear)
  }, [budgetYear])

  useLayoutEffect(() => {
    if (!isHouseholdAggregate) {
      router.replace('/budsjett')
    }
  }, [isHouseholdAggregate, router])

  const { start, end } = useMemo(() => periodRange(periodMode, monthIndex), [periodMode, monthIndex])

  const { members, summary, hasNoBudgetData } = useMemo(
    () =>
      buildHouseholdPeriodData(
        people,
        archivedBudgetsByYear,
        profiles,
        budgetYear,
        year,
        start,
        end,
        transactions,
      ),
    [people, archivedBudgetsByYear, profiles, budgetYear, year, start, end, transactions],
  )

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    const window = Array.from({ length: 11 }, (_, i) => y - 5 + i)
    const set = new Set<number>([budgetYear, year, ...Object.keys(archivedBudgetsByYear).map(Number), ...window])
    return [...set].sort((a, b) => b - a)
  }, [budgetYear, archivedBudgetsByYear, year])

  const subtitle = periodSubtitle(periodMode, year, monthIndex)
  const helpIngress = periodHelpText(periodMode)
  const kpiSub = `${subtitle} (husholdning)`

  const cardStyle: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
  }

  if (!isHouseholdAggregate) {
    return null
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header title="Budsjett" subtitle={`Husholdning · ${subtitle}`} />
      <BudsjettSubnav />
      <div className="p-4 sm:p-6 lg:px-8 lg:py-8 xl:px-10 space-y-4 sm:space-y-6 flex-1 w-full min-w-0">
        <p
          className="text-xs sm:text-sm lg:hidden rounded-xl px-3 py-2"
          style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          Oversikt over budsjettert fordeling og faktiske beløp per person i husholdningen.
        </p>

        <div className="rounded-2xl p-4 sm:p-6 space-y-4" style={cardStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3">
            <label className="flex flex-col gap-1.5 text-sm w-full sm:w-auto min-w-0" style={{ color: 'var(--text-muted)' }}>
              <span>Periode</span>
              <select
                value={periodMode}
                onChange={(e) => setPeriodMode(e.target.value as PeriodMode)}
                className="w-full sm:w-auto sm:min-w-[11rem] min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="month">Én måned</option>
                <option value="ytd">Hittil i år (YTD)</option>
                <option value="year">Hele året</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm w-full sm:w-auto min-w-0" style={{ color: 'var(--text-muted)' }}>
              <span>År</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full sm:w-auto min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            {periodMode !== 'year' && (
              <label className="flex flex-col gap-1.5 text-sm w-full sm:w-auto min-w-0" style={{ color: 'var(--text-muted)' }}>
                <span>{periodMode === 'ytd' ? 'Til og med måned' : 'Måned'}</span>
                <select
                  value={monthIndex}
                  onChange={(e) => setMonthIndex(Number(e.target.value))}
                  className="w-full sm:w-auto min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  {BUDGET_MONTH_LABELS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            {helpIngress} Budsjett er per person; faktiske beløp følger transaksjoner med eierprofil.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Budsjettert netto (hush.)"
            value={formatNOK(summary.householdBudgetedNet)}
            sub={kpiSub}
            icon={Scale}
            trend={summary.householdBudgetedNet >= 0 ? 'up' : 'down'}
            color={summary.householdBudgetedNet >= 0 ? '#3B5BDB' : '#E03131'}
            info="Budsjettert inntekt minus budsjetterte kostnader (alle utgiftsgrupper inkl. sparing) for valgt periode."
          />
          <StatCard
            label="Faktisk netto (hush.)"
            value={formatNOK(summary.householdActualNet)}
            sub={kpiSub}
            icon={Wallet}
            trend={summary.householdActualNet >= 0 ? 'up' : 'down'}
            color={summary.householdActualNet >= 0 ? '#0CA678' : '#E03131'}
            info="Summert faktisk inntekt minus utgift for alle profiler i perioden."
          />
          <StatCard
            label="Budsjettert sparing"
            value={formatNOK(summary.householdBudgetedSparing)}
            sub={kpiSub}
            icon={PiggyBank}
            trend="up"
            color="#0CA678"
            info="Sum av linjer under «Sparing» i budsjettet for perioden."
          />
          <StatCard
            label="Andel til sparing (plan)"
            value={
              summary.savingRatePctBudgeted !== null
                ? `${summary.savingRatePctBudgeted.toFixed(1)} %`
                : '–'
            }
            sub={kpiSub}
            icon={Percent}
            trend={summary.savingRatePctBudgeted !== null && summary.savingRatePctBudgeted > 0 ? 'up' : undefined}
            color="#868E96"
            info="Hvor stor del av budsjettert inntekt som er satt av til «Sparing» i budsjettet (plan). Dette er ikke faktisk sparing fra transaksjoner — se kortet «Budsjettert sparing» og transaksjonslisten for det."
          />
        </div>

        {hasNoBudgetData && (
          <div
            className="rounded-2xl p-4 sm:p-5 text-sm"
            style={{ ...cardStyle, color: 'var(--text-muted)' }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>
              Ingen budsjett for {year}
            </p>
            <p>
              Det finnes ikke budsjettlinjer for dette året for noen i husholdningen. Velg aktivt budsjettår{' '}
              <strong>{budgetYear}</strong> eller et år du har arkivert. Faktiske transaksjoner vises fortsatt per
              person.
            </p>
          </div>
        )}

        <div
          className="rounded-2xl p-3 sm:p-4 space-y-2 w-full max-w-[min(100%,17.5rem)] mr-auto min-w-0"
          style={cardStyle}
        >
          <div className="flex items-start gap-2 min-w-0">
            <Home className="shrink-0 mt-0.5" size={18} style={{ color: 'var(--primary)' }} aria-hidden />
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                Budsjett: inntekt per person
              </h2>
              <p className="text-xs sm:text-sm mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
                Fordeling av budsjettert inntekt — andeler summerer til 100 % når det er inntekt i perioden.
              </p>
            </div>
          </div>
          <HouseholdIncomeSplit members={members} />
        </div>

        <div
          className="rounded-2xl p-3 sm:p-4 space-y-2 w-full max-w-[min(100%,22.5rem)] mr-auto min-w-0"
          style={cardStyle}
        >
          <div className="flex items-start gap-2 min-w-0">
            <Wallet className="shrink-0 mt-0.5" size={18} style={{ color: 'var(--primary)' }} aria-hidden />
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                Faktisk inntekt og utgift per person
              </h2>
              <p className="text-xs sm:text-sm mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
                {helpIngress} Basert på transaksjoner tilknyttet hver profil.
              </p>
            </div>
          </div>
          <HouseholdActualsTable members={members} />
        </div>
      </div>
    </div>
  )
}
