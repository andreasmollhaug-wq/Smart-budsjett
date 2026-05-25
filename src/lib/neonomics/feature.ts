/** Server-side: Neonomics API and routes active. */
export function isNeonomicsServerEnabled(): boolean {
  const v = process.env.NEONOMICS_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1'
}

/** Client UI: NEXT_PUBLIC required; on server also requires NEONOMICS_ENABLED. */
export function isNeonomicsPublicEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_NEONOMICS_ENABLED?.trim().toLowerCase()
  const pub = v === 'true' || v === '1'
  if (!pub) return false
  // Browser bundle: NEONOMICS_ENABLED is not exposed — API is still gated server-side.
  if (typeof window !== 'undefined') return true
  return isNeonomicsServerEnabled()
}
