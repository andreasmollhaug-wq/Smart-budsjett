import type { LedgerBudgetAdjustmentSnapshot } from '@/lib/ledgerImport/types'

export interface TemplateCsvImportRun {
  id: string
  createdAt: string
  profileId: string
  csvProfileId: string
  fileName: string | null
  displayName?: string | null
  rowCountParsed: number
  rowCountImported: number
  rowCountSkipped: number
  errorSummary: string | null
  budgetAdjustment?: LedgerBudgetAdjustmentSnapshot
}
