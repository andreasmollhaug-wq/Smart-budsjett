import Link from 'next/link'
import VariancePctLine from '@/components/budget/VariancePctLine'
import { REPORT_GROUP_LABELS, type BudgetVsActualRow } from '@/lib/bankReportData'
import { formatNOK } from '@/lib/utils'

const tableClass = 'w-full text-sm border-collapse'
const thClass = 'text-left py-2 px-3 font-semibold border-b'
const tdClass = 'py-2 px-3 border-b'

export default function TopExpenseCategoriesTable({
  rows,
  linkHrefForCategory,
}: {
  rows: BudgetVsActualRow[]
  linkHrefForCategory?: (categoryName: string) => string
}) {
  const sorted = [...rows]
    .filter((r) => r.type === 'expense')
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 25)

  if (sorted.length === 0 || sorted.every((r) => r.actual === 0)) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Ingen utgiftsdata i perioden.
      </p>
    )
  }

  let sumActual = 0
  let sumBudgeted = 0
  let sumVariance = 0
  for (const r of sorted) {
    sumActual += r.actual
    sumBudgeted += r.budgeted
    sumVariance += r.variance
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 touch-pan-x lg:overflow-visible">
      <div className="rounded-2xl overflow-hidden w-full max-lg:min-w-[520px] lg:min-w-0" style={{ border: '1px solid var(--border)' }}>
      <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}>
            <th className={thClass} style={{ borderColor: 'var(--border)' }}>
              #
            </th>
            <th className={thClass} style={{ borderColor: 'var(--border)' }}>
              Kategori
            </th>
            <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
              Faktisk
            </th>
            <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
              Budsjett
            </th>
            <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
              Avvik
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={r.categoryId}>
              <td className={`${tdClass} tabular-nums`} style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {i + 1}
              </td>
              <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text)' }}>
                  {linkHrefForCategory ? (
                    <Link
                      href={linkHrefForCategory(r.name)}
                      className="underline underline-offset-2 decoration-[var(--primary)] hover:opacity-90"
                      style={{ color: 'var(--primary)' }}
                    >
                      {r.name}
                    </Link>
                  ) : (
                    r.name
                  )}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {REPORT_GROUP_LABELS[r.parentCategory]}
                </span>
              </td>
              <td className={`${tdClass} text-right tabular-nums font-semibold`} style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                {formatNOK(r.actual)}
              </td>
              <td className={`${tdClass} text-right tabular-nums text-sm`} style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {formatNOK(r.budgeted)}
              </td>
              <td
                className={`${tdClass} text-right tabular-nums align-top sm:align-middle text-sm`}
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="inline-flex flex-col items-end gap-0.5 max-w-[7rem] sm:max-w-none">
                  <span
                    className="font-medium"
                    style={{
                      color:
                        r.variance === 0
                          ? 'var(--text-muted)'
                          : r.variance > 0
                            ? 'var(--danger)'
                            : 'var(--success)',
                    }}
                  >
                    {r.variance > 0 ? '+' : ''}
                    {formatNOK(r.variance)}
                  </span>
                  <VariancePctLine variance={r.variance} budgeted={r.budgeted} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr
            className="font-semibold"
            style={{
              borderTop: '2px solid var(--accent)',
              background: 'var(--primary-pale)',
            }}
          >
            <td className={tdClass} style={{ borderColor: 'var(--border)', color: 'var(--text)' }} colSpan={2}>
              Sum (topp {sorted.length})
            </td>
            <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              {formatNOK(sumActual)}
            </td>
            <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              {formatNOK(sumBudgeted)}
            </td>
            <td className={`${tdClass} text-right tabular-nums align-top sm:align-middle text-sm`} style={{ borderColor: 'var(--border)' }}>
              <div className="inline-flex flex-col items-end gap-0.5 max-w-[7rem] sm:max-w-none">
                <span
                  className="font-medium"
                  style={{
                    color:
                      sumVariance === 0
                        ? 'var(--text-muted)'
                        : sumVariance > 0
                          ? 'var(--danger)'
                          : 'var(--success)',
                  }}
                >
                  {sumVariance > 0 ? '+' : ''}
                  {formatNOK(sumVariance)}
                </span>
                <VariancePctLine variance={sumVariance} budgeted={sumBudgeted} />
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  )
}
