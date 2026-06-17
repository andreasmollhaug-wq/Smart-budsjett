'use client'

import { useEffect, useRef, useState } from 'react'
import { EhSheet } from './EhSheet'
import { ehPrimaryBtnClass, ehPrimaryBtnStyle, ehSecondaryBtnClass, ehSecondaryBtnStyle } from '../ehUi'

export function EnkelHandlelisteNameSheet({
  open,
  title,
  label,
  defaultValue = '',
  placeholder,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  label: string
  defaultValue?: string
  placeholder?: string
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(defaultValue)
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, defaultValue])

  const submit = () => {
    if (value.trim()) {
      onSubmit(value.trim())
      onClose()
    }
  }

  return (
    <EhSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2.5">
          <button type="button" className={`flex-1 ${ehSecondaryBtnClass}`} style={ehSecondaryBtnStyle} onClick={onClose}>
            Avbryt
          </button>
          <button
            type="button"
            className={`flex-1 ${ehPrimaryBtnClass}`}
            style={ehPrimaryBtnStyle}
            disabled={!value.trim()}
            onClick={submit}
          >
            Lagre
          </button>
        </div>
      }
    >
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="mb-2 min-h-[52px] w-full rounded-2xl border px-4 text-base outline-none transition-shadow focus:ring-2"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text)',
          background: 'var(--bg)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
        }}
      />
    </EhSheet>
  )
}
