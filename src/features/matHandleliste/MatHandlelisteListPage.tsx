'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Header from '@/components/layout/Header'
import MatHandlelisteBudgetCard from '@/components/matHandleliste/MatHandlelisteBudgetCard'
import { MatHandlelisteAddListItemModal } from '@/components/matHandleliste/MatHandlelisteAddListItemModal'
import { MatHandlelisteEditListItemModal } from '@/components/matHandleliste/MatHandlelisteEditListItemModal'
import { MatHandlelisteListKpi } from '@/components/matHandleliste/MatHandlelisteListKpi'
import { MatHandlelisteShoppingListPrint } from '@/components/matHandleliste/MatHandlelisteShoppingListPrint'
import { categoryLabel } from '@/features/matHandleliste/categoryMap'
import { MatHandlelistePageShell } from '@/features/matHandleliste/MatHandlelistePageShell'
import type { IngredientUnit, ShoppingListItem } from '@/features/matHandleliste/types'
import { exportShoppingListPdf } from '@/lib/exportShoppingListPdf'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { useStore } from '@/lib/store'
import { Check, ChevronDown, ChevronUp, FileDown, Pencil, Trash2 } from 'lucide-react'

const UNIT_SHORT: Record<IngredientUnit, string> = {
  stk: 'stk',
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  dl: 'dl',
  l: 'l',
  ss: 'ss',
  ts: 'ts',
  pakke: 'pk',
  neve: 'neve',
  other: '',
}

function formatQtyLine(it: ShoppingListItem): string {
  if (it.quantity == null) return ''
  const u = it.unit === 'other' ? (it.unitLabel ?? 'enhet') : UNIT_SHORT[it.unit]
  return `${it.quantity} ${u}`.trim()
}

function sourceSummary(sources: ShoppingListItem['sources']): string | null {
  if (!sources.length) return null
  const titles = [...new Set(sources.map((s) => s.mealTitle))]
  return titles.slice(0, 3).join(', ') + (titles.length > 3 ? '…' : '')
}

function linePriceSubtotal(it: ShoppingListItem): number | null {
  if (it.unitPriceNok == null) return null
  return (it.quantity ?? 1) * it.unitPriceNok
}

function CollapsibleCategorySection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [desktop, setDesktop] = useState(true)
  const [open, setOpen] = useState(true)
  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  if (!mounted || desktop) {
    return (
      <section>
        <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {label}
        </h2>
        {children}
      </section>
    )
  }
  return (
    <section className="rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <button
        type="button"
        className="flex w-full min-h-[44px] items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold touch-manipulation"
        style={{ color: 'var(--text)' }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {label}
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open ? (
        <div className="border-t px-2 pb-2 pt-1" style={{ borderColor: 'var(--border)' }}>
          {children}
        </div>
      ) : null}
    </section>
  )
}

