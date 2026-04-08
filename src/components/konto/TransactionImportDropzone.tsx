'use client'

import { useCallback, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'

type Props = {
  onFileText: (text: string, fileName: string) => void
  disabled?: boolean
}

export default function TransactionImportDropzone({ onFileText, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const readFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && !file.type.includes('text')) {
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : ''
        onFileText(text, file.name)
      }
      reader.readAsText(file, 'UTF-8')
    },
    [onFileText],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled) return
      const f = e.dataTransfer.files[0]
      if (f) readFile(f)
    },
    [disabled, readFile],
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
        if (!disabled) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <FileUp className="mx-auto mb-3 opacity-70" size={36} style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
        Dra og slipp CSV-fil her
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        eller velg fil fra datamaskinen
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) readFile(f)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={disabled}
        className="rounded-xl px-4 py-2 text-sm font-medium"
        style={{
          background: 'var(--primary)',
          color: 'white',
          opacity: disabled ? 0.5 : 1,
        }}
        onClick={() => inputRef.current?.click()}
      >
        Velg fil
      </button>
    </div>
  )
}
