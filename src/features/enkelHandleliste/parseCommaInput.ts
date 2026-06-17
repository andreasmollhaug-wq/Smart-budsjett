/** Deler innhold på komma, semikolon eller linjeskift (SMS / iMessage). */
export function splitShoppingInput(raw: string): string[] {
  const parts = raw.split(/[,;\n\r]+/)
  const out: string[] = []
  const seen = new Set<string>()
  for (const p of parts) {
    const t = p.trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

export function capitalizeWords(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

export function formatItemName(name: string, capitalize: boolean): string {
  const t = name.trim().slice(0, 200)
  if (!t) return ''
  return capitalize ? capitalizeWords(t) : t
}

export function findDuplicateNames(
  candidates: string[],
  existingNames: string[],
): string[] {
  const existing = new Set(existingNames.map((n) => n.trim().toLowerCase()))
  return candidates.filter((c) => existing.has(c.trim().toLowerCase()))
}
