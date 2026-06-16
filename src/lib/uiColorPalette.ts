/**
 * Fargepaletter for innlogget app (CSS-variabler + diagrammer).
 *
 * **Sand** — merkevarepalett med logo-aksent `#004B6B` på primærhandlinger.
 * Urelatert til «Klassisk blå», Excel-grønn eller Rose.
 */

export type UiColorPaletteId =
  | 'default'
  | 'green'
  | 'rose'
  | 'dark'
  | 'sand'

export type UiColorPaletteOption = {
  id: UiColorPaletteId
  label: string
  hint: string
}

export const UI_COLOR_PALETTE_OPTIONS: UiColorPaletteOption[] = [
  { id: 'default', label: 'Klassisk blå', hint: 'Standard — rolig blått og lavmettet bakgrunn' },
  {
    id: 'green',
    label: 'Excel-grønn',
    hint: 'Mørk kontorgrønn inspirert av Excel — rolig og profesjonell',
  },
  { id: 'rose', label: 'Rose', hint: 'Varm rosa og lavmettet bakgrunn' },
  {
    id: 'dark',
    label: 'Mørk modus',
    hint: 'Mørk bakgrunn og lys tekst — godt for kveldsbruk og OLED-skjermer',
  },
  {
    id: 'sand',
    label: 'Sand',
    hint: 'Dottir merkevare — varm lysflate og logo #004B6B på knapper og CTA',
  },
]

const LOGO_CHART_PRIMARY = '#004B6B'
const LOGO_CHART_PRIMARY_LIGHT = '#2499B9'

const CHART: Record<UiColorPaletteId, { primary: string; primaryLight: string }> = {
  default: { primary: '#3B5BDB', primaryLight: '#4C6EF5' },
  green: { primary: '#217346', primaryLight: '#107C41' },
  rose: { primary: '#C2255C', primaryLight: '#E64980' },
  dark: { primary: '#748FFC', primaryLight: '#91A7FF' },
  sand: { primary: LOGO_CHART_PRIMARY, primaryLight: LOGO_CHART_PRIMARY_LIGHT },
}

/** Fjernede logo-varianter mappes til sand. */
const LEGACY_LOGO_PALETTE_TO_SAND = new Set([
  'fjord',
  'slate',
  'sage',
  'wine',
  'nordic',
])

export function normalizeUiColorPaletteId(value: unknown): UiColorPaletteId {
  if (value === 'teal') return 'dark'
  if (typeof value === 'string' && LEGACY_LOGO_PALETTE_TO_SAND.has(value)) return 'sand'
  if (value === 'green' || value === 'rose' || value === 'dark' || value === 'sand') return value
  return 'default'
}

export function chartColorsForUiPalette(id: UiColorPaletteId): { primary: string; primaryLight: string } {
  return CHART[normalizeUiColorPaletteId(id)]
}

/** Gradient-streng for print/PDF som matcher valgt palett (sidebar bruker `var(--cta-gradient)`). */
export function ctaGradientForUiPalette(id: UiColorPaletteId): string {
  const n = normalizeUiColorPaletteId(id)
  switch (n) {
    case 'green':
      return 'linear-gradient(135deg, #1b5c38, #217346)'
    case 'rose':
      return 'linear-gradient(135deg, #A61E4D, #E64980)'
    case 'dark':
      return 'linear-gradient(135deg, #5c7cfa, #748ffc)'
    case 'sand':
      return 'linear-gradient(135deg, #003f58, #004B6B)'
    default:
      return 'linear-gradient(135deg, #3B5BDB, #4C6EF5)'
  }
}

/** Setter `data-ui-palette` på `<html>`; standard fjerner attributtet slik at `:root` i CSS gjelder. */
export function applyUiPaletteToDocument(id: UiColorPaletteId): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const normalized = normalizeUiColorPaletteId(id)
  if (normalized === 'default') {
    root.removeAttribute('data-ui-palette')
  } else {
    root.setAttribute('data-ui-palette', normalized)
  }
}

export type UiPaletteExportTokens = {
  bg: string
  surface: string
  primary: string
  primaryLight: string
  primaryPale: string
  accent: string
  text: string
  textMuted: string
  border: string
  success: string
  danger: string
  ctaGradient: string
}

const EXPORT_TOKENS: Record<UiColorPaletteId, UiPaletteExportTokens> = {
  default: {
    bg: '#EEF2FF',
    surface: '#FFFFFF',
    primary: '#3B5BDB',
    primaryLight: '#4C6EF5',
    primaryPale: '#E0E7FF',
    accent: '#BAC8FF',
    text: '#1E2B4F',
    textMuted: '#6B7A99',
    border: '#D4DCF7',
    success: '#0CA678',
    danger: '#E03131',
    ctaGradient: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)',
  },
  green: {
    bg: '#f0f4f1',
    surface: '#ffffff',
    primary: '#217346',
    primaryLight: '#107c41',
    primaryPale: '#e3efe8',
    accent: '#6baf8f',
    text: '#1e2e24',
    textMuted: '#5a6b62',
    border: '#c5d9cc',
    success: '#0CA678',
    danger: '#E03131',
    ctaGradient: 'linear-gradient(135deg, #1b5c38, #217346)',
  },
  rose: {
    bg: '#FFF0F6',
    surface: '#FFFFFF',
    primary: '#C2255C',
    primaryLight: '#E64980',
    primaryPale: '#FFDEEB',
    accent: '#FCC2D7',
    text: '#2D1520',
    textMuted: '#8A6178',
    border: '#F4C2D5',
    success: '#0CA678',
    danger: '#E03131',
    ctaGradient: 'linear-gradient(135deg, #A61E4D, #E64980)',
  },
  dark: {
    bg: '#0f1117',
    surface: '#1a1d26',
    primary: '#748ffc',
    primaryLight: '#91a7ff',
    primaryPale: '#2f3650',
    accent: '#5c7cfa',
    text: '#e9ecef',
    textMuted: '#868e96',
    border: '#343a46',
    success: '#0CA678',
    danger: '#E03131',
    ctaGradient: 'linear-gradient(135deg, #5c7cfa, #748ffc)',
  },
  sand: {
    bg: '#faf7f5',
    surface: '#ffffff',
    primary: '#004b6b',
    primaryLight: '#2499b9',
    primaryPale: '#e9f5fa',
    accent: '#5fa4bc',
    text: '#071922',
    textMuted: '#5c6f7a',
    border: '#d0e7f2',
    success: '#0CA678',
    danger: '#E03131',
    ctaGradient: 'linear-gradient(135deg, #003f58, #004b6b)',
  },
}

/** Inline CSS custom properties for PDF/off-screen capture (html2canvas). */
export function uiPaletteCssVarsForExport(id: UiColorPaletteId): Record<string, string> {
  const t = EXPORT_TOKENS[normalizeUiColorPaletteId(id)]
  return {
    '--bg': t.bg,
    '--surface': t.surface,
    '--primary': t.primary,
    '--primary-light': t.primaryLight,
    '--primary-pale': t.primaryPale,
    '--accent': t.accent,
    '--text': t.text,
    '--text-muted': t.textMuted,
    '--border': t.border,
    '--success': t.success,
    '--danger': t.danger,
    '--cta-gradient': t.ctaGradient,
  }
}

export function uiPaletteLabel(id: UiColorPaletteId): string {
  const normalized = normalizeUiColorPaletteId(id)
  return UI_COLOR_PALETTE_OPTIONS.find((o) => o.id === normalized)?.label ?? 'Klassisk blå'
}
