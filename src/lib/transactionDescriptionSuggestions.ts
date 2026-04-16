/**
 * Unike beskrivelser til HTML datalist på transaksjonssøk.
 * Sortert etter hyppighet (vanlige beskrivelser først), deretter alfabetisk nb ved lik frekvens.
 */
export function uniqueDescriptionsForDatalist(
  rows: { description?: string | null }[],
  opts?: { max?: number },
): string[] {
  const max = opts?.max ?? 400
  const counts = new Map<string, number>()
  const canonical = new Map<string, string>()

  for (const row of rows) {
    const t = (row.description ?? '').trim()
    if (!t) continue
    const key = t.toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (!canonical.has(key)) canonical.set(key, t)
  }

  const keys = [...counts.keys()]
  keys.sort((a, b) => {
    const ca = counts.get(a) ?? 0
    const cb = counts.get(b) ?? 0
    if (cb !== ca) return cb - ca
    return (canonical.get(a) ?? '').localeCompare(canonical.get(b) ?? '', 'nb')
  })

  const out: string[] = []
  for (const k of keys) {
    const c = canonical.get(k)
    if (c) out.push(c)
    if (out.length >= max) break
  }
  return out
}
