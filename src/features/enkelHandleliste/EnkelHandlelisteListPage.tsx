'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useMemo, useState, useCallback, type ReactNode } from 'react'
import {
  ArrowLeft,
  Bookmark,
  ClipboardList,
  Copy,
  ListPlus,
  MoreHorizontal,
  Share2,
  ShoppingBag,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { useEnkelHandlelisteStore } from './enkelHandlelisteStore'
import { useEnkelHandlelisteCanMutate } from './useEnkelHandlelisteContext'
import { useShakeToSort } from './useShakeToSort'
import { HouseholdReadonlyBanner } from './HouseholdReadonlyBanner'
import { findDuplicateNames } from './parseCommaInput'
import { shareShoppingList } from './shareList'
import { isListOwner } from './familyGate'
import { EhListItemRow } from './components/EhListItemRow'
import { EhAddProductBar } from './components/EhAddProductBar'
import { EhSheet } from './components/EhSheet'
import { EnkelHandlelisteConfirmDialog } from './components/EnkelHandlelisteConfirmDialog'
import { EnkelHandlelisteListPickerSheet } from './components/EnkelHandlelisteListPickerSheet'
import { EnkelHandlelisteProfileChip, type EhListAccessMode } from './components/EnkelHandlelisteProfileChip'
import { EnkelHandlelisteAddItemsModal } from '@/components/enkelHandleliste/EnkelHandlelisteAddItemsModal'
import { EnkelHandlelisteEditItemModal } from '@/components/enkelHandleliste/EnkelHandlelisteEditItemModal'
import { EnkelHandlelisteButikkmodusPanel } from '@/components/enkelHandleliste/EnkelHandlelisteButikkmodusPanel'
import { EnkelHandlelisteMembersModal } from '@/components/enkelHandleliste/EnkelHandlelisteMembersModal'
import { EnkelHandlelisteNameSheet } from './components/EnkelHandlelisteNameSheet'
import { ehIconBtnClass, ehIconBtnStyle } from './ehUi'
import { useStore } from '@/lib/store'

const WEEKDAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']

function MenuRow({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[52px] w-full touch-manipulation items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-medium active:scale-[0.99]"
      style={{ color: danger ? 'var(--danger)' : 'var(--text)' }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          background: danger ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'var(--primary-pale)',
          color: danger ? 'var(--danger)' : 'var(--primary)',
        }}
      >
        {icon}
      </span>
      {label}
    </button>
  )
}

