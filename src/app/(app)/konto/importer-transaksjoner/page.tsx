'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import BankImportHistoryList from '@/components/konto/BankImportHistoryList'
import TemplateCsvImportHistoryList from '@/components/konto/TemplateCsvImportHistoryList'
import BankImportMappingAggregateLists from '@/components/konto/BankImportMappingAggregateLists'
import BankTransactionImportDropzone from '@/components/konto/BankTransactionImportDropzone'
import TransactionImportDropzone from '@/components/konto/TransactionImportDropzone'
import TransactionImportGuideModal from '@/components/konto/TransactionImportGuide'
import type { TransactionImportGuideMode } from '@/components/konto/TransactionImportGuide'
import {
  BankTransactionImportPreviewTable,
  CsvTransactionImportPreviewTable,
} from '@/components/konto/transactionImportPreviewTables'
import TransactionImportSummaryModal from '@/components/konto/TransactionImportSummaryModal'
import { buildZeroBudgetCategory, shouldRegisterCustomLabel } from '@/lib/createBudgetCategoryZero'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { downloadTransactionImportTemplate } from '@/lib/transactionImport/downloadImportTemplate'
import { buildTransactionsFromImportRows } from '@/lib/transactionImport/buildTransactionsFromRows'
import { parseTransactionCsvText } from '@/lib/transactionImport/parseTransactionCsv'
import {
  collectUnknownCategoryNames,
  countPotentialDuplicateRows,
  resolveCategoryForImport,
} from '@/lib/transactionImport/resolveImportCategories'
import { summarizeImportedTransactions } from '@/lib/transactionImport/summarizeImport'
import { buildEffectivePickerCategoriesForCsvImport } from '@/lib/transactionImport/csvImportEffectivePicker'
import {
  IMPORT_FORMAT_V1,
  TEMPLATE_CSV_IMPORT_PROFILE_ID,
} from '@/lib/transactionImport/transactionImport.constants'
import { importTextContainsKontoregulering } from '@/lib/transactionImport/kontoreguleringImport'
import {
  canApplyLedgerBudgetAdjust,
  computeLedgerImportBudgetDeltas,
} from '@/lib/ledgerImport/ledgerImportBudgetAdjust'
import { ledgerBudgetAdjustBlockedUserMessage } from '@/lib/ledgerImport/budgetAdjustEligibilityHints'
import type { LedgerBudgetAdjustmentSnapshot } from '@/lib/ledgerImport/types'
import { mergeBudgetCategoriesForTransactionPicker } from '@/lib/transactionCategoryPicker'
import { buildTransactionsFromBankRows } from '@/lib/bankImport/buildTransactionsFromBankRows'
import { resolveBankMappingCategoryName } from '@/lib/bankImport/bankMappingKeys'
import { BANK_IMPORT_PROFILE_ID, BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST, SPAREBANK1_IMPORT_PROFILE_ID } from '@/lib/bankImport/bankImport.constants'
import {
  buildBankMappingAggregates,
  countPotentialDuplicateBankRows,
} from '@/lib/bankImport/bankImportUiHelpers'
import type { BankParsedRow, BankParseRowError, BankSourceId, ParseBankFileResult } from '@/lib/bankImport/types'
import { useStore } from '@/lib/store'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { generateId } from '@/lib/utils'
import { formatNokCurrencyDisplayTwoDecimals } from '@/lib/money/nokDisplayFormat'
import { roundMoney2 } from '@/lib/money/parseNorwegianAmount'
import { ArrowLeft, BookOpen, ChevronRight, Maximize2, RotateCcw, Sparkles } from 'lucide-react'

type Step = 'upload' | 'unknowns' | 'preview'
type ImportMode = TransactionImportGuideMode
type BankStep = 'upload' | 'mapping' | 'preview'

function isBankImportMode(m: ImportMode): m is 'bank_dnb' | 'bank_sparebank1' {
  return m === 'bank_dnb' || m === 'bank_sparebank1'
}

const IMPORT_SOURCE_OPTIONS: { value: ImportMode; label: string }[] = [
  { value: 'template_csv', label: 'Excel-mal (CSV)' },
  { value: 'bank_dnb', label: 'DNB / Sbanken (.csv / .xlsx)' },
  { value: 'bank_sparebank1', label: 'Sparebank 1 (.csv / .xlsx)' },
]

const DEFAULT_EXPENSE_PARENT: ParentCategory = 'utgifter'

/** Finn parentCategory-hint fra TRANSAKSJON-kolonnen for en gitt kategori i CSV. */
function parentHintForCategory(
  catName: string,
  rows: { categoryRaw: string; parentCategoryHint: ParentCategory }[],
): ParentCategory {
  const match = rows.find((r) => r.categoryRaw.trim() === catName)
  return match?.parentCategoryHint ?? DEFAULT_EXPENSE_PARENT
}

function labelListsForPerson(person: {
  customBudgetLabels?: Record<ParentCategory, string[]>
  hiddenBudgetLabels?: Record<ParentCategory, string[]>
}) {
  const empty = emptyLabelLists()
  return {
    customBudgetLabels: person.customBudgetLabels ?? empty.customBudgetLabels,
    hiddenBudgetLabels: person.hiddenBudgetLabels ?? empty.hiddenBudgetLabels,
  }
}

