import { beforeEach, describe, expect, it } from 'vitest'
import type { BankImportRun } from '@/lib/bankImport/types'
import type { TemplateCsvImportRun } from '@/lib/transactionImport/templateCsvImportRun'
import { TEMPLATE_CSV_IMPORT_PROFILE_ID } from '@/lib/transactionImport/transactionImport.constants'
import { BANK_IMPORT_PROFILE_ID } from '@/lib/bankImport/bankImport.constants'
import { DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from '@/lib/store'

function templateRun(id: string, displayName: string | null): TemplateCsvImportRun {
  return {
    id,
    createdAt: '2026-03-01T12:00:00.000Z',
    profileId: DEFAULT_PROFILE_ID,
    csvProfileId: TEMPLATE_CSV_IMPORT_PROFILE_ID,
    fileName: 'x.csv',
    displayName,
    rowCountParsed: 1,
    rowCountImported: 1,
    rowCountSkipped: 0,
    errorSummary: null,
  }
}

function bankRun(id: string, displayName: string | null): BankImportRun {
  return {
    id,
    createdAt: '2026-03-01T12:00:00.000Z',
    sourceId: 'dnb_sbanken',
    profileId: DEFAULT_PROFILE_ID,
    csvProfileId: BANK_IMPORT_PROFILE_ID,
    fileName: 'x.xlsx',
    displayName,
    rowCountParsed: 1,
    rowCountImported: 1,
    rowCountSkipped: 0,
    errorSummary: null,
    importedLines: [],
  }
}

describe('import run displayName updates', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('updateTemplateCsvImportRunDisplayName oppdaterer visningsnavn', () => {
    useStore.setState({ templateCsvImportHistory: [templateRun('csv-1', null)] })
    useStore.getState().updateTemplateCsvImportRunDisplayName('csv-1', '  Min import  ')
    expect(useStore.getState().templateCsvImportHistory[0]!.displayName).toBe('Min import')
  })

  it('updateTemplateCsvImportRunDisplayName tom streng blir null', () => {
    useStore.setState({ templateCsvImportHistory: [templateRun('csv-2', 'Old')] })
    useStore.getState().updateTemplateCsvImportRunDisplayName('csv-2', '   ')
    expect(useStore.getState().templateCsvImportHistory[0]!.displayName).toBeNull()
  })

  it('updateTemplateCsvImportRunDisplayName ukjent id ingen endring', () => {
    useStore.setState({ templateCsvImportHistory: [templateRun('csv-3', null)] })
    const before = useStore.getState().templateCsvImportHistory
    useStore.getState().updateTemplateCsvImportRunDisplayName('missing', 'N')
    expect(useStore.getState().templateCsvImportHistory).toBe(before)
  })

  it('updateBankImportRunDisplayName oppdaterer visningsnavn', () => {
    useStore.setState({ bankImportHistory: [bankRun('b-1', null)] })
    useStore.getState().updateBankImportRunDisplayName('b-1', 'Bank januar')
    expect(useStore.getState().bankImportHistory[0]!.displayName).toBe('Bank januar')
  })

  it('updateBankImportRunDisplayName ukjent id ingen endring', () => {
    useStore.setState({ bankImportHistory: [bankRun('b-2', null)] })
    const before = useStore.getState().bankImportHistory
    useStore.getState().updateBankImportRunDisplayName('nope', 'X')
    expect(useStore.getState().bankImportHistory).toBe(before)
  })
})
