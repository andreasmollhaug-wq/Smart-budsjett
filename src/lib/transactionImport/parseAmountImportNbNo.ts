/**
 * Tolker beløp fra CSV-import (norsk/Excel).
 *
 * Håndterer vanlige norske tallformater:
 *   - Heltall: «1050», «13 000»
 *   - Desimal med komma: «1050,66», «1 050,66», «1.050,66»
 *   - Tusenskille med mellomrom, NBSP, tynn mellomrom eller punktum
 *
 * Returnerer avrundet positivt heltall (kroner), eller NaN ved ugyldig/tomt/ikke-positivt.
 */
export function parseAmountImportNbNo(raw: string): number {
  let s = raw.trim()
  if (!s) return NaN

  // Fjern vanlige valuta-suffikser/-prefikser
  s = s.replace(/^(NOK|kr)\s*/i, '').replace(/\s*(NOK|kr|,-)$/i, '')
  s = s.trim()
  if (!s) return NaN

  // Avvis negative beløp
  if (s.startsWith('-')) return NaN

  // Fjern alle typer mellomrom brukt som tusenskille (vanlig mellomrom, NBSP, tynn mellomrom)
  s = s.replace(/[\s\u00a0\u202f]/g, '')

  // Norsk tolkningsregel: komma = desimaltegn, punktum = tusenskille.
  // Hvis strengen inneholder komma med 1–3 sifre bak → komma er desimal.
  const commaMatch = /^([^,]*),(\d{1,3})$/.exec(s)
  if (commaMatch) {
    const intPart = commaMatch[1]!.replace(/\./g, '')
    const decPart = commaMatch[2]!
    s = intPart + '.' + decPart
  } else {
    // Ingen desimal-komma → fjern punktum som tusenskille
    s = s.replace(/\./g, '')
  }

  // Kun sifre og evt. ett desimalpunktum (internalisert) tillatt
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN

  const n = Math.round(Number(s))
  if (!Number.isFinite(n) || n <= 0) return NaN
  return n
}
