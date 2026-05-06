'use client'

import { useMemo, useState } from 'react'
import BankImportRunDetailModal from '@/components/konto/BankImportRunDetailModal'
import { countBankRunTransactions } from '@/lib/bankImport/countBankRunTransactions'
import type { BankImportRun } from '@/lib/bankImport/types'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { RemoveLedgerImportRunResult } from '@/lib/store'
import { useStore } from '@/lib/store'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'
import { ChevronRight, Trash2, X } from 'lucide-react'

const SOURCE_LABEL: Record<string, string> = {
  dnb_sbanken: 'DNB / Sbanken',
}

type Props = {
  runs: BankImportRun[]
}

export default function BankImportHistoryList({ runs }: Props) {
  const people = useStore((s) => s.people)
  const profiles = useStore((s) => s.profiles)
  const removeBankImportRun = useStore((s) => s.removeBankImportRun)
  const addAppNotification = useStore((s) => s.addAppNotification)
  const [selectedRun, setSelectedRun] = useState<BankImportRun | null>(null)
  const [runToDelete, setRunToDelete] = useState<BankImportRun | null>(null)

  const detailRun = useMemo(() => {
    if (!selectedRun) return null
    return runs.find((r) => r.id === selectedRun.id) ?? selectedRun
  }, [runs, selectedRun])

  const deleteBackdropDismiss = useModalBackdropDismiss(() => setRunToDelete(null))

  const linkedTxCountForDelete = useMemo(() => {
    if (!runToDelete) return 0
    return countBankRunTransactions(people, runToDelete.profileId, runToDelete.id)
  }, [runToDelete, people])

  const importedForSelected = useMemo(() => {
    if (!detailRun) return []
    const person = people[detailRun.profileId]
    return (person?.transactions ?? [])
      .filter((t) => t.bankImportRunId === detailRun.id)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  }, [detailRun, people])

  const profileNameForSelected = useMemo(() => {
    if (!detailRun) return ''
    return profiles.find((p) => p.id === detailRun.profileId)?.name?.trim() || detailRun.profileId
  }, [detailRun, profiles])

  const profileNameForDelete = useMemo(() => {
    if (!runToDelete) return ''
    return profiles.find((p) => p.id === runToDelete.profileId)?.name?.trim() || runToDelete.profileId
  }, [runToDelete, profiles])

  function notifyAfterRemoval(res: RemoveLedgerImportRunResult) {
    if (!res.ok) return

    if (res.mode === 'historyOnly') {
      addAppNotification({
        title: 'Fjernet fra historikk',
        body: 'Transaksjonene fra bankimporten er beholdt. Budsjett du økte ved denne importen er også uendret — juster budsjett manuelt ved behov.',
        kind: 'budget',
      })
      return
    }

    if (res.orphanFullRemoval) {
      addAppNotification({
        title: 'Import slettet',
        body:
          'Fant ingen tilknyttede transaksjoner eller budsjett-justering fra denne importen (manglende tilknytning). Bare historikkposten ble fjernet.',
        kind: 'budget',
      })
      return
    }

    const parts: string[] = ['Historikk fjernet.']
    if (res.transactionsRemoved > 0) {
      parts.push(
        `${res.transactionsRemoved} transaksjon${res.transactionsRemoved === 1 ? '' : 'er'} fjernet.`,
      )
    }
    if (res.removedBudgetAdjustment) {
      parts.push('Planlagte budsjettbeløp fra importen er tilbakestilt.')
    }
    addAppNotification({
      title: 'Bankimport slettet',
      body: parts.join(' '),
      kind: 'budget',
    })
  }

  const executeDelete = (mode: 'full' | 'historyOnly') => {
    if (!runToDelete) return
    const id = runToDelete.id
    const res = removeBankImportRun(id, mode)
    if (!res.ok) {
      addAppNotification({
        title: 'Kunne ikke slette',
        body: 'Importen ble ikke funnet. Oppdater siden og prøv igjen.',
        kind: 'budget',
      })
      setRunToDelete(null)
      return
    }
    notifyAfterRemoval(res)
    setRunToDelete(null)
    if (selectedRun?.id === id) setSelectedRun(null)
  }

  if (runs.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Ingen tidligere bankimporter ennå.
      </p>
    )
  }

  const showOrphanHint =
    runToDelete && runToDelete.rowCountImported > 0 && linkedTxCountForDelete === 0

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
                Importert: {r.rowCountImported} · Hoppet over: {r.rowCountSkipped} · Rader: {r.rowCountParsed}
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
                aria-label={`Slett eller fjern import fra ${formatIsoDateDdMmYyyy(r.createdAt.slice(0, 10))}`}
                onClick={() => setRunToDelete(r)}
              >
                <Trash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <BankImportRunDetailModal
        open={selectedRun !== null}
        onClose={() => setSelectedRun(null)}
        run={detailRun}
        profileName={profileNameForSelected}
        importedTransactions={importedForSelected}
      />

      {runToDelete && (
        <div
          className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(15, 23, 42, 0.45)' }}
          role="presentation"
          {...deleteBackdropDismiss}
        >
          <div
            className="w-full max-w-lg min-w-0 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-import-delete-title"
          >
            <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
              <h3 id="bank-import-delete-title" className="font-semibold text-lg pr-2" style={{ color: 'var(--text)' }}>
                Slette bankimport?
              </h3>
              <button
                type="button"
                onClick={() => setRunToDelete(null)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg shrink-0 touch-manipulation"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Lukk"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              Du kan fjerne importen fra listen her (transaksjoner blir stående), eller fjerne også transaksjonene som
              ble opprettet av denne kjøringen. Ved full tilbakestilling tilbakestilles eventuelle planlagte budsjettbeløp
              fra «Legg også til i budsjett».
            </p>
            <p className="text-xs mb-3 rounded-lg px-3 py-2" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
              Profil: <span style={{ color: 'var(--text)' }}>{profileNameForDelete}</span>
              {' · '}
              <span className="tabular-nums">{linkedTxCountForDelete}</span> tilknyttede transaksjon
              {linkedTxCountForDelete === 1 ? '' : 'er'} funnet.
            </p>
            {showOrphanHint && (
              <p className="text-xs mb-3 rounded-lg px-3 py-2" style={{ background: '#fffbeb', color: '#92400e' }}>
                Importen viser {runToDelete.rowCountImported} linjer, men ingen transaksjoner er knyttet til denne
                kjøringen. Full tilbakestilling fjerner bare historikkposten.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:gap-3 pt-1">
              <button
                type="button"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
                style={{ background: '#b91c1c', color: '#fff' }}
                onClick={() => executeDelete('full')}
              >
                Full tilbakestilling — fjern også transaksjoner
              </button>
              <button
                type="button"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  background: 'var(--bg)',
                }}
                onClick={() => executeDelete('historyOnly')}
              >
                Bare fjern fra listen (behold transaksjoner)
              </button>
              <button
                type="button"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
                onClick={() => setRunToDelete(null)}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
