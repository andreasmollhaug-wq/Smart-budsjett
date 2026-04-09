/**
 * Hold i synk med `version` i package.json.
 * Semver brukes til å avgjøre hvilke kunngjøringer som gjelder denne bygget.
 */
export const APP_VERSION = '0.3.2'

/** Kort visningsnavn i UI (varsler, footer, osv.). */
export const APP_VERSION_LABEL = 'v0.3.2'

export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0)
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da > db ? 1 : -1
  }
  return 0
}
