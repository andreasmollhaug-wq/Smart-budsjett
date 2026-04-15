'use client'

import BudgetCategoryPicker from '@/components/transactions/BudgetCategoryPicker'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { REPORT_GROUP_LABELS, REPORT_GROUP_ORDER } from '@/lib/bankReportData'
import type { SameDayBatchRowInput } from '@/lib/transactionBatch'
import { createEmptyBatchRow, filterCategoryOptionsForParent } from '@/lib/transactionBatch'
import type { BudgetCategory } from '@/lib/store'
import { formatIntegerNbNo, formatIntegerNbNoWhileTyping, parseIntegerNbNo } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'

const MAX_ROWS = 30

const borderColor = 'var(--border)'

type Profile = { id: string; name: string }

type Props = {
  batchDate: string
  onBatchDateChange: (iso: string) => void
  rows: SameDayBatchRowInput[]
  onRowsChange: (rows: SameDayBatchRowInput[] | ((prev: SameDayBatchRowInput[]) => SameDayBatchRowInput[])) => void
  categoryOptions: BudgetCategory[]
  formError: string | null
  onSubmit: () => void
  onCancel: () => void
  showHouseholdProfilePicker: boolean
  profiles: Profile[]
  formTargetProfileId: string
  onProfileChange: (id: string) => void
}

