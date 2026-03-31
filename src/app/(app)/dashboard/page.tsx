'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAppUser } from '@/components/app/AppUserContext'
import { useActivePersonFinance } from '@/lib/store'
import { formatNOK } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard, ChevronRight } from 'lucide-react'
import DashboardInvestmentsModal from '@/components/dashboard/DashboardInvestmentsModal'
import DashboardSavingsGoalsModal from '@/components/dashboard/DashboardSavingsGoalsModal'

const DashboardIncomeExpenseChart = dynamic(
  () => import('@/components/dashboard/DashboardIncomeExpenseChart'),
  {
    loading: () => (
      <div className="h-[220px] w-full animate-pulse rounded-xl" style={{ background: 'var(--bg)' }} />
    ),
  },
)

function welcomeTitle(displayName: string, isFirstAppState: boolean): string {
  const base = isFirstAppState ? 'Velkommen' : 'Velkommen tilbake'
  const name = displayName.trim()
  return name ? `${base}, ${name}` : base
}

export default function DashboardPage() {
  const { displayName, isFirstAppState } = useAppUser()
  const { budgetCategories, savingsGoals, debts, investments, transactions, isHouseholdAggregate } =
    useActivePersonFinance()

  const [investmentsModalOpen, setInvestmentsModalOpen] = useState(false)
  const [savingsModalOpen, setSavingsModalOpen] = useState(false)

  const totalIncome = budgetCategories.filter((c) => c.type === 'income').reduce((a, b) => a + b.spent, 0)
  const totalExpenses = budgetCategories.filter((c) => c.type === 'expense').reduce((a, b) => a + b.spent, 0)
  const totalDebt = debts.reduce((a, b) => a + b.remainingAmount, 0)
  const totalInvested = investments.reduce((a, b) => a + b.currentValue, 0)
  const totalSaved = savingsGoals.reduce((a, b) => a + b.currentAmount, 0)

  const portfolio = useMemo(() => {
    const totalPurchase = investments.reduce((a, b) => a + b.purchaseValue, 0)
    const totalGain = investments.reduce((a, b) => a + (b.currentValue - b.purchaseValue), 0)
    const gainPct = totalPurchase !== 0 ? (totalGain / totalPurchase) * 100 : 0
    return { totalPurchase, totalGain, gainPct }
  }, [investments])

  const topExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10),
    [transactions],
  )

  const invGainUp = portfolio.totalGain >= 0

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title={welcomeTitle(displayName, isFirstAppState)}
        subtitle={
          isHouseholdAggregate
            ? 'Oversikt · Samlet husholdning — alle profiler'
            : 'Oversikt · Din økonomiske oversikt i dag'
        }
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Månedsinntekt"
            value={formatNOK(totalIncome)}
            sub="Denne måneden"
            icon={Wallet}
            trend="up"
            color="#3B5BDB"
          />
          <StatCard
            label="Månedlige utgifter"
            value={formatNOK(totalExpenses)}
            sub="Denne måneden"
            icon={TrendingDown}
            trend="down"
            color="#E03131"
          />
          <StatCard label="Total gjeld" value={formatNOK(totalDebt)} sub="Alle lån samlet" icon={CreditCard} color="#F08C00" />
          <StatCard
            label="Investeringer"
            value={formatNOK(totalInvested)}
            sub="Markedsverdi i dag"
            icon={TrendingUp}
            trend="up"
            color="#0CA678"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="lg:col-span-2 rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Inntekt vs. utgifter (6 mnd)
            </h2>
            <DashboardIncomeExpenseChart />
          </div>

          <div className="rounded-2xl p-6 flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Topp 10 utgifter
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Største registrerte utgifter
            </p>
            {topExpenses.length === 0 ? (
              <p className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
                Ingen utgifter registrert ennå.
              </p>
            ) : (
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto max-h-[280px]">
                {topExpenses.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-2 rounded-xl p-3"
                    style={{ background: 'var(--bg)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                        {tx.description}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {tx.category} • {tx.date}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0" style={{ color: 'var(--danger)' }}>
                      -{formatNOK(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/transaksjoner"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg"
              style={{ color: 'var(--primary)' }}
            >
              Se alle transaksjoner
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setInvestmentsModalOpen(true)}
            className="rounded-2xl p-6 text-left outline-none transition-opacity hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                  Investeringer
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {investments.length === 0
                    ? 'Ingen posisjoner'
                    : `${investments.length} ${investments.length === 1 ? 'posisjon' : 'posisjoner'}`}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#0CA67820' }}
              >
                <TrendingUp size={20} style={{ color: '#0CA678' }} />
              </div>
            </div>
            <p className="text-2xl font-bold mt-4" style={{ color: 'var(--text)' }}>
              {formatNOK(totalInvested)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Markedsverdi samlet
            </p>
            {investments.length > 0 && (
              <p className="text-sm mt-3 font-medium" style={{ color: invGainUp ? 'var(--success)' : 'var(--danger)' }}>
                {invGainUp ? '+' : ''}
                {formatNOK(portfolio.totalGain)} ({invGainUp ? '+' : ''}
                {portfolio.gainPct.toFixed(1)}%)
              </p>
            )}
            <p className="text-sm mt-4 font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              Se detaljer
              <ChevronRight size={16} />
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSavingsModalOpen(true)}
            className="rounded-2xl p-6 text-left outline-none transition-opacity hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                  Sparemål
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {savingsGoals.length === 0
                    ? 'Ingen mål'
                    : `${savingsGoals.length} ${savingsGoals.length === 1 ? 'mål' : 'mål'}`}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--primary-pale)' }}
              >
                <PiggyBank size={20} style={{ color: 'var(--primary)' }} />
              </div>
            </div>
            <p className="text-2xl font-bold mt-4" style={{ color: 'var(--text)' }}>
              {formatNOK(totalSaved)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Spart totalt
            </p>
            <p className="text-sm mt-4 font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              Se detaljer
              <ChevronRight size={16} />
            </p>
          </button>
        </div>
      </div>

      <DashboardInvestmentsModal
        open={investmentsModalOpen}
        onClose={() => setInvestmentsModalOpen(false)}
        investments={investments}
      />
      <DashboardSavingsGoalsModal
        open={savingsModalOpen}
        onClose={() => setSavingsModalOpen(false)}
        savingsGoals={savingsGoals}
      />
    </div>
  )
}
