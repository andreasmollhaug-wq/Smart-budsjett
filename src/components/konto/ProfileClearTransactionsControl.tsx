'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import InfoPopover from '@/components/ui/InfoPopover'
import ClearTransactionsConfirmModal from '@/components/konto/ClearTransactionsConfirmModal'
import { useStore } from '@/lib/store'

export const CLEAR_TRANSACTIONS_INFO_TITLE = 'Slett alle transaksjoner'
export const CLEAR_TRANSACTIONS_INFO_TEXT =
  'Slett alle transaksjoner fjerner alle registrerte transaksjoner for denne profilen — uansett om de er lagt inn manuelt, importert fra bank/CSV/regnskap, eller opprettet automatisk. Budsjettplan, sparemål, gjeld, investeringer og abonnement påvirkes ikke, men «brukt» i budsjettet og koblede sparemål oppdateres. Import-lister under Min konto kan fortsatt vise tidligere kjøringer. Handlingen kan ikke angres. Planlagte trekk fra synkronisert gjeld eller abonnement kan dukke opp igjen ved neste synk.'

type Props = {
  profileId: string
  profileName: string
  transactionCount: number
  /** Kompakt: søppelkasse-ikon + info. Standard: knapp med tekst (Solo/innstillinger). */
  variant?: 'default' | 'compact'
}

export default function ProfileClearTransactionsControl({
  profileId,
  profileName,
  transactionCount,
  variant = 'default',
}: Props) {
  const clearAllTransactionsForProfile = useStore((s) => s.clearAllTransactionsForProfile)
  const [modalOpen, setModalOpen] = useState(false)

  const disabled = transactionCount === 0

  const handleConfirm = () => {
    setModalOpen(false)
    const res = clearAllTransactionsForProfile(profileId)
    if (!res.ok && typeof window !== 'undefined') {
      if (res.reason === 'empty') {
        window.alert('Det finnes ingen transaksjoner å slette for denne profilen.')
      } else {
        window.alert('Transaksjonene kunne ikke slettes.')
      }
    }
  }

  const disabledTitle = disabled
    ? 'Ingen transaksjoner å slette'
    : `Slett alle transaksjoner (${transactionCount})`

  return (
    <>
      {variant === 'compact' ? (
        <div className="inline-flex shrink-0 items-center">
          <button
            type="button"
            disabled={disabled}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl touch-manipulation transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: disabled ? 'var(--text-muted)' : '#c92a2a' }}
            title={disabledTitle}
            aria-label={disabledTitle}
            onClick={() => setModalOpen(true)}
          >
            <Trash2 size={18} strokeWidth={2} aria-hidden />
          </button>
          <InfoPopover title={CLEAR_TRANSACTIONS_INFO_TITLE} text={CLEAR_TRANSACTIONS_INFO_TEXT} />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              disabled={disabled}
              className="shrink-0 px-3 py-2 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ border: '1px solid var(--border)', color: disabled ? 'var(--text-muted)' : '#c92a2a' }}
              title={disabled ? 'Ingen transaksjoner å slette' : undefined}
              onClick={() => setModalOpen(true)}
            >
              Slett alle transaksjoner
            </button>
            <InfoPopover title={CLEAR_TRANSACTIONS_INFO_TITLE} text={CLEAR_TRANSACTIONS_INFO_TEXT} />
          </div>
          {transactionCount > 0 && (
            <p className="text-xs mt-1.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {transactionCount} transaksjon{transactionCount === 1 ? '' : 'er'} registrert
            </p>
          )}
        </>
      )}
      <ClearTransactionsConfirmModal
        open={modalOpen}
        profileName={profileName}
        transactionCount={transactionCount}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  )
}
