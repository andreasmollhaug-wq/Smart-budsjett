import { getActiveRootProjects } from './kpis'
import { projectHasActiveChildren } from './projectHierarchyHelpers'
import type { RenovationProject } from './types'

/**
 * Aktive hovedprosjekter som kan velges som forelder, bortsett fra `projectId`
 * (samme som detaljside: rot-liste minus eget prosjekt).
 */
export function getActiveRootTargetsExcluding(
  projectId: string,
  projects: RenovationProject[],
): RenovationProject[] {
  return getActiveRootProjects(projects).filter((r) => r.id !== projectId)
}

export type AttachRootAsChildBlockReason = 'not_a_root' | 'has_children' | 'no_other_root'

export type AttachRootAsChildAvailability =
  | { ok: true; targetRoots: RenovationProject[] }
  | { ok: false; reason: AttachRootAsChildBlockReason }

/**
 * Samme betingelser som «Koble til hovedprosjekt» på prosjektdetalj:
 * kun rot uten aktive barn, og minst én annen aktiv rot som mål.
 */
export function getAttachRootAsChildAvailability(
  project: RenovationProject,
  projects: RenovationProject[],
): AttachRootAsChildAvailability {
  if (project.parentId) return { ok: false, reason: 'not_a_root' }
  if (projectHasActiveChildren(project.id, projects)) return { ok: false, reason: 'has_children' }
  const targetRoots = getActiveRootTargetsExcluding(project.id, projects)
  if (targetRoots.length === 0) return { ok: false, reason: 'no_other_root' }
  return { ok: true, targetRoots }
}

export function attachRootAsChildBlockedHint(reason: AttachRootAsChildBlockReason): string {
  switch (reason) {
    case 'has_children':
      return 'Kan ikke flyttes under annet hovedprosjekt mens rom finnes — arkiver eller slett rom først.'
    case 'no_other_root':
      return 'Opprett et ekstra hovedprosjekt å flytte til.'
    case 'not_a_root':
      return ''
  }
}

/**
 * Samme som validateSetProjectParent når `newParentId` er satt (ikke null):
 * rom med egne aktive underprosjekter kan ikke bytte hovedprosjekt.
 */
export function childCanReparentToAnotherRoot(
  child: RenovationProject,
  projects: RenovationProject[],
): boolean {
  if (!child.parentId) return false
  if (projectHasActiveChildren(child.id, projects)) return false
  return true
}

export function sortRenovationProjectsByName(a: RenovationProject, b: RenovationProject): number {
  return a.name.localeCompare(b.name, 'nb', { sensitivity: 'base' })
}
