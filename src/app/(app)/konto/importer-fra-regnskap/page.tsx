'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import ImportCategoryPicker from '@/components/konto/ImportCategoryPicker'
import TransactionImportDropzone from '@/components/konto/TransactionImportDropzone'
import LedgerImportHistoryList from '@/components/konto/LedgerImportHistoryList'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import { buildTransactionsFromLedgerLines } from '@/lib/ledgerImport/buildTransactionsFromLedger'
import { rollupLedgerLinesByAccount } from '@/lib/ledgerImport/ledgerAccountRollup'
import { formatLedgerImportAmountNb } from '@/lib/ledgerImport/formatLedgerImportAmount'
import { LEDGER_IMPORT_MAX_FILE_BYTES } from '@/lib/ledgerImport/ledgerImport.constants'
import { parseLedgerCsvText } from '@/lib/ledgerImport/parseLedgerCsv'
import { getLedgerProfileForSource } from '@/lib/ledgerImport/profiles'
import type { CanonicalLedgerLine, LedgerSourceId, ParseLedgerCsvResult } from '@/lib/ledgerImport/types'
import {
  countPotentialDuplicateLedgerLines,
  summarizeLedgerLinesForPreview,
} from '@/lib/ledgerImport/summarizeLedgerImport'
import { mergeBudgetCategoriesForTransactionPicker } from '@/lib/transactionCategoryPicker'
import { useStore } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatIsoDateDdMmYyyy, generateId } from '@/lib/utils'
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, RotateCcw, X } from 'lucide-react'

const SOURCE_OPTIONS: { id: LedgerSourceId; label: string }[] = [
  { id: 'conta', label: 'Conta' },
  { id: 'tripletex', label: 'Tripletex' },
  { id: 'fiken', label: 'Fiken' },
  { id: 'twentyfourseven', label: '24SevenOffice' },
  { id: 'generic', label: 'Generisk (test / annet)' },
]

type Step = 'upload' | 'mapping' | 'summary'

function labelListsForPerson(person: {
  customBudgetLabels?: Record<string, string[]>
  hiddenBudgetLabels?: Record<string, string[]>
}) {
  const empty = emptyLabelLists()
  return {
    customBudgetLabels: person.customBudgetLabels ?? empty.customBudgetLabels,
    hiddenBudgetLabels: person.hiddenBudgetLabels ?? empty.hiddenBudgetLabels,
  }
}

