'use client'

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { X } from 'lucide-react'
import { useRenovationProjectStore } from './renovationProjectStore'
import { getActiveChildProjects, getActiveRootProjects } from './kpis'
import type { RenovationProject } from './types'
import RenovationModalFrame, {
  renovationModalFooterClass,
  renovationModalScrollableMainClass,
  renovationModalScrollbarSafeBottom,
} from './RenovationModalFrame'
import RenovationCreateMainProjectForm from './RenovationCreateMainProjectForm'
import {
  attachRootAsChildBlockedHint,
  childCanReparentToAnotherRoot,
  getActiveRootTargetsExcluding,
  getAttachRootAsChildAvailability,
  sortRenovationProjectsByName,
} from './renovationHierarchyUi'

const ORGANIZE_TITLE_ID = 'renovation-organize-projects-modal-title'
const CREATE_MAIN_TITLE_ID = 'renovation-organize-create-main-title'

type Panel = 'organize' | 'createMain'

type Props = {
  open: boolean
  onClose: () => void
  /** Scroll til denne seksjonen når modalen åpnes (prosjekt-id). */
  initialScrollToProjectId?: string
}

function scrollToOrganizeSectionWithCleanup(projectId: string): () => void {
  const elId = `renovation-organize-section-${projectId}`
  const scrollToSection = () =>
    document.getElementById(elId)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  const timeoutIds = new Set<number>()
  timeoutIds.add(
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        scrollToSection()
        timeoutIds.add(window.setTimeout(scrollToSection, 120))
      })
    }, 50),
  )
  return () => {
    timeoutIds.forEach((id) => clearTimeout(id))
  }
}

/** Scroll til prosjektseksjon etter opprett (ingen cleanup nødvendig — kort kjøring). */
function scrollOrganizeSectionIntoView(projectId: string) {
  const elId = `renovation-organize-section-${projectId}`
  const scrollToSection = () =>
    document.getElementById(elId)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  window.setTimeout(() => {
    requestAnimationFrame(() => {
      scrollToSection()
      window.setTimeout(scrollToSection, 120)
    })
  }, 50)
}

