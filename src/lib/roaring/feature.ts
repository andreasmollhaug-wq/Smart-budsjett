/** Server-side: Roaring API and routes active. */
export function isRoaringServerEnabled(): boolean {
  const v = process.env.ROARING_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1'
}

/**
 * Eksplisitt lansering av Roaring bankkobling-UI (meny, sider).
 * Av som standard — sett NEXT_PUBLIC_ROARING_UI_LIVE=true for lokal testing.
 */
export function isRoaringBankUiLive(): boolean {
  const uiLive = process.env.NEXT_PUBLIC_ROARING_UI_LIVE?.trim().toLowerCase()
  return uiLive === 'true' || uiLive === '1'
}

/** Client UI: krever UI_LIVE + NEXT_PUBLIC_ROARING_ENABLED; på server også ROARING_ENABLED. */
export function isRoaringPublicEnabled(): boolean {
  if (!isRoaringBankUiLive()) return false
  const v = process.env.NEXT_PUBLIC_ROARING_ENABLED?.trim().toLowerCase()
  const pub = v === 'true' || v === '1'
  if (!pub) return false
  if (typeof window !== 'undefined') return true
  return isRoaringServerEnabled()
}
