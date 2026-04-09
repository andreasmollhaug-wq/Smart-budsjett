'use client'
import { useEffect, useState } from 'react'
import { collectLabelUniverseForParent, type CategoryRemapErrorReason } from '@/lib/categoryRemap'
import { DEFAULT_STANDARD_LABELS, type ParentCategory } from '@/lib/budgetCategoryCatalog'
import { useActivePersonFinance } from '@/lib/store'

const GROUP_LABELS: Record<ParentCategory, string> = {
  inntekter: 'Inntekter',
  regninger: 'Regninger',
  utgifter: 'Utgifter',
  gjeld: 'Gjeld',
  sparing: 'Sparing',
}

function remapErrorNb(reason: CategoryRemapErrorReason): string {
  const m: Record<CategoryRemapErrorReason, string> = {
    same_name: 'Nytt navn må være forskjellig fra det gamle.',
    empty_name: 'Skriv inn et navn.',
    from_unused: 'Kategorien finnes ikke lenger.',
    to_name_used_other_group: 'Dette navnet brukes allerede i en annen hovedgruppe.',
    merge_conflict_two_goals:
      'Begge kategoriene har et koblet sparemål. Frakoble eller flytt ett sparemål under Sparing før du slår sammen.',
  }
  return m[reason]
}

type EditModal = { parent: ParentCategory; fromName: string } | null

export default function BudsjettKategorierPage() {
  const {
    customBudgetLabels,
    hiddenBudgetLabels,
    budgetCategories,
    addCustomBudgetLabel,
    removeCustomBudgetLabel,
    hideStandardBudgetLabel,
    unhideStandardBudgetLabel,
    remapBudgetCategoryName,
    isHouseholdAggregate,
  } = useActivePersonFinance()
  const readOnly = isHouseholdAggregate

  const [newLabel, setNewLabel] = useState<Record<ParentCategory, string>>({
    inntekter: '',
    regninger: '',
    utgifter: '',
    gjeld: '',
    sparing: '',
  })
  const [editModal, setEditModal] = useState<EditModal>(null)
  const [toName, setToName] = useState('')
  const [remapError, setRemapError] = useState<string | null>(null)

  useEffect(() => {
    if (!editModal) return
    setToName('')
    setRemapError(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditModal(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [editModal])

  const handleAdd = (parent: ParentCategory) => {
    const name = newLabel[parent].trim()
    if (!name) return
    addCustomBudgetLabel(parent, name)
    setNewLabel((s) => ({ ...s, [parent]: '' }))
  }

  const handleRemapSubmit = () => {
    if (!editModal) return
    const trimmed = toName.trim()
    const res = remapBudgetCategoryName(editModal.parent, editModal.fromName, trimmed)
    if (!res.ok) {
      setRemapError(remapErrorNb(res.reason))
      return
    }
    setEditModal(null)
  }

  const inputClass =
    'flex-1 min-w-[160px] px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]'

  return (
    <div className="space-y-8">
      {readOnly && (
        <p className="text-sm rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          Du ser husholdningen samlet. Bytt til én profil under «Husholdning» eller i menyen for å legge til, endre eller
          slette budsjettkategorier — endringene gjelder alltid den aktive profilen.
        </p>
      )}

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Skjul standardforslag du ikke bruker, og legg til egne navn. Endringene brukes i nedtrekkslisten når du legger til
        budsjettlinjer.
      </p>

      {(Object.keys(GROUP_LABELS) as ParentCategory[]).map((parent) => {
        const standard = DEFAULT_STANDARD_LABELS[parent]
        const hidden = hiddenBudgetLabels[parent] ?? []
        const custom = customBudgetLabels[parent] ?? []
        const datalistId = `budskat-labels-${parent}`
        const universe = collectLabelUniverseForParent(parent, customBudgetLabels, budgetCategories)

        return (
          <div
            key={parent}
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <datalist id={datalistId}>
              {universe.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
              {GROUP_LABELS[parent]}
            </h2>

            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Standardforslag
            </p>
            <ul className="space-y-2 mb-6">
              {standard.map((name) => {
                const isHidden = hidden.includes(name)
                return (
                  <li
                    key={name}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-sm" style={{ color: isHidden ? 'var(--text-muted)' : 'var(--text)' }}>
                      {name}
                      {isHidden && ' (skjult)'}
                    </span>
                    {isHidden ? (
                      <button
                        type="button"
                        className="text-xs font-medium disabled:opacity-50"
                        style={{ color: 'var(--primary)' }}
                        disabled={readOnly}
                        onClick={() => unhideStandardBudgetLabel(parent, name)}
                      >
                        Gjenopprett
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-xs font-medium disabled:opacity-50"
                        style={{ color: 'var(--text-muted)' }}
                        disabled={readOnly}
                        onClick={() => hideStandardBudgetLabel(parent, name)}
                      >
                        Skjul
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>

            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Egendefinerte navn
            </p>
            {custom.length === 0 ? (
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Ingen ennå.
              </p>
            ) : (
              <ul className="space-y-2 mb-4">
                {custom.map((name) => (
                  <li
                    key={name}
                    className="flex items-center justify-between gap-2 py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-sm min-w-0 truncate" style={{ color: 'var(--text)' }} title={name}>
                      {name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="text-xs font-medium disabled:opacity-50"
                        style={{ color: 'var(--primary)' }}
                        disabled={readOnly}
                        onClick={() => setEditModal({ parent, fromName: name })}
                      >
                        Endre
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium disabled:opacity-50"
                        style={{ color: 'var(--danger)' }}
                        disabled={readOnly}
                        onClick={() => removeCustomBudgetLabel(parent, name)}
                      >
                        Slett
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 flex-wrap">
              <input
                placeholder="Nytt navn"
                value={newLabel[parent]}
                onChange={(e) => setNewLabel((s) => ({ ...s, [parent]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && !readOnly && handleAdd(parent)}
                disabled={readOnly}
                className={inputClass}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--primary)' }}
                disabled={readOnly}
                onClick={() => handleAdd(parent)}
              >
                Legg til
              </button>
            </div>
          </div>
        )
      })}

      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditModal(null)
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remap-title"
          >
            <h3 id="remap-title" className="font-semibold text-base mb-2" style={{ color: 'var(--text)' }}>
              Endre navn på kategori
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              Du endrer «{editModal.fromName}» under {GROUP_LABELS[editModal.parent]}.               Dette er en permanent endring: alle transaksjoner og budsjettplan (også arkiverte år) som brukte dette navnet, oppdateres til det
              nye. Hvis du slår sammen med et navn som allerede finnes (for eksempel et standardforslag), flyttes beløp og
              historikk dit.
            </p>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Nytt navn
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl text-sm mb-2"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              list={`budskat-labels-${editModal.parent}`}
              value={toName}
              onChange={(e) => {
                setToName(e.target.value)
                setRemapError(null)
              }}
              placeholder="Skriv eller velg fra listen"
              autoFocus
            />
            {remapError && (
              <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>
                {remapError}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                onClick={() => setEditModal(null)}
              >
                Avbryt
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
                onClick={handleRemapSubmit}
              >
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
