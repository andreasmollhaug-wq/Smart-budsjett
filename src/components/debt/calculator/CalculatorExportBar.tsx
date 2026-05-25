'use client'

import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'

type Props = {
  onExportPdf: () => void | Promise<void>
  onExportExcel: () => void | Promise<void>
  pdfLoading?: boolean
  excelLoading?: boolean
  disabled?: boolean
}

export default function CalculatorExportBar({
  onExportPdf,
  onExportExcel,
  pdfLoading = false,
  excelLoading = false,
  disabled = false,
}: Props) {
  const btnClass =
    'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium touch-manipulation border disabled:opacity-40'

  return (
    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
      <button
        type="button"
        disabled={disabled || pdfLoading || excelLoading}
        onClick={() => void onExportPdf()}
        className={`${btnClass} flex-1`}
        style={{
          borderColor: 'var(--border)',
          background: 'var(--primary-pale)',
          color: 'var(--primary)',
        }}
      >
        {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <FileDown className="h-4 w-4 shrink-0" />}
        Eksporter PDF
      </button>
      <button
        type="button"
        disabled={disabled || pdfLoading || excelLoading}
        onClick={() => void onExportExcel()}
        className={`${btnClass} flex-1`}
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
        }}
      >
        {excelLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 shrink-0" />
        )}
        Eksporter Excel
      </button>
    </div>
  )
}
