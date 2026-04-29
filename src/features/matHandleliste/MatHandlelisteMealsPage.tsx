'use client'

import { MatHandlelisteHeader } from '@/components/matHandleliste/MatHandlelisteHeader'
import MatHandlelisteTourHeaderButton from '@/features/matHandleliste/MatHandlelisteTourHeaderButton'
import { MatHandlelisteCollapsiblePanel } from '@/components/matHandleliste/MatHandlelisteCollapsiblePanel'
import { MatHandlelisteMealEditorModal } from '@/components/matHandleliste/MatHandlelisteMealEditorModal'
import { MatHandlelisteAppendMealDialog } from '@/features/matHandleliste/MatHandlelisteAppendDialog'
import { MatHandlelistePageShell } from '@/features/matHandleliste/MatHandlelistePageShell'
import { MEAL_SLOT_LABELS } from '@/features/matHandleliste/slotLabels'
import type { Meal, MealSlotId } from '@/features/matHandleliste/types'
import { MEAL_SLOT_ORDER } from '@/features/matHandleliste/types'
import { useStore } from '@/lib/store'
import { Copy, Minus, Plus, Search, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useId, useMemo, useState, type ReactNode } from 'react'

/** Søk i tittel, beskrivelse og ingrediensnavn (inkl. seksjon). */
function mealMatchesSearch(meal: Meal, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true
  if (meal.title.toLowerCase().includes(q)) return true
  if (meal.description?.toLowerCase().includes(q)) return true
  return meal.ingredients.some((ing) => {
    if (ing.name.toLowerCase().includes(q)) return true
    const sec = ing.section?.trim()
    return sec ? sec.toLowerCase().includes(q) : false
  })
}

type MealTimeFilter = 'all' | 'untagged' | MealSlotId

function mealMatchesTimeFilter(meal: Meal, filter: MealTimeFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'untagged') return !meal.tags?.length
  return meal.tags?.includes(filter) ?? false
}

function oppskriftTellingLabel(count: number): string {
  return count === 1 ? '1 oppskrift' : `${count} oppskrifter`
}

function mealTagsInDisplayOrder(tags: MealSlotId[] | undefined): MealSlotId[] {
  if (!tags?.length) return []
  const set = new Set(tags)
  return MEAL_SLOT_ORDER.filter((s) => set.has(s))
}

type MealsFoldKey = MealSlotId | 'untagged'

/** Seksjon under «Mine måltider» — kan lukkes/åpnes for ikke å liste alt på én gang. */
function MealsFoldableSection({
  title,
  subtitle,
  countLabel,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  subtitle: string
  countLabel: string
  isOpen: boolean
  /** Kalles ved klikk på overskrifts-raden */
  onToggle: () => void
  children: ReactNode
}) {
  const listId = useId()
  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={isOpen ? `${title}: skjul liste` : `${title}: vis liste`}
        className="flex min-h-[44px] w-full flex-wrap items-start gap-3 p-4 text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] touch-manipulation sm:p-5"
        onClick={onToggle}
      >
        <span
          className="block w-1 shrink-0 self-stretch rounded-full"
          aria-hidden
          style={{ background: 'color-mix(in srgb, var(--primary) 50%, var(--border))', minHeight: '2.75rem' }}
        />
        <div className="min-w-0 flex-1 pl-3">
          <h2 className="text-base font-semibold leading-tight" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {countLabel}
          </p>
          <span className="inline-flex shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden>
            {isOpen ? <Minus size={20} strokeWidth={2} /> : <Plus size={20} strokeWidth={2} />}
          </span>
        </div>
      </button>
      {isOpen ? (
        <div id={listId} className="border-t px-4 pb-4 sm:px-5" style={{ borderColor: 'var(--border)' }}>
          <ul className="grid grid-cols-1 gap-3 pt-3 md:grid-cols-2 md:gap-4">{children}</ul>
        </div>
      ) : null}
    </section>
  )
}

