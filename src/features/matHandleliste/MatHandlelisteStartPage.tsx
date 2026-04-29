'use client'

import { MatHandlelisteHeader } from '@/components/matHandleliste/MatHandlelisteHeader'
import MatHandlelisteTourHeaderButton from '@/features/matHandleliste/MatHandlelisteTourHeaderButton'
import { useMatHandlelisteTour } from '@/features/matHandleliste/MatHandlelisteTourProvider'
import { MatHandlelistePageShell } from '@/features/matHandleliste/MatHandlelistePageShell'
import { useStore } from '@/lib/store'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { normalizeIngredientKey } from '@/features/matHandleliste/ingredientKey'

export function MatHandlelisteStartPage() {
  const { startTour, startExtendedTour } = useMatHandlelisteTour()
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
      <MatHandlelisteHeader
        title="Mat og handleliste"
        subtitle="Ukeplan, måltider og samlet handleliste"
        titleAddon={<MatHandlelisteTourHeaderButton />}
      />
      <MatHandlelistePageShell>
        <div className="mx-auto w-full max-w-3xl space-y-6 pb-8 xl:max-w-4xl">
          <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:gap-8">
            <div
              data-mh-tour="start-intro"
              className="min-w-0 flex-1 space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                boxShadow: '0 8px 28px -16px rgba(30, 43, 79, 0.14)',
              }}
            >
              <div data-mh-tour="ext-intro" className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Oversikt
                </p>
                <h2 className="text-base font-semibold leading-snug sm:text-lg" style={{ color: 'var(--text)' }}>
                  Fra oppskrift til samlet handleliste — gruppert slik du finner det i butikken
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                  Lag måltider, legg dem i plan, og åpne handlelisten med alt samlet på ett sted. Data lagres på kontoen din
                  (som HjemFlyt).
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => startTour()}
                    className="flex w-full min-h-[48px] min-w-0 items-center justify-center rounded-xl border text-sm font-semibold touch-manipulation sm:w-auto sm:min-w-[12rem]"
                    style={{
                      borderColor: 'var(--primary)',
                      color: 'var(--primary)',
                      background: 'var(--primary-pale)',
                    }}
                  >
                    Vis meg rundt
                  </button>
                  <button
                    type="button"
                    onClick={() => startExtendedTour()}
                    className="flex w-full min-h-[48px] min-w-0 items-center justify-center rounded-xl border text-sm font-semibold touch-manipulation sm:min-w-[12rem]"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                      background: 'var(--bg)',
                    }}
                  >
                    Utvidet gjennomgang
                  </button>
                </div>
              </div>
            </div>

            <aside
              className="flex min-w-0 shrink-0 flex-col gap-0 rounded-2xl border p-1 sm:p-2 lg:w-[min(22rem,100%)]"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--primary-pale) 40%, var(--surface))',
                boxShadow: '0 8px 24px -14px rgba(30, 43, 79, 0.12)',
              }}
            >
              <p
                className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wide sm:px-4"
                style={{ color: 'var(--text-muted)' }}
              >
                Snarveier
              </p>
              <div className="flex flex-col gap-1 pb-2 sm:gap-2 sm:pb-3">
                <Link
                  href="/intern/mat-handleliste/handleliste"
                  className="group mx-2 flex min-h-[52px] min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none ring-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:mx-3"
                  style={{
                    border: '1px solid transparent',
                    background: 'var(--surface)',
                  }}
                >
                  <ArrowRight
                    size={18}
                    className="shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--primary)' }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      Handleliste
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                      Varer fra måltidsplan samlet inn
                    </span>
                  </span>
                </Link>
                <Link
                  href="/intern/mat-handleliste/maltider"
                  className="group mx-2 flex min-h-[52px] min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none ring-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:mx-3"
                  style={{
                    border: '1px solid transparent',
                    background: 'var(--surface)',
                  }}
                >
                  <ArrowRight
                    size={18}
                    className="shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--primary)' }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      Måltider
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                      Bygg egne måltider med ingredienser
                    </span>
                  </span>
                </Link>
                <Link
                  href="/intern/mat-handleliste/plan"
                  className="group mx-2 flex min-h-[52px] min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none ring-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:mx-3"
                  style={{
                    border: '1px solid transparent',
                    background: 'var(--surface)',
                  }}
                >
                  <ArrowRight
                    size={18}
                    className="shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--primary)' }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      Uke- og månedsplan
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                      Planlegg hva dere spiser og når
                    </span>
                  </span>
                </Link>
              </div>
            </aside>
          </div>

          {!demoDataEnabled ? (
            <div
              className="rounded-xl border px-4 py-3 text-sm leading-relaxed"
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
            <p
              className="text-sm rounded-xl border px-4 py-3"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Demodata er på, men listen ser tom ut. Prøv å oppdatere siden (eller gå til handleliste/plan) — eksempler
              skal lastes inn automatisk.
            </p>
          ) : null}

          <div
            data-mh-tour="ext-done"
            className="rounded-2xl border p-5 shadow-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: '0 8px 28px -16px rgba(30, 43, 79, 0.1)' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Når du husker dette, er du klar i butikken
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              <li>Finn fram mellom Start, Handleliste, Måltider og Plan fra menyen øverst i modulen.</li>
              <li>Flytt deg mellom uke og måned når dere planlegger kort eller langt.</li>
              <li>Legg måltidsplan som varer ned på én stor handleliste, og finjuster hvilke tidsrom dere ser på plan.</li>
              <li>Legg til enkeltvarer for ting som ikke står i måltidene eller planen ennå.</li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              «Vis meg rundt» og «Utvidet gjennomgang» på denne siden kan du kjøre så ofte du vil.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2 md:gap-5">
            <div className="rounded-2xl border p-5 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Har ofte hjemme
              </h2>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Når du legger måltid på listen, kan du i forhåndsvisningen velge bort varer du allerede har. Listen her husker
                varenavn slik at appen kan foreslå det samme senere — og i måltidsredigereren kan du krysse ut «Har ofte
                hjemme» på ingredienser du sjelden trenger å kjøpe hver gang.
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
                  className="min-h-[44px] min-w-0 flex-1 rounded-xl border px-3 text-sm"
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

            <div className="rounded-2xl border p-5 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
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
                  className="min-h-[44px] min-w-0 flex-1 rounded-xl border px-3 text-sm"
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
        </div>
      </MatHandlelistePageShell>
    </>
  )
}
