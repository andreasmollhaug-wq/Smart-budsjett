'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Fragment, useEffect, useState } from 'react'
import ImportCategoryPicker from '@/components/konto/ImportCategoryPicker'
import type { BankImportMappingRule } from '@/lib/bankImport/types'
import type { BankParsedRow } from '@/lib/bankImport/types'
import {
  formatMoneyInputFromNumberTwoDecimals,
  normalizeNorwegianAmountToPlainDecimalString,
  roundMoney2,
} from '@/lib/money/parseNorwegianAmount'
import type { ParsedTransactionRow } from '@/lib/transactionImport/parseTransactionCsv'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'

export type CsvPreviewSection = {
  key: string
  showHeading: boolean
  title: string
  subtitle: string | null
  rows: ParsedTransactionRow[]
  total: number
}

export type BankPreviewSection = {
  key: string
  showHeading: boolean
  title: string
  subtitle: string | null
  rows: BankParsedRow[]
  total: number
}

const UNCATEGORIZED_BANK_PREVIEW_LABEL = 'Ikke satt'

function groupBankPreviewRowsByResolvedCategory(
  rows: BankParsedRow[],
  bankMaps: Record<string, BankImportMappingRule | undefined>,
  resolve: (
    maps: Record<string, BankImportMappingRule | undefined>,
    row: BankParsedRow,
  ) => string | undefined,
): { label: string; rows: BankParsedRow[] }[] {
  const bucket = new Map<string, BankParsedRow[]>()
  for (const r of rows) {
    const label = resolve(bankMaps, r)?.trim() || UNCATEGORIZED_BANK_PREVIEW_LABEL
    const list = bucket.get(label)
    if (list) list.push(r)
    else bucket.set(label, [r])
  }
  const labels = [...bucket.keys()].sort((a, b) => {
    if (a === UNCATEGORIZED_BANK_PREVIEW_LABEL) return 1
    if (b === UNCATEGORIZED_BANK_PREVIEW_LABEL) return -1
    return a.localeCompare(b, 'nb', { sensitivity: 'base' })
  })
  return labels.map((label) => {
    const list = bucket.get(label)!
    list.sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.fileLine - b.fileLine)
    return { label, rows: list }
  })
}

function parseBankPreviewAmountCommitted(raw: string): number | null {
  const plain = normalizeNorwegianAmountToPlainDecimalString(raw.trim(), { allowTrailingComma: true })
  if (plain == null) return null
  const n = roundMoney2(Number(plain))
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function BankImportPreviewAmountCell({
  fileLine,
  parsedAmount,
  effectiveAmount,
  onCommit,
}: {
  fileLine: number
  parsedAmount: number
  effectiveAmount: number
  onCommit: (fileLine: number, amount: number | null) => void
}) {
  const [text, setText] = useState(() => formatMoneyInputFromNumberTwoDecimals(effectiveAmount))

  useEffect(() => {
    setText(formatMoneyInputFromNumberTwoDecimals(effectiveAmount))
  }, [fileLine, effectiveAmount])

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={`Beløp i kroner, linje ${fileLine}`}
      className="w-full min-w-[4.5rem] max-w-[9rem] rounded-lg border px-2 py-2 text-sm tabular-nums text-right min-h-[44px] touch-manipulation ml-auto"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
      value={text}
      onChange={(e) => {
        const v = e.target.value.replace(/[^\d,.\s]/g, '')
        setText(v)
      }}
      onBlur={() => {
        if (text.trim() === '') {
          setText(formatMoneyInputFromNumberTwoDecimals(parsedAmount))
          onCommit(fileLine, null)
          return
        }
        const n = parseBankPreviewAmountCommitted(text)
        if (n === null) {
          setText(formatMoneyInputFromNumberTwoDecimals(effectiveAmount))
          return
        }
        setText(formatMoneyInputFromNumberTwoDecimals(n))
        onCommit(fileLine, roundMoney2(n) === roundMoney2(parsedAmount) ? null : n)
      }}
    />
  )
}

