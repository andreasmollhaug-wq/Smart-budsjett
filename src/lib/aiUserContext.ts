import {
  aggregateHouseholdData,
  createEmptyPersonData,
  type BudgetCategory,
  type PersistedAppSlice,
  type PersonData,
  type Transaction,
} from '@/lib/store'
import { monthlyEquivalentNok, yearlyEquivalentNok } from '@/lib/serviceSubscriptionHelpers'
import { formatTransactionDateNbNo } from '@/lib/utils'

const MAX_TRANSACTION_LINES = 300
const MAX_CONTEXT_CHARS = 25_000
const MAX_BUDGET_CATEGORY_LINES = 80

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

/** Minimal validering av lagret app-tilstand fra Supabase. */
export function isPersistedAppSlice(state: unknown): state is PersistedAppSlice {
  if (!isRecord(state)) return false
  if (!isRecord(state.people)) return false
  if (!Array.isArray(state.profiles)) return false
  if (typeof state.activeProfileId !== 'string') return false
  if (state.financeScope !== 'profile' && state.financeScope !== 'household') return false
  if (typeof state.budgetYear !== 'number' || !Number.isFinite(state.budgetYear)) return false
  if (state.subscriptionPlan !== 'solo' && state.subscriptionPlan !== 'family') return false
  if (typeof state.demoDataEnabled !== 'boolean') return false
  return true
}

export function getEffectivePeopleForAi(slice: PersistedAppSlice): Record<string, PersonData> {
  const pbd = slice.peopleBeforeDemo
  if (
    slice.demoDataEnabled &&
    pbd != null &&
    typeof pbd === 'object' &&
    !Array.isArray(pbd) &&
    Object.keys(pbd as object).length > 0
  ) {
    return pbd as Record<string, PersonData>
  }
  return slice.people
}

export function resolvePersonDataForAi(slice: PersistedAppSlice): {
  person: PersonData
  scopeLabel: string
} {
  const effectivePeople = getEffectivePeopleForAi(slice)
  const householdMode =
    slice.financeScope === 'household' &&
    slice.subscriptionPlan === 'family' &&
    slice.profiles.length >= 2

  if (householdMode) {
    return {
      person: aggregateHouseholdData(
        effectivePeople,
        slice.profiles.map((p) => p.id),
        slice.budgetYear,
      ),
      scopeLabel: 'Husholdning (alle profiler)',
    }
  }

  const activeId = slice.activeProfileId
  const profile = slice.profiles.find((p) => p.id === activeId)
  const name = profile?.name?.trim() || 'Aktiv profil'

  return {
    person: effectivePeople[activeId] ?? createEmptyPersonData(),
    scopeLabel: name,
  }
}

function sortTransactionsNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const at = new Date(a.date).getTime()
    const bt = new Date(b.date).getTime()
    if (bt !== at) return bt - at
    return (b.description ?? '').localeCompare(a.description ?? '')
  })
}

function typeLabel(type: 'income' | 'expense'): string {
  return type === 'income' ? 'inntekt' : 'utgift'
}

function sumBudgetedYear(cat: BudgetCategory): number {
  const arr = cat.budgeted
  if (!Array.isArray(arr)) return 0
  return arr.reduce((s, n) => s + (typeof n === 'number' && Number.isFinite(n) ? n : 0), 0)
}

export function buildAiFinanceContextText(
  person: PersonData,
  meta: { budgetYear: number; scopeLabel: string },
): string {
  const lines: string[] = []
  lines.push('--- Brukerens data fra appen (kun lesing) ---')
  lines.push(`Budsjettår: ${meta.budgetYear}`)
  lines.push(`Visningsmodus: ${meta.scopeLabel}`)
  lines.push('')

  const txs = sortTransactionsNewestFirst(person.transactions ?? [])
  const totalTx = txs.length
  const shown = txs.slice(0, MAX_TRANSACTION_LINES)
  const omitted = totalTx - shown.length

  lines.push(`Transaksjoner (nyeste først, ${totalTx} totalt):`)
  if (totalTx === 0) {
    lines.push('Ingen transaksjoner registrert.')
  } else {
    lines.push('dato | beskrivelse | beløp (kr) | kategori | underkategori | type')
    for (const t of shown) {
      const amt = typeof t.amount === 'number' && Number.isFinite(t.amount) ? t.amount : 0
      const desc = (t.description ?? '').replace(/\s+/g, ' ').trim() || '(uten beskrivelse)'
      const cat = (t.category ?? '').replace(/\s+/g, ' ').trim() || '(uten kategori)'
      const sub = (t.subcategory ?? '').replace(/\s+/g, ' ').trim() || '–'
      const dateShow = formatTransactionDateNbNo(t.date) || t.date
      lines.push(`${dateShow} | ${desc} | ${amt} | ${cat} | ${sub} | ${typeLabel(t.type)}`)
    }
    if (omitted > 0) {
      lines.push(`… og ${omitted} eldre transaksjoner vises ikke.`)
    }
  }

  lines.push('')
  const subs = person.serviceSubscriptions ?? []
  lines.push('Tjenesteabonnementer (streaming, programvare m.m., registrert i appen):')
  if (subs.length === 0) {
    lines.push('Ingen tjenesteabonnementer registrert.')
  } else {
    let sumM = 0
    let sumY = 0
    for (const s of subs) {
      if (!s.active) continue
      sumM += monthlyEquivalentNok(s)
      sumY += yearlyEquivalentNok(s)
    }
    lines.push(`Aktive abonnementer: ca. ${Math.round(sumM)} kr/mnd til sammen, ca. ${Math.round(sumY)} kr/år (omregnet).`)
    for (const s of subs) {
      const status = s.active ? 'aktiv' : 'på pause'
      const sync = s.syncToBudget ? ', synket til budsjett (Regninger)' : ''
      lines.push(
        `- ${s.label}: ${s.amountNok} kr per ${s.billing === 'monthly' ? 'måned' : 'år'}, ${status}${sync}`,
      )
    }
  }

  lines.push('')
  lines.push('Budsjettkategorier (brukt / planlagt sum for året):')
  const cats = person.budgetCategories ?? []
  if (cats.length === 0) {
    lines.push('Ingen budsjettkategorier.')
  } else {
    let n = 0
    for (const c of cats) {
      if (n >= MAX_BUDGET_CATEGORY_LINES) {
        lines.push(`… og ${cats.length - n} flere kategorier vises ikke.`)
        break
      }
      const planned = sumBudgetedYear(c)
      const spent = typeof c.spent === 'number' && Number.isFinite(c.spent) ? c.spent : 0
      lines.push(
        `- ${c.name} (${typeLabel(c.type)}): brukt ${spent} kr, planlagt ${planned} kr (sum av månedsbeløp)`,
      )
      n += 1
    }
  }

  let text = lines.join('\n')
  if (text.length > MAX_CONTEXT_CHARS) {
    text = text.slice(0, MAX_CONTEXT_CHARS - 40)
    text += '\n… (kontekst avkortet pga. størrelsesgrense.)'
  }
  return text
}

/** Bygger konteksttekst for systemprompt fra persistert tilstand, eller kort fallback. */
export function buildAiUserContextFromPersistedState(state: unknown): string {
  if (!isPersistedAppSlice(state)) {
    return 'Ingen lagrede økonomidata i appen.'
  }
  const { person, scopeLabel } = resolvePersonDataForAi(state)
  return buildAiFinanceContextText(person, { budgetYear: state.budgetYear, scopeLabel })
}