export default function SameDayBatchTransactionForm({
  batchDate,
  onBatchDateChange,
  rows,
  onRowsChange,
  categoryOptions,
  formError,
  onSubmit,
  onCancel,
  showHouseholdProfilePicker,
  profiles,
  formTargetProfileId,
  onProfileChange,
}: Props) {
  const updateRow = (id: string, patch: Partial<SameDayBatchRowInput>) => {
    onRowsChange((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const setFormParentForRow = (id: string, value: ParentCategory | 'all') => {
    onRowsChange((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const next: SameDayBatchRowInput = { ...r, formParent: value }
        const pool = filterCategoryOptionsForParent(categoryOptions, value)
        if (r.category && !pool.some((c) => c.name === r.category)) {
          return { ...next, category: '' }
        }
        return next
      }),
    )
  }

  const addRow = () => {
    if (rows.length >= MAX_ROWS) return
    onRowsChange((prev) => [...prev, createEmptyBatchRow()])
  }

  const removeRow = (id: string) => {
    if (rows.length <= 1) return
    onRowsChange((prev) => prev.filter((r) => r.id !== id))
  }

  const labelClass = 'block text-xs font-medium mb-1'
  const labelStyle = { color: 'var(--text-muted)' } as const
  const inputClass = 'w-full px-3 py-2.5 rounded-xl text-sm min-w-0'
  const inputStyle = { border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' } as const

  const cellInputClass =
    'w-full min-w-0 h-10 px-2.5 rounded-lg text-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]'
  const pickerBtnClass = 'min-h-10 h-10 py-1.5 px-2.5 rounded-lg text-sm min-w-[10rem] w-full touch-manipulation'

  return (
    <div className="space-y-3 min-w-0">
      <div
        className="rounded-xl p-3 sm:p-4 space-y-3 min-w-0"
        style={{ background: 'var(--bg)', border: `1px solid ${borderColor}` }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Alle linjer får samme dato. Hver rad er én linje i tabellen – du kan tabbe deg bortover og nedover. På smal skjerm
          kan du scrolle sidelengs.
        </p>

        <div
          className={`flex flex-col gap-3 min-w-0 ${showHouseholdProfilePicker ? 'sm:flex-row sm:flex-wrap sm:items-end' : ''}`}
        >
          {showHouseholdProfilePicker && (
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <label className={labelClass} style={labelStyle}>
                Profil
              </label>
              <select
                value={formTargetProfileId}
                onChange={(e) => onProfileChange(e.target.value)}
                className={`${inputClass} min-h-[44px] touch-manipulation`}
                style={inputStyle}
                aria-label="Velg profil for nye transaksjoner"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="min-w-0 w-full sm:w-auto sm:max-w-[11rem]">
            <label className={labelClass} style={labelStyle}>
              Dato for alle
            </label>
            <input
              type="date"
              value={batchDate}
              onChange={(e) => onBatchDateChange(e.target.value)}
              className={`${inputClass} min-h-[44px]`}
              style={inputStyle}
            />
          </div>
        </div>

        <div
          className="min-w-0 rounded-lg border overflow-x-auto overscroll-x-contain"
          style={{ borderColor, background: 'var(--surface)' }}
        >
          <table className="w-full min-w-[720px] text-sm border-collapse caption-bottom">
            <caption className="sr-only">
              Transaksjoner, én rad per linje. Kolonner: nummer, hovedgruppe, kategori, beløp, beskrivelse, underkategori.
            </caption>
            <thead>
              <tr
                className="border-b text-left"
                style={{ borderColor, color: 'var(--text-muted)', background: 'var(--primary-pale)' }}
              >
                <th
                  scope="col"
                  className="sticky left-0 z-[1] w-10 px-2 py-2 text-xs font-medium whitespace-nowrap bg-[var(--primary-pale)]"
                >
                  #
                </th>
              <th scope="col" className="min-w-[9.5rem] px-2 py-2 text-xs font-medium whitespace-nowrap">
                Hovedgruppe
              </th>
              <th scope="col" className="min-w-[12rem] px-2 py-2 text-xs font-medium whitespace-nowrap">
                Kategori
              </th>
              <th scope="col" className="w-28 min-w-[7rem] px-2 py-2 text-xs font-medium whitespace-nowrap">
                Beløp (NOK)
              </th>
              <th scope="col" className="min-w-[12rem] w-[22%] px-2 py-2 text-xs font-medium whitespace-nowrap">
                Beskrivelse
              </th>
              <th scope="col" className="min-w-[9rem] px-2 py-2 text-xs font-medium whitespace-nowrap">
                Underkategori
              </th>
              <th scope="col" className="w-12 px-1 py-2 text-xs font-medium text-center whitespace-nowrap">
                <span className="sr-only">Fjern rad</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <BatchTableRow
                key={row.id}
                row={row}
                index={index}
                rowsLength={rows.length}
                categoryOptions={categoryOptions}
                cellInputClass={cellInputClass}
                pickerBtnClass={pickerBtnClass}
                onUpdate={updateRow}
                onFormParentChange={setFormParentForRow}
                onRemove={removeRow}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= MAX_ROWS}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium min-h-[44px]"
          style={{
            background: 'var(--surface)',
            color: rows.length >= MAX_ROWS ? 'var(--text-muted)' : 'var(--primary)',
            border: `1px solid ${borderColor}`,
          }}
          aria-label="Legg til ny rad"
        >
          <Plus size={16} aria-hidden />
          Legg til rad
        </button>
        {rows.length >= MAX_ROWS ? (
          <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>
            Maks {MAX_ROWS} rader
          </span>
        ) : null}
      </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white min-h-[44px]"
          style={{ background: 'var(--primary)' }}
        >
          Registrer alle
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px]"
          style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: `1px solid ${borderColor}` }}
        >
          Avbryt
        </button>
      </div>

      {formError ? (
        <p className="text-xs max-w-md" style={{ color: 'var(--text-muted)' }} role="status">
          {formError}
        </p>
      ) : null}
    </div>
  )
}

function BatchTableRow({
  row,
  index,
  rowsLength,
  categoryOptions,
  cellInputClass,
  pickerBtnClass,
  onUpdate,
  onFormParentChange,
  onRemove,
}: {
  row: SameDayBatchRowInput
  index: number
  rowsLength: number
  categoryOptions: BudgetCategory[]
  cellInputClass: string
  pickerBtnClass: string
  onUpdate: (id: string, patch: Partial<SameDayBatchRowInput>) => void
  onFormParentChange: (id: string, value: ParentCategory | 'all') => void
  onRemove: (id: string) => void
}) {
  const categoriesForRow = filterCategoryOptionsForParent(
    categoryOptions,
    row.formParent ?? 'all',
  )

  const rowNum = index + 1

  return (
    <tr className="border-b last:border-b-0" style={{ borderColor }}>
      <td
        className="sticky left-0 z-[1] px-2 py-2 align-middle text-center text-xs font-medium tabular-nums whitespace-nowrap bg-[var(--surface)]"
        style={{ color: 'var(--text-muted)' }}
      >
        {rowNum}
      </td>
      <td className="px-2 py-2 align-middle min-w-0">
        <label className="sr-only" htmlFor={`batch-parent-${row.id}`}>
          Hovedgruppe rad {rowNum}
        </label>
        <select
          id={`batch-parent-${row.id}`}
          value={row.formParent ?? 'all'}
          onChange={(e) =>
            onFormParentChange(
              row.id,
              e.target.value === 'all' ? 'all' : (e.target.value as ParentCategory),
            )
          }
          className={`${cellInputClass} touch-manipulation`}
        >
          <option value="all">Alle hovedgrupper</option>
          {REPORT_GROUP_ORDER.map((p) => (
            <option key={p} value={p}>
              {REPORT_GROUP_LABELS[p]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2 align-middle min-w-0">
        <label className="sr-only" htmlFor={`batch-cat-${row.id}`}>
          Kategori rad {rowNum}
        </label>
        <BudgetCategoryPicker
          id={`batch-cat-${row.id}`}
          value={row.category}
          onChange={(name) => onUpdate(row.id, { category: name })}
          categories={categoriesForRow}
          variant="pick"
          sortAlphabetically={false}
          className={pickerBtnClass}
        />
      </td>
      <td className="px-2 py-2 align-middle min-w-0">
        <label className="sr-only" htmlFor={`batch-amt-${row.id}`}>
          Beløp rad {rowNum}
        </label>
        <input
          id={`batch-amt-${row.id}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={row.amount}
          onChange={(e) => onUpdate(row.id, { amount: formatIntegerNbNoWhileTyping(e.target.value) })}
          onBlur={() => {
            const n = parseIntegerNbNo(row.amount)
            if (Number.isFinite(n)) onUpdate(row.id, { amount: formatIntegerNbNo(n) })
          }}
          className={cellInputClass}
        />
      </td>
      <td className="px-2 py-2 align-middle min-w-0">
        <label className="sr-only" htmlFor={`batch-desc-${row.id}`}>
          Beskrivelse rad {rowNum}
        </label>
        <input
          id={`batch-desc-${row.id}`}
          type="text"
          value={row.description}
          onChange={(e) => onUpdate(row.id, { description: e.target.value })}
          placeholder="Hva gjelder det?"
          className={cellInputClass}
          autoComplete="off"
        />
      </td>
      <td className="px-2 py-2 align-middle min-w-0">
        <label className="sr-only" htmlFor={`batch-sub-${row.id}`}>
          Underkategori rad {rowNum}
        </label>
        <input
          id={`batch-sub-${row.id}`}
          type="text"
          value={row.subcategory}
          onChange={(e) => onUpdate(row.id, { subcategory: e.target.value })}
          placeholder="Valgfritt"
          className={cellInputClass}
          autoComplete="off"
        />
      </td>
      <td className="px-1 py-2 align-middle text-center">
        {rowsLength > 1 ? (
          <button
            type="button"
            onClick={() => onRemove(row.id)}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg touch-manipulation mx-auto"
            style={{ color: 'var(--danger)' }}
            aria-label={`Fjern rad ${rowNum}`}
          >
            <Trash2 size={18} aria-hidden />
          </button>
        ) : (
          <span className="inline-block min-w-[44px]" aria-hidden />
        )}
      </td>
    </tr>
  )
}
