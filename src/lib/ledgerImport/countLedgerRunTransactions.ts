import type { PersonData } from '@/lib/store'

/** Antall transaksjoner for en profil som er knyttet til en regnskapsimport-kjøring. */
export function countLedgerRunTransactions(
  people: Record<string, PersonData>,
  profileId: string,
  runId: string,
): number {
  const person = people[profileId]
  if (!person) return 0
  let n = 0
  for (const t of person.transactions) {
    if (t.ledgerImportRunId === runId) n++
  }
  return n
}
