'use client'

import { formatNOK } from '@/lib/utils'
import type { HouseholdMemberPeriodTotals } from '@/lib/householdDashboardData'

type Props = {
  members: HouseholdMemberPeriodTotals[]
  /** Tettere rader og typografi (f.eks. dashbord-kort). */
  compact?: boolean
}

export default function HouseholdActualsTable({ members, compact }: Props) {
  const cell = compact ? 'py-1.5' : 'py-2'
  const text = compact ? 'text-xs' : 'text-xs sm:text-sm'
  return (
    <div className="overflow-x-auto -mx-0.5 min-w-0">
      <table className={`w-full min-w-[18rem] ${text} border-collapse`}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <th className={`text-left ${cell} pr-2`}>Person</th>
            <th className={`text-right ${cell} px-2 tabular-nums`}>Faktisk inntekt</th>
            <th className={`text-right ${cell} px-2 tabular-nums`}>Faktisk utgift</th>
            <th className={`text-right ${cell} pl-2 tabular-nums`}>Netto</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const net = m.actualIncome - m.actualExpense
            return (
              <tr key={m.profileId} style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                <td className={`${cell} pr-2 font-medium`}>{m.name}</td>
                <td className={`text-right ${cell} px-2 tabular-nums`}>{formatNOK(m.actualIncome)}</td>
                <td className={`text-right ${cell} px-2 tabular-nums`}>{formatNOK(m.actualExpense)}</td>
                <td
                  className={`text-right ${cell} pl-2 tabular-nums font-semibold`}
                  style={{ color: net >= 0 ? '#0CA678' : '#E03131' }}
                >
                  {formatNOK(net)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
