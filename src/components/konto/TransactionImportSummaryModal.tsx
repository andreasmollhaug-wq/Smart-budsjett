'use client'

import Link from 'next/link'
import type { ImportSummary } from '@/lib/transactionImport/summarizeImport'
import { formatIsoDateDdMmYyyy, formatNOK } from '@/lib/utils'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  summary: ImportSummary | null
  skippedCategoryRows: number
  parseErrorCount: number
  duplicateWarningCount: number
  transactionsHref: string
}

export default function TransactionImportSummaryModal({
  open,
  onClose,
  summary,
  skippedCategoryRows,
  parseErrorCount,
  duplicateWarningCount,
  transactionsHref,
}: Props) {
  if (!open || !summary) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-lg min-w-0 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-summary-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
          <h3 id="import-summary-title" className="font-semibold text-lg min-w-0 pr-2" style={{ color: 'var(--text)' }}>
            Import fullført
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg shrink-0 touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>

        <ul className="text-sm space-y-2 mb-4" style={{ color: 'var(--text)' }}>
          <li>
            <strong>{summary.importedCount}</strong> transaksjoner importert
          </li>
          <li>
            Sum beløp: <strong>{formatNOK(summary.totalAmount)}</strong>
          </li>
          {summary.dateMin && summary.dateMax && (
            <li>
              Datoer: {formatIsoDateDdMmYyyy(summary.dateMin)} – {formatIsoDateDdMmYyyy(summary.dateMax)}
            </li>
          )}
          {skippedCategoryRows > 0 && (
            <li style={{ color: 'var(--text-muted)' }}>
              Hoppet over (kategori ikke lagt til / avvist): {skippedCategoryRows} rader
            </li>
          )}
          {parseErrorCount > 0 && (
            <li style={{ color: 'var(--text-muted)' }}>
              Rader med feil i fil (ikke importert): {parseErrorCount}
            </li>
          )}
          {duplicateWarningCount > 0 && (
            <li style={{ color: 'var(--text-muted)' }}>
              Mulige duplikater mot eksisterende transaksjoner: {duplicateWarningCount}
            </li>
          )}
        </ul>

        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Sum per kategori
        </p>
        <div
          className="rounded-xl border text-sm mb-6 min-w-0 overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px]">
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th className="text-left px-3 py-2 font-medium">Kategori</th>
                <th className="text-right px-3 py-2 font-medium">Antall</th>
                <th className="text-right px-3 py-2 font-medium">Sum</th>
              </tr>
            </thead>
            <tbody>
              {summary.byCategory.map((row) => (
                <tr key={row.category} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-3 py-2">{row.category}</td>
                  <td className="px-3 py-2 text-right">{row.count}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNOK(row.sum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium w-full sm:w-auto touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Lukk
          </button>
          <Link
            href={transactionsHref}
            className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium inline-flex items-center justify-center w-full sm:w-auto touch-manipulation"
            style={{ background: 'var(--primary)', color: 'white' }}
            onClick={onClose}
          >
            Gå til transaksjoner
          </Link>
        </div>
      </div>
    </div>
  )
}
