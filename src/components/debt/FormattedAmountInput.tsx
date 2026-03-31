'use client'
import { parseThousands } from '@/lib/utils'

type Props = {
  value: number
  onChange: (n: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}

/** Beløpsfelt med nb-NO tusenskille (tekstfelt, ikke type="number"). */
export default function FormattedAmountInput({
  value,
  onChange,
  placeholder,
  disabled,
  className = '',
  id,
  'aria-label': ariaLabel,
}: Props) {
  const display = value > 0 ? Number(value).toLocaleString('nb-NO') : ''

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      value={display}
      onChange={(e) => onChange(parseThousands(e.target.value))}
      className={className}
      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
    />
  )
}
