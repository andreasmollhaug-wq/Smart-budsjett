import { describe, expect, it } from 'vitest'
import { normalizeUiColorPaletteId } from './uiColorPalette'

describe('normalizeUiColorPaletteId', () => {
  it('returnerer default for ukjente verdier og undefined', () => {
    expect(normalizeUiColorPaletteId(undefined)).toBe('default')
    expect(normalizeUiColorPaletteId('')).toBe('default')
    expect(normalizeUiColorPaletteId('blue')).toBe('default')
    expect(normalizeUiColorPaletteId(1)).toBe('default')
  })

  it('beholder gyldige paletter', () => {
    expect(normalizeUiColorPaletteId('default')).toBe('default')
    expect(normalizeUiColorPaletteId('green')).toBe('green')
    expect(normalizeUiColorPaletteId('rose')).toBe('rose')
    expect(normalizeUiColorPaletteId('dark')).toBe('dark')
    expect(normalizeUiColorPaletteId('sand')).toBe('sand')
  })

  it('mapper fjernede logo-varianter til sand', () => {
    expect(normalizeUiColorPaletteId('fjord')).toBe('sand')
    expect(normalizeUiColorPaletteId('slate')).toBe('sand')
    expect(normalizeUiColorPaletteId('sage')).toBe('sand')
    expect(normalizeUiColorPaletteId('wine')).toBe('sand')
    expect(normalizeUiColorPaletteId('nordic')).toBe('sand')
  })

  it('mapper legacy teal til dark', () => {
    expect(normalizeUiColorPaletteId('teal')).toBe('dark')
  })
})

describe('uiPaletteCssVarsForExport', () => {
  it('returnerer tokens for default, dark og sand', async () => {
    const { uiPaletteCssVarsForExport, ctaGradientForUiPalette } = await import('./uiColorPalette')
    const def = uiPaletteCssVarsForExport('default')
    expect(def['--primary']).toBe('#3B5BDB')
    expect(def['--bg']).toBe('#EEF2FF')

    const dark = uiPaletteCssVarsForExport('dark')
    expect(dark['--text']).toBe('#e9ecef')
    expect(dark['--cta-gradient']).toBe(ctaGradientForUiPalette('dark'))

    const sand = uiPaletteCssVarsForExport('sand')
    expect(sand['--bg']).toBe('#faf7f5')
    expect(sand['--primary']).toBe('#004b6b')
  })
})