export function MatHandlelisteListPage() {
  const profiles = useStore((s) => s.profiles)
  const mat = useStore((s) => s.matHandleliste)
  const mhToggleListItem = useStore((s) => s.mhToggleListItem)
  const mhRemoveListItem = useStore((s) => s.mhRemoveListItem)
  const mhClearCheckedListItems = useStore((s) => s.mhClearCheckedListItems)
  const mhReorderShoppingCategories = useStore((s) => s.mhReorderShoppingCategories)
  const { formatNOK } = useNokDisplayFormatters()

  const [activityOpen, setActivityOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<ShoppingListItem | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfPortalReady, setPdfPortalReady] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPdfPortalReady(true)
  }, [])

  /** PDF inneholder kun ikke-avkryssede linjer – samme som utskriftskomponenten. */
  const uncheckedExportCount = useMemo(
    () => mat.list.filter((it) => !it.checked).length,
    [mat.list],
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, ShoppingListItem[]>()
    for (const id of mat.categoryOrder) {
      map.set(id, [])
    }
    for (const it of mat.list) {
      const cid = map.has(it.categoryId) ? it.categoryId : 'annet'
      if (!map.has(cid)) map.set(cid, [])
      map.get(cid)!.push(it)
    }
    return map
  }, [mat.list, mat.categoryOrder])

  const profileName = (id: string) => profiles.find((p) => p.id === id)?.name ?? 'Ukjent'

  function moveCategory(catId: string, dir: 'up' | 'down') {
    const o = [...mat.categoryOrder]
    const i = o.indexOf(catId)
    if (i < 0) return
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= o.length) return
    ;[o[i], o[j]] = [o[j]!, o[i]!]
    mhReorderShoppingCategories(o)
  }

  const exportPdf = useCallback(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    const el = pdfRef.current
    if (!el) {
      window.alert('Kunne ikke forberede PDF. Prøv å laste siden på nytt.')
      return
    }
    if (uncheckedExportCount === 0) {
      window.alert(
        'Ingen varer å eksportere. Enten er listen tom, eller alle varer er krysset av. Fjern noen avkrysninger eller legg til varer.',
      )
      return
    }
    setPdfBusy(true)
    try {
      const d = new Date()
      const fn = `handleliste-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.pdf`
      await exportShoppingListPdf(el, fn)
    } catch (e) {
      console.error('exportShoppingListPdf', e)
      const detail = e instanceof Error ? e.message : String(e)
      window.alert(
        process.env.NODE_ENV === 'development'
          ? `PDF-eksport feilet (dev): ${detail}\n\nSjekk også at nedlasting ikke er blokkert.`
          : 'PDF-eksport feilet. Sjekk at nedlasting ikke er blokkert (popup/nettleser), og prøv igjen.',
      )
    } finally {
      setPdfBusy(false)
    }
  }, [uncheckedExportCount])

  return (
    <>
      <Header title="Handleliste" subtitle="Intern test · mat og handleliste" />
      <MatHandlelistePageShell>
        <div className="mx-auto w-full max-w-lg space-y-4 pb-8">
          <MatHandlelisteBudgetCard showHandlelisteEstimates />

          <MatHandlelisteListKpi list={mat.list} />

          {mat.activity.length > 0 && (
            <div className="rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <button
                type="button"
                onClick={() => setActivityOpen(!activityOpen)}
                className="flex w-full min-h-[44px] items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium"
                style={{ color: 'var(--text)' }}
              >
                Siste aktivitet ({mat.activity.length})
                {activityOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {activityOpen && (
                <ul className="space-y-1 border-t px-3 py-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                  {[...mat.activity].reverse().slice(0, 12).map((ev) => (
                    <li key={ev.id} style={{ color: 'var(--text-muted)' }}>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {profileName(ev.profileId)}
                      </span>
                      : {ev.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="min-h-[48px] w-full rounded-xl text-sm font-semibold text-white touch-manipulation"
            style={{ background: 'var(--primary)' }}
          >
            Legg til vare
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-[44px] rounded-xl border px-3 text-sm font-medium touch-manipulation"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              onClick={() => {
                if (typeof window !== 'undefined' && window.confirm('Fjerne alle avkryssede varer?')) {
                  mhClearCheckedListItems()
                }
              }}
            >
              Fjern avkryssede
            </button>
            <button
              type="button"
              disabled={uncheckedExportCount === 0 || pdfBusy}
              title={
                mat.list.length > 0 && uncheckedExportCount === 0
                  ? 'Alle varer er krysset av. Fjern avkrysning på det du vil ha med i PDF.'
                  : undefined
              }
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-sm font-medium touch-manipulation disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              onClick={() => void exportPdf()}
            >
              <FileDown size={18} aria-hidden />
              {pdfBusy ? 'Eksporterer…' : 'Eksporter PDF'}
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-xl border px-3 text-sm font-medium touch-manipulation"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              onClick={() => setOrderOpen(!orderOpen)}
            >
              Butikkrekkefølge
            </button>
          </div>

          {orderOpen && (
            <ul className="space-y-1 rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border)' }}>
              {mat.categoryOrder.map((cid) => (
                <li key={cid} className="flex items-center justify-between gap-2">
                  <span style={{ color: 'var(--text)' }}>{categoryLabel(cid)}</span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      className="rounded-lg border px-2 py-1 text-xs"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => moveCategory(cid, 'up')}
                    >
                      Opp
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border px-2 py-1 text-xs"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => moveCategory(cid, 'down')}
                    >
                      Ned
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {mat.list.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Listen er tom. Legg til varer for hånd eller fra måltidsplanen.
            </p>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {mat.categoryOrder.map((catId) => {
                const items = byCategory.get(catId) ?? []
                if (items.length === 0) return null
                return (
                  <CollapsibleCategorySection key={catId} label={categoryLabel(catId)}>
                    <ul className="space-y-2">
                      {items.map((it) => {
                        const sub = linePriceSubtotal(it)
                        return (
                          <li
                            key={it.id}
                            className="rounded-xl border p-3"
                            style={{
                              borderColor: 'var(--border)',
                              background: 'var(--surface)',
                              opacity: it.checked ? 0.72 : 1,
                            }}
                          >
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => mhToggleListItem(it.id)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors"
                                style={{
                                  borderColor: 'var(--border)',
                                  background: it.checked ? 'var(--primary-pale)' : 'var(--bg)',
                                }}
                                aria-label={it.checked ? 'Merk som ikke kjøpt' : 'Merk som i handlekurv'}
                                aria-pressed={it.checked}
                              >
                                {it.checked ? <Check size={20} style={{ color: 'var(--primary)' }} /> : null}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                                  <span
                                    className="font-medium"
                                    style={{
                                      color: 'var(--text)',
                                      textDecoration: it.checked ? 'line-through' : undefined,
                                    }}
                                  >
                                    {it.displayName}
                                  </span>
                                  {formatQtyLine(it) ? (
                                    <span className="text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                      {formatQtyLine(it)}
                                    </span>
                                  ) : null}
                                </div>
                                {it.unitPriceNok != null ? (
                                  <p className="mt-0.5 text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                    {formatNOK(it.unitPriceNok)} per enhet
                                    {sub != null ? ` · ca. ${formatNOK(sub)}` : null}
                                  </p>
                                ) : (
                                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Ingen pris — trykk Rediger
                                  </p>
                                )}
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {it.checked ? 'I handlekurv' : 'Ikke kjøpt'}
                                  {it.manual ? ' · Manuell' : null}
                                  {' · '}
                                  Lagt inn av {profileName(it.addedFromProfileId)}
                                </span>
                                {sourceSummary(it.sources) ? (
                                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Fra: {sourceSummary(it.sources)}
                                  </p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditItem(it)}
                                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium touch-manipulation"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  >
                                    <Pencil size={14} aria-hidden /> Rediger
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => mhRemoveListItem(it.id)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border touch-manipulation"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                    aria-label="Slett vare"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </CollapsibleCategorySection>
                )
              })}
            </div>
          )}
        </div>

        <MatHandlelisteAddListItemModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          categoryOrder={mat.categoryOrder}
        />
        <MatHandlelisteEditListItemModal
          open={editItem != null}
          item={editItem}
          onClose={() => setEditItem(null)}
          categoryOrder={mat.categoryOrder}
        />

      </MatHandlelistePageShell>

      {pdfPortalReady
        ? createPortal(
            <div
              className="pointer-events-none fixed top-0 w-[210mm]"
              style={{ left: '-12000px' }}
              aria-hidden
            >
              <MatHandlelisteShoppingListPrint ref={pdfRef} list={mat.list} categoryOrder={mat.categoryOrder} />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
