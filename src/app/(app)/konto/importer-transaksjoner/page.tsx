'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import TransactionImportDropzone from '@/components/konto/TransactionImportDropzone'
import TransactionImportGuideModal from '@/components/konto/TransactionImportGuide'
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
import { IMPORT_FORMAT_V1 } from '@/lib/transactionImport/transactionImport.constants'
import { mergeBudgetCategoriesForTransactionPicker } from '@/lib/transactionCategoryPicker'
import { useStore } from '@/lib/store'
import { formatIsoDateDdMmYyyy, formatNOK } from '@/lib/utils'
import { ArrowLeft, BookOpen, ChevronRight, RotateCcw } from 'lucide-react'

type Step = 'upload' | 'unknowns' | 'preview'

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
  const profiles = useStore((s) => s.profiles)
  const people = useStore((s) => s.people)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const setActiveProfileId = useStore((s) => s.setActiveProfileId)
  const addBudgetCategory = useStore((s) => s.addBudgetCategory)
  const addCustomBudgetLabel = useStore((s) => s.addCustomBudgetLabel)
  const addTransactions = useStore((s) => s.addTransactions)
  const addAppNotification = useStore((s) => s.addAppNotification)

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
  const [skippedImportRows, setSkippedImportRows] = useState(0)
  const [dupWarn, setDupWarn] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    setImportProfileId(activeProfileId)
  }, [activeProfileId])

  const person = people[importProfileId]
  const pickerCategories = useMemo(() => {
    if (!person) return []
    return mergeBudgetCategoriesForTransactionPicker(person.budgetCategories, labelListsForPerson(person))
  }, [person])

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
    setSkippedImportRows(0)
    setDupWarn(0)
  }, [])

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

  const previewRows = useMemo(() => {
    return parsedRows.slice(0, 100)
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
      if (rejected.has(t)) continue
      sums[r.parentCategoryHint] = (sums[r.parentCategoryHint] ?? 0) + r.amount
    }
    return sums
  }, [parsedRows, unknownList, unknownApproval])

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
      parsedRows,
      (raw) => {
        const t = raw.trim()
        if (rejected.has(t)) return null
        const r = resolveCategoryForImport(raw, hypothetical)
        return r.kind === 'matched' ? r.canonical : null
      },
      person.transactions,
    )
  }, [person, parsedRows, unknownList, unknownApproval, pickerCategories])

  const runImport = () => {
    if (!person) return
    setActiveProfileId(importProfileId)
    const pid = importProfileId
    if (!useStore.getState().people[pid]) return

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

    const txs = buildTransactionsFromImportRows(parsedRows, canonicalForRaw, pid)

    const existingDup = countPotentialDuplicateRows(parsedRows, canonicalForRaw, pFinal.transactions)

    addTransactions(txs)

    setSkippedImportRows(parsedRows.length - txs.length)
    setDupWarn(existingDup)
    setSummary(summarizeImportedTransactions(txs))
    setSummaryOpen(true)
    setStep('upload')

    const skipped = parsedRows.length - txs.length
    const parts: string[] = [`${txs.length} transaksjon${txs.length === 1 ? '' : 'er'} lagt til.`]
    if (skipped > 0) parts.push(`${skipped} rad${skipped === 1 ? '' : 'er'} hoppet over (kategori).`)
    if (existingDup > 0) parts.push(`${existingDup} mulig${existingDup === 1 ? '' : 'e'} duplikat mot eksisterende data.`)
    addAppNotification({
      title: 'Import av data fullført',
      body: parts.join(' '),
      kind: 'budget',
    })
  }

  const transactionsHref = useMemo(() => {
    if (!summary?.dateMin) return '/transaksjoner'
    const y = parseInt(summary.dateMin.slice(0, 4), 10)
    if (Number.isFinite(y)) return `/transaksjoner?year=${y}`
    return '/transaksjoner'
  }, [summary])

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
          Importer transaksjoner fra CSV
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Last opp en fil eksportert fra Excel (CSV UTF-8). Kolonnene skal tilsvare malen: DATO, TRANSAKSJON (ignoreres i
          appen), KATEGORI, BELØP, valgfri beskrivelse. Format {IMPORT_FORMAT_V1}. Har du flere profiler i husholdningen,
          velg riktig profil over før du laster opp.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2"
            style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
            onClick={() => setGuideOpen(true)}
          >
            <BookOpen size={18} className="shrink-0 opacity-90" aria-hidden />
            Steg-for-steg veiledning
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            className="text-sm font-medium rounded-xl px-3 py-2"
            style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
            onClick={() => downloadTransactionImportTemplate()}
          >
            Last ned CSV-mal
          </button>
          {step !== 'upload' && (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              onClick={resetFlow}
            >
              <RotateCcw size={15} className="shrink-0" aria-hidden />
              Start på nytt
            </button>
          )}
        </div>
      </div>

      <TransactionImportGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

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
            className="w-full max-w-md rounded-xl px-3 py-2 text-sm"
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

      {parseError && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
          {parseError}
        </div>
      )}

      {step === 'upload' && (
        <TransactionImportDropzone onFileText={onFileText} disabled={!person} />
      )}

      {step === 'unknowns' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Fil: <strong style={{ color: 'var(--text)' }}>{fileLabel}</strong> — {parsedRows.length} gyldige rader.
            Disse kategorinavnene finnes ikke i budsjettet ditt ennå. Type (inntekt/utgift) er utledet fra
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

      {step === 'preview' && (
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
                    {formatNOK(previewGroupTotals[key] ?? 0)}
                  </p>
                </div>
              ))}
          </div>

          <div className="rounded-2xl overflow-hidden border max-h-[min(60vh,28rem)] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr style={{ background: 'var(--bg)' }}>
                  <th className="text-left px-3 py-2 font-medium">Dato</th>
                  <th className="text-left px-3 py-2 font-medium">Kategori</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-right px-3 py-2 font-medium">Beløp</th>
                  <th className="text-left px-3 py-2 font-medium">Beskrivelse</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r) => (
                  <tr key={`${r.fileLine}-${r.dateIso}`} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-3 py-2 whitespace-nowrap">{formatIsoDateDdMmYyyy(r.dateIso)}</td>
                    <td className="px-3 py-2">{r.categoryRaw}</td>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: r.transactionType === 'income' ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {r.transactionType === 'income' ? 'Inntekt' : 'Utgift'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatNOK(r.amount)}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                      {r.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 100 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Viser 100 av {parsedRows.length} rader.
            </p>
          )}
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
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
            onClick={runImport}
          >
            Bekreft import
          </button>
        </div>
      )}
      </div>
      </div>

      <TransactionImportSummaryModal
        open={summaryOpen}
        onClose={() => {
          setSummaryOpen(false)
          resetFlow()
        }}
        summary={summary}
        skippedCategoryRows={skippedImportRows}
        parseErrorCount={rowParseErrors.length}
        duplicateWarningCount={dupWarn}
        transactionsHref={transactionsHref}
      />
    </div>
  )
}
