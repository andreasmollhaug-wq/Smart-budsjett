'use client'

import { useMemo } from 'react'
import { buildBudgetSetupChecklist } from '@/lib/budgetSetupChecklist'
import type { DottirAiUserSnapshot } from '@/lib/dottirAiRouteSuggestions'
import { useStore } from '@/lib/store'

function yearTotal(budgeted: unknown): number {
  if (!Array.isArray(budgeted)) return 0
  return budgeted.reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0)
}

function countForProfiles(
  people: Record<
    string,
    {
      transactions: unknown[]
      debts: unknown[]
      savingsGoals: unknown[]
      budgetCategories: { budgeted: unknown }[]
      serviceSubscriptions: unknown[]
      investments: unknown[]
    }
  >,
  profileIds: string[],
) {
  let transactionCount = 0
  let debtCount = 0
  let savingsGoalCount = 0
  let budgetLinesWithAmount = 0
  let serviceSubscriptionCount = 0
  let investmentCount = 0

  for (const id of profileIds) {
    const p = people[id]
    if (!p) continue
    transactionCount += p.transactions?.length ?? 0
    debtCount += p.debts?.length ?? 0
    savingsGoalCount += p.savingsGoals?.length ?? 0
    serviceSubscriptionCount += p.serviceSubscriptions?.length ?? 0
    investmentCount += p.investments?.length ?? 0
    for (const cat of p.budgetCategories ?? []) {
      if (yearTotal(cat.budgeted) > 0) budgetLinesWithAmount += 1
    }
  }

  return {
    transactionCount,
    debtCount,
    savingsGoalCount,
    budgetLinesWithAmount,
    serviceSubscriptionCount,
    investmentCount,
  }
}

export function useDottirAiUserSnapshot(): DottirAiUserSnapshot {
  const people = useStore((s) => s.people)
  const profiles = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const financeScope = useStore((s) => s.financeScope)
  const subscriptionPlan = useStore((s) => s.subscriptionPlan)
  const budgetYear = useStore((s) => s.budgetYear)
  const onboardingStatus = useStore((s) => s.onboarding.status)
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const budgetSetupOverridesByYear = useStore(
    (s) => s.people[s.activeProfileId]?.budgetSetupOverridesByYear,
  )
  const activeBudgetCategories = useStore(
    (s) => s.people[s.activeProfileId]?.budgetCategories ?? [],
  )

  const isHouseholdAggregate =
    financeScope === 'household' && subscriptionPlan === 'family' && profiles.length >= 2

  return useMemo(() => {
    const profileIds = isHouseholdAggregate ? profiles.map((p) => p.id) : [activeProfileId]

    const counts = countForProfiles(people, profileIds)

    const checklist = buildBudgetSetupChecklist({
      budgetCategories: isHouseholdAggregate
        ? profiles.flatMap((p) => people[p.id]?.budgetCategories ?? [])
        : activeBudgetCategories,
      budgetYear,
      overridesByYear: isHouseholdAggregate ? undefined : budgetSetupOverridesByYear,
    })
    const checklistOpenCount = checklist.filter((item) => !item.done).length

    return {
      ...counts,
      checklistOpenCount,
      onboardingStatus,
      demoDataEnabled,
      isHouseholdAggregate,
    }
  }, [
    isHouseholdAggregate,
    profiles,
    activeProfileId,
    people,
    budgetYear,
    activeBudgetCategories,
    budgetSetupOverridesByYear,
    onboardingStatus,
    demoDataEnabled,
  ])
}
