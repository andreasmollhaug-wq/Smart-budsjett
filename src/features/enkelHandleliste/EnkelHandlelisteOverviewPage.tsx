'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Archive, Check, ChevronRight, FolderPlus, MoreVertical, Pencil, Plus, RotateCcw, Settings, ShoppingCart, Trash2 } from 'lucide-react'
import { useEnkelHandlelisteStore } from './enkelHandlelisteStore'
import { useEnkelHandlelisteCanMutate } from './useEnkelHandlelisteContext'
import { HouseholdReadonlyBanner } from './HouseholdReadonlyBanner'
import { EnkelHandlelisteSettingsModal } from '@/components/enkelHandleliste/EnkelHandlelisteSettingsModal'
import { EnkelHandlelisteNameSheet } from './components/EnkelHandlelisteNameSheet'
import { EnkelHandlelisteConfirmDialog } from './components/EnkelHandlelisteConfirmDialog'
import { EhSheet } from './components/EhSheet'
import { isListOwner } from './familyGate'
import { ehIconBtnClass, ehIconBtnStyle, ehPrimaryBtnClass, ehPrimaryBtnStyle, ehSecondaryBtnClass, ehSecondaryBtnStyle } from './ehUi'
import { useStore } from '@/lib/store'
import type { EhItem, EhList } from './types'

function listProgress(listId: string, items: { listId: string; checked: boolean }[]) {
  const listItems = items.filter((i) => i.listId === listId)
  const done = listItems.filter((i) => i.checked).length
  return { total: listItems.length, done }
}

