import { describe, expect, it } from 'vitest'
import {
  formatNokAxisNoCurrencyDisplay,
  formatNokChartLabelDisplay,
  formatNokCurrencyDisplay,
  formatNokOrDashDisplay,
} from './nokDisplayFormat'

describe('formatNokCurrencyDisplay', () => {
  it('hele kroner når av', () => {
    expect(formatNokCurrencyDisplay(52.35, false)).toMatch(/52/)
    expect(formatNokCurrencyDisplay(52.35, false)).not.toMatch(/35/)
  })
  it('bevarer desimaler når på', () => {
    expect(formatNokCurrencyDisplay(52.35, true)).toMatch(/52/)
    expect(formatNokCurrencyDisplay(52.35, true)).toMatch(/35/)
  })
  it('5 000 heltall uten ,00 når på', () => {
    const s = formatNokCurrencyDisplay(5000, true)
    expect(s).toMatch(/5\s*000|5000/u)
  })
  it('NaN uendelig gir tom', () => {
    expect(formatNokCurrencyDisplay(Number.NaN, true)).toBe('')
  })
})

describe('formatNokOrDashDisplay', () => {
  it('0 og ugyldig gir tankestrek', () => {
    expect(formatNokOrDashDisplay(0, true)).toBe('—')
    expect(formatNokOrDashDisplay(Number.NaN, false)).toBe('—')
  })
})

describe('formatNokChartLabelDisplay', () => {
  it('uten desimaler følger gammel k', () => {
    const a = formatNokChartLabelDisplay(12_000, false)
    const b = formatNokChartLabelDisplay(12_000, true)
    expect(a).toBeTruthy()
    expect(b).toContain('k')
  })
  it('med desimaler: 10k+ kan ha én des i k', () => {
    const s = formatNokChartLabelDisplay(12_350, true)
    expect(s).toMatch(/k/u)
  })
})

describe('formatNokAxisNoCurrencyDisplay', () => {
  it('rund av når desimaler av', () => {
    // nb-NO bruker ofte tynt mellomrom (U+202F) / nbsp (U+00A0) som tusenskille
    expect(formatNokAxisNoCurrencyDisplay(1234.56, false)).toMatch(/1[\s\u00a0\u202f]235/u)
  })
  it('bevarer des når på', () => {
    expect(formatNokAxisNoCurrencyDisplay(1234.5, true)).toContain('5')
  })
})
