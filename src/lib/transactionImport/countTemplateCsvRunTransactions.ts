import type { PersonData } from '@/lib/store'

export function countTemplateCsvRunTransactions(
  people: Record<string, PersonData>,
  profileId: string,
  runId: string,
): number {
  const person = people[profileId]
  if (!person) return 0
  return person.transactions.filter((t) => t.templateCsvImportRunId === runId).length
}
