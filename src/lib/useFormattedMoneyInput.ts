'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'
import { formatMoneyAmountWhileTyping } from '@/lib/money/parseNorwegianAmount'
import { caretIndexAfterDigitCount, countDigitsBeforePosition } from '@/lib/utils'

/**
 * Kontrollert beløpsfelt: nb-NO-tusenskille og desimaler mens bruker skriver,
 * uten at markøren hopper til slutten ved hver tastetrykk.
 */
export function useFormattedMoneyInput(
  value: string,
  setValue: (v: string) => void,
): { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void } {
  const caretRef = useRef<number | null>(null)
  const targetRef = useRef<HTMLInputElement | null>(null)

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.target
      targetRef.current = el
      const start = el.selectionStart ?? 0
      const digitsBefore = countDigitsBeforePosition(el.value, start)
      const newVal = formatMoneyAmountWhileTyping(el.value)
      caretRef.current = caretIndexAfterDigitCount(newVal, digitsBefore)
      setValue(newVal)
    },
    [setValue],
  )

  useLayoutEffect(() => {
    const el = targetRef.current
    if (el == null || caretRef.current === null) return
    const pos = Math.min(caretRef.current, value.length)
    try {
      el.setSelectionRange(pos, pos)
    } catch {
      /* ignore */
    }
    caretRef.current = null
    targetRef.current = null
  }, [value])

  return { onChange }
}
