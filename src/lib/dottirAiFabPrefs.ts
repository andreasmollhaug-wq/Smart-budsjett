const STORAGE_KEY = 'smart-budsjett-dottir-ai-fab-prefs-v1'

export type DottirAiFabPrefs = {
  /** Permanent skjult til bruker slår på i innstillinger */
  hidden: boolean
  /** ISO-dato (YYYY-MM-DD) — skjult til og med denne dagen */
  hiddenUntil: string | null
}

const DEFAULT_PREFS: DottirAiFabPrefs = {
  hidden: false,
  hiddenUntil: null,
}

export function readDottirAiFabPrefs(): DottirAiFabPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const data = JSON.parse(raw) as Partial<DottirAiFabPrefs>
    return {
      hidden: Boolean(data.hidden),
      hiddenUntil: typeof data.hiddenUntil === 'string' ? data.hiddenUntil : null,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function writeDottirAiFabPrefs(prefs: DottirAiFabPrefs): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

export function osloDateString(d = new Date()): string {
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' })
}

export function tomorrowOsloDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return osloDateString(d)
}

/** FAB skal vises når ikke permanent skjult og hiddenUntil er passert. */
export function isDottirAiFabVisible(prefs: DottirAiFabPrefs, today = osloDateString()): boolean {
  if (!prefs.hidden && !prefs.hiddenUntil) return true
  if (prefs.hiddenUntil && prefs.hiddenUntil < today) {
    return !prefs.hidden
  }
  if (prefs.hiddenUntil && prefs.hiddenUntil >= today) return false
  return !prefs.hidden
}

export function hideFabUntilTomorrow(): DottirAiFabPrefs {
  const prefs = { hidden: false, hiddenUntil: tomorrowOsloDateString() }
  writeDottirAiFabPrefs(prefs)
  return prefs
}

export function hideFabUntilEnabled(): DottirAiFabPrefs {
  const prefs = { hidden: true, hiddenUntil: null }
  writeDottirAiFabPrefs(prefs)
  return prefs
}

export function showFab(): DottirAiFabPrefs {
  const prefs = { hidden: false, hiddenUntil: null }
  writeDottirAiFabPrefs(prefs)
  return prefs
}
