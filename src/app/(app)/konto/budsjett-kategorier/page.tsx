'use client'
import { useState } from 'react'
import { useActivePersonFinance } from '@/lib/store'
import { DEFAULT_STANDARD_LABELS, type ParentCategory } from '@/lib/budgetCategoryCatalog'

const GROUP_LABELS: Record<ParentCategory, string> = {
  inntekter: 'Inntekter',
  regninger: 'Regninger',
  utgifter: 'Utgifter',
  gjeld: 'Gjeld',
  sparing: 'Sparing',
}

export default function BudsjettKategorierPage() {
  const {
    customBudgetLabels,
    hiddenBudgetLabels,
    addCustomBudgetLabel,
    removeCustomBudgetLabel,
    hideStandardBudgetLabel,
    unhideStandardBudgetLabel,
  } = useActivePersonFinance()
  const [newLabel, setNewLabel] = useState<Record<ParentCategory, string>>({
    inntekter: '',
    regninger: '',
    utgifter: '',
    gjeld: '',
    sparing: '',
  })

  const handleAdd = (parent: ParentCategory) => {
    const name = newLabel[parent].trim()
    if (!name) return
    addCustomBudgetLabel(parent, name)
    setNewLabel((s) => ({ ...s, [parent]: '' }))
  }

  return (
    <div className="space-y-8">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Skjul standardforslag du ikke bruker, og legg til egne navn. Endringene brukes i nedtrekkslisten når du legger til
        budsjettlinjer.
      </p>

      {(Object.keys(GROUP_LABELS) as ParentCategory[]).map((parent) => {
        const standard = DEFAULT_STANDARD_LABELS[parent]
        const hidden = hiddenBudgetLabels[parent] ?? []
        const custom = customBudgetLabels[parent] ?? []

        return (
          <div
            key={parent}
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
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
                        className="text-xs font-medium"
                        style={{ color: 'var(--primary)' }}
                        onClick={() => unhideStandardBudgetLabel(parent, name)}
                      >
                        Gjenopprett
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-muted)' }}
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
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {name}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-medium"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => removeCustomBudgetLabel(parent, name)}
                    >
                      Slett
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 flex-wrap">
              <input
                placeholder="Nytt navn"
                value={newLabel[parent]}
                onChange={(e) => setNewLabel((s) => ({ ...s, [parent]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd(parent)}
                className="flex-1 min-w-[160px] px-3 py-2 text-sm rounded-xl"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
                onClick={() => handleAdd(parent)}
              >
                Legg til
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
