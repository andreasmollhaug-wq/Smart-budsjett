import type { HjemflytProfileMeta } from './types'
import { normalizeHjemflytProfileMeta } from './profileMeta'

/** Minimalt profilskall for rettighetssjekk (matcher PersonProfile i store). */
export type HjemflytProfileRef = {
  id: string
  hjemflyt?: HjemflytProfileMeta
}

/**
 * True når profilen kan administrere HjemFlyt (oppgaver, innstillinger, godkjenning).
 * Kun eksplisitt barneprofil (`kind: 'child'`) er utelatt; hovedprofil og voksne uten meta er admin.
 */
export function canAdministerHjemflyt(profileId: string, profiles: HjemflytProfileRef[]): boolean {
  const p = profiles.find((x) => x.id === profileId)
  if (!p) return false
  const n = normalizeHjemflytProfileMeta(p.id, p.hjemflyt)
  if (n?.kind === 'child') return false
  return true
}
