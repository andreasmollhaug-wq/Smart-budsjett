'use client'

import { categoryLabel } from '@/features/matHandleliste/categoryMap'
import type { IngredientUnit, ShoppingListItem } from '@/features/matHandleliste/types'
import { SHOPPING_LIST_PDF_CAPTURE_ROOT_ID } from '@/lib/exportShoppingListPdf'
import { forwardRef, useMemo } from 'react'

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

function qtyLine(it: ShoppingListItem): string {
  if (it.quantity == null) return '—'
  const u = it.unit === 'other' ? (it.unitLabel ?? 'enhet') : UNIT_SHORT[it.unit]
  return `${it.quantity} ${u}`.trim()
}

export const MatHandlelisteShoppingListPrint = forwardRef<
  HTMLDivElement,
  {
    list: ShoppingListItem[]
    categoryOrder: string[]
    title?: string
  }
>(function MatHandlelisteShoppingListPrint({ list, categoryOrder, title = 'Handleliste' }, ref) {
  /** Kun linjer som fortsatt skal handles (samme som KPI / butikkliste). */
  const { byCategory, totalLines, sumNok } = useMemo(() => {
    const map = new Map<string, ShoppingListItem[]>()
    for (const id of categoryOrder) {
      map.set(id, [])
    }
    for (const it of list) {
      if (it.checked) continue
      const cid = map.has(it.categoryId) ? it.categoryId : 'annet'
      if (!map.has(cid)) map.set(cid, [])
      map.get(cid)!.push(it)
    }
    let sum = 0
    for (const it of list) {
      if (it.checked) continue
      if (it.unitPriceNok == null) continue
      sum += (it.quantity ?? 1) * it.unitPriceNok
    }
    return { byCategory: map, totalLines: list.filter((it) => !it.checked).length, sumNok: sum }
  }, [list, categoryOrder])

  const dateStr = new Date().toLocaleDateString('nb-NO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      ref={ref}
      id={SHOPPING_LIST_PDF_CAPTURE_ROOT_ID}
      className="w-[190mm] p-6 text-sm"
      style={{ background: '#fff', color: '#111', fontFamily: 'system-ui, sans-serif' }}
    >
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-1 text-xs text-neutral-600">{dateStr}</p>
      <p className="mt-2 text-xs font-medium text-amber-800">
        Test/priser – veiledende. Ikke markedspriser.
      </p>
      <p className="mt-1 text-xs text-neutral-600">
        Listen viser kun varer som ikke er krysset av i appen. Tom rute til høyre – kryss av med penn i butikken.
      </p>
      {categoryOrder.map((catId) => {
        const items = byCategory.get(catId) ?? []
        if (items.length === 0) return null
        return (
          <section key={catId} className="mt-4">
            <h2 className="border-b border-neutral-300 pb-1 text-sm font-semibold">
              {categoryLabel(catId)}
            </h2>
            <table className="mt-2 w-full table-fixed text-left text-xs">
              <colgroup>
                <col className="w-[36%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="text-neutral-600">
                  <th className="py-1 pr-2">Vare</th>
                  <th className="py-1 pr-2">Mengde</th>
                  <th className="py-1 pr-2">Pris/enhet</th>
                  <th className="py-1 pr-2">Delsum</th>
                  <th className="py-1 pl-1 text-center font-normal">Huket</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const sub =
                    it.unitPriceNok != null ? (it.quantity ?? 1) * it.unitPriceNok : null
                  return (
                    <tr key={it.id} className="border-t border-neutral-200">
                      <td className="py-2 pr-2 align-middle font-medium">{it.displayName}</td>
                      <td className="py-2 pr-2 align-middle tabular-nums">{qtyLine(it)}</td>
                      <td className="py-2 pr-2 align-middle tabular-nums">
                        {it.unitPriceNok != null ? `${it.unitPriceNok} kr` : '—'}
                      </td>
                      <td className="py-2 pr-2 align-middle tabular-nums">{sub != null ? `${sub} kr` : '—'}</td>
                      <td className="py-2 pl-1 align-middle text-center">
                        <span
                          className="inline-block align-middle"
                          style={{
                            width: 16,
                            height: 16,
                            minWidth: 16,
                            minHeight: 16,
                            border: '2px solid #171717',
                            borderRadius: 2,
                            boxSizing: 'border-box',
                          }}
                          aria-hidden
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )
      })}
      <div className="mt-6 border-t-2 border-neutral-800 pt-2 text-sm font-semibold">
        Gjenstår (antall linjer): {totalLines}
        <span className="ml-4">Sum estimat (ikke avkrysset, med pris): {sumNok} kr</span>
      </div>
    </div>
  )
})
