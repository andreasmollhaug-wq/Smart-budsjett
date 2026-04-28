'use client'

import Header from '@/components/layout/Header'
import { MatHandlelistePageShell } from '@/features/matHandleliste/MatHandlelistePageShell'
import { useStore } from '@/lib/store'
import Link from 'next/link'
import { useState } from 'react'
import { normalizeIngredientKey } from '@/features/matHandleliste/ingredientKey'

export function MatHandlelisteStartPage() {
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const staples = useStore((s) => s.matHandleliste.staples)
  const mealCount = useStore((s) => s.matHandleliste.meals.length)
  const mhSetStaplesNormalizedKeys = useStore((s) => s.mhSetStaplesNormalizedKeys)
  const mhSetGroceryBudgetCategoryName = useStore((s) => s.mhSetGroceryBudgetCategoryName)
  const groceryName = useStore((s) => s.matHandleliste.settings.groceryBudgetCategoryName)
  const [stapleInput, setStapleInput] = useState('')
  const [budgetLineInput, setBudgetLineInput] = useState(groceryName ?? '')

  return (
    <>
      <Header title="Mat og handleliste" subtitle="Ukeplan, måltider og samlet handleliste" />
      <MatHandlelistePageShell>
        <div className="mx-auto max-w-lg space-y-6 pb-8">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            Her kan du bygge egne måltider, legge dem i uke- og månedsplan, og få en samlet handleliste
            gruppert som i butikken. Alt lagres på kontoen din (samme som HjemFlyt).
          </p>
          {!demoDataEnabled ? (
            <div
              className="rounded-xl border px-3 py-3 text-sm leading-relaxed"
              style={{ borderColor: 'var(--border)', background: 'var(--primary-pale)', color: 'var(--text)' }}
            >
              <strong className="font-semibold">Demodata:</strong> Slå på «Demodata» under{' '}
              <Link href="/konto/innstillinger#demodata" className="font-medium underline" style={{ color: 'var(--primary)' }}>
                Min konto → Innstillinger
              </Link>{' '}
              for å få ferdig utfylt ukeplan, eksempelmåltider og handleliste (samme som for budsjett og transaksjoner).
              Oppdater siden etter at du har slått det på.
            </div>
          ) : mealCount === 0 ? (
            <p className="text-sm rounded-xl border px-3 py-3" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Demodata er på, men listen ser tom ut. Prøv å oppdatere siden (eller gå til handleliste/plan) — eksempler
              skal lastes inn automatisk.
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <Link
              href="/intern/mat-handleliste/handleliste"
              className="flex min-h-[48px] items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--primary)' }}
            >
              Åpne handleliste
            </Link>
            <Link
              href="/intern/mat-handleliste/maltider"
              className="flex min-h-[48px] items-center justify-center rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Mine måltider
            </Link>
            <Link
              href="/intern/mat-handleliste/plan"
              className="flex min-h-[48px] items-center justify-center rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Måltidsplan
            </Link>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Stiftvarer (har ofte hjemme)
            </h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Når du legger måltid på listen, kan du i forhåndsvisningen velge bort det du allerede har. Stiftvarer her
              er en huskeliste for autoforslag senere — nå brukes de som referanse når du redigerer måltid (merk
              ingredens som stiftvare).
            </p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const k = normalizeIngredientKey(stapleInput)
                if (!k) return
                if (!staples.includes(k)) mhSetStaplesNormalizedKeys([...staples, k])
                setStapleInput('')
              }}
            >
              <input
                value={stapleInput}
                onChange={(e) => setStapleInput(e.target.value)}
                placeholder="F.eks. salt"
                className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <button
                type="submit"
                className="min-h-[44px] shrink-0 rounded-xl px-3 text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                Legg til
              </button>
            </form>
            {staples.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {staples.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="rounded-full border px-3 py-1 text-xs"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      onClick={() => mhSetStaplesNormalizedKeys(staples.filter((x) => x !== s))}
                    >
                      {s} ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Budsjettlinje for mat (valgfritt)
            </h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Skriv nøyaktig navn på budsjettlinjen som skal vises på handleliste-kortet. Tom = automatisk søk etter
              «mat», «dagligvarer» …
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={budgetLineInput}
                onChange={(e) => setBudgetLineInput(e.target.value)}
                placeholder="F.eks. Mat"
                className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <button
                type="button"
                className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
                onClick={() => mhSetGroceryBudgetCategoryName(budgetLineInput.trim() || null)}
              >
                Lagre
              </button>
            </div>
          </div>
        </div>
      </MatHandlelistePageShell>
    </>
  )
}
