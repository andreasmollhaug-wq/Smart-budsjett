'use client'

import { categoryLabel } from '@/features/matHandleliste/categoryMap'
import type { ShoppingListItem } from '@/features/matHandleliste/types'
import { Check, X } from 'lucide-react'
import { useEffect, useId } from 'react'

function formatQtyBrief(it: ShoppingListItem): string {
  if (it.quantity == null) return ''
  const u =
    it.unit === 'other'
      ? it.unitLabel ?? 'enhet'
      : ({
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
        }[it.unit])
  return `${it.quantity} ${u}`.trim()
}

export function MatHandlelisteButikkmodusPanel({
  open,
  onClose,
  list,
  categoryOrder,
  toggleItem,
}: {
  open: boolean
  onClose: () => void
  list: ShoppingListItem[]
  categoryOrder: string[]
  toggleItem: (id: string) => void
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  const byCategory = new Map<string, ShoppingListItem[]>()
  for (const id of categoryOrder) byCategory.set(id, [])
  for (const it of list) {
    if (it.checked) continue
    const cid = byCategory.has(it.categoryId) ? it.categoryId : 'annet'
    if (!byCategory.has(cid)) byCategory.set(cid, [])
    byCategory.get(cid)!.push(it)
  }

  const remaining = list.filter((it) => !it.checked)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: 'var(--bg)',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-3"
        style={{
          borderColor: 'var(--border)',
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        }}
      >
        <h1 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Butikkmodus
        </h1>
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border text-sm font-medium touch-manipulation"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          onClick={onClose}
        >
          <X size={22} aria-hidden />
          <span className="sr-only">Lukk</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
        {remaining.length === 0 ? (
          <p className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Alt i kurven — ingen varer gjenstår.
          </p>
        ) : (
          <div className="space-y-5 pb-4">
            {categoryOrder.map((catId) => {
              const items = (byCategory.get(catId) ?? []).filter((it) => !it.checked)
              if (items.length === 0) return null
              return (
                <section key={catId}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {categoryLabel(catId)}
                  </h2>
                  <ul className="space-y-2">
                    {items.map((it) => (
                      <li key={it.id}>
                        <button
                          type="button"
                          onClick={() => toggleItem(it.id)}
                          className="flex w-full min-h-[52px] items-center gap-3 rounded-xl border px-3 py-2 text-left touch-manipulation"
                          style={{
                            borderColor: 'var(--border)',
                            background: 'var(--surface)',
                          }}
                          aria-pressed={it.checked}
                        >
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
                            style={{
                              borderColor: 'var(--border)',
                              background: it.checked ? 'var(--primary-pale)' : 'var(--bg)',
                            }}
                            aria-hidden
                          >
                            {it.checked ? <Check size={22} style={{ color: 'var(--primary)' }} /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium leading-snug" style={{ color: 'var(--text)' }}>
                              {it.displayName}
                            </span>
                            {formatQtyBrief(it) ? (
                              <span className="mt-0.5 block text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                {formatQtyBrief(it)}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
