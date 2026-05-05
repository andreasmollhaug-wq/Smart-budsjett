'use client'

import { useCallback, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { parseDnbSbankenCsvText, parseDnbSbankenXlsxBuffer } from '@/lib/bankImport/parseDnbFile'

type Props = {
  onBankParsed: (result: ReturnType<typeof parseDnbSbankenCsvText>, fileName: string) => void
  disabled?: boolean
}

export default function BankTransactionImportDropzone({ onBankParsed, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      const nameLower = file.name.toLowerCase()
      if (nameLower.endsWith('.csv') || file.type === 'text/csv' || file.type.includes('text')) {
        const text = await file.text()
        onBankParsed(parseDnbSbankenCsvText(text), file.name)
        return
      }
      if (
        nameLower.endsWith('.xlsx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        setBusy(true)
        try {
          const buf = await file.arrayBuffer()
          const result = await parseDnbSbankenXlsxBuffer(buf)
          onBankParsed(result, file.name)
        } finally {
          setBusy(false)
        }
        return
      }
    },
    [onBankParsed],
  )

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled || busy) return
      const f = e.dataTransfer.files[0]
      if (f) await processFile(f)
    },
    [disabled, busy, processFile],
  )

  return (
    <div
      className="rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
      style={{
        borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
        background: dragOver ? 'var(--primary-pale)' : 'var(--bg)',
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled && !busy) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <FileUp className="mx-auto mb-3 opacity-70" size={36} style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
        Dra og slipp DNB/Sbanken-fil her
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Excel (.xlsx) fra nettbank, eller CSV lagret med samme kolonner
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="hidden"
        disabled={disabled || busy}
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) await processFile(f)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={disabled || busy}
        className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
        style={{
          background: 'var(--primary)',
          color: 'white',
          opacity: disabled || busy ? 0.5 : 1,
        }}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? 'Leser fil …' : 'Velg fil'}
      </button>
    </div>
  )
}
