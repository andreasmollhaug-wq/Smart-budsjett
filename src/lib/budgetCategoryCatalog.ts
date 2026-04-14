export type ParentCategory = 'inntekter' | 'regninger' | 'utgifter' | 'gjeld' | 'sparing'

/** Standardkatalog per hovedgruppe (kan skjules av bruker). */
export const DEFAULT_STANDARD_LABELS: Record<ParentCategory, string[]> = {
  inntekter: [
    'Lønn',
    'Bonus',
    'Feriepenger',
    'Freelance / sidearbeid',
    'Leieinntekt',
    'Barnetrygd',
    'NAV / stønad',
    'Pensjon',
    'Utbytte',
    'Annet (inntekt)',
  ],
  regninger: [
    'Husleie',
    'Boliglån (felleskost)',
    'Strøm',
    'Varme / fjernvarme',
    'Internett',
    'Mobilabonnement',
    'TV / streaming',
    'Innboforsikring',
    'Bilforsikring',
    'Reiseforsikring',
    'Livsforsikring',
    'Barnehage / SFO',
    'Skole / studieavgift',
    'Treningsabonnement',
    'Medlemskap',
    'Lisenser (f.eks. programvare)',
    'Kommunale avgifter',
    'Vann / avløp',
    'Renovasjon',
    'Sameie / borettslag',
    'Parkering (fast)',
    'Garasje / lager',
    'Hytte / felles',
    'Bankgebyrer',
    'Annet (regning)',
  ],
  utgifter: [
    'Mat & dagligvarer',
    'Restaurant & takeaway',
    'Kaffe & kantine',
    'Klær & sko',
    'Personlig pleie',
    'Apotek & helse',
    'Kollektivt',
    'Drivstoff',
    'Bompenger',
    'Bil / vedlikehold',
    'Fritid & hobby',
    'Gaver',
    'Ferie & reise',
    'Møbler & interiør',
    'Elektronikk',
    'Barn (klær, leker)',
    'Dyr / veterinær',
    'Gaver & donasjoner',
    'Snacks & kiosk',
    'Bøker & media',
    'Sport & utstyr',
    'Frisør',
    'Annet (utgift)',
  ],
  gjeld: [
    'Boliglån (avdrag)',
    'Billån',
    'Studielån',
    'Kredittkort',
    'Forbrukslån',
    'Kassakreditt',
    'Refinansiering',
    'Leasing',
    'Salgspant',
    'Annet (gjeld)',
  ],
  sparing: [
    'Aksjer',
    'Fond',
    'Krypto',
    'Sparekonto',
    'Pensjonssparing (IPS)',
    'BSU',
    'Nødfond',
    'Feriefond',
  ],
}

export type LabelLists = {
  hiddenBudgetLabels: Record<ParentCategory, string[]>
  customBudgetLabels: Record<ParentCategory, string[]>
}

const emptyRecord = (): Record<ParentCategory, string[]> => ({
  inntekter: [],
  regninger: [],
  utgifter: [],
  gjeld: [],
  sparing: [],
})

export const emptyLabelLists = (): LabelLists => ({
  hiddenBudgetLabels: emptyRecord(),
  customBudgetLabels: emptyRecord(),
})

/** Sortert liste uten duplikater. */
function uniqueSorted(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'nb'),
  )
}

/**
 * Tilgjengelige navn for dropdown: standard minus skjulte, pluss egne.
 * Når `omitExistingLines` er true (standard), filtreres navn som allerede finnes som budsjettlinje bort.
 */
export function getAvailableLabels(
  parent: ParentCategory,
  lists: LabelLists,
  existingCategoryNames: string[],
  options?: { omitExistingLines?: boolean },
): string[] {
  const omitExisting = options?.omitExistingLines !== false
  const standard = DEFAULT_STANDARD_LABELS[parent]
  const hidden = new Set(lists.hiddenBudgetLabels[parent] ?? [])
  const custom = lists.customBudgetLabels[parent] ?? []
  const existing = new Set(existingCategoryNames.map((n) => n.trim()))

  const fromStandard = standard.filter((s) => !hidden.has(s))
  const combined = uniqueSorted([...fromStandard, ...custom])
  if (!omitExisting) return combined
  return combined.filter((name) => !existing.has(name))
}

export function isStandardLabel(parent: ParentCategory, name: string): boolean {
  return DEFAULT_STANDARD_LABELS[parent].includes(name)
}
