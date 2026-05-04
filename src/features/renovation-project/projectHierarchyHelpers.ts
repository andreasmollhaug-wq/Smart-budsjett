import type { RenovationProject } from './types'

export type ValidateHierarchyResult = { ok: true } | { ok: false; message: string }

/** Alle prosjekter som hører til treet (rot + etterkommere via parentId), inkl. rot. */
export function collectSubtreeProjectIds(rootId: string, projects: RenovationProject[]): Set<string> {
  const set = new Set<string>([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const p of projects) {
      if (p.parentId && set.has(p.parentId) && !set.has(p.id)) {
        set.add(p.id)
        changed = true
      }
    }
  }
  return set
}

export function projectHasActiveChildren(
  projectId: string,
  projects: RenovationProject[],
): boolean {
  return projects.some((p) => p.status === 'active' && p.parentId === projectId)
}

export function validateParentForNewChild(
  parentId: string | undefined,
  projects: RenovationProject[],
): ValidateHierarchyResult {
  if (parentId === undefined || parentId === '') return { ok: true }
  const parent = projects.find((p) => p.id === parentId)
  if (!parent) return { ok: false, message: 'Fant ikke hovedprosjektet.' }
  if (parent.status !== 'active') {
    return { ok: false, message: 'Hovedprosjektet må være aktivt.' }
  }
  if (parent.parentId) {
    return { ok: false, message: 'Du kan bare koble til et hovedprosjekt, ikke et annet rom.' }
  }
  return { ok: true }
}

/** Endre parentId for eksisterende prosjekt (koble fra / til hovedprosjekt). */
export function validateSetProjectParent(
  projectId: string,
  newParentId: string | null,
  projects: RenovationProject[],
): ValidateHierarchyResult {
  const proj = projects.find((p) => p.id === projectId)
  if (!proj) return { ok: false, message: 'Fant ikke prosjektet.' }

  if (newParentId === null) {
    return { ok: true }
  }

  if (newParentId === projectId) {
    return { ok: false, message: 'Et prosjekt kan ikke være sin egen forelder.' }
  }

  const parent = projects.find((p) => p.id === newParentId)
  if (!parent) return { ok: false, message: 'Fant ikke hovedprosjektet.' }
  if (parent.status !== 'active') {
    return { ok: false, message: 'Hovedprosjektet må være aktivt.' }
  }
  if (parent.parentId) {
    return { ok: false, message: 'Du kan bare koble til et hovedprosjekt, ikke et annet rom.' }
  }

  if (projectHasActiveChildren(projectId, projects)) {
    return {
      ok: false,
      message:
        'Prosjekter som allerede har aktive underprosjekter kan ikke kobles til et annet hovedprosjekt. Arkiver eller slett rommene først.',
    }
  }

  return { ok: true }
}