export function EnkelHandlelisteOverviewPage() {
  const router = useRouter()
  const groups = useEnkelHandlelisteStore((s) => s.groups)
  const allLists = useEnkelHandlelisteStore((s) => s.lists)
  const items = useEnkelHandlelisteStore((s) => s.items)
  const settings = useEnkelHandlelisteStore((s) => s.settings)
  const ehAddGroup = useEnkelHandlelisteStore((s) => s.ehAddGroup)
  const ehCreateList = useEnkelHandlelisteStore((s) => s.ehCreateList)
  const ehRenameList = useEnkelHandlelisteStore((s) => s.ehRenameList)
  const ehArchiveList = useEnkelHandlelisteStore((s) => s.ehArchiveList)
  const ehUnarchiveList = useEnkelHandlelisteStore((s) => s.ehUnarchiveList)
  const ehDeleteList = useEnkelHandlelisteStore((s) => s.ehDeleteList)
  const ehPatchSettings = useEnkelHandlelisteStore((s) => s.ehPatchSettings)
  const profiles = useStore((s) => s.profiles)

  const { canMutate, activeProfileId, familyEnabled } = useEnkelHandlelisteCanMutate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newListOpen, setNewListOpen] = useState(false)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [menuList, setMenuList] = useState<EhList | null>(null)
  const [renameListId, setRenameListId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const activeLists = useMemo(
    () => allLists.filter((l) => !l.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder),
    [allLists],
  )
  const archivedLists = useMemo(
    () => allLists.filter((l) => l.archivedAt).sort((a, b) => (a.archivedAt! < b.archivedAt! ? 1 : -1)),
    [allLists],
  )

  const ungrouped = activeLists.filter((l) => !l.groupId)
  const byGroup = useMemo(() => {
    const m = new Map<string, EhList[]>()
    for (const g of groups) m.set(g.id, [])
    for (const l of activeLists) {
      if (l.groupId && m.has(l.groupId)) m.get(l.groupId)!.push(l)
    }
    return m
  }, [groups, activeLists])

  const handleNewList = (name: string) => {
    if (!canMutate) return
    const res = ehCreateList({
      name,
      groupId: settings.defaultGroupId,
      ownerProfileId: activeProfileId,
      allProfileIds: profiles.map((p) => p.id),
      familyEnabled,
    })
    if (res.ok && res.id) router.push(`/intern/enkel-handleliste/liste/${res.id}`)
  }

  const renderListCard = (list: EhList) => {
    const { total, done } = listProgress(list.id, items as EhItem[])
    const allDone = total > 0 && done === total
    const isOwner = list.ownerProfileId === activeProfileId
    const isShared = familyEnabled && list.memberProfileIds.length > 0 && !isOwner
    const progress = total === 0 ? 0 : Math.round((done / total) * 100)
    return (
      <li key={list.id} className="relative flex min-w-0 items-stretch overflow-hidden">
        <button
          type="button"
          onClick={() => router.push(`/intern/enkel-handleliste/liste/${list.id}`)}
          className="flex min-h-[68px] min-w-0 flex-1 touch-manipulation items-center gap-3 px-3.5 py-2.5 text-left active:opacity-90"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: allDone ? 'color-mix(in srgb, var(--success) 14%, transparent)' : 'var(--primary-pale)',
              color: allDone ? 'var(--success)' : 'var(--primary)',
            }}
          >
            {allDone ? <Check size={20} strokeWidth={3} aria-hidden /> : <ShoppingCart size={19} aria-hidden />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                {list.name}
              </span>
              {isShared && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                >
                  Delt
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {total === 0 ? 'Tom' : allDone ? 'Alt plukket' : `${done} av ${total} plukket`}
            </span>
            {total > 0 && (
              <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--primary-pale)' }}>
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${progress}%`, background: allDone ? 'var(--success)' : 'var(--cta-gradient)' }}
                />
              </span>
            )}
          </span>
          {!(canMutate && isOwner) && <ChevronRight size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden />}
        </button>
        {canMutate && isOwner && (
          <button
            type="button"
            className="inline-flex min-h-[68px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center active:opacity-60"
            aria-label="Listevalg"
            onClick={() => setMenuList(list)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ color: 'var(--text-muted)' }}>
              <MoreVertical size={18} aria-hidden />
            </span>
          </button>
        )}
      </li>
    )
  }

  const sectionCard = (children: React.ReactNode) => (
    <ul
      className="overflow-hidden rounded-2xl border divide-y divide-[color:var(--border)]"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: '0 1px 2px rgba(30,43,79,0.04), 0 4px 14px rgba(30,43,79,0.06)' }}
    >
      {children}
    </ul>
  )

  return (
    <div className="min-w-0">
      <header className="mb-5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Handlelister
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Enkelt, raskt og alltid med deg.
          </p>
        </div>
        <button type="button" className={ehIconBtnClass} style={ehIconBtnStyle} aria-label="Innstillinger" onClick={() => setSettingsOpen(true)}>
          <Settings size={20} aria-hidden />
        </button>
      </header>

      {!canMutate && <HouseholdReadonlyBanner />}

      {canMutate && (
        <div className="mb-6 flex gap-2.5">
          <button type="button" className={`flex-1 ${ehPrimaryBtnClass}`} style={ehPrimaryBtnStyle} onClick={() => setNewListOpen(true)}>
            <Plus size={18} aria-hidden />
            Ny liste
          </button>
          <button type="button" className={ehSecondaryBtnClass} style={ehSecondaryBtnStyle} onClick={() => setNewGroupOpen(true)} aria-label="Ny gruppe">
            <FolderPlus size={18} aria-hidden />
          </button>
        </div>
      )}

      {activeLists.length === 0 && groups.length === 0 && (
        <div className="mt-12 flex flex-col items-center px-6 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
            <ShoppingCart size={28} aria-hidden />
          </span>
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Ingen lister ennå
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Lag din første handleliste, så er du i gang på sekunder.
          </p>
        </div>
      )}

      {(activeLists.length > 0 || groups.length > 0) && (
        <div className="space-y-6">
          {groups.map((g) => {
            const gl = byGroup.get(g.id) ?? []
            if (!gl.length && !canMutate) return null
            return (
              <section key={g.id}>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {g.name}
                </h2>
                {gl.length > 0 ? (
                  sectionCard(gl.map(renderListCard))
                ) : (
                  <p className="px-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Ingen lister i denne gruppen.
                  </p>
                )}
              </section>
            )
          })}
          {ungrouped.length > 0 && (
            <section>
              {groups.length > 0 && (
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Uten gruppe
                </h2>
              )}
              {sectionCard(ungrouped.map(renderListCard))}
            </section>
          )}
        </div>
      )}

      {archivedLists.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Arkivert
          </h2>
          <ul className="space-y-2">
            {archivedLists.map((list) => (
              <li
                key={list.id}
                className="flex items-center justify-between gap-2 rounded-2xl border px-4 py-3"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <span className="min-w-0 truncate text-sm" style={{ color: 'var(--text-muted)' }}>
                  {list.name}
                </span>
                {canMutate && isListOwner(list, activeProfileId) && (
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold touch-manipulation"
                    style={{ color: 'var(--primary)' }}
                    onClick={() => ehUnarchiveList(list.id, activeProfileId)}
                  >
                    <RotateCcw size={13} aria-hidden />
                    Hent tilbake
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-liste handlingsmeny */}
      <EhSheet open={!!menuList} onClose={() => setMenuList(null)} title={menuList?.name}>
        <div className="space-y-0.5 pb-3">
          <button
            type="button"
            onClick={() => {
              setRenameListId(menuList!.id)
              setMenuList(null)
            }}
            className="flex min-h-[52px] w-full touch-manipulation items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-medium active:scale-[0.99]"
            style={{ color: 'var(--text)' }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
              <Pencil size={18} aria-hidden />
            </span>
            Endre navn
          </button>
          <button
            type="button"
            onClick={() => {
              ehArchiveList(menuList!.id, activeProfileId)
              setMenuList(null)
            }}
            className="flex min-h-[52px] w-full touch-manipulation items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-medium active:scale-[0.99]"
            style={{ color: 'var(--text)' }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
              <Archive size={18} aria-hidden />
            </span>
            Arkiver
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirm({ id: menuList!.id, name: menuList!.name })
              setMenuList(null)
            }}
            className="flex min-h-[52px] w-full touch-manipulation items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-medium active:scale-[0.99]"
            style={{ color: 'var(--danger)' }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}
            >
              <Trash2 size={18} aria-hidden />
            </span>
            Slett liste
          </button>
        </div>
      </EhSheet>

      <EnkelHandlelisteSettingsModal
        open={settingsOpen}
        settings={settings}
        groups={groups}
        familyEnabled={familyEnabled}
        onClose={() => setSettingsOpen(false)}
        onSave={(patch) => ehPatchSettings(patch)}
      />
      <EnkelHandlelisteNameSheet
        open={newListOpen}
        title="Ny liste"
        label="Navn på listen"
        defaultValue="Handleliste"
        onClose={() => setNewListOpen(false)}
        onSubmit={handleNewList}
      />
      <EnkelHandlelisteNameSheet
        open={newGroupOpen}
        title="Ny gruppe"
        label="Navn på gruppen"
        defaultValue="Butikk"
        onClose={() => setNewGroupOpen(false)}
        onSubmit={(name) => ehAddGroup(name, activeProfileId)}
      />
      <EnkelHandlelisteNameSheet
        open={!!renameListId}
        title="Endre navn"
        label="Nytt navn"
        defaultValue={allLists.find((l) => l.id === renameListId)?.name ?? ''}
        onClose={() => setRenameListId(null)}
        onSubmit={(name) => {
          if (renameListId) ehRenameList(renameListId, name, activeProfileId)
          setRenameListId(null)
        }}
      />
      <EnkelHandlelisteConfirmDialog
        open={!!deleteConfirm}
        title="Slett liste"
        message={`Slette «${deleteConfirm?.name}»? Dette kan ikke angres.`}
        danger
        confirmLabel="Slett"
        onConfirm={() => {
          if (deleteConfirm) ehDeleteList(deleteConfirm.id, activeProfileId)
          setDeleteConfirm(null)
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
