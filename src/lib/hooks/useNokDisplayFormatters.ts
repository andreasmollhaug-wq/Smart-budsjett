'use client'

import { useCallback, useMemo } from 'react'
import { useStore } from '@/lib/store'
import {
  formatNokAxisNoCurrencyDisplay,
  formatNokChartLabelDisplay,
  formatNokCurrencyDisplay,
  formatNokOrDashDisplay,
} from '@/lib/money/nokDisplayFormat'

/**
 * NOK-formatering basert på `showAmountDecimals` (Min konto / innstillinger).
 * Inntastingsfelter bruker fortsatt pengeparsers, ikke disse, ved redigering.
 */
export function useNokDisplayFormatters() {
  const showAmountDecimals = useStore((s) => s.showAmountDecimals)

  return useMemo(() => {
    return {
      showAmountDecimals,
      formatNOK: (amount: number) => formatNokCurrencyDisplay(amount, showAmountDecimals),
      formatNOKOrDash: (amount: number) => formatNokOrDashDisplay(amount, showAmountDecimals),
      formatNOKChartLabel: (amount: number) => formatNokChartLabelDisplay(amount, showAmountDecimals),
      formatNokAxisNoCurrency: (amount: number) => formatNokAxisNoCurrencyDisplay(amount, showAmountDecimals),
    }
  }, [showAmountDecimals])
}

/** Når du trenger én funksjon i et callback uten at hele objektet skal være dep. */
export function useFormatNOK() {
  const showAmountDecimals = useStore((s) => s.showAmountDecimals)
  return useCallback(
    (amount: number) => formatNokCurrencyDisplay(amount, showAmountDecimals),
    [showAmountDecimals],
  )
}
