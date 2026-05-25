/** Server-side: Neonomics API and routes active. */
export function isNeonomicsServerEnabled(): boolean {
  const v = process.env.NEONOMICS_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1'
}

/**
 * Eksplisitt lansering av bankkobling-UI (meny, sider, varsler).
 * Av som standard — sett NEXT_PUBLIC_NEONOMICS_UI_LIVE=true når funksjonen skal vises på dottir.no.
 */
export function isNeonomicsBankUiLive(): boolean {
  const uiLive = process.env.NEXT_PUBLIC_NEONOMICS_UI_LIVE?.trim().toLowerCase()
  return uiLive === 'true' || uiLive === '1'
}

/** Client UI: krever UI_LIVE + NEXT_PUBLIC_NEONOMICS_ENABLED; på server også NEONOMICS_ENABLED. */
export function isNeonomicsPublicEnabled(): boolean {
  if (!isNeonomicsBankUiLive()) return false
  const v = process.env.NEXT_PUBLIC_NEONOMICS_ENABLED?.trim().toLowerCase()
  const pub = v === 'true' || v === '1'
  if (!pub) return false
  // Browser bundle: NEONOMICS_ENABLED is not exposed — API is still gated server-side.
  if (typeof window !== 'undefined') return true
  return isNeonomicsServerEnabled()
}
