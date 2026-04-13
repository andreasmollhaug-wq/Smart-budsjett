import {
  aggregateHouseholdData,
  createEmptyPersonData,
  type BudgetCategory,
  type Debt,
  type Investment,
  type PersistedAppSlice,
  type PersonData,
  type Transaction,
} from '@/lib/store'
import { monthlyEquivalentNok, yearlyEquivalentNok } from '@/lib/serviceSubscriptionHelpers'
import { formatTransactionDateNbNo } from '@/lib/utils'

const MAX_TRANSACTION_LINES = 300
const MAX_CONTEXT_CHARS = 25_000
const MAX_BUDGET_CATEGORY_LINES = 80
const MAX_SAVINGS_GOAL_LINES = 28
const MAX_DEBT_LINES = 28
const MAX_INVESTMENT_LINES = 28

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

export function profileNamesMapFromSlice(slice: PersistedAppSlice): Record<string, string> {
  const m: Record<string, string> = {}
  for (const p of slice.profiles) {
    m[p.id] = p.name?.trim() || 'Profil'
  }
  return m
}

export function resolvePersonDataForAi(slice: PersistedAppSlice): {
  person: PersonData
  scopeLabel: string
  isHouseholdAggregate: boolean
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
      isHouseholdAggregate: true,
    }
  }

  const activeId = slice.activeProfileId
  const profile = slice.profiles.find((p) => p.id === activeId)
  const name = profile?.name?.trim() || 'Aktiv profil'

  return {
    person: effectivePeople[activeId] ?? createEmptyPersonData(),
    scopeLabel: name,
    isHouseholdAggregate: false,
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

function profileShort(
  profileId: string | undefined,
  profileNamesById: Record<string, string>,
  isHouseholdAggregate: boolean,
): string {
  if (!isHouseholdAggregate || !profileId) return ''
  return profileNamesById[profileId]?.trim() || 'Ukjent profil'
}

function debtTypeNb(t: Debt['type']): string {
  switch (t) {
    case 'mortgage':
      return 'boliglån'
    case 'credit_card':
      return 'kredittkort'
    case 'student_loan':
      return 'studielån'
    case 'consumer_loan':
      return 'forbrukslån'
    case 'refinancing':
      return 'refinansiering'
    case 'loan':
      return 'lån'
    default:
      return 'annet'
  }
}

function investmentTypeNb(t: Investment['type']): string {
  switch (t) {
    case 'stocks':
      return 'aksjer'
    case 'funds':
      return 'fond'
    case 'crypto':
      return 'krypto'
    case 'bonds':
      return 'obligasjoner'
    default:
      return 'annet'
  }
}

export type AiFinanceContextMeta = {
  budgetYear: number
  scopeLabel: string
  isHouseholdAggregate: boolean
  profileNamesById: Record<string, string>
}

export function buildAiFinanceContextText(person: PersonData, meta: AiFinanceContextMeta): string {
  const { budgetYear, scopeLabel, isHouseholdAggregate, profileNamesById } = meta
  const lines: string[] = []
  lines.push('--- Brukerens data fra appen (kun lesing) ---')
  lines.push(`Budsjettår: ${budgetYear}`)
  lines.push(`Visningsmodus: ${scopeLabel}`)
  if (isHouseholdAggregate) {
    lines.push(
      'Bruk av data: tallene under er aggregert på tvers av alle profiler. Transaksjoner og enkeltposter som er merket med profil, tilhører den profilen.',
    )
  } else {
    lines.push('Bruk av data: tallene under gjelder kun den valgte profilen (samme som visningsmodus over).')
  }
  lines.push('')

  const txs = sortTransactionsNewestFirst(person.transactions ?? [])
  const totalTx = txs.length
  const shown = txs.slice(0, MAX_TRANSACTION_LINES)
  const omitted = totalTx - shown.length

  lines.push(`Transaksjoner (nyeste først, ${totalTx} totalt):`)
  if (totalTx === 0) {
    lines.push('Ingen transaksjoner registrert.')
  } else {
    if (isHouseholdAggregate) {
      lines.push('dato | beskrivelse | beløp (kr) | kategori | underkategori | type | profil')
    } else {
      lines.push('dato | beskrivelse | beløp (kr) | kategori | underkategori | type')
    }
    for (const t of shown) {
      const amt = typeof t.amount === 'number' && Number.isFinite(t.amount) ? t.amount : 0
      const desc = (t.description ?? '').replace(/\s+/g, ' ').trim() || '(uten beskrivelse)'
      const cat = (t.category ?? '').replace(/\s+/g, ' ').trim() || '(uten kategori)'
      const sub = (t.subcategory ?? '').replace(/\s+/g, ' ').trim() || '–'
      const dateShow = formatTransactionDateNbNo(t.date) || t.date
      const prof = profileShort(t.profileId, profileNamesById, isHouseholdAggregate)
      if (isHouseholdAggregate) {
        lines.push(`${dateShow} | ${desc} | ${amt} | ${cat} | ${sub} | ${typeLabel(t.type)} | ${prof || '–'}`)
      } else {
        lines.push(`${dateShow} | ${desc} | ${amt} | ${cat} | ${sub} | ${typeLabel(t.type)}`)
      }
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
      if (!s.active || s.cancelledFrom) continue
      sumM += monthlyEquivalentNok(s)
      sumY += yearlyEquivalentNok(s)
    }
    lines.push(`Aktive abonnementer: ca. ${Math.round(sumM)} kr/mnd til sammen, ca. ${Math.round(sumY)} kr/år (omregnet).`)
    for (const s of subs) {
      const status = s.cancelledFrom ? 'avsluttet' : s.active ? 'aktiv' : 'på pause'
      const sync = s.syncToBudget ? ', synket til budsjett (Regninger)' : ''
      const prof = profileShort(s.sourceProfileId, profileNamesById, isHouseholdAggregate)
      const who = prof ? ` [${prof}]` : ''
      lines.push(
        `- ${s.label}${who}: ${s.amountNok} kr per ${s.billing === 'monthly' ? 'måned' : 'år'}, ${status}${sync}`,
      )
    }
  }

  lines.push('')
  lines.push('Budsjettkategorier (brukt / planlagt sum for året):')
  if (isHouseholdAggregate) {
    lines.push('(Like kategorinavn er summert på tvers av profiler.)')
  }
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

  lines.push('')
  lines.push('Sparemål:')
  const goals = person.savingsGoals ?? []
  if (goals.length === 0) {
    lines.push('Ingen sparemål registrert.')
  } else {
    let gn = 0
    for (const g of goals) {
      if (gn >= MAX_SAVINGS_GOAL_LINES) {
        lines.push(`… og ${goals.length - gn} flere sparemål vises ikke.`)
        break
      }
      const prof = profileShort(g.sourceProfileId, profileNamesById, isHouseholdAggregate)
      const who = prof ? ` [${prof}]` : ''
      lines.push(
        `- ${g.name}${who}: mål ${g.targetAmount} kr, nå ${g.currentAmount} kr, måldato ${g.targetDate || '–'}`,
      )
      gn += 1
    }
  }

  lines.push('')
  lines.push('Gjeld (registrert i appen):')
  const debts = person.debts ?? []
  if (debts.length === 0) {
    lines.push('Ingen gjeld registrert.')
  } else {
    let dn = 0
    for (const d of debts) {
      if (dn >= MAX_DEBT_LINES) {
        lines.push(`… og ${debts.length - dn} flere lån vises ikke.`)
        break
      }
      const prof = profileShort(d.sourceProfileId, profileNamesById, isHouseholdAggregate)
      const who = prof ? ` [${prof}]` : ''
      lines.push(
        `- ${d.name}${who}: rest ${d.remainingAmount} kr, månedlig ${d.monthlyPayment} kr, rente ${d.interestRate} %, type ${debtTypeNb(d.type)}`,
      )
      dn += 1
    }
  }

  lines.push('')
  lines.push('Investeringer (registrert i appen):')
  const invs = person.investments ?? []
  if (invs.length === 0) {
    lines.push('Ingen investeringer registrert.')
  } else {
    let inN = 0
    for (const inv of invs) {
      if (inN >= MAX_INVESTMENT_LINES) {
        lines.push(`… og ${invs.length - inN} flere posisjoner vises ikke.`)
        break
      }
      const prof = profileShort(inv.sourceProfileId, profileNamesById, isHouseholdAggregate)
      const who = prof ? ` [${prof}]` : ''
      lines.push(
        `- ${inv.name}${who}: markedsverdi ca. ${inv.currentValue} kr, kjøpsverdi ${inv.purchaseValue} kr, type ${investmentTypeNb(inv.type)}`,
      )
      inN += 1
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
  const { person, scopeLabel, isHouseholdAggregate } = resolvePersonDataForAi(state)
  const profileNamesById = profileNamesMapFromSlice(state)
  return buildAiFinanceContextText(person, {
    budgetYear: state.budgetYear,
    scopeLabel,
    isHouseholdAggregate,
    profileNamesById,
  })
}
