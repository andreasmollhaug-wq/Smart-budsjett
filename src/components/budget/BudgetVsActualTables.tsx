import Link from 'next/link'
import {
  REPORT_GROUP_LABELS,
  REPORT_GROUP_ORDER,
  type BudgetVsActualRow,
} from '@/lib/bankReportData'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import VariancePctLine from '@/components/budget/VariancePctLine'
import { formatNOK } from '@/lib/utils'

const tableClass = 'w-full text-sm border-collapse'
const thClass = 'text-left py-2 px-3 font-semibold border-b'
const tdClass = 'py-2 px-3 border-b'

function varianceColor(r: BudgetVsActualRow): string {
  if (r.variance === 0) return 'var(--text-muted)'
  if (r.type === 'expense' && r.variance > 0) return 'var(--danger)'
  if (r.type === 'income' && r.variance < 0) return 'var(--danger)'
  return 'var(--success)'
}

export default function BudgetVsActualTables({
  budgetVsByParent,
  linkHrefForCategory,
  onCategorySelect,
  variant = 'default',
}: {
  budgetVsByParent: Record<ParentCategory, BudgetVsActualRow[]>
  /** Når satt, blir kategorinavn lenket til transaksjoner med forhåndsfilter. */
  linkHrefForCategory?: (categoryName: string) => string
  /** Når satt, åpnes modal e.l. i stedet for direktenavigasjon (tar presedens over lenke). */
  onCategorySelect?: (row: BudgetVsActualRow) => void
  /** actual-only: kun kategori + faktisk (transaksjonsoversikt uten budsjett). */
  variant?: 'default' | 'actual-only'
}) {
  const actualOnly = variant === 'actual-only'

  return (
    <div className="space-y-6">
      {REPORT_GROUP_ORDER.map((group) => {
        const rows = budgetVsByParent[group]
        if (!rows.length) return null

        let sumB = 0
        let sumA = 0
        let sumV = 0
        for (const r of rows) {
          sumB += r.budgeted
          sumA += r.actual
          sumV += r.variance
        }

        return (
          <div key={group}>
            <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>
              {REPORT_GROUP_LABELS[group]}
            </h4>
            <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 touch-pan-x lg:overflow-visible">
              <div className="rounded-2xl overflow-hidden w-full max-lg:min-w-[420px] lg:min-w-0" style={{ border: '1px solid var(--border)' }}>
              <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}>
                    <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                      Kategori
                    </th>
                    {!actualOnly ? (
                      <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                        Budsjett
                      </th>
                    ) : null}
                    <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                      Faktisk
                    </th>
                    {!actualOnly ? (
                      <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                        Avvik
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.categoryId}>
                      <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                        {onCategorySelect ? (
                          <button
                            type="button"
                            onClick={() => onCategorySelect(r)}
                            className="font-medium text-left underline underline-offset-2 decoration-[var(--primary)] hover:opacity-90 touch-manipulation min-h-[44px] sm:min-h-0 py-1 -my-1"
                            style={{ color: 'var(--primary)' }}
                          >
                            {r.name}
                          </button>
                        ) : linkHrefForCategory ? (
                          <Link
                            href={linkHrefForCategory(r.name)}
                            className="font-medium underline underline-offset-2 decoration-[var(--primary)] hover:opacity-90"
                            style={{ color: 'var(--primary)' }}
                          >
                            {r.name}
                          </Link>
                        ) : (
                          r.name
                        )}
                      </td>
                      {!actualOnly ? (
                        <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                          {formatNOK(r.budgeted)}
                        </td>
                      ) : null}
                      <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                        {formatNOK(r.actual)}
                      </td>
                      {!actualOnly ? (
                        <td
                          className={`${tdClass} text-right tabular-nums align-top sm:align-middle`}
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <div className="inline-flex flex-col items-end gap-0.5 max-w-[9rem] sm:max-w-none">
                            <span className="font-medium" style={{ color: varianceColor(r) }}>
                              {r.variance > 0 ? '+' : ''}
                              {formatNOK(r.variance)}
                            </span>
                            <VariancePctLine variance={r.variance} budgeted={r.budgeted} />
                          </div>
                        </td>
                      ) : null}
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
                    <td className={tdClass} style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                      Totalt
                    </td>
                    {!actualOnly ? (
                      <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                        {formatNOK(sumB)}
                      </td>
                    ) : null}
                    <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                      {formatNOK(sumA)}
                    </td>
                    {!actualOnly ? (
                      <td className={`${tdClass} text-right tabular-nums align-top sm:align-middle`} style={{ borderColor: 'var(--border)' }}>
                        <div className="inline-flex flex-col items-end gap-0.5 max-w-[9rem] sm:max-w-none">
                          <span
                            style={{
                              color:
                                sumV === 0
                                  ? 'var(--text-muted)'
                                  : group === 'inntekter'
                                    ? sumV >= 0
                                      ? 'var(--success)'
                                      : 'var(--danger)'
                                    : sumV > 0
                                      ? 'var(--danger)'
                                      : 'var(--success)',
                            }}
                          >
                            {sumV > 0 ? '+' : ''}
                            {formatNOK(sumV)}
                          </span>
                          <VariancePctLine variance={sumV} budgeted={sumB} />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
