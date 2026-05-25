import { BANK_IMPORT_HISTORY_MAX } from '@/lib/bankImport/bankImport.constants'
import type { BankImportRun } from '@/lib/bankImport/types'
import { sumTxForCategoryInYear } from '@/lib/budgetYearHelpers'
import type { PersistedAppSlice, PersonData, Transaction } from '@/lib/store'
import { syncLinkedSavingsGoalsCurrent } from '@/lib/store'

function recalcPersonBudgetSpentForYear(
  person: PersonData,
  profileId: string,
  year: number,
): PersonData {
  const def = person.defaultIncomeWithholding
  const budgetCategories = person.budgetCategories.map((c) => ({
    ...c,
    spent: sumTxForCategoryInYear(person.transactions, c.name, c.type, year, profileId, def),
  }))
  return syncLinkedSavingsGoalsCurrent({ ...person, budgetCategories }, profileId)
}

function resolveOwnerProfileId(slice: PersistedAppSlice, profileId: string): string {
  if (slice.profiles.some((p) => p.id === profileId) && slice.people[profileId]) {
    return profileId
  }
  return slice.activeProfileId
}

/** Server-side equivalent of addBankImportRunWithTransactions (no budget adjustment). */
export function applyBankImportToPersistedSlice(
  slice: PersistedAppSlice,
  run: BankImportRun,
  incoming: Transaction[],
): PersistedAppSlice {
  const historySlice = [run, ...slice.bankImportHistory].slice(0, BANK_IMPORT_HISTORY_MAX)
  let nextPeople = { ...slice.people }

  if (!incoming.length) {
    return { ...slice, people: nextPeople, bankImportHistory: historySlice }
  }

  const groups = new Map<string, Transaction[]>()
  for (const t of incoming) {
    const pid = resolveOwnerProfileId(slice, t.profileId ?? run.profileId)
    const tx: Transaction = { ...t, profileId: pid }
    const arr = groups.get(pid) ?? []
    arr.push(tx)
    groups.set(pid, arr)
  }

  for (const [pid, txs] of groups) {
    const person = nextPeople[pid]
    if (!person) continue
    const next = syncLinkedSavingsGoalsCurrent(
      { ...person, transactions: [...txs, ...person.transactions] },
      pid,
    )
    nextPeople = {
      ...nextPeople,
      [pid]: recalcPersonBudgetSpentForYear(next, pid, slice.budgetYear),
    }
  }

  return { ...slice, people: nextPeople, bankImportHistory: historySlice }
}
