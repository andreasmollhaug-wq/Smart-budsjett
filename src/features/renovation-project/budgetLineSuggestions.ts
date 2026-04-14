/**
 * Forslag til navn på budsjettlinjer (f.eks. fag / leverandør).
 * Brukeren kan alltid skrive fritt — dette er kun hurtigvalg og autocomplete.
 */
export const BUDGET_LINE_LABEL_SUGGESTIONS: readonly string[] = [
  'Rørlegger',
  'Elektriker',
  'Snekker',
  'Murer / flislegger',
  'Membran / tetting',
  'Ventilasjon',
  'Riving / container',
  'Maling / tapet',
  'Kjøkkeninnredning',
  'Armaturer',
  'Gulv / parkett',
  'Arkitekt / tegning',
]

/** Unike forslag + eksisterende linjenavn i prosjektet (til datalist). */
export function datalistOptionsForBudgetLines(existingLabels: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const add = (s: string) => {
    const t = s.trim()
    if (!t) return
    const key = t.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(t)
  }
  for (const s of BUDGET_LINE_LABEL_SUGGESTIONS) add(s)
  for (const s of existingLabels) add(s)
  return out
}
