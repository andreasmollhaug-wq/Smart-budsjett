'use client'
import { useState, useEffect, useRef } from 'react'
import { formatNOK, formatThousands } from '@/lib/utils'

type Props = {
  value: number
  onChange: (n: number) => void
  className?: string
}

export default function BudgetAmountCell({ value, onChange, className = '' }: Props) {
  const [editing, setEditing] = useState(false)
  const [display, setDisplay] = useState(value > 0 ? formatThousands(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDisplay(value > 0 ? formatThousands(value) : '')
  }, [value, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\s/g, '')
    if (!/^\d*$/.test(raw)) return
    const formatted = raw ? Number(raw).toLocaleString('nb-NO') : ''
    setDisplay(formatted)
    onChange(raw ? Number(raw) : 0)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`block w-full max-w-[6.5rem] ml-auto text-right text-xs tabular-nums min-h-8 px-1 py-0.5 rounded font-sans border border-transparent hover:border-[var(--border)] transition-colors truncate ${className}`}
        style={{ color: value > 0 ? 'var(--text)' : 'var(--text-muted)' }}
      >
        {value > 0 ? formatNOK(value) : '—'}
      </button>
    )
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={(e) => e.target.select()}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault()
          setEditing(false)
        }
      }}
      className={`w-full max-w-[6.5rem] ml-auto text-right text-xs tabular-nums h-8 px-1.5 py-0.5 rounded font-sans ${className}`}
      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
    />
  )
}