export default function ImporterFraRegnskapPage() {
  const { formatNOK } = useNokDisplayFormatters()
  const profiles = useStore((s) => s.profiles)
  const people = useStore((s) => s.people)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const setActiveProfileId = useStore((s) => s.setActiveProfileId)
  const addTransactions = useStore((s) => s.addTransactions)
  const addAppNotification = useStore((s) => s.addAppNotification)
  const ledgerAccountMappings = useStore((s) => s.ledgerAccountMappings)
  const ledgerImportHistory = useStore((s) => s.ledgerImportHistory)
  const setLedgerAccountMapping = useStore((s) => s.setLedgerAccountMapping)
  const appendLedgerImportRun = useStore((s) => s.appendLedgerImportRun)
  const addBudgetCategory = useStore((s) => s.addBudgetCategory)
  const addCustomBudgetLabel = useStore((s) => s.addCustomBudgetLabel)

  const [importProfileId, setImportProfileId] = useState(activeProfileId)
  const [sourceId, setSourceId] = useState<LedgerSourceId>('conta')
  const [step, setStep] = useState<Step>('upload')
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ParseLedgerCsvResult | null>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [expandedLedgerAccounts, setExpandedLedgerAccounts] = useState<Record<string, boolean>>({})
  const [excludedFileLines, setExcludedFileLines] = useState<Set<number>>(() => new Set())
  const [forceIncludeHeldBack, setForceIncludeHeldBack] = useState<Set<number>>(() => new Set())
  const [importDisplayName, setImportDisplayName] = useState('')

  const person = people[importProfileId]
  const pickerCategories = useMemo(() => {
    if (!person) return []
    return mergeBudgetCategoriesForTransactionPicker(person.budgetCategories, labelListsForPerson(person))
  }, [person])

  const ledgerProfile = useMemo(() => getLedgerProfileForSource(sourceId), [sourceId])

  const ledgerWorkingLines = useMemo(() => {
    if (!parseResult) return []
    const extra = parseResult.heldBackLines
      .filter((h) => forceIncludeHeldBack.has(h.line.fileLine))
      .map((h) => h.line)
    const merged = [...parseResult.lines, ...extra]
    merged.sort((a, b) => a.fileLine - b.fileLine)
    return merged
  }, [parseResult, forceIncludeHeldBack])

  const ledgerCandidateCount = useMemo(() => {
    if (!parseResult) return 0
    return parseResult.lines.length + parseResult.heldBackLines.length
  }, [parseResult])

  const linesIncluded = useMemo(
    () => ledgerWorkingLines.filter((l) => !excludedFileLines.has(l.fileLine)),
    [ledgerWorkingLines, excludedFileLines],
  )

  const linesByAccountAll = useMemo(() => {
    const m = new Map<string, CanonicalLedgerLine[]>()
    for (const l of ledgerWorkingLines) {
      const arr = m.get(l.accountCode) ?? []
      arr.push(l)
      m.set(l.accountCode, arr)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.fileLine - b.fileLine)
    }
    return m
  }, [ledgerWorkingLines])

  const accountStats = useMemo(() => {
    const roll = rollupLedgerLinesByAccount(linesIncluded)
    return [...roll.entries()].sort((a, b) => a[0].localeCompare(b[0], 'nb'))
  }, [linesIncluded])

  const mappingForAccount = useCallback(
    (code: string): string => {
      return ledgerAccountMappings[sourceId]?.[code]?.categoryName ?? ''
    },
    [ledgerAccountMappings, sourceId],
  )

  const setLineExcluded = useCallback((fileLine: number, excluded: boolean) => {
    setExcludedFileLines((prev) => {
      const next = new Set(prev)
      if (excluded) next.add(fileLine)
      else next.delete(fileLine)
      return next
    })
  }, [])

  const toggleForceIncludeHeldBack = useCallback((fileLine: number) => {
    setForceIncludeHeldBack((prev) => {
      const next = new Set(prev)
      if (next.has(fileLine)) next.delete(fileLine)
      else next.add(fileLine)
      return next
    })
  }, [])

  const excludeAllForAccount = useCallback((code: string) => {
    const accLines = linesByAccountAll.get(code) ?? []
    setExcludedFileLines((prev) => {
      const next = new Set(prev)
      for (const l of accLines) next.add(l.fileLine)
      return next
    })
  }, [linesByAccountAll])

  const includeAllForAccount = useCallback((code: string) => {
    const accLines = linesByAccountAll.get(code) ?? []
    setExcludedFileLines((prev) => {
      const next = new Set(prev)
      for (const l of accLines) next.delete(l.fileLine)
      return next
    })
  }, [linesByAccountAll])

  const fullyExcludedAccounts = useMemo(() => {
    const out: { code: string; label: string; lineCount: number }[] = []
    for (const [code, accLines] of linesByAccountAll) {
      if (accLines.length === 0) continue
      if (accLines.every((l) => excludedFileLines.has(l.fileLine))) {
        const label = accLines[0]?.accountName || code
        out.push({ code, label, lineCount: accLines.length })
      }
    }
    return out.sort((a, b) => a.code.localeCompare(b.code, 'nb'))
  }, [linesByAccountAll, excludedFileLines])

  const formatRollupKr = useCallback(
    (n: number) =>
      ledgerProfile.amountPrecision === 'ore' ? formatLedgerImportAmountNb(n) : formatNOK(n),
    [ledgerProfile.amountPrecision, formatNOK],
  )

  const accountToCategoryRecord = useMemo(() => {
    const r: Record<string, string | undefined> = {}
    for (const [code] of accountStats) {
      const v = mappingForAccount(code)?.trim()
      r[code] = v || undefined
    }
    return r
  }, [accountStats, mappingForAccount])

  const previewSummary = useMemo(
    () => summarizeLedgerLinesForPreview(linesIncluded, accountToCategoryRecord),
    [linesIncluded, accountToCategoryRecord],
  )

  const dupWarn = useMemo(() => {
    if (!person || linesIncluded.length === 0) return 0
    return countPotentialDuplicateLedgerLines(
      linesIncluded,
      (acc) => mappingForAccount(acc) || null,
      person.transactions,
    )
  }, [person, linesIncluded, mappingForAccount])

  const handleProfileChange = (pid: string) => {
    setImportProfileId(pid)
    setActiveProfileId(pid)
  }

  const resetFlow = useCallback(() => {
    setStep('upload')
    setParseError(null)
    setParseResult(null)
    setFileLabel(null)
    setExpandedLedgerAccounts({})
    setExcludedFileLines(new Set())
    setForceIncludeHeldBack(new Set())
    setImportDisplayName('')
  }, [])

  const onFileText = useCallback(
    (text: string, name: string) => {
      setParseError(null)
      const byteLen = new TextEncoder().encode(text).length
      if (byteLen > LEDGER_IMPORT_MAX_FILE_BYTES) {
        setParseError('Filen er for stor (maks 5 MB).')
        return
      }
      const prof = getLedgerProfileForSource(sourceId)
      const result = parseLedgerCsvText(text, prof)
      if (result.lines.length === 0 && result.heldBackLines.length === 0 && result.rowErrors.length > 0) {
        const first = result.rowErrors[0]
        setParseError(first?.detail ?? 'Kunne ikke lese filen. Sjekk overskrifter og skilletegn.')
        setParseResult(null)
        setFileLabel(name)
        return
      }
      setExpandedLedgerAccounts({})
      setExcludedFileLines(new Set())
      setForceIncludeHeldBack(new Set())
      setImportDisplayName('')
      setParseResult(result)
      setFileLabel(name)
      setStep('mapping')
    },
    [sourceId],
  )

  const goToSummary = () => {
    if (previewSummary.unmappedLineCount > 0 || linesIncluded.length === 0) return
    setStep('summary')
  }

  const runImport = () => {
    if (!person || linesIncluded.length === 0 || previewSummary.unmappedLineCount > 0) return
    setActiveProfileId(importProfileId)
    const pid = importProfileId
    const runId = generateId()
    const map: Record<string, string | undefined> = {}
    for (const [code] of accountStats) {
      const c = mappingForAccount(code).trim()
      map[code] = c || undefined
    }
    const { transactions, skippedUnmapped, skippedUnknownCategory, importedLineSnapshots } =
      buildTransactionsFromLedgerLines(linesIncluded, map, pickerCategories, pid, runId)
    addTransactions(transactions)
    const skipped = skippedUnmapped + skippedUnknownCategory
    const labelTrim = importDisplayName.trim()
    appendLedgerImportRun({
      id: runId,
      createdAt: new Date().toISOString(),
      sourceId,
      profileId: pid,
      csvProfileId: ledgerProfile.id,
      fileName: fileLabel,
      displayName: labelTrim ? labelTrim : null,
      rowCountParsed: linesIncluded.length,
      rowCountImported: transactions.length,
      rowCountSkipped: skipped,
      errorSummary: null,
      importedLines: importedLineSnapshots,
    })
    const parts: string[] = [`${transactions.length} transaksjon${transactions.length === 1 ? '' : 'er'} fra regnskap.`]
    if (skipped > 0) parts.push(`${skipped} rad${skipped === 1 ? '' : 'er'} hoppet over.`)
    if (dupWarn > 0) parts.push(`${dupWarn} mulig${dupWarn === 1 ? '' : 'e'} duplikat.`)
    addAppNotification({
      title: 'Import fra regnskap fullført',
      body: parts.join(' '),
      kind: 'budget',
    })
    resetFlow()
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/konto/innstillinger"
          className="inline-flex items-center gap-1 font-medium min-h-[44px] sm:min-h-0 touch-manipulation"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          Min konto
        </Link>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text)' }}>Import fra regnskap</span>
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
            Import fra regnskap (CSV)
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Last opp hovedbok eller tilsvarende CSV fra regnskapssystemet. Velg riktig kilde slik at kolonnene tolkes
            riktig. Kartlegg hver regnskapskonto til en kategori — valgene huskes til neste import. Beløp lagres
            som positive tall; inntekt eller utgift følger kategorien du velger.
          </p>
          <a
            href="https://hjelp.conta.no/regnskap/rapporter-regnskap/hovedbok/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2 min-h-[44px] touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
          >
            <BookOpen size={18} className="shrink-0 opacity-90" aria-hidden />
            Conta: eksporter hovedbok som CSV
          </a>
        </div>

        <div
          className="space-y-4 pt-2 border-t scroll-mt-24"
          style={{ borderColor: 'var(--border)' }}
          id="ledger-import-start"
        >
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
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Regnskapssystem (CSV-profil)
            </label>
            <select
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value as LedgerSourceId)
                resetFlow()
              }}
              className="w-full max-w-md rounded-xl px-3 py-3 sm:py-2 text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
              style={{ border: '1px solid var(--border)', background: '#fff', color: 'var(--text)' }}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Profil: <code className="text-[11px]">{ledgerProfile.id}</code>
              {sourceId === 'conta'
                ? ' — tilpasset Conta hovedbok CSV.'
                : ' — justeres når vi låser ekte eksportfiler per leverandør.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(step !== 'upload' || parseResult) && (
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-3 sm:py-2 min-h-[44px] touch-manipulation"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                onClick={resetFlow}
              >
                <RotateCcw size={15} className="shrink-0" aria-hidden />
                Start på nytt
              </button>
            )}
          </div>

          {parseError && (
            <div className="rounded-xl p-4 text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
              {parseError}
            </div>
          )}

          {parseResult &&
            parseResult.rowErrors.length > 0 &&
            (parseResult.lines.length > 0 || parseResult.heldBackLines.length > 0) && (
            <div className="rounded-xl p-4 text-sm space-y-1" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
              <p className="font-medium">Parser-advarsler ({parseResult.rowErrors.length})</p>
              <ul className="text-xs max-h-32 overflow-y-auto space-y-1" style={{ color: 'var(--text-muted)' }}>
                {parseResult.rowErrors.slice(0, 40).map((e, i) => (
                  <li key={i}>
                    Linje {e.fileLine}: {e.reason}
                    {e.detail ? ` — ${e.detail}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 'upload' && <TransactionImportDropzone onFileText={onFileText} disabled={!person} />}

          {step === 'mapping' &&
            parseResult &&
            (parseResult.lines.length > 0 || parseResult.heldBackLines.length > 0) && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Fil: <strong style={{ color: 'var(--text)' }}>{fileLabel}</strong> — {ledgerCandidateCount} poster i
                filen, {linesIncluded.length} med i importen, {accountStats.length} ulike kontoer med poster til import.
                {parseResult.heldBackLines.length > 0 && (
                  <>
                    {' '}
                    {parseResult.heldBackLines.length} uten bilag er tatt ut (ofte saldo) — se listen nederst og huk av «Ta
                    med» ved behov.
                  </>
                )}{' '}
                Bruk «Vis alle poster» for detaljer, «Ekskluder alle» for å fjerne hele kontoen, eller X på enkeltlinjer.
                Summer gjelder kun linjer som importeres. Velg kategori for hver aktiv konto. Tomt valg tillates ikke før
                du går videre.
              </p>
              {linesIncluded.length === 0 && (
                <p className="text-sm rounded-xl px-3 py-3" style={{ background: '#fef2f2', color: '#991b1b' }}>
                  Alle linjer er ekskludert fra import. Under «Kontoer uten import» kan du trykke «Ta med konto», eller åpne
                  en konto og bruke «Ta med» på enkeltlinjer.
                </p>
              )}
              <div className="space-y-3">
                {accountStats.map(([code, roll]) => {
                  const expanded = expandedLedgerAccounts[code] === true
                  const accountLines = linesByAccountAll.get(code) ?? []
                  const totalOnAccount = accountLines.length
                  const linesPanelId = `ledger-import-lines-${code}`
                  const sumParts: string[] = []
                  if (roll.sumExpense > 0) sumParts.push(`Sum ${formatRollupKr(roll.sumExpense)} kr`)
                  if (roll.sumIncome > 0) sumParts.push(`Sum ${formatRollupKr(roll.sumIncome)} kr`)
                  return (
                  <div
                    key={code}
                    className="rounded-xl border p-4 space-y-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {code}
                        </span>
                        {roll.label && roll.label !== code && (
                          <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                            {roll.label}
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 min-w-0 max-w-full sm:max-w-[min(100%,28rem)] flex flex-col gap-2 items-end text-right">
                        <div
                          className="text-xs tabular-nums leading-snug inline-flex flex-wrap items-baseline justify-end gap-x-1.5 gap-y-0"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span>
                            {roll.count === totalOnAccount
                              ? `${roll.count} linje${roll.count === 1 ? '' : 'r'} til import`
                              : `${roll.count} av ${totalOnAccount} linjer til import`}
                          </span>
                          {sumParts.length > 0 && (
                            <>
                              <span className="opacity-40 select-none" aria-hidden>
                                ·
                              </span>
                              <span>{sumParts.join(' · ')}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 w-full sm:w-auto">
                          <button
                            type="button"
                            className="text-xs font-medium inline-flex items-center gap-1 py-1.5 px-2 min-h-[40px] sm:min-h-[36px] touch-manipulation rounded-lg -mr-1 sm:mr-0"
                            style={{ color: 'var(--primary)' }}
                            aria-expanded={expanded}
                            aria-controls={linesPanelId}
                            aria-label={
                              expanded
                                ? `Skjul poster for konto ${code}`
                                : `Vis alle ${totalOnAccount} postering${totalOnAccount === 1 ? '' : 'er'} for konto ${code}`
                            }
                            onClick={() =>
                              setExpandedLedgerAccounts((s) => ({ ...s, [code]: !expanded }))
                            }
                          >
                            {expanded ? 'Skjul poster' : `Vis alle poster (${totalOnAccount})`}
                            <ChevronDown
                              size={16}
                              className="shrink-0 transition-transform"
                              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                              aria-hidden
                            />
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium inline-flex items-center py-1.5 px-2.5 min-h-[40px] sm:min-h-[36px] rounded-lg touch-manipulation whitespace-nowrap"
                            style={{
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                            }}
                            aria-label={`Ekskluder alle linjer på konto ${code} fra import`}
                            onClick={() => excludeAllForAccount(code)}
                          >
                            Ekskluder alle
                          </button>
                        </div>
                      </div>
                    </div>
                    {expanded && (
                      <div
                        id={linesPanelId}
                        role="region"
                        aria-label={`Poster for konto ${code}`}
                        className="rounded-lg px-2 py-2 text-xs space-y-1.5 max-h-[min(40vh,16rem)] overflow-y-auto overscroll-contain"
                        style={{
                          background: 'color-mix(in srgb, var(--surface) 88%, var(--border))',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {accountLines.map((l, i) => {
                          const isExcluded = excludedFileLines.has(l.fileLine)
                          return (
                          <div
                            key={`${code}-L${l.fileLine}-i${i}`}
                            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pb-1.5 border-b last:border-b-0 last:pb-0"
                            style={{
                              borderColor: 'var(--border)',
                              opacity: isExcluded ? 0.55 : 1,
                            }}
                          >
                            {isExcluded ? (
                              <button
                                type="button"
                                className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium touch-manipulation min-h-[36px] sm:min-h-0"
                                style={{ border: '1px solid var(--border)', color: 'var(--primary)', background: 'var(--surface)' }}
                                onClick={() => setLineExcluded(l.fileLine, false)}
                              >
                                Ta med
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="shrink-0 rounded-md p-1.5 min-h-[36px] min-w-[36px] inline-flex items-center justify-center touch-manipulation"
                                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
                                aria-label="Ekskluder linje fra import"
                                onClick={() => setLineExcluded(l.fileLine, true)}
                              >
                                <X size={14} aria-hidden />
                              </button>
                            )}
                            <span
                              className="tabular-nums shrink-0 text-[11px]"
                              style={{ color: 'var(--text)', textDecoration: isExcluded ? 'line-through' : undefined }}
                            >
                              {formatIsoDateDdMmYyyy(l.dateIso)}
                            </span>
                            <span
                              className="tabular-nums font-medium shrink-0 text-[11px]"
                              style={{ color: 'var(--text)', textDecoration: isExcluded ? 'line-through' : undefined }}
                            >
                              {ledgerProfile.amountPrecision === 'ore'
                                ? formatLedgerImportAmountNb(l.amount)
                                : formatNOK(l.amount)}{' '}
                              <span className="font-normal opacity-80">
                                kr ({l.ledgerSide === 'income' ? 'innt.' : 'utg.'})
                              </span>
                            </span>
                            <span
                              className="min-w-0 flex-1 basis-full sm:basis-auto leading-snug"
                              style={{ textDecoration: isExcluded ? 'line-through' : undefined }}
                            >
                              {[l.voucherRef, l.description].filter(Boolean).join(' · ') || '—'}
                              {isExcluded && (
                                <span className="ml-1 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                  (ikke import)
                                </span>
                              )}
                            </span>
                          </div>
                          )
                        })}
                      </div>
                    )}
                    <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      Kategori
                    </label>
                    <ImportCategoryPicker
                      fieldId={`ledger-${code}`}
                      value={mappingForAccount(code)}
                      onChange={(name) => {
                        if (!name?.trim()) {
                          setLedgerAccountMapping(sourceId, code, null)
                        } else {
                          setLedgerAccountMapping(sourceId, code, { categoryName: name.trim() })
                        }
                      }}
                      categories={pickerCategories}
                      budgetCategories={person?.budgetCategories ?? []}
                      customBudgetLabels={
                        person
                          ? labelListsForPerson(person).customBudgetLabels
                          : emptyLabelLists().customBudgetLabels
                      }
                      addBudgetCategory={addBudgetCategory}
                      addCustomBudgetLabel={addCustomBudgetLabel}
                      disabled={!person}
                    />
                  </div>
                  )
                })}
              </div>
              {fullyExcludedAccounts.length > 0 && (
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'color-mix(in srgb, var(--surface) 92%, var(--border))',
                  }}
                >
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Kontoer uten import ({fullyExcludedAccounts.length})
                  </h3>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {fullyExcludedAccounts.map(({ code: exCode, label: exLabel, lineCount }) => (
                      <li
                        key={exCode}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                      >
                        <span className="min-w-0">
                          <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>
                            {exCode}
                          </span>
                          {exLabel && exLabel !== exCode && (
                            <span className="ml-2" style={{ color: 'var(--text-muted)' }}>
                              {exLabel}
                            </span>
                          )}
                          <span className="ml-1 text-xs tabular-nums">
                            — {lineCount} linje{lineCount === 1 ? '' : 'r'}
                          </span>
                        </span>
                        <button
                          type="button"
                          className="shrink-0 text-xs font-medium rounded-lg px-3 py-2 min-h-[40px] sm:min-h-[36px] touch-manipulation"
                          style={{ border: '1px solid var(--border)', color: 'var(--primary)', background: 'var(--surface)' }}
                          onClick={() => includeAllForAccount(exCode)}
                        >
                          Ta med konto
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {parseResult.heldBackLines.length > 0 && (
                <details
                  className="group rounded-xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'color-mix(in srgb, var(--surface) 94%, var(--border))',
                  }}
                >
                  <summary
                    className="font-medium cursor-pointer select-none touch-manipulation min-h-[44px] flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden"
                    style={{ color: 'var(--text)' }}
                  >
                    <ChevronDown
                      size={18}
                      className="shrink-0 opacity-70 transition-transform group-open:rotate-180"
                      style={{ color: 'var(--text-muted)' }}
                      aria-hidden
                    />
                    Linjer uten bilag (tatt ut av import) ({parseResult.heldBackLines.length})
                  </summary>
                  <p className="text-xs mt-2 mb-3 pl-0 sm:pl-7" style={{ color: 'var(--text-muted)' }}>
                    Ofte inngående eller utgående balanse. Huk av «Ta med» for linjer du likevel vil ha i kartleggingen.
                  </p>
                  <ul className="space-y-2 max-h-[min(40vh,14rem)] overflow-y-auto pl-0 sm:pl-7">
                    {[...parseResult.heldBackLines]
                      .sort((a, b) => a.line.fileLine - b.line.fileLine)
                      .map((h) => (
                        <li
                          key={h.line.fileLine}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-2 rounded-lg border px-3 py-2"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                        >
                          <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer touch-manipulation shrink-0">
                            <input
                              type="checkbox"
                              checked={forceIncludeHeldBack.has(h.line.fileLine)}
                              onChange={() => toggleForceIncludeHeldBack(h.line.fileLine)}
                              className="shrink-0 rounded border"
                              style={{ borderColor: 'var(--border)' }}
                            />
                            <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                              Ta med
                            </span>
                          </label>
                          <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                            Rad {h.line.fileLine}
                          </span>
                          <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                            {formatIsoDateDdMmYyyy(h.line.dateIso)}
                          </span>
                          <span className="font-mono text-xs font-semibold shrink-0" style={{ color: 'var(--text)' }}>
                            {h.line.accountCode}
                          </span>
                          <span className="text-xs font-medium tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                            {ledgerProfile.amountPrecision === 'ore'
                              ? formatLedgerImportAmountNb(h.line.amount)
                              : formatNOK(h.line.amount)}{' '}
                            kr
                          </span>
                          <span className="text-xs min-w-0 flex-1 basis-full sm:basis-auto" style={{ color: 'var(--text-muted)' }}>
                            {[h.line.voucherRef, h.line.description].filter(Boolean).join(' · ') || '—'}
                          </span>
                        </li>
                      ))}
                  </ul>
                </details>
              )}
              <div
                className="flex flex-col sm:flex-row gap-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
                style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
              >
                <button
                  type="button"
                  disabled={previewSummary.unmappedLineCount > 0 || linesIncluded.length === 0}
                  className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: 'white' }}
                  onClick={goToSummary}
                >
                  Gå til sammendrag
                </button>
                {linesIncluded.length === 0 ? (
                  <p className="text-sm self-center" style={{ color: '#991b1b' }}>
                    Ingen linjer er valgt til import.
                  </p>
                ) : (
                  previewSummary.unmappedLineCount > 0 && (
                  <p className="text-sm self-center" style={{ color: '#991b1b' }}>
                    Kartlegg alle kontoer først ({previewSummary.unmappedLineCount} linje
                    {previewSummary.unmappedLineCount === 1 ? '' : 'r'} uten kategori).
                  </p>
                  )
                )}
              </div>
            </div>
          )}

          {step === 'summary' && linesIncluded.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Bekreft import
              </h2>
              <div className="space-y-1.5">
                <label htmlFor="ledger-import-display-name" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Navn på import (valgfritt)
                </label>
                <input
                  id="ledger-import-display-name"
                  type="text"
                  value={importDisplayName}
                  onChange={(e) => setImportDisplayName(e.target.value)}
                  maxLength={120}
                  placeholder="F.eks. Conta Q1 2026"
                  autoComplete="off"
                  className="w-full max-w-md rounded-xl border px-3 py-2.5 text-sm min-h-[44px] touch-manipulation"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Vises i «Tidligere importer» så du lettere finner riktig kjøring.
                </p>
              </div>
              <ul className="text-sm space-y-2" style={{ color: 'var(--text-muted)' }}>
                <li>
                  Periode: {previewSummary.dateMin} — {previewSummary.dateMax}
                </li>
                <li>Linjer: {previewSummary.lineCount}</li>
                <li>Sum (foreløpig fra debet/kredit i fil): inntekt {formatNOK(previewSummary.totalIncome)} · utgift {formatNOK(previewSummary.totalExpense)}</li>
                <li>
                  Etter import brukes <strong style={{ color: 'var(--text)' }}>kategoritype</strong> (inntekt/utgift) fra
                  den valgte kategorien — ikke summeringen over som sannhet for KPI.
                </li>
                {dupWarn > 0 && (
                  <li style={{ color: '#b45309' }}>
                    {dupWarn} mulig{dupWarn === 1 ? '' : 'e'} duplikat mot eksisterende transaksjoner (samme dato, beløp,
                    tekst, kategori).
                  </li>
                )}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
                  style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                  onClick={() => setStep('mapping')}
                >
                  Tilbake
                </button>
                <button
                  type="button"
                  className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
                  style={{ background: 'var(--primary)', color: 'white' }}
                  onClick={runImport}
                >
                  Bekreft import
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl p-6 sm:p-8 space-y-4"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Tidligere importer
        </h2>
        <LedgerImportHistoryList runs={ledgerImportHistory} />
      </div>
    </div>
  )
}
