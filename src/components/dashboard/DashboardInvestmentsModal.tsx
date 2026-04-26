'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { Investment } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  investments: Investment[]
}

export default function DashboardInvestmentsModal({ open, onClose, investments }: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const ordered = investments.slice().sort((a, b) => b.currentValue - a.currentValue)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="dashboard-inv-modal-title">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: 'var(--border)' }}>
          <h2 id="dashboard-inv-modal-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Investeringer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label="Lukk"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {ordered.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen investeringer ennå. Legg til posisjoner på investeringssiden.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ordered.map((inv) => {
                const retNok = inv.currentValue - inv.purchaseValue
                const retPct = inv.purchaseValue !== 0 ? (retNok / inv.purchaseValue) * 100 : 0
                const isUp = retNok >= 0
                return (
                  <div
                    key={inv.id}
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                      {inv.name}
                    </p>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Kjøpt for</span>
                        <span style={{ color: 'var(--text)' }}>{formatNOK(inv.purchaseValue)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Nå verdi</span>
                        <span style={{ color: 'var(--primary)' }}>{formatNOK(inv.currentValue)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Avkastning</span>
                        <span style={{ color: isUp ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                          {isUp ? '+' : ''}
                          {formatNOK(retNok)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Avkastning %</span>
                        <span style={{ color: isUp ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                          {isUp ? '+' : ''}
                          {retPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t p-5" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Lukk
          </button>
          <Link
            href="/investering"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Gå til investering
          </Link>
        </div>
      </div>
    </div>
  )
}
