/** Felles formatering av Excel-/CSV-celleverdier til streng for bankimport-grid. */

function formatDdMmYyyyFromDate(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}

function formatDdMmYyyyFromIsoParts(isoYyyyMmDd: string): string {
  const [yStr, mStr, dStr] = isoYyyyMmDd.split('-')
  const y = parseInt(yStr ?? '', 10)
  const m = parseInt(mStr ?? '', 10)
  const d = parseInt(dStr ?? '', 10)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
  return `${d}.${m}.${y}`
}

/** Excel 1900-dato – grovt filter for heltall som kan være serienummer. */
function excelSerialToIsoIfLikely(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1) return null
  const excelEpoch = Date.UTC(1899, 11, 30)
  const ms = excelEpoch + Math.round(serial * 86400000)
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getUTCFullYear()
  if (y < 1990 || y > 2100) return null
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

export function formatBankCellValue(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') {
    if (
      Number.isFinite(value) &&
      value === Math.floor(value) &&
      value > 20000 &&
      value < 120000
    ) {
      const iso = excelSerialToIsoIfLikely(value)
      if (iso) return formatDdMmYyyyFromIsoParts(iso)
    }
    return String(value)
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return formatDdMmYyyyFromDate(value)
  }
  if (typeof value === 'object' && value !== null && 'richText' in value) {
    const rt = (value as { richText: { text: string }[] }).richText
    if (Array.isArray(rt)) return rt.map((r) => r.text).join('').trim()
  }
  if (typeof value === 'object' && value !== null && 'result' in value) {
    return formatBankCellValue((value as { result: unknown }).result)
  }
  return String(value).trim()
}
