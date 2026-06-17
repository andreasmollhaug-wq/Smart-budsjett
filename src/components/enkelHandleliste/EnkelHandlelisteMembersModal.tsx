'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { EhList } from '@/features/enkelHandleliste/types'
import { EhSheet } from '@/features/enkelHandleliste/components/EhSheet'
import {
  ehPrimaryBtnClass,
  ehPrimaryBtnStyle,
  ehSecondaryBtnClass,
  ehSecondaryBtnStyle,
} from '@/features/enkelHandleliste/ehUi'

export function EnkelHandlelisteMembersModal({
  open,
  list,
  profiles,
  ownerName,
  onClose,
  onSave,
}: {
  open: boolean
  list: EhList | null
  profiles: { id: string; name: string }[]
  ownerName: string
  onClose: () => void
  onSave: (memberProfileIds: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (list) setSelected(new Set(list.memberProfileIds))
  }, [list])

  const others = list ? profiles.filter((p) => p.id !== list.ownerProfileId) : []

  return (
    <EhSheet
      open={open && !!list}
      onClose={onClose}
      title="Hvem kan legge til?"
      description={
        <>
          Eier: <strong>{ownerName}</strong>. Samme Dottir-konto — bytt profil øverst på den andre telefonen.
        </>
      }
      footer={
        <div className="flex gap-2.5">
          <button type="button" className={`flex-1 ${ehSecondaryBtnClass}`} style={ehSecondaryBtnStyle} onClick={onClose}>
            Avbryt
          </button>
          <button
            type="button"
            className={`flex-1 ${ehPrimaryBtnClass}`}
            style={ehPrimaryBtnStyle}
            onClick={() => onSave([...selected])}
          >
            Lagre
          </button>
        </div>
      }
    >
      {others.length === 0 ? (
        <p className="py-6 text-center text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Legg til flere profiler under <strong>Min konto</strong> for å dele listen.
        </p>
      ) : (
        <ul className="space-y-2 pb-2">
          {others.map((p) => {
            const on = selected.has(p.id)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="flex min-h-[56px] w-full touch-manipulation items-center gap-3 rounded-2xl border px-4 text-left active:scale-[0.99]"
                  style={{
                    borderColor: on ? 'var(--primary)' : 'var(--border)',
                    background: on ? 'var(--primary-pale)' : 'var(--bg)',
                  }}
                  onClick={() => {
                    const next = new Set(selected)
                    if (next.has(p.id)) next.delete(p.id)
                    else next.add(p.id)
                    setSelected(next)
                  }}
                  aria-pressed={on}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: on ? 'var(--primary)' : 'var(--border)',
                      background: on ? 'var(--primary)' : 'transparent',
                    }}
                  >
                    {on && <Check size={16} color="#fff" aria-hidden />}
                  </span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {p.name}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </EhSheet>
  )
}
