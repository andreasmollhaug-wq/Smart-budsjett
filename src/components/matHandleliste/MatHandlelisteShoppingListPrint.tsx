'use client'

import { catalogPriceBasisLabel, estimatedShoppingListLineTotalNok } from '@/features/matHandleliste/estimateShoppingListPrice'
import { categoryLabel } from '@/features/matHandleliste/categoryMap'
import { mergeShoppingListPdfLayout, type ShoppingListPdfLayoutOptions } from '@/features/matHandleliste/printPdfLayout'
import type { IngredientUnit, ShoppingListItem } from '@/features/matHandleliste/types'
import { SHOPPING_LIST_PDF_CAPTURE_ROOT_ID } from '@/lib/exportShoppingListPdf'
import { useStore } from '@/lib/store'
import { ctaGradientForUiPalette } from '@/lib/uiColorPalette'
import { forwardRef, useMemo } from 'react'

/**
 * Kun hex/rgb her – html2canvas 1.4.x støtter ikke lab()/oklch() fra Tailwind v4-palett.
 */
const PDF_COLORS = {
  bg: '#ffffff',
  text: '#111111',
  borderLight: '#e5e5e5',
  borderMedium: '#d4d4d4',
  textTitle: '#171717',
  textSubtitle: '#262626',
  textMuted: '#525252',
  textBody: '#404040',
  textLabel: '#737373',
  footerBorder: '#262626',
  rowBorder: '#e5e5e5',
  amber800: '#92400e',
  amber900: '#78350f',
  white: '#ffffff',
} as const

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

export type MatHandlelisteShoppingListPrintVariant = 'handleliste' | 'plan'

export const MatHandlelisteShoppingListPrint = forwardRef<
  HTMLDivElement,
  {
    list: ShoppingListItem[]
    categoryOrder: string[]
    /** Hovedoverskrift i PDF-en. */
    title?: string
    /** Ekstra linje under tittel (f.eks. ukeintervall). */
    subtitle?: string
    /** Kort ingress under dato/disclaimer. */
    intro?: string
    /**
     * Styr hvilke deler som vises (PDF-modal). Kombineres med `showBrand` for bakoverkompatibilitet —
     * `layout` overstyrer når felter er eksplisitt satt fra modal/draft.
     */
    layout?: Partial<ShoppingListPdfLayoutOptions>
    /** Vikt Legacy: brukes når ikkesatt i `layout` (plan-PDF ønsker merke som standard til modal kobles). */
    showBrand?: boolean
    /** handleliste = full disclaimer; plan = kortere variant for måltidsplan-PDF. */
    variant?: MatHandlelisteShoppingListPrintVariant
    /** Forhåndsvisning må ikke duplikere id på `SHOPPING_LIST_PDF_CAPTURE_ROOT_ID`. */
    suppressPdfCaptureRootId?: boolean
  }
