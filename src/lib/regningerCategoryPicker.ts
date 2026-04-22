import type { BudgetCategory } from '@/lib/store'

/**
 * Normaliserer navn for enkel sammenligning (små bokstaver, fjern diakritiske tegn).
 */
export function normalizeCategoryNameForMatch(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/**
 * Lavere tall = høyere prioritet i nedtrekk. Kategorier som ikke treffer noen nøkkel får samme «rest»-nivå.
 */
const PRIORITY_KEYWORDS: readonly string[] = [
  'streaming',
  'stream',
  'abonnement',
  'medlemskap',
  'tv',
  'mobil',
  'musikk',
  'nett',
]

function priorityRank(normalizedName: string): number {
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    const k = PRIORITY_KEYWORDS[i]!
    if (normalizedName.includes(k)) return i
  }
  return PRIORITY_KEYWORDS.length
}

/**
 * Sorterer Regninger-linjer for «Bruk eksisterende linje» på abonnement-siden:
 * abonnement/streaming-lignende navn først, deretter alfabetisk.
 */
export function sortRegningerCategoriesForSubscriptionPicker(
  categories: BudgetCategory[],
): BudgetCategory[] {
  return [...categories].sort((a, b) => {
    const na = normalizeCategoryNameForMatch(a.name)
    const nb = normalizeCategoryNameForMatch(b.name)
    const ra = priorityRank(na)
    const rb = priorityRank(nb)
    if (ra !== rb) return ra - rb
    return a.name.localeCompare(b.name, 'nb', { sensitivity: 'base' })
  })
}

function isStreamingBucket(normalizedName: string): boolean {
  if (normalizedName.includes('streaming')) return true
  if (normalizedName.includes('stream')) return true
  return false
}

function isAbonnementBucket(normalizedName: string): boolean {
  return normalizedName.includes('abonnement')
}

/** F.eks. trening, forening — navn uten «medlemskap» må velges manuelt eller opprettes via «Medlemskap (legges til)». */
function isMedlemskapBucket(normalizedName: string): boolean {
  return normalizedName.includes('medlemskap')
}

export type SubscriptionSharedLinePartition = {
  streaming: BudgetCategory[]
  abonnement: BudgetCategory[]
  medlemskap: BudgetCategory[]
}

/**
 * Kun for «Bruk eksisterende linje» på abonnement-siden: deler Regninger-linjer i Streaming, Abonnementer og Medlemskap.
 * Øvrige linjer (husleie, strøm, …) vises ikke her.
 */
export function partitionRegningerForSubscriptionSharedLine(
  categories: BudgetCategory[],
): SubscriptionSharedLinePartition {
  const streaming: BudgetCategory[] = []
  const abonnement: BudgetCategory[] = []
  const medlemskap: BudgetCategory[] = []
  for (const c of categories) {
    const n = normalizeCategoryNameForMatch(c.name)
    if (isStreamingBucket(n)) {
      streaming.push(c)
    } else if (isAbonnementBucket(n)) {
      abonnement.push(c)
    } else if (isMedlemskapBucket(n)) {
      medlemskap.push(c)
    }
  }
  return {
    streaming: sortRegningerCategoriesForSubscriptionPicker(streaming),
    abonnement: sortRegningerCategoriesForSubscriptionPicker(abonnement),
    medlemskap: sortRegningerCategoriesForSubscriptionPicker(medlemskap),
  }
}

/**
 * Hvis brukeren allerede har valgt en Regninger-linje som ikke er streaming/abonnement/medlemskap (eldre data),
 * vis den som ekstra valg slik at verdien ikke «forsvinner» i nedtrekket.
 */
export function subscriptionSharedLineLegacyCategory(
  allRegningerOptions: BudgetCategory[],
  partition: SubscriptionSharedLinePartition,
  selectedCategoryId: string,
): BudgetCategory | undefined {
  if (!selectedCategoryId.trim()) return undefined
  const inPartition = new Set(
    [...partition.streaming, ...partition.abonnement, ...partition.medlemskap].map((c) => c.id),
  )
  if (inPartition.has(selectedCategoryId)) return undefined
  return allRegningerOptions.find((c) => c.id === selectedCategoryId)
}
