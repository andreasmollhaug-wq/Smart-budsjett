'use client'

import { useMemo, useState } from 'react'
import LedgerImportRunDetailModal from '@/components/konto/LedgerImportRunDetailModal'
import type { LedgerImportRun } from '@/lib/ledgerImport/types'
import { useStore } from '@/lib/store'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'
import { ChevronRight, Trash2 } from 'lucide-react'

const SOURCE_LABEL: Record<string, string> = {
  conta: 'Conta',
  tripletex: 'Tripletex',
  fiken: 'Fiken',
  twentyfourseven: '24SevenOffice',
  generic: 'Generisk',
}

type Props = {
  runs: LedgerImportRun[]
}

export default function LedgerImportHistoryList({ runs }: Props) {
  const people = useStore((s) => s.people)
  const profiles = useStore((s) => s.profiles)
  const removeLedgerImportRun = useStore((s) => s.removeLedgerImportRun)
  const addAppNotification = useStore((s) => s.addAppNotification)
  const [selectedRun, setSelectedRun] = useState<LedgerImportRun | null>(null)

  const importedForSelected = useMemo(() => {
    if (!selectedRun) return []
    const person = people[selectedRun.profileId]
    return (person?.transactions ?? [])
      .filter((t) => t.ledgerImportRunId === selectedRun.id)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  }, [selectedRun, people])

  const profileNameForSelected = useMemo(() => {
    if (!selectedRun) return ''
    return profiles.find((p) => p.id === selectedRun.profileId)?.name?.trim() || selectedRun.profileId
  }, [selectedRun, profiles])

  const confirmAndRemove = (r: LedgerImportRun) => {
    const ok = window.confirm(
      'Slette denne importen? Alle transaksjoner som hører til importen, fjernes fra transaksjonslisten. Dette kan ikke angres.',
    )
    if (!ok) return
    removeLedgerImportRun(r.id)
    if (selectedRun?.id === r.id) setSelectedRun(null)
    addAppNotification({
      title: 'Import slettet',
      body: 'Historikk og tilknyttede transaksjoner er fjernet.',
      kind: 'budget',
    })
  }

  if (runs.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Ingen tidligere importer ennå.
      </p>
    )
  }

  return (
    <>
      <ul className="space-y-3">
        {runs.map((r) => (
          <li
            key={r.id}
            className="flex min-w-0 rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <button
              type="button"
              className="flex-1 min-w-0 text-left px-4 py-3 text-sm transition-opacity hover:opacity-90 touch-manipulation min-h-[44px]"
              style={{ color: 'inherit', background: 'transparent' }}
              onClick={() => setSelectedRun(r)}
              aria-label={`Vis detaljer for import ${formatIsoDateDdMmYyyy(r.createdAt.slice(0, 10))}`}
            >
              {r.displayName?.trim() && (
                <p className="text-sm font-semibold mb-1 m-0" style={{ color: 'var(--text)' }}>
                  {r.displayName.trim()}
                </p>
              )}
              <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
                <span className="font-medium flex items-center gap-1 min-w-0" style={{ color: 'var(--text)' }}>
                  <ChevronRight size={16} className="shrink-0 opacity-60" style={{ color: 'var(--text-muted)' }} aria-hidden />
                  <span className="min-w-0">
                    {formatIsoDateDdMmYyyy(r.createdAt.slice(0, 10))}{' '}
                    <span style={{ color: 'var(--text-muted)' }} className="font-normal">
                      {SOURCE_LABEL[r.sourceId] ?? r.sourceId}
                    </span>
                  </span>
                </span>
                {r.fileName && (
                  <span className="text-xs truncate max-w-[200px] sm:max-w-xs" style={{ color: 'var(--text-muted)' }}>
                    {r.fileName}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 tabular-nums m-0" style={{ color: 'var(--text-muted)' }}>
                Importert: {r.rowCountImported} · Hoppet over: {r.rowCountSkipped} · Parsede rader: {r.rowCountParsed}
              </p>
              {r.errorSummary && (
                <p className="text-xs mt-1 m-0" style={{ color: '#991b1b' }}>
                  {r.errorSummary}
                </p>
              )}
            </button>
            <div
              className="shrink-0 flex flex-col border-l"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <button
                type="button"
                className="flex-1 min-h-[44px] min-w-[48px] sm:min-w-[52px] px-2 inline-flex items-center justify-center touch-manipulation transition-opacity hover:opacity-85"
                style={{ color: '#b91c1c' }}
                aria-label={`Slett import fra ${formatIsoDateDdMmYyyy(r.createdAt.slice(0, 10))}`}
                onClick={() => confirmAndRemove(r)}
              >
                <Trash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <LedgerImportRunDetailModal
        open={selectedRun !== null}
        onClose={() => setSelectedRun(null)}
        run={selectedRun}
        profileName={profileNameForSelected}
        importedTransactions={importedForSelected}
      />
    </>
  )
}