>(function MatHandlelisteShoppingListPrint(
  {
    list,
    categoryOrder,
    title = 'Handleliste',
    subtitle,
    intro,
    showBrand = false,
    layout: layoutPartial,
    variant = 'handleliste',
    suppressPdfCaptureRootId = false,
  },
  ref,
) {
  const uiColorPalette = useStore((s) => s.uiColorPalette)
  const brandGradient = ctaGradientForUiPalette(uiColorPalette)
  const L = mergeShoppingListPdfLayout({
    ...(showBrand ? { showBrand: true } : {}),
    ...(layoutPartial ?? {}),
  })
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
      const line = estimatedShoppingListLineTotalNok(it)
      if (line != null) sum += line
    }
    return { byCategory: map, totalLines: list.filter((it) => !it.checked).length, sumNok: sum }
  }, [list, categoryOrder])

  const dateStr = new Date().toLocaleDateString('nb-NO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isPlan = variant === 'plan'

  return (
    <div
      ref={ref}
      id={suppressPdfCaptureRootId ? undefined : SHOPPING_LIST_PDF_CAPTURE_ROOT_ID}
      className="w-[190mm] p-6 text-sm"
      style={{
        background: PDF_COLORS.bg,
        color: PDF_COLORS.text,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {L.showBrand ? (
        <div
          className="mb-4 flex items-start gap-3 pb-4"
          style={{ borderBottom: `1px solid ${PDF_COLORS.borderLight}` }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={{ background: brandGradient, color: PDF_COLORS.white }}
          >
            SB
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-base font-bold leading-tight" style={{ color: PDF_COLORS.textTitle }}>
              Smart Budsjett
            </p>
            <p className="text-xs" style={{ color: PDF_COLORS.textLabel }}>
              by EnkelExcel
            </p>
          </div>
        </div>
      ) : null}

      <h1 className="text-xl font-bold">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm font-semibold" style={{ color: PDF_COLORS.textSubtitle }}>
          {subtitle}
        </p>
      ) : null}
      {L.showPrintDate ? (
        <p className="mt-1 text-xs" style={{ color: PDF_COLORS.textMuted }}>
          {dateStr}
        </p>
      ) : null}

      {intro ? (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: PDF_COLORS.textBody }}>
          {intro}
        </p>
      ) : null}

      {L.showDisclaimer ? (
        isPlan ? (
          <>
            <p className="mt-2 text-xs font-medium" style={{ color: PDF_COLORS.amber900 }}>
              Priser og delsumberegning er veiledende testdata – ikke markedspriser.
            </p>
            {L.showCheckboxColumn ? (
              <p className="mt-1 text-xs" style={{ color: PDF_COLORS.textMuted }}>
                Tom rute til høyre – kryss av med penn når varen er handlet.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="mt-2 text-xs font-medium" style={{ color: PDF_COLORS.amber800 }}>
              Test/priser – veiledende. Ikke markedspriser.
            </p>
            {L.showCheckboxColumn ? (
              <p className="mt-1 text-xs" style={{ color: PDF_COLORS.textMuted }}>
                Listen viser kun varer som ikke er krysset av i appen. Tom rute til høyre – kryss av med penn i butikken.
              </p>
            ) : null}
          </>
        )
      ) : null}
      {categoryOrder.map((catId) => {
        const items = byCategory.get(catId) ?? []
        if (items.length === 0) return null
        return (
          <section key={catId} className="mt-4">
            <h2
              className="pb-1 text-sm font-semibold"
              style={{ borderBottom: `1px solid ${PDF_COLORS.borderMedium}`, color: PDF_COLORS.text }}
            >
              {categoryLabel(catId)}
            </h2>
            <table className="mt-2 w-full table-fixed text-left text-xs">
              <colgroup>
                {L.showPriceColumns && L.showCheckboxColumn ? (
                  <>
                    <col className="w-[36%]" />
                    <col className="w-[18%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                  </>
                ) : L.showPriceColumns && !L.showCheckboxColumn ? (
                  <>
                    <col className="w-[40%]" />
                    <col className="w-[24%]" />
                    <col className="w-[18%]" />
                    <col className="w-[18%]" />
                  </>
                ) : !L.showPriceColumns && L.showCheckboxColumn ? (
                  <>
                    <col className="w-[46%]" />
                    <col className="w-[34%]" />
                    <col className="w-[20%]" />
                  </>
                ) : (
                  <>
                    <col className="w-[52%]" />
                    <col className="w-[48%]" />
                  </>
                )}
              </colgroup>
              <thead>
                <tr style={{ color: PDF_COLORS.textMuted }}>
                  <th className="py-1 pr-2">Vare</th>
                  <th className="py-1 pr-2">Mengde</th>
                  {L.showPriceColumns ? (
                    <>
                      <th className="py-1 pr-2">Katalog</th>
                      <th className="py-1 pr-2">Delsum</th>
                    </>
                  ) : null}
                  {L.showCheckboxColumn ? (
                    <th className="py-1 pl-1 text-center font-normal">Huket</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const sub = estimatedShoppingListLineTotalNok(it)
                  return (
                    <tr key={it.id} style={{ borderTop: `1px solid ${PDF_COLORS.rowBorder}`, color: PDF_COLORS.text }}>
                      <td className="py-2 pr-2 align-middle font-medium">{it.displayName}</td>
                      <td className="py-2 pr-2 align-middle tabular-nums">{qtyLine(it)}</td>
                      {L.showPriceColumns ? (
                        <>
                          <td className="py-2 pr-2 align-middle tabular-nums">
                            {it.unitPriceNok != null ? `${it.unitPriceNok} ${catalogPriceBasisLabel(it.unit)}` : '—'}
                          </td>
                          <td className="py-2 pr-2 align-middle tabular-nums">{sub != null ? `${sub} kr` : '—'}</td>
                        </>
                      ) : null}
                      {L.showCheckboxColumn ? (
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
                      ) : null}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )
      })}
      {L.showLineCountFooter || (L.showEstimatedSumFooter && L.showPriceColumns) ? (
        <div
          className="mt-6 pt-2 text-sm font-semibold"
          style={{
            borderTop: `2px solid ${PDF_COLORS.footerBorder}`,
            color: PDF_COLORS.text,
          }}
        >
          {L.showLineCountFooter ? <span>Gjenstår (antall linjer): {totalLines}</span> : null}
          {L.showLineCountFooter && L.showEstimatedSumFooter && L.showPriceColumns ? (
            <span className="ml-4">
              Sum estimat (ikke avkrysset, med pris): {sumNok} kr
            </span>
          ) : null}
          {!L.showLineCountFooter && L.showEstimatedSumFooter && L.showPriceColumns ? (
            <span>Sum estimat (ikke avkrysset, med pris): {sumNok} kr</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
})
