/**
 * Fargepaletter for innlogget app (CSS-variabler + diagrammer).
 *
 * **`fjord` … `wine` («Sen kveld») — Premium logofamilie**
 * Alle deler merkevare-aksent `#004B6B` på primærhandlinger (knapper, CTA, viktige lenker).
 * `--primary-light` og diagram-hjelpelinje er **samme** tone for hele familien (ett produkt, flere rom).
 * Variasjon = sidebakgrunn, kort-skygger (`--primary-pale`), rammer og Chrome-gradient — ikke nye aksentfarger.
 * Urelatert til «Klassisk blå», Excel-grønn eller Rose.
 */

export type UiColorPaletteId =
  | 'default'
  | 'green'
  | 'rose'
  | 'dark'
  | 'fjord'
  | 'sand'
  | 'slate'
  | 'sage'
  | 'wine'

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
    id: 'fjord',
    label: 'Fjordblå',
    hint: 'Premium logofamilie — klar referanse (#004B6B på handlingsknapper): mest luft, kald isdis',
  },
  {
    id: 'sand',
    label: 'Sand',
    hint: 'Premium logofamilie — varm, nesten hvit lysflate rundt aksent (#004B6B); ro og overskudd',
  },
  {
    id: 'slate',
    label: 'Skifer',
    hint: 'Premium logofamilie — arkitektonisk kjølig rom; aksent på knapper beholdes #004B6B',
  },
  {
    id: 'sage',
    label: 'Salvie',
    hint: 'Premium logofamilie — myk mint-dugg i flater; samme knappespråk som logo (#004B6B)',
  },
  {
    id: 'wine',
    label: 'Sen kveld',
    hint: 'Premium logofamilie — dypest lysrom og rik sidebar; handlingsfarge uendret #004B6B',
  },
]

/** Graf-linjer for logofamilien: aksent (#004B6B) og éi felles hjelpelinje («premium»: eitt språk). */
const LOGO_CHART_PRIMARY = '#004B6B'
const LOGO_CHART_PRIMARY_LIGHT = '#2499B9'

const CHART: Record<UiColorPaletteId, { primary: string; primaryLight: string }> = {
  default: { primary: '#3B5BDB', primaryLight: '#4C6EF5' },
  green: { primary: '#217346', primaryLight: '#107C41' },
  rose: { primary: '#C2255C', primaryLight: '#E64980' },
  dark: { primary: '#748FFC', primaryLight: '#91A7FF' },
  fjord: { primary: LOGO_CHART_PRIMARY, primaryLight: LOGO_CHART_PRIMARY_LIGHT },
  sand: { primary: LOGO_CHART_PRIMARY, primaryLight: LOGO_CHART_PRIMARY_LIGHT },
  slate: { primary: LOGO_CHART_PRIMARY, primaryLight: LOGO_CHART_PRIMARY_LIGHT },
  sage: { primary: LOGO_CHART_PRIMARY, primaryLight: LOGO_CHART_PRIMARY_LIGHT },
  wine: { primary: LOGO_CHART_PRIMARY, primaryLight: LOGO_CHART_PRIMARY_LIGHT },
}

export function normalizeUiColorPaletteId(value: unknown): UiColorPaletteId {
  if (value === 'teal') return 'dark'
  if (
    value === 'green' ||
    value === 'rose' ||
    value === 'dark' ||
    value === 'fjord' ||
    value === 'sand' ||
    value === 'slate' ||
    value === 'sage' ||
    value === 'wine'
  )
    return value
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
    case 'fjord':
      return 'linear-gradient(135deg, #00334b, #004B6B)'
    case 'sand':
      return 'linear-gradient(135deg, #003f58, #004B6B)'
    case 'slate':
      return 'linear-gradient(135deg, #003045, #004B6B)'
    case 'sage':
      return 'linear-gradient(135deg, #003a4a, #004B6B)'
    case 'wine':
      return 'linear-gradient(135deg, #00161c, #004B6B)'
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
