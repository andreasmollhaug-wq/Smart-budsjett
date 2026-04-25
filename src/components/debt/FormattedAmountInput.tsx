'use client'
import { formatMoneyInputFromNumber, parsePositiveMoneyAmount2Decimals } from '@/lib/money/parseNorwegianAmount'
import { useFormattedMoneyInput } from '@/lib/useFormattedMoneyInput'
import { useState, useEffect, useRef } from 'react'

type Props = {
  value: number
  onChange: (n: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}

/** Beløpsfelt med nb-NO (tusenskille og inntil 2 desimaler). Oppdaterer forelder onBlur. */
export default function FormattedAmountInput({
  value,
  onChange,
  placeholder,
  disabled,
  className = '',
  id,
  'aria-label': ariaLabel,
}: Props) {
  const [text, setText] = useState(() => (value > 0 ? formatMoneyInputFromNumber(value) : ''))
  const focusRef = useRef(false)
  const moneyField = useFormattedMoneyInput(text, setText)

  useEffect(() => {
    if (focusRef.current) return
    setText(value > 0 ? formatMoneyInputFromNumber(value) : '')
  }, [value])

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      value={text}
      onChange={moneyField.onChange}
      onFocus={() => {
        focusRef.current = true
      }}
      onBlur={() => {
        focusRef.current = false
        const n = parsePositiveMoneyAmount2Decimals(text)
        if (Number.isFinite(n)) {
          onChange(n)
          setText(formatMoneyInputFromNumber(n))
        } else {
          setText(value > 0 ? formatMoneyInputFromNumber(value) : '')
        }
      }}
      className={className}
      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
    />
  )
}
