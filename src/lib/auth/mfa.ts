export type AalLevel = 'aal1' | 'aal2'

export type AalSnapshot = {
  currentLevel: AalLevel | null
  nextLevel: AalLevel | null
}

export const MFA_CHALLENGE_PATH = '/logg-inn/tofaktor'

/** Bruker har MFA aktivert og må verifisere TOTP for denne sesjonen. */
export function needsMfaStepUp(aal: AalSnapshot | null | undefined): boolean {
  if (!aal) return false
  return aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2'
}

export function isMfaChallengePath(pathname: string): boolean {
  return pathname === MFA_CHALLENGE_PATH || pathname.startsWith(`${MFA_CHALLENGE_PATH}/`)
}

/** Paths that must not trigger MFA redirect even when step-up is needed. */
export function isMfaExemptPath(pathname: string, isPublicPath: (p: string) => boolean): boolean {
  if (isPublicPath(pathname)) return true
  if (isMfaChallengePath(pathname)) return true
  if (pathname.startsWith('/tilbakestill-passord')) return true
  if (pathname.startsWith('/glemt-passord')) return true
  return false
}

export function hasVerifiedTotpFactor(
  factors: { totp?: Array<{ status?: string }> } | null | undefined,
): boolean {
  return (factors?.totp ?? []).some((f) => f.status === 'verified')
}

export function getVerifiedTotpFactorId(
  factors: { totp?: Array<{ id: string; status?: string }> } | null | undefined,
): string | null {
  const factor = (factors?.totp ?? []).find((f) => f.status === 'verified')
  return factor?.id ?? null
}