export default function RenovationOrganizeProjectsModal({
  open,
  onClose,
  initialScrollToProjectId,
}: Props) {
  const projects = useRenovationProjectStore((s) => s.projects)
  const setProjectParent = useRenovationProjectStore((s) => s.setProjectParent)

  const [panel, setPanel] = useState<Panel>('organize')
  const [attachChoice, setAttachChoice] = useState<Record<string, string>>({})
  const [reparentChoice, setReparentChoice] = useState<Record<string, string>>({})

  const sortedRoots = useMemo(() => {
    return [...getActiveRootProjects(projects)].sort(sortRenovationProjectsByName)
  }, [projects])

  useEffect(() => {
    if (!open) return
    setPanel('organize')
  }, [open])

  useEffect(() => {
    if (!open) return
    setAttachChoice((prev) => {
      const next = { ...prev }
      for (const r of sortedRoots) {
        const av = getAttachRootAsChildAvailability(r, projects)
        if (av.ok) {
          const valid = new Set(av.targetRoots.map((t) => t.id))
          if (!next[r.id] || !valid.has(next[r.id]!)) {
            next[r.id] = av.targetRoots[0]?.id ?? ''
          }
        } else {
          delete next[r.id]
        }
      }
      return next
    })
  }, [open, sortedRoots, projects])

  useEffect(() => {
    if (!open) return
    const next: Record<string, string> = {}
    for (const p of projects) {
      if (!p.parentId) continue
      const targets = getActiveRootTargetsExcluding(p.id, projects)
      if (targets.length === 0) {
        next[p.id] = p.parentId
        continue
      }
      const stillValid = targets.some((t) => t.id === p.parentId)
      next[p.id] = stillValid ? p.parentId! : targets[0]!.id
    }
    setReparentChoice(next)
  }, [open, projects])

  useEffect(() => {
    if (!open || !initialScrollToProjectId) return
    return scrollToOrganizeSectionWithCleanup(initialScrollToProjectId)
  }, [open, initialScrollToProjectId])

  const handleRequestClose = () => {
    if (panel === 'createMain') {
      setPanel('organize')
      return
    }
    onClose()
  }

  if (!open) return null

  const runSetParent = (projectId: string, newParentId: string | null) => {
    const r = setProjectParent(projectId, newParentId)
    if (!r.ok && typeof window !== 'undefined') window.alert(r.message)
  }

  const titleId = panel === 'createMain' ? CREATE_MAIN_TITLE_ID : ORGANIZE_TITLE_ID

  return (
    <RenovationModalFrame onRequestClose={handleRequestClose} ariaLabelledBy={titleId} maxWidth="xl">
      {panel === 'createMain' ? (
        <div
          className="flex shrink-0 items-start justify-between gap-4 border-b p-4 sm:p-5 min-w-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex-1 space-y-1 pr-1">
            <h2 id={CREATE_MAIN_TITLE_ID} className="text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              Nytt hovedprosjekt
            </h2>
            <p className="text-xs leading-relaxed sm:text-sm break-words" style={{ color: 'var(--text-muted)' }}>
              Hovedprosjekt for f.eks. et kjøpt hus eller større oppussingsløp. Du legger til rom under senere — eller
              koble eksisterende prosjekter hit etterpå.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanel('organize')}
            className="shrink-0 min-h-[44px] min-w-[44px] rounded-xl p-2.5 touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Tilbake til organisering"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
      ) : (
        <div
          className="flex shrink-0 items-start justify-between gap-4 border-b p-4 sm:p-5 min-w-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex-1 space-y-1 pr-1">
            <h2 id={ORGANIZE_TITLE_ID} className="text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              Organiser prosjekter
            </h2>
            <p className="text-xs leading-relaxed sm:text-sm break-words" style={{ color: 'var(--text-muted)' }}>
              Her kan du koble frie hovedprosjekter inn under et annet hus, bytte hvilket hoved rom hører til,
              og løsrive rom til egne hovedprosjekter. Aktive rom under et hovedprosjekt må ryddes (arkiver/slett)
              før du kan flytte selve hovedprosjektet under et annet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-h-[44px] min-w-[44px] rounded-xl p-2.5 touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {panel === 'createMain' ? (
          <RenovationCreateMainProjectForm
            idPrefix="organize-new-main"
            onSuccess={(p) => {
              setPanel('organize')
              scrollOrganizeSectionIntoView(p.id)
            }}
            onCancel={() => setPanel('organize')}
          />
        ) : (
          <div
            className={`${renovationModalScrollableMainClass} ${renovationModalScrollbarSafeBottom} flex-1 min-h-0 space-y-6`}
          >
            <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                Trenger du et nytt hus/hoved før du flytter?
              </p>
              <button
                type="button"
                onClick={() => setPanel('createMain')}
                className="min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-medium text-white touch-manipulation sm:w-auto"
                style={{ background: 'var(--primary)' }}
              >
                Opprett nytt hovedprosjekt
              </button>
            </div>

            {sortedRoots.map((root) => (
              <OrganizeRootSection
                key={root.id}
                root={root}
                projects={projects}
                attachTargetId={attachChoice[root.id] ?? ''}
                setAttachTargetId={(v) => setAttachChoice((s) => ({ ...s, [root.id]: v }))}
                reparentChoice={reparentChoice}
                setReparentChoice={setReparentChoice}
                onSetParent={runSetParent}
              />
            ))}

            {sortedRoots.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ingen hovedprosjekter ennå. Bruk knappen over for å opprette — deretter kan du flytte og koble
                prosjekter.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div
        className={`flex shrink-0 justify-end ${renovationModalFooterClass}`}
        style={{ borderColor: 'var(--border)' }}
      >
        {panel === 'createMain' ? (
          <button
            type="button"
            onClick={() => setPanel('organize')}
            className="min-h-[44px] rounded-xl border px-5 py-2.5 text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            Tilbake til organisering
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border px-5 py-2.5 text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
        )}
      </div>
    </RenovationModalFrame>
  )
}

function OrganizeRootSection({
  root,
  projects,
  attachTargetId,
  setAttachTargetId,
  reparentChoice,
  setReparentChoice,
  onSetParent,
}: {
  root: RenovationProject
  projects: RenovationProject[]
  attachTargetId: string
  setAttachTargetId: (v: string) => void
  reparentChoice: Record<string, string>
  setReparentChoice: Dispatch<SetStateAction<Record<string, string>>>
  onSetParent: (projectId: string, newParentId: string | null) => void
}) {
  const attachAv = getAttachRootAsChildAvailability(root, projects)
  const children = [...getActiveChildProjects(root.id, projects)].sort(sortRenovationProjectsByName)

  return (
    <section
      id={`renovation-organize-section-${root.id}`}
      className="rounded-2xl border p-4 sm:p-5 space-y-4 min-w-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between min-w-0">
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words" style={{ color: 'var(--text)' }}>
            {root.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            <span
              className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Hoved
            </span>
          </p>
        </div>
      </div>

      {attachAv.ok ? (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Dette hovedprosjektet har ingen rom ennå — du kan knytte det inn under et annet hovedprosjekt.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="sr-only" htmlFor={`organize-attach-${root.id}`}>
              Flytt under hovedprosjekt
            </label>
            <select
              id={`organize-attach-${root.id}`}
              value={attachTargetId}
              onChange={(e) => setAttachTargetId(e.target.value)}
              className="min-h-[44px] w-full max-w-md rounded-xl border px-3 py-2.5 text-base sm:text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              {attachAv.targetRoots.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!attachTargetId}
              onClick={() => {
                if (!attachTargetId) return
                onSetParent(root.id, attachTargetId)
              }}
              className="min-h-[44px] w-full shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-white touch-manipulation disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              style={{ background: 'var(--primary)' }}
            >
              Flytt under …
            </button>
          </div>
        </div>
      ) : attachAv.reason === 'has_children' || attachAv.reason === 'no_other_root' ? (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {attachRootAsChildBlockedHint(attachAv.reason)}
        </p>
      ) : null}

      {children.length > 0 ? (
        <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Rom og underprosjekter
          </p>
          <ul className="space-y-3">
            {children.map((child) => (
              <li
                key={child.id}
                className="rounded-xl border p-3 sm:p-4 space-y-3"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words" style={{ color: 'var(--text)' }}>
                    {child.name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <span
                      className="inline-block rounded-md px-2 py-0.5 font-medium"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      Rom
                    </span>
                  </p>
                </div>

                {childCanReparentToAnotherRoot(child, projects) ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="min-w-0 w-full flex-1 sm:max-w-xs">
                      <label className="mb-1 block text-xs" style={{ color: 'var(--text-muted)' }} htmlFor={`organize-reparent-${child.id}`}>
                        Hovedprosjekt
                      </label>
                      <select
                        id={`organize-reparent-${child.id}`}
                        value={reparentChoice[child.id] ?? child.parentId ?? ''}
                        onChange={(e) =>
                          setReparentChoice((s) => ({ ...s, [child.id]: e.target.value }))
                        }
                        className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      >
                        {getActiveRootTargetsExcluding(child.id, projects).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white touch-manipulation sm:w-auto"
                      style={{ background: 'var(--primary)' }}
                      onClick={() => {
                        const v = reparentChoice[child.id] ?? child.parentId
                        if (!v || v === child.parentId) return
                        onSetParent(child.id, v)
                      }}
                    >
                      Lagre flytting
                    </button>
                    <button
                      type="button"
                      className="min-h-[44px] w-full rounded-xl border px-4 py-2.5 text-sm font-medium touch-manipulation sm:w-auto"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
                      onClick={() => onSetParent(child.id, null)}
                    >
                      Løsriv som hovedprosjekt
                    </button>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Du kan ikke bytte hovedprosjekt for et rom som har egne aktive underprosjekter — arkiver eller
                    slett disse først.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