export function CsvTransactionImportPreviewTable({
  sections,
  excludedCsvFileLines,
  setExcludedCsvFileLines,
  formatNOKImport,
}: {
  sections: CsvPreviewSection[]
  excludedCsvFileLines: Set<number>
  setExcludedCsvFileLines: Dispatch<SetStateAction<Set<number>>>
  formatNOKImport: (amount: number) => string
}) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0">
        <tr style={{ background: 'var(--bg)' }}>
          <th className="text-center px-2 py-2 font-medium whitespace-nowrap w-12">Med</th>
          <th className="text-left px-3 py-2 font-medium">Dato</th>
          <th className="text-left px-3 py-2 font-medium">Kategori</th>
          <th className="text-left px-3 py-2 font-medium">Type</th>
          <th className="text-right px-3 py-2 font-medium">Beløp</th>
          <th className="text-left px-3 py-2 font-medium">Beskrivelse</th>
        </tr>
      </thead>
      {sections.map((sec) => (
        <tbody key={sec.key}>
          {sec.showHeading && (
            <tr style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
              <td colSpan={6} className="px-3 py-2 align-top">
                <p className="text-xs font-semibold m-0" style={{ color: 'var(--text)' }}>
                  {sec.title}
                </p>
                {sec.subtitle && (
                  <p className="text-[11px] m-0 mt-1 leading-snug min-w-0" style={{ color: 'var(--text-muted)' }}>
                    {sec.subtitle}
                  </p>
                )}
              </td>
            </tr>
          )}
          {sec.rows.map((r) => (
            <tr key={`${sec.key}-${r.fileLine}-${r.dateIso}`} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-2 py-2 text-center align-middle">
                <label className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation mx-auto">
                  <input
                    type="checkbox"
                    className="rounded border touch-manipulation"
                    style={{ borderColor: 'var(--border)' }}
                    checked={!excludedCsvFileLines.has(r.fileLine)}
                    onChange={(e) => {
                      const on = e.target.checked
                      setExcludedCsvFileLines((prev) => {
                        const next = new Set(prev)
                        if (on) next.delete(r.fileLine)
                        else next.add(r.fileLine)
                        return next
                      })
                    }}
                    aria-label={`Ta med rad ${r.fileLine} i importen`}
                  />
                </label>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{formatIsoDateDdMmYyyy(r.dateIso)}</td>
              <td className="px-3 py-2">{r.categoryRaw}</td>
              <td
                className="px-3 py-2 text-xs"
                style={{ color: r.transactionType === 'income' ? 'var(--success)' : 'var(--danger)' }}
              >
                {r.transactionType === 'income' ? 'Inntekt' : 'Utgift'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatNOKImport(r.amount)}</td>
              <td className="px-3 py-2 min-w-0" style={{ color: 'var(--text-muted)' }}>
                {r.description || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  )
}

export function BankTransactionImportPreviewTable({
  sections,
  excludedBankFileLines,
  setExcludedBankFileLines,
  bankParsedRowByFileLine,
  person,
  bankMaps,
  pickerCategories,
  resolveBankMappingCategoryName,
  applyBankMappingWithLegacyFanout,
  budgetCategories,
  customBudgetLabels,
  addBudgetCategory,
  addCustomBudgetLabel,
  bankAmountOverridesByLine,
  setBankLineAmountOverride,
  formatNOKImport,
  fieldIdScope,
  /** Kun utvidet forhåndsvisning: underseksjoner sortert etter valgt kategori innen hver filseksjon (øvrige / kontoregulering). */
  groupRowsByCategory = false,
}: {
  sections: BankPreviewSection[]
  excludedBankFileLines: Set<number>
  setExcludedBankFileLines: Dispatch<SetStateAction<Set<number>>>
  bankParsedRowByFileLine: Map<number, BankParsedRow>
  person: {
    budgetCategories: BudgetCategory[]
  } | null
  bankMaps: Record<string, BankImportMappingRule | undefined>
  pickerCategories: BudgetCategory[]
  resolveBankMappingCategoryName: (
    maps: Record<string, BankImportMappingRule | undefined>,
    row: BankParsedRow,
  ) => string | undefined
  applyBankMappingWithLegacyFanout: (primaryKey: string, rule: { categoryName: string } | null) => void
  budgetCategories: BudgetCategory[]
  customBudgetLabels: Record<string, string[]>
  addBudgetCategory: (c: BudgetCategory) => void
  addCustomBudgetLabel: (parent: ParentCategory, label: string) => void
  bankAmountOverridesByLine: Record<number, number>
  setBankLineAmountOverride: (fileLine: number, amount: number | null) => void
  formatNOKImport: (amount: number) => string
  /** Unik prefix for felt-ID ved flere tabeller (inline + modal). */
  fieldIdScope: string
  groupRowsByCategory?: boolean
}) {
  const renderBankRow = (r: BankParsedRow, keyPrefix: string) => {
    const parsedAmount = bankParsedRowByFileLine.get(r.fileLine)?.amount ?? r.amount
    return (
      <tr
        key={`${fieldIdScope}-${keyPrefix}-${r.fileLine}-${r.dateIso}-${r.mappingKey}`}
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <td className="px-2 py-2 text-center align-top">
          <label className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation mx-auto">
            <input
              type="checkbox"
              className="rounded border touch-manipulation"
              style={{ borderColor: 'var(--border)' }}
              checked={!excludedBankFileLines.has(r.fileLine)}
              onChange={(e) => {
                const on = e.target.checked
                setExcludedBankFileLines((prev) => {
                  const next = new Set(prev)
                  if (on) next.delete(r.fileLine)
                  else next.add(r.fileLine)
                  return next
                })
              }}
              aria-label={`Ta med rad ${r.fileLine} i importen`}
            />
          </label>
        </td>
        <td className="px-3 py-2 whitespace-nowrap align-top">{formatIsoDateDdMmYyyy(r.dateIso)}</td>
        <td className="px-3 py-2 min-w-0 align-top w-full max-w-[min(100%,20rem)] sm:max-w-none sm:w-auto">
          {person ? (
            <ImportCategoryPicker
              fieldId={`${fieldIdScope}-bank-preview-${r.fileLine}-${r.mappingKey}`}
              value={resolveBankMappingCategoryName(bankMaps, r) ?? ''}
              onChange={(name) =>
                applyBankMappingWithLegacyFanout(r.mappingKey, name?.trim() ? { categoryName: name.trim() } : null)
              }
              categories={pickerCategories.filter((c) => c.type === r.transactionType)}
              budgetCategories={budgetCategories}
              customBudgetLabels={customBudgetLabels}
              addBudgetCategory={addBudgetCategory}
              addCustomBudgetLabel={addCustomBudgetLabel}
            />
          ) : (
            <span className="inline-block py-2">{resolveBankMappingCategoryName(bankMaps, r) ?? '—'}</span>
          )}
        </td>
        <td
          className="px-3 py-2 text-xs align-top"
          style={{ color: r.transactionType === 'income' ? 'var(--success)' : 'var(--danger)' }}
        >
          {r.transactionType === 'income' ? 'Inntekt' : 'Utgift'}
        </td>
        <td className="px-3 py-2 align-top min-w-0">
          {person ? (
            <div className="flex flex-col gap-1 items-end min-w-0">
              <BankImportPreviewAmountCell
                fileLine={r.fileLine}
                parsedAmount={parsedAmount}
                effectiveAmount={r.amount}
                onCommit={setBankLineAmountOverride}
              />
              {bankAmountOverridesByLine[r.fileLine] !== undefined && (
                <span
                  className="text-[10px] tabular-nums leading-tight text-right break-words max-w-[12rem]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Fra fil: {formatNOKImport(parsedAmount)}
                </span>
              )}
            </div>
          ) : (
            <span className="inline-block py-2 tabular-nums text-right w-full">{formatNOKImport(r.amount)}</span>
          )}
        </td>
        <td className="px-3 py-2 min-w-0 break-words align-top" style={{ color: 'var(--text-muted)' }}>
          {r.forklaringRaw || '—'}
        </td>
      </tr>
    )
  }

  return (
    <table className="w-full text-sm min-w-0">
      <thead className="sticky top-0">
        <tr style={{ background: 'var(--bg)' }}>
          <th className="text-center px-2 py-2 font-medium whitespace-nowrap w-12">Med</th>
          <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Dato</th>
          <th className="text-left px-3 py-2 font-medium min-w-[12rem]">Kategori</th>
          <th className="text-left px-3 py-2 font-medium">Type</th>
          <th className="text-right px-3 py-2 font-medium whitespace-nowrap min-w-0">Beløp (kr)</th>
          <th className="text-left px-3 py-2 font-medium min-w-0">Forklaring</th>
        </tr>
      </thead>
      {sections.map((sec) => (
        <tbody key={sec.key}>
          {sec.showHeading && (
            <tr style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
              <td colSpan={6} className="px-3 py-2 align-top">
                <p className="text-xs font-semibold m-0" style={{ color: 'var(--text)' }}>
                  {sec.title}
                </p>
                {sec.subtitle && (
                  <p className="text-[11px] m-0 mt-1 leading-snug min-w-0" style={{ color: 'var(--text-muted)' }}>
                    {sec.subtitle}
                  </p>
                )}
              </td>
            </tr>
          )}
          {groupRowsByCategory
            ? groupBankPreviewRowsByResolvedCategory(sec.rows, bankMaps, resolveBankMappingCategoryName).map(
                ({ label: catLabel, rows: catRows }) => {
                  const catSum = roundMoney2(catRows.reduce((s, row) => s + row.amount, 0))
                  return (
                    <Fragment key={`${sec.key}-cat-${catLabel}`}>
                      <tr style={{ background: 'color-mix(in srgb, var(--surface) 88%, var(--border))', borderTop: '1px solid var(--border)' }}>
                        <td colSpan={6} className="px-3 py-2 align-top">
                          <p className="text-xs font-semibold m-0" style={{ color: 'var(--text)' }}>
                            {catLabel}
                          </p>
                          <p className="text-[11px] m-0 mt-0.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {catRows.length} rad{catRows.length === 1 ? '' : 'er'} · Sum {formatNOKImport(catSum)}
                          </p>
                        </td>
                      </tr>
                      {catRows.map((r) => renderBankRow(r, `${sec.key}-${catLabel}`))}
                    </Fragment>
                  )
                },
              )
            : sec.rows.map((r) => renderBankRow(r, sec.key))}
        </tbody>
      ))}
    </table>
  )
}