function MealRow({
  m,
  profileLabel,
  onAppend,
  onDuplicate,
  onEdit,
}: {
  m: Meal
  profileLabel: string
  onAppend: () => void
  onDuplicate: () => void
  onEdit: () => void
}) {
  const tagSlots = mealTagsInDisplayOrder(m.tags)
  return (
    <li
      role="button"
      tabIndex={0}
      className="group flex flex-wrap items-center gap-2 rounded-xl border p-3 text-left transition-[box-shadow,border-color] duration-200 md:hover:shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit()
        }
      }}
      aria-label={`Rediger måltid: ${m.title}`}
    >
      <div className="min-w-0 flex-1 pointer-events-none">
        <p className="font-medium" style={{ color: 'var(--text)' }}>
          {m.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {m.ingredients.length} ingredienser · {m.defaultServings} porsj. · {profileLabel}
        </p>
        {tagSlots.length > 0 ? (
          <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="Tidsrom for måltidet">
            {tagSlots.map((slot) => (
              <li
                key={slot}
                className="rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {MEAL_SLOT_LABELS[slot]}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Alle tidsrom
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onAppend()
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
        aria-label="Legg på handleliste"
      >
        <ShoppingCart size={18} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDuplicate()
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        aria-label="Dupliser"
      >
        <Copy size={18} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        className="min-h-[40px] rounded-xl border px-3 text-sm font-medium transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        Rediger
      </button>
    </li>
  )
}

export function MatHandlelisteMealsPage() {
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const meals = useStore((s) => s.matHandleliste.meals)
  const profiles = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const mhDuplicateMeal = useStore((s) => s.mhDuplicateMeal)

  const [editing, setEditing] = useState<Meal | 'new' | null>(null)
  const [appendMeal, setAppendMeal] = useState<Meal | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<MealTimeFilter>('all')
  const [onlyMyMeals, setOnlyMyMeals] = useState(false)

  /** Tidsrom/«uten tag» som brukeren har skjult (standard: alle åpne). */
  const [collapsedMealSections, setCollapsedMealSections] = useState<Set<MealsFoldKey>>(() => new Set())

  function toggleMealsSectionFold(key: MealsFoldKey) {
    setCollapsedMealSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const mealsSectionExpanded = (key: MealsFoldKey) => !collapsedMealSections.has(key)

  const profileLabel = (id: string) => profiles.find((p) => p.id === id)?.name ?? 'Ukjent profil'
  const multiProfile = profiles.length > 1

  const filteredMeals = useMemo(() => {
    return meals.filter((m) => {
      if (!mealMatchesTimeFilter(m, timeFilter)) return false
      if (multiProfile && onlyMyMeals && m.createdByProfileId !== activeProfileId) return false
      if (!mealMatchesSearch(m, searchQuery)) return false
      return true
    })
  }, [meals, timeFilter, multiProfile, onlyMyMeals, activeProfileId, searchQuery])

  const groupedSections = useMemo(() => {
    const tagged = MEAL_SLOT_ORDER.map((slot) => ({
      slot,
      label: MEAL_SLOT_LABELS[slot],
      meals: filteredMeals.filter((m) => m.tags?.includes(slot)),
    })).filter((sec) => sec.meals.length > 0)
    const untagged = filteredMeals.filter((m) => !m.tags?.length)
    return { tagged, untagged }
  }, [filteredMeals])

  const hasListResults =
    groupedSections.tagged.length > 0 || groupedSections.untagged.length > 0

  function openNew() {
    setEditing('new')
  }

  function openEdit(m: Meal) {
    setEditing(m)
  }

  function closeEditor() {
    setEditing(null)
  }

  return (
    <>
      <MatHandlelisteHeader
        title="Mine måltider"
        subtitle="Din kokebok — lagres i appen (ikke hentet fra nettet)"
        titleAddon={<MatHandlelisteTourHeaderButton />}
      />
      <MatHandlelistePageShell>
        <div data-mh-tour="meals-main" className="mx-auto w-full max-w-4xl space-y-4 pb-8 text-left">
          <div data-mh-tour="meals-toolbar" className="space-y-4">
          <div
            className="rounded-xl border p-4 text-sm leading-relaxed"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p style={{ color: 'var(--text)' }}>
              Her bygger du egne måltider og ingredienser. Alt lagres lokalt på kontoen din sammen med resten av
              appdata — det er ingen ekstern oppskriftsdatabase.
            </p>
            {demoDataEnabled ? (
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Demodata kan fylle eksempler automatisk når det er slått på under innstillinger.
              </p>
            ) : (
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Vil du se eksempelmåltider og plan? Slå på «Demodata» under{' '}
                <Link href="/konto/innstillinger#demodata" className="font-medium underline" style={{ color: 'var(--primary)' }}>
                  Min konto → Innstillinger
                </Link>
                .
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={openNew}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={18} /> Nytt måltid
          </button>

          {meals.length > 0 ? (
            <MatHandlelisteCollapsiblePanel title="Søk og filter">
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Søk blant måltider og ingredienser
                </label>
                <div
                  className="mt-1 flex items-center gap-2 rounded-xl border px-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  <Search size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="F.eks. pesto, laks…"
                    autoComplete="off"
                    className="min-h-[44px] flex-1 border-0 bg-transparent py-2 text-sm outline-none"
                    style={{ color: 'var(--text)' }}
                    aria-label="Søk etter måltid eller ingrediens"
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Treff på tittel, beskrivelse eller ingrediensnavn.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Filter: tidsrom
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeFilter('all')}
                    className="min-h-[40px] rounded-full border px-3 text-xs font-medium touch-manipulation"
                    style={{
                      borderColor: timeFilter === 'all' ? 'var(--primary)' : 'var(--border)',
                      background: timeFilter === 'all' ? 'var(--primary-pale)' : 'var(--bg)',
                      color: timeFilter === 'all' ? 'var(--primary)' : 'var(--text)',
                    }}
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('untagged')}
                    className="min-h-[40px] rounded-full border px-3 text-xs font-medium touch-manipulation"
                    style={{
                      borderColor: timeFilter === 'untagged' ? 'var(--primary)' : 'var(--border)',
                      background: timeFilter === 'untagged' ? 'var(--primary-pale)' : 'var(--bg)',
                      color: timeFilter === 'untagged' ? 'var(--primary)' : 'var(--text)',
                    }}
                  >
                    Uten tag
                  </button>
                  {MEAL_SLOT_ORDER.map((slot) => {
                    const on = timeFilter === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeFilter(slot)}
                        className="min-h-[40px] rounded-full border px-3 text-xs font-medium touch-manipulation"
                        style={{
                          borderColor: on ? 'var(--primary)' : 'var(--border)',
                          background: on ? 'var(--primary-pale)' : 'var(--bg)',
                          color: on ? 'var(--primary)' : 'var(--text)',
                        }}
                      >
                        {MEAL_SLOT_LABELS[slot]}
                      </button>
                    )
                  })}
                </div>
              </div>
              {multiProfile ? (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Filter: profil
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlyMyMeals(false)}
                      className="min-h-[40px] rounded-full border px-3 text-xs font-medium touch-manipulation"
                      style={{
                        borderColor: !onlyMyMeals ? 'var(--primary)' : 'var(--border)',
                        background: !onlyMyMeals ? 'var(--primary-pale)' : 'var(--bg)',
                        color: !onlyMyMeals ? 'var(--primary)' : 'var(--text)',
                      }}
                    >
                      Alle profiler
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlyMyMeals(true)}
                      className="min-h-[40px] rounded-full border px-3 text-xs font-medium touch-manipulation"
                      style={{
                        borderColor: onlyMyMeals ? 'var(--primary)' : 'var(--border)',
                        background: onlyMyMeals ? 'var(--primary-pale)' : 'var(--bg)',
                        color: onlyMyMeals ? 'var(--primary)' : 'var(--text)',
                      }}
                    >
                      Kun {profileLabel(activeProfileId)}
                    </button>
                  </div>
                </div>
              ) : null}
              <p className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                Viser {filteredMeals.length} av {meals.length} måltider
              </p>
            </MatHandlelisteCollapsiblePanel>
          ) : null}
          </div>

          {meals.length > 0 ? (
            <div className="space-y-6 md:space-y-8">
              {groupedSections.tagged.map((sec) => (
                <MealsFoldableSection
                  key={sec.slot}
                  title={sec.label}
                  subtitle="Oppskrifter til planlegging"
                  countLabel={oppskriftTellingLabel(sec.meals.length)}
                  isOpen={mealsSectionExpanded(sec.slot)}
                  onToggle={() => toggleMealsSectionFold(sec.slot)}
                >
                  {sec.meals.map((m) => (
                    <MealRow
                      key={`${m.id}-${sec.slot}`}
                      m={m}
                      profileLabel={profileLabel(m.createdByProfileId)}
                      onAppend={() => setAppendMeal(m)}
                      onDuplicate={() => mhDuplicateMeal(m.id)}
                      onEdit={() => openEdit(m)}
                    />
                  ))}
                </MealsFoldableSection>
              ))}
              {groupedSections.untagged.length > 0 ? (
                <MealsFoldableSection
                  title="Uten tag"
                  subtitle="Synlig i alle tidsrom i ukeplanen"
                  countLabel={oppskriftTellingLabel(groupedSections.untagged.length)}
                  isOpen={mealsSectionExpanded('untagged')}
                  onToggle={() => toggleMealsSectionFold('untagged')}
                >
                  {groupedSections.untagged.map((m) => (
                    <MealRow
                      key={m.id}
                      m={m}
                      profileLabel={profileLabel(m.createdByProfileId)}
                      onAppend={() => setAppendMeal(m)}
                      onDuplicate={() => mhDuplicateMeal(m.id)}
                      onEdit={() => openEdit(m)}
                    />
                  ))}
                </MealsFoldableSection>
              ) : null}
              {!hasListResults ? (
                <p className="py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen måltider matcher søket eller filtrene. Prøv å fjerne et filter eller endre søket.
                </p>
              ) : null}
            </div>
          ) : null}

          {meals.length === 0 && editing == null ? (
            <p className="py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen måltider ennå. Opprett ett for å komme i gang.
            </p>
          ) : null}
        </div>
      </MatHandlelistePageShell>

      <MatHandlelisteMealEditorModal editing={editing} onClose={closeEditor} />

      <MatHandlelisteAppendMealDialog
        open={appendMeal != null}
        meal={appendMeal}
        title={appendMeal ? `Legg «${appendMeal.title}» på listen` : ''}
        onClose={() => setAppendMeal(null)}
      />
    </>
  )
}
