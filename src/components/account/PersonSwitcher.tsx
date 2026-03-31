'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useActivePersonFinance, MAX_FAMILY_PROFILES } from '@/lib/store'
import UpgradeSubscriptionModal from './UpgradeSubscriptionModal'

export default function PersonSwitcher() {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    subscriptionPlan,
    addProfile,
    financeScope,
    setFinanceScope,
  } = useActivePersonFinance()

  const showHouseholdOption = subscriptionPlan === 'family' && profiles.length >= 2
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const showAddButton = profiles.length < MAX_FAMILY_PROFILES

  const handleAddClick = () => {
    if (subscriptionPlan === 'solo' && profiles.length >= 1) {
      setUpgradeOpen(true)
      return
    }
    setNewName('')
    setNameOpen(true)
  }

  const submitNewProfile = () => {
    const res = addProfile(newName)
    if (res.ok) {
      setNameOpen(false)
      setNewName('')
      return
    }
    if (res.reason === 'solo_limit') {
      setNameOpen(false)
      setUpgradeOpen(true)
    }
  }

  return (
    <>
      <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Viser data for
        </p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {showHouseholdOption && (
            <button
              type="button"
              onClick={() => setFinanceScope('household')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all max-w-[160px] truncate"
              style={{
                background: financeScope === 'household' ? 'var(--primary-pale)' : 'var(--bg)',
                color: financeScope === 'household' ? 'var(--primary)' : 'var(--text-muted)',
                border: `1px solid ${financeScope === 'household' ? 'var(--accent)' : 'var(--border)'}`,
              }}
              title="Sum av alle i husholdningen"
            >
              Husholdning
            </button>
          )}
          {profiles.map((p) => {
            const active = financeScope === 'profile' && p.id === activeProfileId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveProfileId(p.id)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all max-w-[140px] truncate"
                style={{
                  background: active ? 'var(--primary-pale)' : 'var(--bg)',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                }}
                title={p.name}
              >
                {p.name}
              </button>
            )
          })}
          {showAddButton && (
            <button
              type="button"
              onClick={handleAddClick}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium"
              style={{
                border: '1px dashed var(--border)',
                color: 'var(--primary)',
                background: 'transparent',
              }}
              title={subscriptionPlan === 'solo' ? 'Legg til person (krever Familie)' : 'Legg til person'}
            >
              <Plus size={14} />
              Legg til
            </button>
          )}
        </div>
        {showHouseholdOption && financeScope === 'household' && (
          <p className="text-[10px] mt-2 leading-snug" style={{ color: 'var(--text-muted)' }}>
            Nye transaksjoner og registreringer legges til profilen «
            {profiles.find((x) => x.id === activeProfileId)?.name ?? '…'}» — bytt person med pillene over for å endre
            målprofil.
          </p>
        )}
      </div>

      <UpgradeSubscriptionModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {nameOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk" onClick={() => setNameOpen(false)} />
          <div
            className="relative max-w-sm w-full rounded-2xl p-5 shadow-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Ny person i husholdningen
            </h3>
            <label className="block mt-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Navn
            </label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitNewProfile()}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              placeholder="F.eks. partner"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNameOpen(false)}
                className="px-3 py-1.5 rounded-xl text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={submitNewProfile}
                className="px-3 py-1.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                Legg til
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
