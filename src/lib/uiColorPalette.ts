/** Fargepalett for innlogget app (UI + diagrammer som trenger hex). Standard er dagens blå tema. */

export type UiColorPaletteId = 'default' | 'green' | 'rose' | 'dark'

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
]

const CHART: Record<UiColorPaletteId, { primary: string; primaryLight: string }> = {
  default: { primary: '#3B5BDB', primaryLight: '#4C6EF5' },
  green: { primary: '#217346', primaryLight: '#107C41' },
  rose: { primary: '#C2255C', primaryLight: '#E64980' },
  dark: { primary: '#748FFC', primaryLight: '#91A7FF' },
}

export function normalizeUiColorPaletteId(value: unknown): UiColorPaletteId {
  if (value === 'teal') return 'dark'
  if (value === 'green' || value === 'rose' || value === 'dark') return value
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
