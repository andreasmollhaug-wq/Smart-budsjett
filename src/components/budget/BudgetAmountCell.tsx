'use client'
import { useCallback, useState, useEffect, useRef } from 'react'
import { formatMoneyInputFromNumber, parsePositiveMoneyAmount2Decimals } from '@/lib/money/parseNorwegianAmount'
import { useFormattedMoneyInput } from '@/lib/useFormattedMoneyInput'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

type Props = {
  value: number
  onChange: (n: number) => void
  className?: string
  /** Når sann: vis beløp uten redigering (f.eks. linje styrt fra Abonnementer). */
  readOnly?: boolean
}

function displayForStored(value: number): string {
  return Number.isFinite(value) && value !== 0 ? formatMoneyInputFromNumber(value) : ''
}

export default function BudgetAmountCell({ value, onChange, className = '', readOnly = false }: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const [editing, setEditing] = useState(false)
  const [display, setDisplay] = useState(displayForStored(value))
  const inputRef = useRef<HTMLInputElement>(null)

  const setDisplayStr = useCallback((v: string) => {
    setDisplay(v)
  }, [])
  const displayMoney = useFormattedMoneyInput(display, setDisplayStr)

  useEffect(() => {
    if (!editing) setDisplay(displayForStored(value))
  }, [value, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const applyBlur = () => {
    const n = parsePositiveMoneyAmount2Decimals(display)
    if (Number.isFinite(n)) {
      onChange(n)
      setDisplay(formatMoneyInputFromNumber(n))
    } else {
      setDisplay(displayForStored(value))
    }
    setEditing(false)
  }

  if (readOnly) {
    return (
      <span
        className={`block w-full max-w-[6.5rem] ml-auto text-right text-xs tabular-nums min-h-8 px-2 pr-2.5 py-0.5 rounded font-sans ${className}`}
        style={{
          color: Number.isFinite(value) && value !== 0 ? 'var(--text)' : 'var(--text-muted)',
        }}
      >
        {Number.isFinite(value) && value !== 0 ? formatNOK(value) : '—'}
      </span>
    )
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`block w-full max-w-[6.5rem] ml-auto text-right text-xs tabular-nums min-h-8 px-2 pr-2.5 py-0.5 rounded font-sans border border-transparent hover:border-[var(--border)] transition-colors truncate ${className}`}
        style={{
          color: Number.isFinite(value) && value !== 0 ? 'var(--text)' : 'var(--text-muted)',
        }}
      >
        {Number.isFinite(value) && value !== 0 ? formatNOK(value) : '—'}
      </button>
    )
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={displayMoney.onChange}
      onFocus={(e) => e.target.select()}
      onBlur={applyBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          void inputRef.current?.blur()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          setDisplay(displayForStored(value))
          setEditing(false)
        }
      }}
      className={`w-full max-w-[6.5rem] ml-auto text-right text-xs tabular-nums h-8 px-2 pr-2.5 py-0.5 rounded font-sans ${className}`}
      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
    />
  )
}
