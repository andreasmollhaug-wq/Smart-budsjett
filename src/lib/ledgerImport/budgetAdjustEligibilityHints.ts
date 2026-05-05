import type { LedgerBudgetAdjustReason } from '@/lib/ledgerImport/ledgerImportBudgetAdjust'

export function ledgerBudgetAdjustBlockedUserMessage(
  reason: LedgerBudgetAdjustReason | undefined,
  budgetYear: number,
): string {
  switch (reason) {
    case 'multi_year':
      return 'Importen dekker flere kalenderår. Begrens til ett år i filen, eller importer ett år om gangen.'
    case 'wrong_year':
      return `Alle poster må tilhøre budsjettåret ${budgetYear} i appen (samme år som budsjettvisningen).`
    case 'empty':
      return 'Ingen linjer å importere.'
    default:
      return ''
  }
}
