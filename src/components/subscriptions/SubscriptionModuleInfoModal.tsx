'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

export default function SubscriptionModuleInfoModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else {
      el.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="rounded-2xl p-0 max-w-lg w-[min(100vw-2rem,28rem)] backdrop:bg-black/40"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
      onClose={onClose}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Om tjenesteabonnementer
          </h2>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1.5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <p style={{ color: 'var(--text)' }}>
            Her samler du faste digitale abonnementer — for eksempel streaming, musikk og programvare — og ser{' '}
            <strong className="font-semibold">sum per måned og per år</strong>.
          </p>
          <p>
            Du kan <strong className="font-medium" style={{ color: 'var(--text)' }}>synkronisere med budsjettet</strong>:
            da opprettes en linje under Regninger med samme planbeløp, så du slipper å legge inn det samme to ganger.
          </p>
          <p>
            <strong className="font-medium" style={{ color: 'var(--text)' }}>Faktisk forbruk</strong> i budsjettet
            følger fortsatt transaksjonene dine når du registrerer trekk i samme kategori.
          </p>
          <p>
            <strong className="font-medium" style={{ color: 'var(--text)' }}>EnkelExcel AI</strong> kan bruke de
            registrerte abonnementene når du spør om tall — for eksempel «hva koster streaming til sammen?».
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
            onClick={onClose}
          >
            Forstått
          </button>
        </div>
      </div>
    </dialog>
  )
}
