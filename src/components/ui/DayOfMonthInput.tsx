'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { clampBillingDay } from '@/lib/subscriptionTransactions'
import { commitDayOfMonthText } from '@/lib/dayOfMonthInput'

type Props = {
  value: number | undefined
  onCommit: (value: number) => void
  disabled?: boolean
  className?: string
  id?: string
  placeholder?: string
  'aria-label'?: string
}

/**
 * Tallfelt for dag i måneden (1–31) som er redigerbart:
 * - lar brukeren midlertidig tømme feltet mens de skriver
 * - commit/clamp ved blur/Enter
 */
export default function DayOfMonthInput({
  value,
  onCommit,
  disabled,
  className = '',
  id,
  placeholder,
  'aria-label': ariaLabel,
}: Props) {
  const initial = useMemo(() => (value == null ? '' : String(clampBillingDay(value))), [value])
  const [text, setText] = useState<string>(initial)
  const isEditingRef = useRef(false)

  useEffect(() => {
    if (isEditingRef.current) return
    setText(value == null ? '' : String(clampBillingDay(value)))
  }, [value])

  const commit = () => {
    const next = commitDayOfMonthText(text, value)
    setText(next.text)
    onCommit(next.value)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={text}
      onFocus={() => {
        isEditingRef.current = true
      }}
      onChange={(e) => {
        const next = e.target.value.replace(/[^\d]/g, '')
        setText(next)
      }}
      onBlur={() => {
        isEditingRef.current = false
        commit()
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return
        e.currentTarget.blur()
      }}
      className={className}
      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
    />
  )
}

