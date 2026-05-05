import type { PersonData } from '@/lib/store'

export function countBankRunTransactions(
  people: Record<string, PersonData>,
  profileId: string,
  runId: string,
): number {
  const person = people[profileId]
  if (!person) return 0
  let n = 0
  for (const t of person.transactions) {
    if (t.bankImportRunId === runId) n++
  }
  return n
}
