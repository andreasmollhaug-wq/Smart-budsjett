'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import Link from 'next/link'

const DEFAULT_HINTS = ['mat', 'dagligvarer', 'mat og drikke', 'daglig']

function findGroceryBudgetLine(
  categories: { name: string; type: string; budgeted: number[] }[],
  monthIndex: number,
  explicitName: string | null,
): { name: string; amount: number } | null {
  if (explicitName?.trim()) {
    const c = categories.find((x) => x.type === 'expense' && x.name.trim() === explicitName.trim())
    if (c) return { name: c.name, amount: c.budgeted[monthIndex] ?? 0 }
  }
  const lower = (s: string) => s.toLowerCase()
  for (const cat of categories) {
    if (cat.type !== 'expense') continue
    const n = lower(cat.name)
    if (DEFAULT_HINTS.some((h) => n.includes(h))) {
      return { name: cat.name, amount: cat.budgeted[monthIndex] ?? 0 }
    }
  }
  return null
}

/**
 * Budsjettbeløp hentes for kalendermåneden til mandagen i `planWeekStart` når den er satt
 * (typisk valgt uke på måltidsplan), ellers inneværende måned. Uke som krysser månedsskille
 * bruker fortsatt mandagens måned — forutsigbart mot ISO-uke.
 */
export default function MatHandlelisteBudgetCard({
  planWeekStart,
  showHandlelisteEstimates,
}: {
  planWeekStart?: Date
  /** På handleliste-siden: forklar at varepriser er test/estimat mot budsjett. */
  showHandlelisteEstimates?: boolean
}) {
  const { formatNOK } = useNokDisplayFormatters()
  const activeProfileId = useStore((s) => s.activeProfileId)
  const financeScope = useStore((s) => s.financeScope)
  const people = useStore((s) => s.people)
  const profiles = useStore((s) => s.profiles)
  const budgetYear = useStore((s) => s.budgetYear)
  const groceryHint = useStore((s) => s.matHandleliste.settings.groceryBudgetCategoryName)

  const anchorDate = planWeekStart ?? new Date()
  const monthIndex = anchorDate.getMonth()
  const budgetMonthLabel = anchorDate.toLocaleDateString('nb-NO', { month: 'long' })
  const anchoredToPlanWeek = planWeekStart != null

  const line = useMemo(() => {
    if (financeScope === 'household') {
      let sum = 0
      let label = 'Mat (samlet husholdning)'
      let found = false
      for (const pr of profiles) {
        const person = people[pr.id]
        if (!person) continue
        const hit = findGroceryBudgetLine(person.budgetCategories, monthIndex, groceryHint)
        if (hit) {
          sum += hit.amount
          label = hit.name
          found = true
        }
      }
      if (!found) return null
      return { name: label, amount: sum }
    }
    const person = people[activeProfileId]
    if (!person) return null
    return findGroceryBudgetLine(person.budgetCategories, monthIndex, groceryHint)
  }, [activeProfileId, financeScope, groceryHint, monthIndex, people, profiles])

  const emptyMonthPhrase = anchoredToPlanWeek
    ? `for ${budgetMonthLabel}`
    : 'for denne måneden'

  if (!line) {
    return (
      <div
        className="rounded-xl border p-4 text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p className="font-medium" style={{ color: 'var(--text)' }}>
          Matbudsjett
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Vi fant ingen åpenbar «mat»-linje i budsjettet {emptyMonthPhrase}. Legg til en utgiftslinje under
          Utgifter (f.eks. «Mat»), eller bruk budsjettsiden som vanlig.
        </p>
        <Link
          href="/budsjett"
          className="mt-2 inline-block text-sm font-medium underline"
          style={{ color: 'var(--primary)' }}
        >
          Gå til budsjett
        </Link>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border p-4 text-sm"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <p className="font-medium" style={{ color: 'var(--text)' }}>
        Matbudsjett for {budgetMonthLabel}
      </p>
      <p className="mt-1 tabular-nums text-lg font-semibold" style={{ color: 'var(--text)' }}>
        {formatNOK(line.amount)}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
        Linje: «{line.name}» · {budgetYear}
      </p>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {showHandlelisteEstimates
          ? 'Priser på handlelisten er veiledende testdata. Matbudsjettet under viser fortsatt plan fra budsjettet — ikke sanntidsbutikkpriser.'
          : 'Handlelisten er ikke koblet til priser ennå — budsjettet viser planen din.'}
      </p>
    </div>
  )
}