export function EnkelHandlelisteListPage({ listId }: { listId: string }) {
  const list = useEnkelHandlelisteStore((s) => s.lists.find((l) => l.id === listId))
  const allItems = useEnkelHandlelisteStore((s) => s.items)
  const settings = useEnkelHandlelisteStore((s) => s.settings)
  const allLists = useEnkelHandlelisteStore((s) => s.lists)
  const ehAddItems = useEnkelHandlelisteStore((s) => s.ehAddItems)
  const ehToggleItem = useEnkelHandlelisteStore((s) => s.ehToggleItem)
  const ehPatchItem = useEnkelHandlelisteStore((s) => s.ehPatchItem)
  const ehRemoveItem = useEnkelHandlelisteStore((s) => s.ehRemoveItem)
  const ehSortCheckedToBottom = useEnkelHandlelisteStore((s) => s.ehSortCheckedToBottom)
  const ehClearCheckedItems = useEnkelHandlelisteStore((s) => s.ehClearCheckedItems)
  const ehClearAllItems = useEnkelHandlelisteStore((s) => s.ehClearAllItems)
  const ehCopyListContent = useEnkelHandlelisteStore((s) => s.ehCopyListContent)
  const ehSetListMembers = useEnkelHandlelisteStore((s) => s.ehSetListMembers)
  const ehCreateTemplateFromList = useEnkelHandlelisteStore((s) => s.ehCreateTemplateFromList)
  const ehApplyTemplate = useEnkelHandlelisteStore((s) => s.ehApplyTemplate)
  const templates = useEnkelHandlelisteStore((s) => s.templates)
  const profiles = useStore((s) => s.profiles)

  const { canMutate, activeProfileId, familyEnabled, profileNames } = useEnkelHandlelisteCanMutate()

  const [pasteOpen, setPasteOpen] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [butikkOpen, setButikkOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dupDialog, setDupDialog] = useState<{ names: string[]; pending: string[] } | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    message: string
    danger?: boolean
    onOk: () => void
  } | null>(null)
  const [listPicker, setListPicker] = useState<'copy' | 'template' | null>(null)
  const [templateNameOpen, setTemplateNameOpen] = useState(false)

  const items = useMemo(
    () => allItems.filter((i) => i.listId === listId).sort((a, b) => a.sortOrder - b.sortOrder),
    [allItems, listId],
  )

  const unchecked = useMemo(() => items.filter((i) => !i.checked), [items])
  const checked = useMemo(() => items.filter((i) => i.checked), [items])
  const editItem = editItemId ? items.find((i) => i.id === editItemId) ?? null : null

  const onShake = useCallback(() => {
    if (canMutate) ehSortCheckedToBottom(listId, activeProfileId)
  }, [canMutate, listId, activeProfileId, ehSortCheckedToBottom])

  useShakeToSort(settings.shakeToSortEnabled && canMutate, onShake)

  if (!list) notFound()

  const owner = isListOwner(list, activeProfileId)
  const canEditList = canMutate && (owner || list.memberProfileIds.includes(activeProfileId))
  const progress = items.length === 0 ? 0 : Math.round((checked.length / items.length) * 100)

  const accessMode: EhListAccessMode = !canMutate
    ? 'household'
    : owner
      ? 'owner'
      : list.memberProfileIds.includes(activeProfileId)
        ? 'member'
        : 'readonly'

  const addNames = (rawNames: string[], skipDupCheck = false) => {
    const existing = items.map((i) => i.name)
    const dups = findDuplicateNames(rawNames, existing)
    if (!skipDupCheck && dups.length > 0) {
      setDupDialog({ names: dups, pending: rawNames })
      return
    }
    const toAdd = skipDupCheck ? rawNames.filter((n) => !dups.includes(n)) : rawNames
    if (!toAdd.length && skipDupCheck) return
    ehAddItems(listId, skipDupCheck && dups.length ? toAdd : rawNames, activeProfileId, settings.capitalizeWords)
  }

  const closeMenuThen = (fn: () => void) => () => {
    setMenuOpen(false)
    fn()
  }

  const renderSection = (title: string, sectionItems: typeof items, muted = false) => {
    if (!sectionItems.length) return null
    return (
      <section className="mb-5">
        <h2
          className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          {title}
          <span
            className="rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
          >
            {sectionItems.length}
          </span>
        </h2>
        <ul
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            boxShadow: '0 1px 2px rgba(30,43,79,0.04), 0 4px 14px rgba(30,43,79,0.06)',
            opacity: muted ? 0.78 : 1,
          }}
        >
          {sectionItems.map((it) => {
            const showInitial =
              familyEnabled && settings.showContributorInitials && it.addedByProfileId !== activeProfileId
            const initial = showInitial ? (profileNames[it.addedByProfileId]?.charAt(0) ?? '?') : null
            const canDelete = canMutate && (owner || it.addedByProfileId === activeProfileId)
            return (
              <EhListItemRow
                key={it.id}
                item={it}
                canEdit={canEditList}
                canDelete={canDelete}
                showQuantity={settings.showQuantity}
                contributorInitial={initial}
                onToggle={() => ehToggleItem(it.id, activeProfileId)}
                onEdit={() => setEditItemId(it.id)}
                onDelete={() => ehRemoveItem(it.id, activeProfileId)}
              />
            )
          })}
        </ul>
      </section>
    )
  }

  return (
    <div className="min-w-0">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/intern/enkel-handleliste" className={ehIconBtnClass} style={ehIconBtnStyle} aria-label="Tilbake">
          <ArrowLeft size={20} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            {list.name}
          </h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {items.length === 0
              ? 'Tom liste'
              : checked.length === items.length
                ? 'Alt plukket 🎉'
                : `${checked.length} av ${items.length} plukket`}
          </p>
        </div>
        <button
          type="button"
          className={ehIconBtnClass}
          style={ehIconBtnStyle}
          aria-label="Del liste"
          onClick={() => void shareShoppingList(items, list.name).catch(() => {})}
        >
          <Share2 size={19} aria-hidden />
        </button>
        <button
          type="button"
          className={ehIconBtnClass}
          style={ehIconBtnStyle}
          aria-label="Meny"
          onClick={() => setMenuOpen(true)}
        >
          <MoreHorizontal size={20} aria-hidden />
        </button>
      </header>

      {items.length > 0 && (
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--primary-pale)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progress}%`, background: 'var(--cta-gradient)' }}
          />
        </div>
      )}

      {!canMutate && <HouseholdReadonlyBanner />}
      {canMutate && accessMode !== 'owner' && <EnkelHandlelisteProfileChip mode={accessMode} />}

      {items.length > 0 && (
        <button
          type="button"
          onClick={() => setButikkOpen(true)}
          className="mb-5 flex w-full touch-manipulation items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-[transform] active:scale-[0.99]"
          style={{ borderColor: 'var(--primary)', background: 'var(--primary-pale)' }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: 'var(--cta-gradient)' }}
          >
            <ShoppingBag size={20} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold" style={{ color: 'var(--primary)' }}>
              Start butikkmodus
            </span>
            <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
              Stor og enkel — skjermen holdes våken
            </span>
          </span>
        </button>
      )}

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center px-6 text-center">
          <span
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
          >
            <Sparkles size={28} aria-hidden />
          </span>
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Listen er tom
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Søk etter en vare nederst, eller skriv inn det du trenger. Vi husker det til neste gang.
          </p>
        </div>
      ) : (
        <>
          {renderSection('Å handle', unchecked)}
          {renderSection('Plukket', checked, true)}
        </>
      )}

      <EhAddProductBar disabled={!canEditList} onAddNames={(names) => addNames(names)} />

      {/* Handlingsmeny */}
      <EhSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Mer">
        <div className="space-y-0.5 pb-3">
          {canEditList && (
            <MenuRow icon={<ClipboardList size={18} />} label="Lim inn mange" onClick={closeMenuThen(() => setPasteOpen(true))} />
          )}
          {canEditList && templates.length > 0 && (
            <MenuRow icon={<Bookmark size={18} />} label="Bruk en mal" onClick={closeMenuThen(() => setListPicker('template'))} />
          )}
          {canEditList && owner && (
            <MenuRow icon={<ListPlus size={18} />} label="Lag mal fra listen" onClick={closeMenuThen(() => setTemplateNameOpen(true))} />
          )}
          {canEditList && (
            <MenuRow icon={<Copy size={18} />} label="Kopier til en annen liste" onClick={closeMenuThen(() => setListPicker('copy'))} />
          )}
          {canEditList && checked.length > 0 && (
            <MenuRow
              icon={<Trash2 size={18} />}
              label="Fjern plukkede varer"
              onClick={closeMenuThen(() =>
                setConfirm({
                  title: 'Fjerne plukkede?',
                  message: 'Alle avhukede varer fjernes fra listen.',
                  onOk: () => ehClearCheckedItems(listId, activeProfileId),
                }),
              )}
            />
          )}
          {canMutate && owner && familyEnabled && (
            <MenuRow icon={<Users size={18} />} label="Del med husstanden" onClick={closeMenuThen(() => setMembersOpen(true))} />
          )}
          {owner && canMutate && (
            <MenuRow
              icon={<Trash2 size={18} />}
              label="Tøm hele listen"
              danger
              onClick={closeMenuThen(() =>
                setConfirm({
                  title: 'Tømme listen?',
                  message: 'Alle varer fjernes. Dette kan ikke angres.',
                  danger: true,
                  onOk: () => ehClearAllItems(listId, activeProfileId),
                }),
              )}
            />
          )}
        </div>
      </EhSheet>

      <EnkelHandlelisteAddItemsModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Lim inn varer"
        hint="Kopier tekst fra SMS eller iMessage og lim inn her."
        onSubmit={(names) => addNames(names)}
      />
      <EnkelHandlelisteEditItemModal
        open={!!editItem}
        item={editItem}
        showQuantity={settings.showQuantity}
        onClose={() => setEditItemId(null)}
        onSave={(patch) => {
          if (editItem) ehPatchItem(editItem.id, patch, activeProfileId)
        }}
      />
      <EnkelHandlelisteButikkmodusPanel
        open={butikkOpen}
        onClose={() => setButikkOpen(false)}
        items={items}
        toggleItem={(id) => canEditList && ehToggleItem(id, activeProfileId)}
      />
      {familyEnabled && owner && (
        <EnkelHandlelisteMembersModal
          open={membersOpen}
          list={list}
          profiles={profiles.map((p) => ({ id: p.id, name: profileNames[p.id] ?? p.name }))}
          ownerName={profileNames[list.ownerProfileId] ?? 'Eier'}
          onClose={() => setMembersOpen(false)}
          onSave={(ids) => {
            ehSetListMembers(listId, ids, activeProfileId)
            setMembersOpen(false)
          }}
        />
      )}

      <EnkelHandlelisteConfirmDialog
        open={!!dupDialog}
        title="Finnes allerede"
        message={`${dupDialog?.names.join(', ')} finnes allerede. Legge til likevel?`}
        confirmLabel="Legg til"
        onConfirm={() => {
          if (dupDialog) addNames(dupDialog.pending, true)
          setDupDialog(null)
        }}
        onCancel={() => setDupDialog(null)}
      />
      <EnkelHandlelisteConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        danger={confirm?.danger}
        confirmLabel={confirm?.danger ? 'Ja, fjern' : 'Ja'}
        onConfirm={() => {
          confirm?.onOk()
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
      <EnkelHandlelisteListPickerSheet
        open={listPicker === 'copy'}
        title="Kopier til liste"
        lists={allLists.filter((l) => !l.archivedAt && l.id !== listId)}
        onClose={() => setListPicker(null)}
        onPick={(targetId) => ehCopyListContent(listId, targetId, 'merge', activeProfileId)}
      />
      <EnkelHandlelisteListPickerSheet
        open={listPicker === 'template'}
        title="Velg mal"
        lists={templates.map((t) => ({
          id: t.id,
          groupId: null,
          name: t.suggestedWeekday != null ? `${t.name} (${WEEKDAYS[t.suggestedWeekday]})` : t.name,
          ownerProfileId: activeProfileId,
          memberProfileIds: [],
          sortOrder: 0,
          archivedAt: null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))}
        onClose={() => setListPicker(null)}
        onPick={(templateId) => {
          setConfirm({
            title: 'Bruk mal',
            message: 'Legge til malens varer på listen?',
            onOk: () => ehApplyTemplate(templateId, listId, 'merge', activeProfileId),
          })
        }}
      />
      <EnkelHandlelisteNameSheet
        open={templateNameOpen}
        title="Lag mal fra listen"
        label="Navn på mal"
        placeholder="F.eks. Fast ukeshandel"
        onClose={() => setTemplateNameOpen(false)}
        onSubmit={(name) => ehCreateTemplateFromList(listId, name, activeProfileId, false)}
      />
    </div>
  )
}