export default function ImporterTransaksjonerPage() {
  /** Importflyt: alltid inntil to desimaler uavhengig av «vis desimaler» i innstillinger. */
  const formatNOKImport = useCallback((amount: number) => formatNokCurrencyDisplayTwoDecimals(amount), [])
  const profiles = useStore((s) => s.profiles)
  const people = useStore((s) => s.people)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const setActiveProfileId = useStore((s) => s.setActiveProfileId)
  const addBudgetCategory = useStore((s) => s.addBudgetCategory)
  const addCustomBudgetLabel = useStore((s) => s.addCustomBudgetLabel)
  const addAppNotification = useStore((s) => s.addAppNotification)
  const budgetYear = useStore((s) => s.budgetYear)
  const addTemplateCsvImportRunWithTransactions = useStore((s) => s.addTemplateCsvImportRunWithTransactions)
  const templateCsvImportHistory = useStore((s) => s.templateCsvImportHistory)
  const bankImportMappingsRoot = useStore((s) => s.bankImportMappings)
  const setBankImportMapping = useStore((s) => s.setBankImportMapping)
  const addBankImportRunWithTransactions = useStore((s) => s.addBankImportRunWithTransactions)
  const bankImportHistory = useStore((s) => s.bankImportHistory)

  const [importMode, setImportMode] = useState<ImportMode>('template_csv')
  const [importProfileId, setImportProfileId] = useState(activeProfileId)
  const [step, setStep] = useState<Step>('upload')
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ReturnType<typeof parseTransactionCsvText>['rows']>([])
  const [rowParseErrors, setRowParseErrors] = useState<ReturnType<typeof parseTransactionCsvText>['rowErrors']>([])
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [unknownList, setUnknownList] = useState<string[]>([])
  const [unknownApproval, setUnknownApproval] = useState<Record<string, boolean>>({})
  const [summary, setSummary] = useState<ReturnType<typeof summarizeImportedTransactions> | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryParseErrorCount, setSummaryParseErrorCount] = useState(0)
  const [skippedImportRows, setSkippedImportRows] = useState(0)
  const [dupWarn, setDupWarn] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)
  const [importDisplayNameCsv, setImportDisplayNameCsv] = useState('')
  const [importDisplayNameBank, setImportDisplayNameBank] = useState('')
  const [csvPreviewExpanded, setCsvPreviewExpanded] = useState(false)
  const [bankPreviewExpanded, setBankPreviewExpanded] = useState(false)

  const [bankStep, setBankStep] = useState<BankStep>('upload')
  const [bankParseError, setBankParseError] = useState<string | null>(null)
  const [bankParsedRows, setBankParsedRows] = useState<BankParsedRow[]>([])
  const [bankRowErrors, setBankRowErrors] = useState<BankParseRowError[]>([])
  const [bankFileLabel, setBankFileLabel] = useState<string | null>(null)
  const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(true)
  const [bankAiBusy, setBankAiBusy] = useState(false)
  const [bankAiError, setBankAiError] = useState<string | null>(null)
  const [bankAiProgress, setBankAiProgress] = useState<string | null>(null)
  const [bankMappingExpanded, setBankMappingExpanded] = useState(false)
  const [bankAmountOverridesByLine, setBankAmountOverridesByLine] = useState<Record<number, number>>({})
  const [excludedCsvFileLines, setExcludedCsvFileLines] = useState<Set<number>>(() => new Set())
  const [excludedBankFileLines, setExcludedBankFileLines] = useState<Set<number>>(() => new Set())
  const [alsoApplyToBudgetCsv, setAlsoApplyToBudgetCsv] = useState(false)
  const [alsoApplyToBudgetBank, setAlsoApplyToBudgetBank] = useState(false)

  const activeBankSourceId = useMemo<BankSourceId>(
    () => (importMode === 'bank_sparebank1' ? 'sparebank1' : 'dnb_sbanken'),
    [importMode],
  )

  const activeBankCsvProfileId = useMemo(
    () =>
      importMode === 'bank_sparebank1' ? SPAREBANK1_IMPORT_PROFILE_ID : BANK_IMPORT_PROFILE_ID,
    [importMode],
  )

  useEffect(() => {
    setImportProfileId(activeProfileId)
  }, [activeProfileId])

  const person = people[importProfileId]
  const pickerCategories = useMemo(() => {
    if (!person) return []
    return mergeBudgetCategoriesForTransactionPicker(person.budgetCategories, labelListsForPerson(person))
  }, [person])

  const bankMaps = useMemo(
    () => bankImportMappingsRoot[activeBankSourceId] ?? {},
    [bankImportMappingsRoot, activeBankSourceId],
  )

  const handleProfileChange = (pid: string) => {
    setImportProfileId(pid)
    setActiveProfileId(pid)
  }

  const resetFlow = useCallback(() => {
    setStep('upload')
    setParseError(null)
    setParsedRows([])
    setRowParseErrors([])
    setFileLabel(null)
    setUnknownList([])
    setUnknownApproval({})
    setSummary(null)
    setSummaryOpen(false)
    setSummaryParseErrorCount(0)
    setSkippedImportRows(0)
    setDupWarn(0)
    setExcludedCsvFileLines(new Set())
    setAlsoApplyToBudgetCsv(false)
    setImportDisplayNameCsv('')
    setCsvPreviewExpanded(false)
  }, [])

  const resetBankFlow = useCallback(() => {
    setBankStep('upload')
    setBankParseError(null)
    setBankParsedRows([])
    setBankRowErrors([])
    setBankFileLabel(null)
    setShowOnlyUnmapped(true)
    setBankAiBusy(false)
    setBankAiError(null)
    setBankMappingExpanded(false)
    setBankAmountOverridesByLine({})
    setExcludedBankFileLines(new Set())
    setAlsoApplyToBudgetBank(false)
    setImportDisplayNameBank('')
    setBankPreviewExpanded(false)
  }, [])

  const switchImportMode = useCallback(
    (next: ImportMode) => {
      if (next === importMode) return
      const fromBank = isBankImportMode(importMode)
      const toBank = isBankImportMode(next)
      if (fromBank && toBank) {
        setImportMode(next)
        resetBankFlow()
        return
      }
      setImportMode(next)
      resetFlow()
      resetBankFlow()
    },
    [importMode, resetFlow, resetBankFlow],
  )

  const onFileText = useCallback(
    (text: string, name: string) => {
      setParseError(null)
      const result = parseTransactionCsvText(text)
      if (result.rowErrors.length && result.rows.length === 0 && result.rowErrors[0]?.detail?.includes('stor')) {
        setParseError(result.rowErrors[0]?.detail ?? 'Kunne ikke lese filen.')
        return
      }
      if (result.rowErrors.length && result.rows.length === 0 && result.rowErrors[0]?.detail?.includes('Fant ikke')) {
        setParseError(result.rowErrors[0]?.detail ?? 'Ugyldig format.')
        return
      }
      if (result.rowErrors.length && result.rows.length === 0 && result.rowErrors[0]?.detail?.includes('Tom fil')) {
        setParseError('Filen er tom.')
        return
      }

      setParsedRows(result.rows)
      setRowParseErrors(result.rowErrors)
      setFileLabel(name)
      setExcludedCsvFileLines(new Set())
      setAlsoApplyToBudgetCsv(false)
      setImportDisplayNameCsv('')

      const unknowns = collectUnknownCategoryNames(result.rows, pickerCategories)
      const approve: Record<string, boolean> = {}
      for (const u of unknowns) approve[u] = true
      setUnknownApproval(approve)
      setUnknownList(unknowns)

      if (unknowns.length > 0) {
        setStep('unknowns')
      } else {
        setStep('preview')
      }

      if (result.rows.length > 0) {
        addAppNotification({
          title: 'Datafil er lastet opp',
          body: `«${name}» — ${result.rows.length} rad${result.rows.length === 1 ? '' : 'er'} klar til import.`,
          kind: 'budget',
        })
      }
    },
    [pickerCategories, addAppNotification],
  )

  const csvPreviewSections = useMemo(() => {
    const main: typeof parsedRows = []
    const ko: typeof parsedRows = []
    for (const r of parsedRows) {
      if (importTextContainsKontoregulering(r.description)) ko.push(r)
      else main.push(r)
    }
    const out: {
      key: string
      showHeading: boolean
      title: string
      subtitle: string | null
      rows: typeof parsedRows
      total: number
    }[] = []
    if (main.length > 0) {
      out.push({
        key: 'main',
        showHeading: ko.length > 0,
        title: 'Øvrige transaksjoner',
        subtitle: null,
        rows: main.slice(0, 100),
        total: main.length,
      })
    }
    if (ko.length > 0) {
      out.push({
        key: 'kontoreg',
        showHeading: true,
        title: 'Kontoregulering',
        subtitle: 'Typisk overføringer mellom egne kontoer — samme import som øvrige, men samlet for oversikt.',
        rows: ko.slice(0, 100),
        total: ko.length,
      })
    }
    return out
  }, [parsedRows])

  /** Forhåndsoppsummering: sum per budsjettgruppe — bruker parentCategoryHint direkte fra TRANSAKSJON-kolonnen. */
  const previewGroupTotals = useMemo(() => {
    const rejected = new Set(unknownList.filter((u) => unknownApproval[u] === false))
    const sums: Record<string, number> = {
      inntekter: 0,
      regninger: 0,
      utgifter: 0,
      gjeld: 0,
      sparing: 0,
    }
    for (const r of parsedRows) {
      const t = r.categoryRaw.trim()
      if (rejected.has(t) || excludedCsvFileLines.has(r.fileLine)) continue
      sums[r.parentCategoryHint] = (sums[r.parentCategoryHint] ?? 0) + r.amount
    }
    return sums
  }, [parsedRows, unknownList, unknownApproval, excludedCsvFileLines])

  /** Inkluderer godkjente nye kategorier som ennå ikke er i store (for duplikatsjekk i forhåndsvisning). */
  const duplicatePreviewCount = useMemo(() => {
    if (!person) return 0
    const rejected = new Set(unknownList.filter((u) => unknownApproval[u] === false))
    const hypothetical: typeof pickerCategories = [...pickerCategories]
    const seen = new Set(hypothetical.map((c) => c.name))
    for (const u of unknownList) {
      if (!unknownApproval[u] || rejected.has(u.trim())) continue
      if (!seen.has(u)) {
        const hint = parentHintForCategory(u, parsedRows)
        const isIncome = hint === 'inntekter'
        hypothetical.push(
          buildZeroBudgetCategory(u, hint, isIncome ? 'income' : 'expense', hypothetical.length),
        )
        seen.add(u)
      }
    }
    return countPotentialDuplicateRows(
      parsedRows.filter((r) => !excludedCsvFileLines.has(r.fileLine)),
      (raw) => {
        const t = raw.trim()
        if (rejected.has(t)) return null
        const r = resolveCategoryForImport(raw, hypothetical)
        return r.kind === 'matched' ? r.canonical : null
      },
      person.transactions,
    )
  }, [person, parsedRows, unknownList, unknownApproval, pickerCategories, excludedCsvFileLines])

  const legacyKeysByPrimary = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const r of bankParsedRows) {
      let set = m.get(r.mappingKey)
      if (!set) {
        set = new Set<string>()
        m.set(r.mappingKey, set)
      }
      set.add(r.mappingKeyLegacy)
    }
    return m
  }, [bankParsedRows])

  const bankParsedRowsEffective = useMemo(
    () =>
      bankParsedRows.map((r) => {
        const o = bankAmountOverridesByLine[r.fileLine]
        if (o === undefined) return r
        return { ...r, amount: o }
      }),
    [bankParsedRows, bankAmountOverridesByLine],
  )

  const bankParsedRowByFileLine = useMemo(() => {
    const m = new Map<number, BankParsedRow>()
    for (const r of bankParsedRows) m.set(r.fileLine, r)
    return m
  }, [bankParsedRows])

  const setBankLineAmountOverride = useCallback((fileLine: number, amount: number | null) => {
    const base = bankParsedRowByFileLine.get(fileLine)?.amount
    setBankAmountOverridesByLine((prev) => {
      const next = { ...prev }
      if (
        amount === null ||
        base === undefined ||
        roundMoney2(amount) === roundMoney2(base)
      ) {
        delete next[fileLine]
      } else next[fileLine] = amount
      return next
    })
  }, [bankParsedRowByFileLine])

  const resolvedBankCategoryName = useCallback(
    (primaryKey: string) => {
      const legacies = legacyKeysByPrimary.get(primaryKey) ?? new Set<string>()
      const p = bankMaps[primaryKey]?.categoryName?.trim()
      if (p) return p
      for (const leg of legacies) {
        const x = bankMaps[leg]?.categoryName?.trim()
        if (x) return x
      }
      return ''
    },
    [bankMaps, legacyKeysByPrimary],
  )

  const isBankKeyMapped = useCallback(
    (mappingKey: string, transactionType: 'income' | 'expense') => {
      const name = resolvedBankCategoryName(mappingKey)
      if (!name) return false
      const c = pickerCategories.find((x) => x.name === name)
      return !!c && c.type === transactionType
    },
    [resolvedBankCategoryName, pickerCategories],
  )

  const applyBankMappingWithLegacyFanout = useCallback(
    (primaryKey: string, rule: { categoryName: string } | null) => {
      setBankImportMapping(activeBankSourceId, primaryKey, rule)
      const legs = legacyKeysByPrimary.get(primaryKey)
      if (!legs) return
      for (const leg of legs) {
        setBankImportMapping(activeBankSourceId, leg, rule)
      }
    },
    [setBankImportMapping, legacyKeysByPrimary, activeBankSourceId],
  )

  const bankAggregates = useMemo(
    () => buildBankMappingAggregates(bankParsedRowsEffective),
    [bankParsedRowsEffective],
  )

  const bankVisibleAggregates = useMemo(() => {
    if (!showOnlyUnmapped) return bankAggregates
    return bankAggregates.filter((a) => !isBankKeyMapped(a.mappingKey, a.transactionType))
  }, [bankAggregates, showOnlyUnmapped, isBankKeyMapped])

  const { bankVisibleIncome, bankVisibleExpense } = useMemo(() => {
    const income: typeof bankAggregates = []
    const expense: typeof bankAggregates = []
    for (const a of bankVisibleAggregates) {
      if (a.transactionType === 'income') income.push(a)
      else expense.push(a)
    }
    return { bankVisibleIncome: income, bankVisibleExpense: expense }
  }, [bankVisibleAggregates])

  const fileHasIncomeAggregates = useMemo(
    () => bankAggregates.some((a) => a.transactionType === 'income'),
    [bankAggregates],
  )
  const fileHasExpenseAggregates = useMemo(
    () => bankAggregates.some((a) => a.transactionType === 'expense'),
    [bankAggregates],
  )

  const bankMappingIncomeSectionMode = useMemo(() => {
    if (!fileHasIncomeAggregates) return 'empty-file'
    if (bankVisibleIncome.length === 0) return 'hidden'
    return 'list'
  }, [fileHasIncomeAggregates, bankVisibleIncome.length])

  const bankMappingExpenseSectionMode = useMemo(() => {
    if (!fileHasExpenseAggregates) return 'empty-file'
    if (bankVisibleExpense.length === 0) return 'hidden'
    return 'list'
  }, [fileHasExpenseAggregates, bankVisibleExpense.length])

  const bankCanGoPreview = useMemo(() => {
    if (!bankAggregates.length) return false
    return bankAggregates.every((a) => isBankKeyMapped(a.mappingKey, a.transactionType))
  }, [bankAggregates, isBankKeyMapped])

  const bankUnmappedAggregates = useMemo(() => {
    return bankAggregates.filter((a) => !isBankKeyMapped(a.mappingKey, a.transactionType))
  }, [bankAggregates, isBankKeyMapped])

  const bankDuplicatePreviewCount = useMemo(() => {
    if (!person || bankParsedRows.length === 0) return 0
    const rows = bankParsedRowsEffective.filter((r) => !excludedBankFileLines.has(r.fileLine))
    return countPotentialDuplicateBankRows(
      rows,
      (row) => resolveBankMappingCategoryName(bankMaps, row) ?? null,
      person.transactions,
    )
  }, [person, bankParsedRows, bankParsedRowsEffective, bankMaps, excludedBankFileLines])

  const bankPreviewSections = useMemo(() => {
    const main: BankParsedRow[] = []
    const ko: BankParsedRow[] = []
    for (const r of bankParsedRowsEffective) {
      if (importTextContainsKontoregulering(r.forklaringRaw)) ko.push(r)
      else main.push(r)
    }
    const out: {
      key: string
      showHeading: boolean
      title: string
      subtitle: string | null
      rows: BankParsedRow[]
      total: number
    }[] = []
    if (main.length > 0) {
      out.push({
        key: 'main',
        showHeading: ko.length > 0,
        title: 'Øvrige transaksjoner',
        subtitle: null,
        rows: main.slice(0, 100),
        total: main.length,
      })
    }
    if (ko.length > 0) {
      out.push({
        key: 'kontoreg',
        showHeading: true,
        title: 'Kontoregulering',
        subtitle: 'Typisk overføringer mellom egne kontoer — samme import som øvrige, men samlet for oversikt.',
        rows: ko.slice(0, 100),
        total: ko.length,
      })
    }
    return out
  }, [bankParsedRowsEffective])

  const rowsIncludedInImport = useMemo(
    () => parsedRows.filter((r) => !excludedCsvFileLines.has(r.fileLine)),
    [parsedRows, excludedCsvFileLines],
  )

  const pendingCsvImportTransactions = useMemo(() => {
    if (!person || rowsIncludedInImport.length === 0) return []
    const effectivePicker = buildEffectivePickerCategoriesForCsvImport(
      person,
      unknownList,
      unknownApproval,
      parsedRows,
    )
    const rejected = new Set(unknownList.filter((u) => unknownApproval[u] === false))
    const canonicalForRaw = (raw: string): string | null => {
      const t = raw.trim()
      if (rejected.has(t)) return null
      const r = resolveCategoryForImport(raw, effectivePicker)
      return r.kind === 'matched' ? r.canonical : null
    }
    return buildTransactionsFromImportRows(rowsIncludedInImport, canonicalForRaw, importProfileId)
  }, [person, rowsIncludedInImport, unknownList, unknownApproval, parsedRows, importProfileId])

  const budgetAdjustEligibilityCsv = useMemo(
    () => canApplyLedgerBudgetAdjust(pendingCsvImportTransactions, budgetYear),
    [pendingCsvImportTransactions, budgetYear],
  )

  const budgetDeltaPreviewCsv = useMemo(() => {
    if (!person || pendingCsvImportTransactions.length === 0 || !budgetAdjustEligibilityCsv.ok) return null
    const effectivePicker = buildEffectivePickerCategoriesForCsvImport(
      person,
      unknownList,
      unknownApproval,
      parsedRows,
    )
    return computeLedgerImportBudgetDeltas(pendingCsvImportTransactions, effectivePicker)
  }, [person, pendingCsvImportTransactions, budgetAdjustEligibilityCsv.ok, unknownList, unknownApproval, parsedRows])

  const budgetAdjustBlockedMsgCsv = useMemo(() => {
    if (budgetAdjustEligibilityCsv.ok) return ''
    return ledgerBudgetAdjustBlockedUserMessage(budgetAdjustEligibilityCsv.reason, budgetYear)
  }, [budgetAdjustEligibilityCsv, budgetYear])

  useEffect(() => {
    if (!budgetAdjustEligibilityCsv.ok) setAlsoApplyToBudgetCsv(false)
  }, [budgetAdjustEligibilityCsv.ok])

  const bankRowsForImportPreview = useMemo(
    () => bankParsedRowsEffective.filter((r) => !excludedBankFileLines.has(r.fileLine)),
    [bankParsedRowsEffective, excludedBankFileLines],
  )

  const pendingBankImportTransactions = useMemo(() => {
    if (!person || bankRowsForImportPreview.length === 0) return []
    const merged = mergeBudgetCategoriesForTransactionPicker(
      person.budgetCategories,
      labelListsForPerson(person),
    )
    const getCategoryName = (row: BankParsedRow) => resolveBankMappingCategoryName(bankMaps, row)
    return buildTransactionsFromBankRows(
      bankRowsForImportPreview,
      getCategoryName,
      merged,
      importProfileId,
    ).transactions
  }, [person, bankRowsForImportPreview, bankMaps, importProfileId])

  const budgetAdjustEligibilityBank = useMemo(
    () => canApplyLedgerBudgetAdjust(pendingBankImportTransactions, budgetYear),
    [pendingBankImportTransactions, budgetYear],
  )

  const budgetDeltaPreviewBank = useMemo(() => {
    if (!person || pendingBankImportTransactions.length === 0 || !budgetAdjustEligibilityBank.ok) return null
    const merged = mergeBudgetCategoriesForTransactionPicker(
      person.budgetCategories,
      labelListsForPerson(person),
    )
    return computeLedgerImportBudgetDeltas(pendingBankImportTransactions, merged)
  }, [person, pendingBankImportTransactions, budgetAdjustEligibilityBank.ok])

  const budgetAdjustBlockedMsgBank = useMemo(() => {
    if (budgetAdjustEligibilityBank.ok) return ''
    return ledgerBudgetAdjustBlockedUserMessage(budgetAdjustEligibilityBank.reason, budgetYear)
  }, [budgetAdjustEligibilityBank, budgetYear])

  useEffect(() => {
    if (!budgetAdjustEligibilityBank.ok) setAlsoApplyToBudgetBank(false)
  }, [budgetAdjustEligibilityBank.ok])

  const bankMappingExpandBackdropDismiss = useModalBackdropDismiss(() => setBankMappingExpanded(false))
  const csvPreviewExpandBackdropDismiss = useModalBackdropDismiss(() => setCsvPreviewExpanded(false))
  const bankPreviewExpandBackdropDismiss = useModalBackdropDismiss(() => setBankPreviewExpanded(false))

  useEffect(() => {
    const previewOpen = csvPreviewExpanded || bankPreviewExpanded
    if (!previewOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCsvPreviewExpanded(false)
        setBankPreviewExpanded(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [csvPreviewExpanded, bankPreviewExpanded])

  const onBankParsed = useCallback(
    (result: ParseBankFileResult, name: string) => {
      setBankParseError(null)
      if (result.rowErrors.length && result.rows.length === 0) {
        const first = result.rowErrors[0]
        setBankParseError(
          first?.detail ?? (first?.reason ? String(first.reason) : null) ?? 'Kunne ikke lese bankfilen.',
        )
        setBankParsedRows([])
        setBankRowErrors(result.rowErrors)
        setBankFileLabel(name)
        setBankAmountOverridesByLine({})
        setImportDisplayNameBank('')
        setBankStep('upload')
        return
      }
      if (result.rows.length === 0) {
        setBankParseError(
          importMode === 'bank_sparebank1'
            ? 'Ingen transaksjonsrader funnet. Sjekk at filen har riktig overskriftsrad (Dato, Beskrivelse, Inn, Ut).'
            : 'Ingen transaksjonsrader funnet. Sjekk at filen har riktig overskriftsrad (Dato, Forklaring, …).',
        )
        setBankParsedRows([])
        setBankRowErrors(result.rowErrors)
        setBankFileLabel(name)
        setBankAmountOverridesByLine({})
        setImportDisplayNameBank('')
        setBankStep('upload')
        return
      }
      setBankAmountOverridesByLine({})
      setExcludedBankFileLines(new Set())
      setAlsoApplyToBudgetBank(false)
      setBankParsedRows(result.rows)
      setBankRowErrors(result.rowErrors)
      setBankFileLabel(name)
      setImportDisplayNameBank('')
      setBankStep('mapping')
      addAppNotification({
        title: 'Bankfil er lastet opp',
        body: `«${name}» — ${result.rows.length} rad${result.rows.length === 1 ? '' : 'er'} klar til kartlegging.`,
        kind: 'budget',
      })
    },
    [addAppNotification, importMode],
  )

  const fetchBankAiSuggestions = useCallback(async () => {
    const unmapped = bankAggregates.filter((a) => !isBankKeyMapped(a.mappingKey, a.transactionType))
    if (!unmapped.length) return
    setBankAiError(null)
    setBankAiBusy(true)
    const batchSize = BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST
    const totalBatches = Math.ceil(unmapped.length / batchSize)
    try {
      const incomeCategories = pickerCategories.filter((c) => c.type === 'income').map((c) => c.name)
      const expenseCategories = pickerCategories.filter((c) => c.type === 'expense').map((c) => c.name)
      let openedList = false
      for (let b = 0; b < totalBatches; b++) {
        setBankAiProgress(totalBatches > 1 ? `KI-steg ${b + 1} av ${totalBatches} …` : 'Henter forslag …')
        const chunk = unmapped.slice(b * batchSize, (b + 1) * batchSize)
        const keys = chunk.map((a) => ({
          key: a.mappingKey,
          kind: a.transactionType,
          forklaring: a.exampleForklaring,
        }))
        const res = await fetch('/api/bank-import-suggest', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ keys, incomeCategories, expenseCategories }),
        })
        const data = (await res.json().catch(() => null)) as
          | { suggestions?: { key: string; category: string | null }[]; error?: string }
          | null
        if (!res.ok) {
          setBankAiError(
            data?.error ?? `KI-forslag feilet (steg ${b + 1} av ${totalBatches}).`,
          )
          return
        }
        const suggestions = data?.suggestions ?? []
        for (const s of suggestions) {
          if (!s.category) continue
          const existing =
            useStore.getState().bankImportMappings[activeBankSourceId]?.[s.key]?.categoryName?.trim()
          if (existing) continue
          const rule = { categoryName: s.category }
          setBankImportMapping(activeBankSourceId, s.key, rule)
          const legs = legacyKeysByPrimary.get(s.key)
          if (legs) {
            for (const leg of legs) {
              setBankImportMapping(activeBankSourceId, leg, rule)
            }
          }
          openedList = true
        }
      }
      if (openedList) {
        setShowOnlyUnmapped(false)
      }
    } catch {
      setBankAiError('Nettverksfeil ved KI-forslag.')
    } finally {
      setBankAiBusy(false)
      setBankAiProgress(null)
    }
  }, [bankAggregates, isBankKeyMapped, pickerCategories, setBankImportMapping, legacyKeysByPrimary, activeBankSourceId])

  const runBankImport = () => {
    if (!person || !bankCanGoPreview) return
    setActiveProfileId(importProfileId)
    const pid = importProfileId
    const pBefore = useStore.getState().people[pid]
    if (!pBefore) return
    const labelTrim = importDisplayNameBank.trim()

    const merged = mergeBudgetCategoriesForTransactionPicker(
      pBefore.budgetCategories,
      labelListsForPerson(pBefore),
    )
    const runId = generateId()
    const liveMaps = useStore.getState().bankImportMappings[activeBankSourceId] ?? {}
    const getCategoryName = (row: BankParsedRow) => resolveBankMappingCategoryName(liveMaps, row)

    const bankRowsToImport = bankParsedRowsEffective.filter((r) => !excludedBankFileLines.has(r.fileLine))
    const userExcludedBank = bankParsedRowsEffective.filter((r) => excludedBankFileLines.has(r.fileLine)).length

    const {
      transactions,
      skippedUnmapped,
      skippedUnknownCategory,
      skippedTypeMismatch,
      importedLineSnapshots,
    } = buildTransactionsFromBankRows(bankRowsToImport, getCategoryName, merged, pid, runId)

    const rowSkipped = skippedUnmapped + skippedUnknownCategory + skippedTypeMismatch + userExcludedBank

    let budgetAdjustment: LedgerBudgetAdjustmentSnapshot | undefined
    let splitSkippedForBudget = 0
    if (alsoApplyToBudgetBank) {
      const elig = canApplyLedgerBudgetAdjust(transactions, budgetYear)
      if (elig.ok) {
        const computed = computeLedgerImportBudgetDeltas(transactions, merged)
        splitSkippedForBudget = computed.skippedHouseholdSplitCount
        if (computed.entries.length > 0) {
          const existingIds = new Set(pBefore.budgetCategories.map((c) => c.id))
          const entryCatIds = new Set(computed.entries.map((e) => e.categoryId))
          const backfillCategories = merged.filter(
            (c) => entryCatIds.has(c.id) && !existingIds.has(c.id),
          )
          budgetAdjustment = {
            profileId: pid,
            entries: computed.entries,
            ...(backfillCategories.length ? { backfillCategories } : {}),
          }
        }
      }
    }

    const existingDup = countPotentialDuplicateBankRows(
      bankRowsToImport,
      (row) => getCategoryName(row) ?? null,
      pBefore.transactions,
    )

    addBankImportRunWithTransactions(
      {
        id: runId,
        createdAt: new Date().toISOString(),
        sourceId: activeBankSourceId,
        profileId: pid,
        csvProfileId: activeBankCsvProfileId,
        fileName: bankFileLabel,
        displayName: labelTrim ? labelTrim : null,
        rowCountParsed: bankParsedRows.length,
        rowCountImported: transactions.length,
        rowCountSkipped: rowSkipped,
        errorSummary: null,
        importedLines: importedLineSnapshots,
        budgetAdjustment,
      },
      transactions,
    )

    setSkippedImportRows(rowSkipped)
    setDupWarn(existingDup)
    setSummaryParseErrorCount(bankRowErrors.length)
    setSummary(summarizeImportedTransactions(transactions, people[importProfileId]?.defaultIncomeWithholding))
    setSummaryOpen(true)
    resetBankFlow()

    const parts: string[] = [`${transactions.length} transaksjon${transactions.length === 1 ? '' : 'er'} lagt til.`]
    if (rowSkipped > 0) parts.push(`${rowSkipped} rad${rowSkipped === 1 ? '' : 'er'} hoppet over.`)
    if (budgetAdjustment) {
      parts.push('Planlagte budsjettbeløp er økt for tilhørende måneder og kategorier.')
    }
    if (alsoApplyToBudgetBank && splitSkippedForBudget > 0) {
      parts.push(
        `${splitSkippedForBudget} linje(r) på delt husstandsbudsjett ble ikke lagt til i budsjettplanen.`,
      )
    }
    if (existingDup > 0) {
      parts.push(
        `${existingDup} mulig${existingDup === 1 ? '' : 'e'} duplikat mot eksisterende data før import.`,
      )
    }
    addAppNotification({
      title: 'Bankimport fullført',
      body: parts.join(' '),
      kind: 'budget',
    })
  }

  const runImport = () => {
    if (!person) return
    setActiveProfileId(importProfileId)
    const pid = importProfileId
    if (!useStore.getState().people[pid]) return
    const labelTrim = importDisplayNameCsv.trim()

    const rejected = new Set(unknownList.filter((u) => unknownApproval[u] === false))

    for (const name of unknownList) {
      if (!unknownApproval[name]) continue
      const parent = parentHintForCategory(name, parsedRows)
      const isIncome = parent === 'inntekter'
      const type: 'income' | 'expense' = isIncome ? 'income' : 'expense'
      const live = useStore.getState().people[pid]
      if (!live) return
      const lists = labelListsForPerson(live)
      if (shouldRegisterCustomLabel(parent, name, lists.customBudgetLabels)) {
        addCustomBudgetLabel(parent, name)
      }
      const live2 = useStore.getState().people[pid]
      if (!live2) return
      const cat = buildZeroBudgetCategory(name, parent, type, live2.budgetCategories.length)
      addBudgetCategory(cat)
    }

    const pFinal = useStore.getState().people[pid]
    if (!pFinal) return
    const merged = mergeBudgetCategoriesForTransactionPicker(pFinal.budgetCategories, labelListsForPerson(pFinal))

    const canonicalForRaw = (raw: string): string | null => {
      const t = raw.trim()
      if (rejected.has(t)) return null
      const r = resolveCategoryForImport(raw, merged)
      if (r.kind === 'matched') return r.canonical
      return null
    }

    const rowsToImport = parsedRows.filter((r) => !excludedCsvFileLines.has(r.fileLine))
    const runId = generateId()
    const txs = buildTransactionsFromImportRows(rowsToImport, canonicalForRaw, pid, runId)

    const existingDup = countPotentialDuplicateRows(rowsToImport, canonicalForRaw, pFinal.transactions)

    let budgetAdjustment: LedgerBudgetAdjustmentSnapshot | undefined
    let splitSkippedForBudget = 0
    if (alsoApplyToBudgetCsv) {
      const elig = canApplyLedgerBudgetAdjust(txs, budgetYear)
      if (elig.ok) {
        const computed = computeLedgerImportBudgetDeltas(txs, merged)
        splitSkippedForBudget = computed.skippedHouseholdSplitCount
        if (computed.entries.length > 0) {
          const existingIds = new Set(pFinal.budgetCategories.map((c) => c.id))
          const entryCatIds = new Set(computed.entries.map((e) => e.categoryId))
          const backfillCategories = merged.filter(
            (c) => entryCatIds.has(c.id) && !existingIds.has(c.id),
          )
          budgetAdjustment = {
            profileId: pid,
            entries: computed.entries,
            ...(backfillCategories.length ? { backfillCategories } : {}),
          }
        }
      }
    }

    addTemplateCsvImportRunWithTransactions(
      {
        id: runId,
        createdAt: new Date().toISOString(),
        profileId: pid,
        csvProfileId: TEMPLATE_CSV_IMPORT_PROFILE_ID,
        fileName: fileLabel,
        displayName: labelTrim ? labelTrim : null,
        rowCountParsed: parsedRows.length,
        rowCountImported: txs.length,
        rowCountSkipped: parsedRows.length - txs.length,
        errorSummary: null,
        budgetAdjustment,
      },
      txs,
    )

    setSkippedImportRows(parsedRows.length - txs.length)
    setDupWarn(existingDup)
    setSummaryParseErrorCount(rowParseErrors.length)
    setSummary(summarizeImportedTransactions(txs, people[importProfileId]?.defaultIncomeWithholding))
    setSummaryOpen(true)
    setStep('upload')

    const skipped = parsedRows.length - txs.length
    const parts: string[] = [`${txs.length} transaksjon${txs.length === 1 ? '' : 'er'} lagt til.`]
    if (skipped > 0) parts.push(`${skipped} rad${skipped === 1 ? '' : 'er'} hoppet over (kategori / valgt bort).`)
    if (budgetAdjustment) {
      parts.push('Planlagte budsjettbeløp er økt for tilhørende måneder og kategorier.')
    }
    if (alsoApplyToBudgetCsv && splitSkippedForBudget > 0) {
      parts.push(
        `${splitSkippedForBudget} linje(r) på delt husstandsbudsjett ble ikke lagt til i budsjettplanen.`,
      )
    }
    if (existingDup > 0) parts.push(`${existingDup} mulig${existingDup === 1 ? '' : 'e'} duplikat mot eksisterende data.`)
    addAppNotification({
      title: 'Import av data fullført',
      body: parts.join(' '),
      kind: 'budget',
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/konto/innstillinger"
          className="inline-flex items-center gap-1 font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          Min konto
        </Link>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text)' }}>Importer transaksjoner</span>
      </div>

      <div
        className="rounded-2xl p-6 sm:p-8 space-y-6"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
      <div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
          {importMode === 'template_csv'
            ? 'Importer transaksjoner fra CSV'
            : importMode === 'bank_sparebank1'
              ? 'Importer fra Sparebank 1'
              : 'Importer fra DNB / Sbanken'}
        </h1>
        {importMode === 'template_csv' ? (
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Last opp en fil eksportert fra Excel (CSV UTF-8). Kolonnene skal tilsvare malen: DATO, TRANSAKSJON (ignoreres i
            appen), KATEGORI, BELØP, valgfri beskrivelse. Format {IMPORT_FORMAT_V1}. BELØP kan ha tusenskille og komma som
            desimal (f.eks. 1&nbsp;050,66); beløp lagres med inntil to desimaler (øre). Har du flere profiler i husholdningen, velg
            riktig profil nedenfor før du laster opp. Har du hovedbok fra regnskapssystem, bruk{' '}
            <Link href="/konto/importer-fra-regnskap" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
              Import fra regnskap
            </Link>
            .
          </p>
        ) : importMode === 'bank_sparebank1' ? (
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Last opp Excel (.xlsx) eller CSV fra Sparebank 1 med kolonnene Dato, Beskrivelse, Rentedato, Inn og Ut (Til konto /
            Fra konto ignoreres for beløp). Velg kategori per beskrivelse; samme tekst kan mapes ulikt for inntekt og utgift.
            Beløp lagres med inntil to desimaler (øre). Punktum som desimal fra Excel støttes. «Foreslå kategorier med KI»
            sender bare beskrivelsestekstene til modellen — ikke beløp eller dato. Har du regnskap som hovedbok, bruk{' '}
            <Link href="/konto/importer-fra-regnskap" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
              Import fra regnskap
            </Link>
            .
          </p>
        ) : (
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Last opp Excel (.xlsx) fra DNB/Sbanken eller en CSV lagret med samme kolonner (Dato, Forklaring, Rentedato, Ut fra
            konto, Inn på konto). Velg kategori per forklaring; samme tekst kan mapes ulikt for inntekt og utgift. Beløp
            lagres med inntil to desimaler (øre). Punktum som desimal fra Excel (f.eks. 499,5 vist som 499.5) støttes. «Foreslå
            kategorier med KI» sender bare forklaringstekstene til modellen — ikke
            beløp eller dato. Har du regnskap som hovedbok, bruk{' '}
            <Link href="/konto/importer-fra-regnskap" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
              Import fra regnskap
            </Link>
            .
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2 min-h-[44px] touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
            onClick={() => setGuideOpen(true)}
          >
            <BookOpen size={18} className="shrink-0 opacity-90" aria-hidden />
            Steg-for-steg veiledning
          </button>
        </div>
        {importMode === 'template_csv' && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              className="text-sm font-medium rounded-xl px-3 py-2 min-h-[44px] touch-manipulation"
              style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
              onClick={() => downloadTransactionImportTemplate()}
            >
              Last ned CSV-mal
            </button>
            {step !== 'upload' && (
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2 min-h-[44px] touch-manipulation"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                onClick={resetFlow}
              >
                <RotateCcw size={15} className="shrink-0" aria-hidden />
                Start på nytt
              </button>
            )}
          </div>
        )}
        {isBankImportMode(importMode) && bankStep !== 'upload' && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2 min-h-[44px] touch-manipulation"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              onClick={resetBankFlow}
            >
              <RotateCcw size={15} className="shrink-0" aria-hidden />
              Start på nytt
            </button>
          </div>
        )}
      </div>

      <TransactionImportGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        mode={importMode}
      />

      <div id="import-opplasting" className="scroll-mt-24 space-y-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
      {profiles.length >= 2 && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: '#fff',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
          }}
        >
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Importer til profil
          </label>
          <select
            value={importProfileId}
            onChange={(e) => handleProfileChange(e.target.value)}
            className="w-full max-w-md rounded-xl px-3 py-3 sm:py-2 text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
            style={{ border: '1px solid var(--border)', background: '#fff', color: 'var(--text)' }}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        className="rounded-2xl p-4"
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <label
            htmlFor="import-transaksjon-kilde"
            className="text-xs font-medium m-0"
            style={{ color: 'var(--text-muted)' }}
          >
            Importkilde
          </label>
          <span className="text-xs opacity-50 select-none" style={{ color: 'var(--text-muted)' }} aria-hidden>
            ·
          </span>
          <button
            type="button"
            className="text-xs font-medium m-0 p-1 -m-1 rounded-md touch-manipulation min-h-[44px] min-w-[44px] inline-flex items-center justify-center sm:min-h-0 sm:min-w-0 sm:p-0 sm:inline sm:underline-offset-2 sm:hover:underline"
            style={{ color: 'var(--primary)' }}
            onClick={() => setGuideOpen(true)}
            aria-label={
              importMode === 'template_csv'
                ? 'Hjelp for valgt importkilde (Excel-mal)'
                : importMode === 'bank_sparebank1'
                  ? 'Hjelp for valgt importkilde (Sparebank 1)'
                  : 'Hjelp for valgt importkilde (DNB / Sbanken)'
            }
          >
            Hjelp
          </button>
        </div>
        <select
          id="import-transaksjon-kilde"
          value={importMode}
          onChange={(e) => switchImportMode(e.target.value as ImportMode)}
          className="w-full max-w-md rounded-xl px-3 py-3 sm:py-2 text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
          style={{ border: '1px solid var(--border)', background: '#fff', color: 'var(--text)' }}
        >
          {IMPORT_SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-xs mt-2 m-0" style={{ color: 'var(--text-muted)' }}>
          Bytte mellom Excel-mal og bank nullstiller påbegynt import. Bytte mellom DNB og Sparebank 1 nullstiller bare
          bank-steg.
        </p>
      </div>

      {importMode === 'template_csv' && parseError && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
          {parseError}
        </div>
      )}

      {isBankImportMode(importMode) && bankParseError && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
          {bankParseError}
        </div>
      )}

      {importMode === 'template_csv' && step === 'upload' && (
        <TransactionImportDropzone onFileText={onFileText} disabled={!person} />
      )}

      {importMode === 'template_csv' && step === 'unknowns' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Fil: <strong style={{ color: 'var(--text)' }}>{fileLabel}</strong> — {parsedRows.length} gyldige rader.
            Disse kategorinavnene finnes ikke i listen din ennå. Type (inntekt/utgift) er utledet fra
            TRANSAKSJON-kolonnen i filen. Velg om de skal opprettes.
          </p>
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th className="text-left px-4 py-3 font-medium">Kategori fra fil</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-right px-4 py-3 font-medium">Legg til</th>
                </tr>
              </thead>
              <tbody>
                {unknownList.map((name) => {
                  const hint = parentHintForCategory(name, parsedRows)
                  const groupLabel: Record<ParentCategory, string> = {
                    inntekter: 'Inntekt',
                    regninger: 'Regning',
                    utgifter: 'Utgift',
                    gjeld: 'Gjeld',
                    sparing: 'Sparing',
                  }
                  const isIncome = hint === 'inntekter'
                  return (
                    <tr key={name} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-3">{name}</td>
                      <td
                        className="px-4 py-3 text-xs font-medium"
                        style={{ color: isIncome ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {groupLabel[hint] ?? 'Utgift'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unknownApproval[name] ?? false}
                            onChange={(e) =>
                              setUnknownApproval((s) => ({ ...s, [name]: e.target.checked }))
                            }
                          />
                          <span>Ja</span>
                        </label>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
            onClick={() => setStep('preview')}
          >
            Fortsett til forhåndsvisning
          </button>
        </div>
      )}

      {importMode === 'template_csv' && step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {fileLabel && (
              <>
                Fil: <strong style={{ color: 'var(--text)' }}>{fileLabel}</strong> — {parsedRows.length} rader som kan
                importeres (etter kategorivalg). Parser-feil: {rowParseErrors.length}.
              </>
            )}
          </p>
          {duplicatePreviewCount > 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Advarsel: {duplicatePreviewCount} rad(er) kan overlappe med eksisterende transaksjoner (samme dato,
              beløp, beskrivelse og kategori).
            </p>
          )}

          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {([
              { key: 'inntekter', label: 'Inntekter', color: 'var(--success)' },
              { key: 'regninger', label: 'Regninger', color: 'var(--danger)' },
              { key: 'utgifter', label: 'Utgifter', color: 'var(--danger)' },
              { key: 'gjeld', label: 'Gjeld', color: 'var(--danger)' },
              { key: 'sparing', label: 'Sparing', color: 'var(--primary)' },
            ] as const)
              .filter(({ key }) => (previewGroupTotals[key] ?? 0) > 0)
              .map(({ key, label, color }) => (
                <div
                  key={key}
                  className="rounded-xl p-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </p>
                  <p className="text-sm font-semibold tabular-nums" style={{ color }}>
                    {formatNOKImport(previewGroupTotals[key] ?? 0)}
                  </p>
                </div>
              ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation w-full sm:w-auto"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onClick={() => setCsvPreviewExpanded(true)}
            >
              <Maximize2 size={18} aria-hidden />
              Utvid forhåndsvisning
            </button>
          </div>

          <div
            className="rounded-2xl overflow-hidden border max-h-[min(60vh,28rem)] overflow-y-auto"
            style={{ borderColor: 'var(--border)' }}
          >
            <CsvTransactionImportPreviewTable
              sections={csvPreviewSections}
              excludedCsvFileLines={excludedCsvFileLines}
              setExcludedCsvFileLines={setExcludedCsvFileLines}
              formatNOKImport={formatNOKImport}
            />
          </div>
          {csvPreviewSections.some((s) => s.total > 100) ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Maks 100 rader vises per gruppe i forhåndsvisning.
              {csvPreviewSections.map((s) => (
                <span key={`hint-${s.key}`} className="block mt-0.5">
                  {s.title}: {s.total} rad{s.total === 1 ? '' : 'er'}
                  {s.total > 100 ? ' (viser 100)' : ''}
                </span>
              ))}
            </p>
          ) : null}
          {rowParseErrors.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium" style={{ color: 'var(--text-muted)' }}>
                Parser-feil ({rowParseErrors.length})
              </summary>
              <ul className="mt-2 space-y-1 list-disc pl-5" style={{ color: 'var(--text-muted)' }}>
                {rowParseErrors.slice(0, 30).map((e, i) => (
                  <li key={i}>
                    Linje {e.fileLine}: {e.reason}
                    {e.detail ? ` (${e.detail})` : ''}
                  </li>
                ))}
                {rowParseErrors.length > 30 && <li>…</li>}
              </ul>
            </details>
          )}
          <div
            className="rounded-xl border px-4 py-3 space-y-2"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <label className="flex items-start gap-3 cursor-pointer touch-manipulation min-h-[44px]">
              <input
                type="checkbox"
                className="mt-1 shrink-0 rounded border touch-manipulation"
                style={{ borderColor: 'var(--border)' }}
                checked={alsoApplyToBudgetCsv}
                disabled={!budgetAdjustEligibilityCsv.ok}
                onChange={(e) => setAlsoApplyToBudgetCsv(e.target.checked)}
              />
              <span className="text-sm leading-snug min-w-0" style={{ color: 'var(--text)' }}>
                <span className="font-medium">Legg også til i budsjett</span>
                <span className="block mt-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  Øker planlagte månedbeløp for samme kategori og måned som transaksjonene (budsjettår {budgetYear}).
                  Inntekt med trekk i budsjettet justeres til brutto. Felles husstandsbudsjettlinjer oppdateres ikke
                  automatisk.
                </span>
              </span>
            </label>
            {!budgetAdjustEligibilityCsv.ok && budgetAdjustBlockedMsgCsv && (
              <p className="text-xs pl-7 sm:pl-8" style={{ color: 'var(--text-muted)' }}>
                {budgetAdjustBlockedMsgCsv}
              </p>
            )}
            {budgetAdjustEligibilityCsv.ok &&
              budgetDeltaPreviewCsv &&
              budgetDeltaPreviewCsv.skippedHouseholdSplitCount > 0 && (
                <p className="text-xs pl-7 sm:pl-8" style={{ color: '#b45309' }}>
                  {budgetDeltaPreviewCsv.skippedHouseholdSplitCount} linje(r) på delt husstandsbudsjett blir ikke lagt til i
                  budsjettplanen.
                </p>
              )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="csv-import-display-name"
              className="block text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Navn på import (valgfritt)
            </label>
            <input
              id="csv-import-display-name"
              type="text"
              value={importDisplayNameCsv}
              onChange={(e) => setImportDisplayNameCsv(e.target.value)}
              maxLength={120}
              placeholder="F.eks. Januarutlegg 2026"
              autoComplete="off"
              className="w-full max-w-md rounded-xl border px-3 py-2.5 text-sm min-h-[44px] touch-manipulation"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
              }}
            />
            <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
              Vises i «Tidligere importer» så du lettere finner riktig kjøring.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm font-medium text-white min-h-[44px] touch-manipulation"
            style={{ background: 'var(--primary)' }}
            onClick={runImport}
          >
            Bekreft import
          </button>

          {csvPreviewExpanded && (
            <div
              className="fixed inset-0 z-[210] flex items-center justify-center sm:p-5"
              style={{
                background: 'rgba(15, 23, 42, 0.45)',
                paddingLeft: 'max(0.75rem, calc(env(safe-area-inset-left) + 0.5rem))',
                paddingRight: 'max(0.75rem, calc(env(safe-area-inset-right) + 0.5rem))',
                paddingTop: 'max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))',
                paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
              }}
              role="presentation"
              {...csvPreviewExpandBackdropDismiss}
            >
              <div
                className="w-full max-w-5xl min-w-0 min-h-0 flex flex-col rounded-2xl shadow-xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  maxHeight:
                    'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem)',
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="csv-preview-expand-title"
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 sm:px-6 shrink-0 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <h3
                    id="csv-preview-expand-title"
                    className="font-semibold text-lg min-w-0 pr-2 m-0"
                    style={{ color: 'var(--text)' }}
                  >
                    Forhåndsvisning
                  </h3>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6">
                  <div className="py-3">
                    <CsvTransactionImportPreviewTable
                      sections={csvPreviewSections}
                      excludedCsvFileLines={excludedCsvFileLines}
                      setExcludedCsvFileLines={setExcludedCsvFileLines}
                      formatNOKImport={formatNOKImport}
                    />
                  </div>
                </div>
                <div
                  className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 py-3 sm:px-6 border-t"
                  style={{
                    borderColor: 'var(--border)',
                    paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                    background: 'var(--surface)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCsvPreviewExpanded(false)}
                    className="min-h-[44px] w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-medium text-white touch-manipulation"
                    style={{ background: 'var(--primary)' }}
                  >
                    Lukk
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isBankImportMode(importMode) && bankStep === 'upload' && (
        <BankTransactionImportDropzone
          variant={importMode === 'bank_sparebank1' ? 'sparebank1' : 'dnb_sbanken'}
          onBankParsed={onBankParsed}
          disabled={!person}
        />
      )}

      {isBankImportMode(importMode) && bankStep === 'mapping' && person && (
        <div className="space-y-4 min-w-0">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Fil: <strong style={{ color: 'var(--text)' }}>{bankFileLabel}</strong> — {bankParsedRows.length} rader.
            Kartlegg hver forklaring til riktig budsjettkategori. Standardvisning viser bare det som mangler mapping.
            Giro-referanser normaliseres slik at samme leverandør gjenbruker mapping.
          </p>
          {bankAiError && !bankMappingExpanded && (
            <div className="rounded-xl p-3 text-sm" style={{ background: '#fffbeb', color: '#92400e' }}>
              {bankAiError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm min-h-[44px] touch-manipulation">
              <input
                type="checkbox"
                checked={showOnlyUnmapped}
                onChange={(e) => setShowOnlyUnmapped(e.target.checked)}
              />
              Trenger kartlegging (kun ikke mappet)
            </label>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onClick={() => setBankMappingExpanded(true)}
            >
              <Maximize2 size={18} aria-hidden />
              Utvid kartlegging
            </button>
            {bankUnmappedAggregates.length > 0 && (
              <button
                type="button"
                disabled={bankAiBusy}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  opacity: bankAiBusy ? 0.65 : 1,
                }}
                onClick={() => void fetchBankAiSuggestions()}
              >
                <Sparkles size={18} aria-hidden />
                {bankAiBusy ? bankAiProgress ?? 'Henter forslag …' : 'Foreslå kategorier med KI'}
              </button>
            )}
          </div>
          {bankUnmappedAggregates.length > BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST && (
            <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
              KI kan kjøre flere steg automatisk (maks {BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST} typer per steg). Hvert steg
              teller som én melding mot AI-kvoten denne måneden.
            </p>
          )}
          <div
            className="rounded-2xl border overflow-hidden max-h-[min(55vh,24rem)] overflow-y-auto"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="px-3 py-3 sm:px-4 sm:py-4">
              <BankImportMappingAggregateLists
                incomeList={bankVisibleIncome}
                expenseList={bankVisibleExpense}
                incomeSectionMode={bankMappingIncomeSectionMode}
                expenseSectionMode={bankMappingExpenseSectionMode}
                formatNOK={formatNOKImport}
                allPickerCategories={pickerCategories}
                resolvedCategoryName={resolvedBankCategoryName}
                onCategoryChange={(a, name) =>
                  applyBankMappingWithLegacyFanout(
                    a.mappingKey,
                    name?.trim() ? { categoryName: name.trim() } : null,
                  )
                }
                budgetCategories={person.budgetCategories}
                customBudgetLabels={labelListsForPerson(person).customBudgetLabels}
                addBudgetCategory={addBudgetCategory}
                addCustomBudgetLabel={addCustomBudgetLabel}
              />
            </div>
          </div>
          {bankVisibleAggregates.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {showOnlyUnmapped
                ? 'Alle forklaringer er kartlagt. Slå av «Trenger kartlegging» for å se hele listen.'
                : 'Ingen rader.'}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={!bankCanGoPreview}
              className="rounded-xl px-4 py-3 text-sm font-medium text-white min-h-[44px] touch-manipulation disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
              onClick={() => setBankStep('preview')}
            >
              Fortsett til forhåndsvisning
            </button>
          </div>

          {bankMappingExpanded && (
            <div
              className="fixed inset-0 z-[210] flex items-center justify-center sm:p-5"
              style={{
                background: 'rgba(15, 23, 42, 0.45)',
                paddingLeft: 'max(0.75rem, calc(env(safe-area-inset-left) + 0.5rem))',
                paddingRight: 'max(0.75rem, calc(env(safe-area-inset-right) + 0.5rem))',
                paddingTop: 'max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))',
                paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
              }}
              role="presentation"
              {...bankMappingExpandBackdropDismiss}
            >
              <div
                className="w-full max-w-3xl min-w-0 min-h-0 flex flex-col rounded-2xl shadow-xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  maxHeight:
                    'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem)',
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="bank-mapping-expand-title"
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 sm:px-6 shrink-0 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <h3
                    id="bank-mapping-expand-title"
                    className="font-semibold text-lg min-w-0 pr-2 m-0"
                    style={{ color: 'var(--text)' }}
                  >
                    Kartlegging
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 shrink-0 min-w-0">
                    {bankUnmappedAggregates.length > 0 && (
                      <button
                        type="button"
                        disabled={bankAiBusy}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
                        style={{
                          border: '1px solid var(--border)',
                          color: 'var(--primary)',
                          opacity: bankAiBusy ? 0.65 : 1,
                        }}
                        onClick={() => void fetchBankAiSuggestions()}
                      >
                        <Sparkles size={18} aria-hidden />
                        {bankAiBusy ? bankAiProgress ?? 'Henter forslag …' : 'Foreslå kategorier med KI'}
                      </button>
                    )}
                  </div>
                </div>
                {bankAiError && (
                  <div
                    className="shrink-0 mx-4 sm:mx-6 mt-3 mb-1 rounded-xl p-3 text-sm"
                    style={{ background: '#fffbeb', color: '#92400e' }}
                  >
                    {bankAiError}
                  </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6">
                  <BankImportMappingAggregateLists
                    incomeList={bankVisibleIncome}
                    expenseList={bankVisibleExpense}
                    incomeSectionMode={bankMappingIncomeSectionMode}
                    expenseSectionMode={bankMappingExpenseSectionMode}
                    className="py-3"
                    formatNOK={formatNOKImport}
                    allPickerCategories={pickerCategories}
                    resolvedCategoryName={resolvedBankCategoryName}
                    onCategoryChange={(a, name) =>
                      applyBankMappingWithLegacyFanout(
                        a.mappingKey,
                        name?.trim() ? { categoryName: name.trim() } : null,
                      )
                    }
                    budgetCategories={person.budgetCategories}
                    customBudgetLabels={labelListsForPerson(person).customBudgetLabels}
                    addBudgetCategory={addBudgetCategory}
                    addCustomBudgetLabel={addCustomBudgetLabel}
                    fieldIdScope="utvid"
                  />
                </div>
                <div
                  className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 py-3 sm:px-6 border-t"
                  style={{
                    borderColor: 'var(--border)',
                    paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                    background: 'var(--surface)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setBankMappingExpanded(false)}
                    className="min-h-[44px] w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-medium text-white touch-manipulation"
                    style={{ background: 'var(--primary)' }}
                  >
                    Lukk og lagre
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isBankImportMode(importMode) && bankStep === 'preview' && (
        <div className="space-y-4">
          {bankFileLabel && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Fil: <strong style={{ color: 'var(--text)' }}>{bankFileLabel}</strong> — {bankParsedRows.length}{' '}
              rader. Parser/advarsler: {bankRowErrors.length}.
            </p>
          )}
          {person && (
            <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
              Du kan endre kategori og beløp (inntil to desimaler) per rad før du bekrefter. Kategoriendring gjenbrukes for samme
              typet forklaring; beløp gjelder bare denne importen.
            </p>
          )}
          {bankDuplicatePreviewCount > 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Advarsel: {bankDuplicatePreviewCount} rad(er) kan overlappe med eksisterende transaksjoner (samme dato,
              beløp, beskrivelse og kategori).
            </p>
          )}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center mt-6">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation w-full sm:w-auto"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onClick={() => setBankPreviewExpanded(true)}
            >
              <Maximize2 size={18} aria-hidden />
              Utvid forhåndsvisning
            </button>
          </div>
          <div
            className="rounded-2xl overflow-hidden border max-h-[min(60vh,28rem)] overflow-y-auto overflow-x-auto min-w-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <BankTransactionImportPreviewTable
              sections={bankPreviewSections}
              excludedBankFileLines={excludedBankFileLines}
              setExcludedBankFileLines={setExcludedBankFileLines}
              bankParsedRowByFileLine={bankParsedRowByFileLine}
              person={person ?? null}
              bankMaps={bankMaps}
              pickerCategories={pickerCategories}
              resolveBankMappingCategoryName={resolveBankMappingCategoryName}
              applyBankMappingWithLegacyFanout={applyBankMappingWithLegacyFanout}
              budgetCategories={person?.budgetCategories ?? []}
              customBudgetLabels={
                person ? labelListsForPerson(person).customBudgetLabels : emptyLabelLists().customBudgetLabels
              }
              addBudgetCategory={addBudgetCategory}
              addCustomBudgetLabel={addCustomBudgetLabel}
              bankAmountOverridesByLine={bankAmountOverridesByLine}
              setBankLineAmountOverride={setBankLineAmountOverride}
              formatNOKImport={formatNOKImport}
              fieldIdScope="bank-preview-inline"
            />
          </div>
          {bankPreviewSections.some((s) => s.total > 100) ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Maks 100 rader vises per gruppe i forhåndsvisning.
              {bankPreviewSections.map((s) => (
                <span key={`bank-hint-${s.key}`} className="block mt-0.5">
                  {s.title}: {s.total} rad{s.total === 1 ? '' : 'er'}
                  {s.total > 100 ? ' (viser 100)' : ''}
                </span>
              ))}
            </p>
          ) : null}
          {bankRowErrors.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium" style={{ color: 'var(--text-muted)' }}>
                Parser-feil ({bankRowErrors.length})
              </summary>
              <ul className="mt-2 space-y-1 list-disc pl-5" style={{ color: 'var(--text-muted)' }}>
                {bankRowErrors.slice(0, 30).map((e, i) => (
                  <li key={i}>
                    Linje {e.fileLine}: {e.reason}
                    {e.detail ? ` (${e.detail})` : ''}
                  </li>
                ))}
                {bankRowErrors.length > 30 && <li>…</li>}
              </ul>
            </details>
          )}
          <div
            className="rounded-xl border px-4 py-3 space-y-2"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <label className="flex items-start gap-3 cursor-pointer touch-manipulation min-h-[44px]">
              <input
                type="checkbox"
                className="mt-1 shrink-0 rounded border touch-manipulation"
                style={{ borderColor: 'var(--border)' }}
                checked={alsoApplyToBudgetBank}
                disabled={!budgetAdjustEligibilityBank.ok}
                onChange={(e) => setAlsoApplyToBudgetBank(e.target.checked)}
              />
              <span className="text-sm leading-snug min-w-0" style={{ color: 'var(--text)' }}>
                <span className="font-medium">Legg også til i budsjett</span>
                <span className="block mt-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  Øker planlagte månedbeløp for samme kategori og måned som transaksjonene (budsjettår {budgetYear}).
                  Inntekt med trekk i budsjettet justeres til brutto. Felles husstandsbudsjettlinjer oppdateres ikke
                  automatisk.
                </span>
              </span>
            </label>
            {!budgetAdjustEligibilityBank.ok && budgetAdjustBlockedMsgBank && (
              <p className="text-xs pl-7 sm:pl-8" style={{ color: 'var(--text-muted)' }}>
                {budgetAdjustBlockedMsgBank}
              </p>
            )}
            {budgetAdjustEligibilityBank.ok &&
              budgetDeltaPreviewBank &&
              budgetDeltaPreviewBank.skippedHouseholdSplitCount > 0 && (
                <p className="text-xs pl-7 sm:pl-8" style={{ color: '#b45309' }}>
                  {budgetDeltaPreviewBank.skippedHouseholdSplitCount} linje(r) på delt husstandsbudsjett blir ikke lagt til i
                  budsjettplanen.
                </p>
              )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="bank-import-display-name"
              className="block text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Navn på import (valgfritt)
            </label>
            <input
              id="bank-import-display-name"
              type="text"
              value={importDisplayNameBank}
              onChange={(e) => setImportDisplayNameBank(e.target.value)}
              maxLength={120}
              placeholder="F.eks. DNB januar 2026"
              autoComplete="off"
              className="w-full max-w-md rounded-xl border px-3 py-2.5 text-sm min-h-[44px] touch-manipulation"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
              }}
            />
            <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
              Vises i «Tidligere importer» så du lettere finner riktig kjøring.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              onClick={() => setBankStep('mapping')}
            >
              Tilbake til kartlegging
            </button>
            <button
              type="button"
              disabled={!bankCanGoPreview}
              className="rounded-xl px-4 py-3 text-sm font-medium text-white min-h-[44px] touch-manipulation disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
              onClick={runBankImport}
            >
              Bekreft import
            </button>
          </div>

          {bankPreviewExpanded && (
            <div
              className="fixed inset-0 z-[210] flex items-center justify-center sm:p-5"
              style={{
                background: 'rgba(15, 23, 42, 0.45)',
                paddingLeft: 'max(0.75rem, calc(env(safe-area-inset-left) + 0.5rem))',
                paddingRight: 'max(0.75rem, calc(env(safe-area-inset-right) + 0.5rem))',
                paddingTop: 'max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))',
                paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
              }}
              role="presentation"
              {...bankPreviewExpandBackdropDismiss}
            >
              <div
                className="w-full max-w-5xl min-w-0 min-h-0 flex flex-col rounded-2xl shadow-xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  maxHeight:
                    'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem)',
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="bank-preview-expand-title"
              >
                <div
                  className="flex flex-col gap-0.5 px-4 py-3 sm:px-6 shrink-0 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <h3
                    id="bank-preview-expand-title"
                    className="font-semibold text-lg min-w-0 pr-2 m-0"
                    style={{ color: 'var(--text)' }}
                  >
                    Forhåndsvisning
                  </h3>
                  <p className="text-xs m-0 leading-snug" style={{ color: 'var(--text-muted)' }}>
                    Gruppert etter valgt kategori innen hver blokk (øvrige / kontoregulering). Inline-forhåndsvisning er
                    uendret.
                  </p>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6">
                  <div className="py-3 overflow-x-auto min-w-0">
                    <BankTransactionImportPreviewTable
                      sections={bankPreviewSections}
                      excludedBankFileLines={excludedBankFileLines}
                      setExcludedBankFileLines={setExcludedBankFileLines}
                      bankParsedRowByFileLine={bankParsedRowByFileLine}
                      person={person ?? null}
                      bankMaps={bankMaps}
                      pickerCategories={pickerCategories}
                      resolveBankMappingCategoryName={resolveBankMappingCategoryName}
                      applyBankMappingWithLegacyFanout={applyBankMappingWithLegacyFanout}
                      budgetCategories={person?.budgetCategories ?? []}
                      customBudgetLabels={
                        person
                          ? labelListsForPerson(person).customBudgetLabels
                          : emptyLabelLists().customBudgetLabels
                      }
                      addBudgetCategory={addBudgetCategory}
                      addCustomBudgetLabel={addCustomBudgetLabel}
                      bankAmountOverridesByLine={bankAmountOverridesByLine}
                      setBankLineAmountOverride={setBankLineAmountOverride}
                      formatNOKImport={formatNOKImport}
                      fieldIdScope="bank-preview-utvid"
                      groupRowsByCategory
                    />
                  </div>
                </div>
                <div
                  className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 py-3 sm:px-6 border-t"
                  style={{
                    borderColor: 'var(--border)',
                    paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                    background: 'var(--surface)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setBankPreviewExpanded(false)}
                    className="min-h-[44px] w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-medium text-white touch-manipulation"
                    style={{ background: 'var(--primary)' }}
                  >
                    Lukk
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      </div>

      {isBankImportMode(importMode) && (
        <section className="rounded-2xl p-6 sm:p-8 space-y-4 max-w-3xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--text)' }}>
            Tidligere bankimporter
          </h2>
          <BankImportHistoryList runs={bankImportHistory} />
        </section>
      )}

      {importMode === 'template_csv' && (
        <section
          className="rounded-2xl p-6 sm:p-8 space-y-4 max-w-3xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--text)' }}>
            Tidligere Excel-importer
          </h2>
          <TemplateCsvImportHistoryList runs={templateCsvImportHistory} />
        </section>
      )}

      <TransactionImportSummaryModal
        open={summaryOpen}
        onClose={() => {
          setSummaryOpen(false)
          resetFlow()
          resetBankFlow()
        }}
        summary={summary}
        skippedCategoryRows={skippedImportRows}
        parseErrorCount={summaryParseErrorCount}
        duplicateWarningCount={dupWarn}
      />
    </div>
  )
}
