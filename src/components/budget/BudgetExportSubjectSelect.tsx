'use client'

import type { BudgetExportSubject } from '@/lib/budgetPlanExport/types'

type Props = {
  value: BudgetExportSubject
  onChange: (value: BudgetExportSubject) => void
  isHouseholdAggregate: boolean
  profiles: { id: string; name: string }[]
  id?: string
  className?: string
}

export default function BudgetExportSubjectSelect({
  value,
  onChange,
  isHouseholdAggregate,
  profiles,
  id = 'budget-export-subject',
  className = '',
}: Props) {
  const showAll = profiles.length > 1
  if (!isHouseholdAggregate && profiles.length <= 1) return null

  return (
    <label
      className={`flex min-w-0 flex-col gap-1 text-sm sm:min-w-[12rem] ${className}`}
      style={{ color: 'var(--text-muted)' }}
    >
      <span>Eksporter for</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as BudgetExportSubject)}
        className="w-full min-h-[44px] min-w-0 rounded-xl px-3 text-sm touch-manipulation"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        aria-label="Velg hvem budsjettplanen gjelder"
      >
        {isHouseholdAggregate ? <option value="household">Husholdning (samlet)</option> : null}
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
        {showAll ? <option value="all">Alle</option> : null}
      </select>
    </label>
  )
}
