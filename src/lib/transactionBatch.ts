import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'
import type { Transaction } from '@/lib/store'
import { generateId, parseIntegerNbNo } from '@/lib/utils'

export type SameDayBatchRowInput = {
  id: string
  /** Begrenser kategoriliste; «alle» som i enkeltflyt. */
  formParent: ParentCategory | 'all'
  description: string
  amount: string
  category: string
  subcategory: string
}

export function filterCategoryOptionsForParent(
  categoryOptions: BudgetCategory[],
  formParent: ParentCategory | 'all',
): BudgetCategory[] {
  const p = formParent ?? 'all'
  if (p === 'all') return categoryOptions
  return categoryOptions.filter((c) => c.parentCategory === p)
}

export function createEmptyBatchRow(): SameDayBatchRowInput {
  return {
    id: generateId(),
    formParent: 'all',
    description: '',
    amount: '',
    category: '',
    subcategory: '',
  }
}

function rowHasAnyInput(row: SameDayBatchRowInput): boolean {
  const parent = row.formParent ?? 'all'
  if (parent !== 'all') return true
  if (row.description.trim()) return true
  if (row.category.trim()) return true
  if (row.subcategory.trim()) return true
  const n = parseIntegerNbNo(row.amount)
  return Number.isFinite(n)
}

function rowIsComplete(row: SameDayBatchRowInput): boolean {
  if (!row.description.trim()) return false
  if (!row.category.trim()) return false
  const n = parseIntegerNbNo(row.amount)
  return Number.isFinite(n)
}

/**
 * Bygger transaksjoner fra batch-rader med felles dato.
 * Tomme rader hoppes over. Delvise rader gir feil med radnummer (1-basert).
 */
export function validateAndBuildSameDayTransactions(
  rows: SameDayBatchRowInput[],
  opts: {
    date: string
    categoryOptions: BudgetCategory[]
    todayStr: string
    profilePatch: Pick<Transaction, 'profileId'> | Record<string, never>
  },
): { ok: true; transactions: Transaction[] } | { ok: false; message: string } {
  const { date, categoryOptions, todayStr, profilePatch } = opts

  if (!date || date.length < 10) {
    return { ok: false, message: 'Velg en gyldig dato.' }
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    const idx = i + 1
    if (!rowHasAnyInput(row)) continue
    if (!rowIsComplete(row)) {
      return {
        ok: false,
        message: `Rad ${idx}: Fyll inn beskrivelse, beløp og kategori (som passer valgt hovedgruppe).`,
      }
    }
  }

  const txs: Transaction[] = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    if (!rowIsComplete(row)) continue

    const amountNum = parseIntegerNbNo(row.amount)
    if (!Number.isFinite(amountNum)) {
      return { ok: false, message: `Rad ${i + 1}: Ugyldig beløp.` }
    }

    const parent = row.formParent ?? 'all'
    const pool = filterCategoryOptionsForParent(categoryOptions, parent)
    const meta = pool.find((c) => c.name === row.category)
    if (!meta) {
      return {
        ok: false,
        message: `Rad ${i + 1}: Velg kategori som hører til valgt hovedgruppe.`,
      }
    }

    const sub = row.subcategory.trim()
    txs.push({
      id: generateId(),
      date,
      description: row.description.trim(),
      amount: amountNum,
      category: row.category,
      type: meta.type,
      ...profilePatch,
      ...(sub ? { subcategory: sub } : {}),
      ...(date > todayStr ? { plannedFollowUp: true as const } : {}),
    })
  }

  if (txs.length === 0) {
    return { ok: false, message: 'Fyll inn minst én fullstendig transaksjon.' }
  }

  return { ok: true, transactions: txs }
}
