import {
  aggregateHouseholdData,
  createEmptyPersonData,
  type BudgetCategory,
  type Debt,
  type Investment,
  type PersistedAppSlice,
  type PersonData,
  type ServiceSubscription,
  type Transaction,
} from '@/lib/store'
import { monthlyEquivalentNok, yearlyEquivalentNok } from '@/lib/serviceSubscriptionHelpers'
import {
  isOverduePlanFollowUp,
  isPlannedKommendeLater,
  isPlannedKommendeThisMonth,
  sortTransactionsByDateAsc,
  todayYyyyMmDd,
  transactionRequiresPlanFollowUp,
} from '@/lib/plannedTransactions'
import { formatTransactionDateNbNo } from '@/lib/utils'
import {
  effectiveBudgetedIncomeMonth,
  effectiveIncomeTransactionAmount,
  transactionIncomeIsNet,
} from '@/lib/incomeWithholding'

const MAX_TRANSACTION_LINES = 300
const MAX_CONTEXT_CHARS = 25_000
const MAX_BUDGET_CATEGORY_LINES = 80
const MAX_SAVINGS_GOAL_LINES = 28
const MAX_DEBT_LINES = 28
const MAX_INVESTMENT_LINES = 28
const MAX_SUBSCRIPTION_SERVICE_CELL_CHARS = 72

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

function plannedYearTotalForAi(cat: BudgetCategory): number {
  if (cat.type === 'income' && cat.parentCategory === 'inntekter') {
    let s = 0
    for (let i = 0; i < 12; i++) s += effectiveBudgetedIncomeMonth(cat, i)
    return s
  }
  return sumBudgetedYear(cat)
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

function subscriptionActiveForTotals(s: ServiceSubscription): boolean {
  return !!(s.active && !s.cancelledFrom)
}

function truncateSubscriptionServiceCell(s: string): string {
  const t = s.trim()
  if (t.length <= MAX_SUBSCRIPTION_SERVICE_CELL_CHARS) return t
  return `${t.slice(0, MAX_SUBSCRIPTION_SERVICE_CELL_CHARS - 1)}…`
}

function appendTransactionsSection(lines: string[], person: PersonData, meta: AiFinanceContextMeta): void {
  const { isHouseholdAggregate, profileNamesById, peopleById } = meta
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
      const amtRaw = typeof t.amount === 'number' && Number.isFinite(t.amount) ? t.amount : 0
      const wh =
        t.profileId && peopleById[t.profileId]
          ? peopleById[t.profileId]!.defaultIncomeWithholding
          : undefined
      const netInc =
        t.type === 'income' ? effectiveIncomeTransactionAmount(t, wh ?? undefined) : amtRaw
      let amtShow = String(amtRaw)
      if (t.type === 'income' && !transactionIncomeIsNet(t)) {
        amtShow = `${amtRaw} (brutto; ca. ${netInc} kr netto i summeringer)`
      }
      const desc = (t.description ?? '').replace(/\s+/g, ' ').trim() || '(uten beskrivelse)'
      const cat = (t.category ?? '').replace(/\s+/g, ' ').trim() || '(uten kategori)'
      const sub = (t.subcategory ?? '').replace(/\s+/g, ' ').trim() || '–'
      const dateShow = formatTransactionDateNbNo(t.date) || t.date
      const prof = profileShort(t.profileId, profileNamesById, isHouseholdAggregate)
      if (isHouseholdAggregate) {
        lines.push(`${dateShow} | ${desc} | ${amtShow} | ${cat} | ${sub} | ${typeLabel(t.type)} | ${prof || '–'}`)
      } else {
        lines.push(`${dateShow} | ${desc} | ${amtShow} | ${cat} | ${sub} | ${typeLabel(t.type)}`)
      }
    }
    if (omitted > 0) {
      lines.push(`… og ${omitted} eldre transaksjoner vises ikke.`)
    }
  }
}

function appendPlannedFollowUpSection(lines: string[], person: PersonData): void {
  const todayAi = todayYyyyMmDd()
  const planRelevant = (person.transactions ?? []).filter((t) => transactionRequiresPlanFollowUp(t))
  const overdueAi = planRelevant
    .filter((t) => isOverduePlanFollowUp(t, todayAi))
    .sort(sortTransactionsByDateAsc)
    .slice(0, 15)
  const thisMonthAi = planRelevant
    .filter((t) => isPlannedKommendeThisMonth(t, todayAi))
    .sort(sortTransactionsByDateAsc)
    .slice(0, 15)
  const laterAi = planRelevant
    .filter((t) => isPlannedKommendeLater(t, todayAi))
    .sort(sortTransactionsByDateAsc)
    .slice(0, 10)
  lines.push('Planlagt oppfølging (Kommende — begrenset utdrag):')
  if (overdueAi.length === 0 && thisMonthAi.length === 0 && laterAi.length === 0) {
    lines.push('Ingen planlagte poster som krever ekstra oppfølging i dette utdraget.')
  } else {
    const pushPlanLines = (label: string, txs: Transaction[]) => {
      if (txs.length === 0) return
      lines.push(label)
      for (const t of txs) {
        const amt = typeof t.amount === 'number' && Number.isFinite(t.amount) ? t.amount : 0
        const desc = (t.description ?? '').replace(/\s+/g, ' ').trim() || '(uten beskrivelse)'
        const dateShow = formatTransactionDateNbNo(t.date) || t.date
        const rev = t.reviewedAt ? 'gjennomgått' : 'ikke gjennomgått'
        const paid = t.type === 'expense' ? (t.paidAt ? ', betalt' : ', ikke betalt') : ''
        lines.push(`- ${dateShow} | ${desc} | ${amt} kr | ${typeLabel(t.type)} | ${rev}${paid}`)
      }
    }
    pushPlanLines('Etter planlagt dato (trenger oppfølging):', overdueAi)
    pushPlanLines('Denne måneden (planlagt, uferdig):', thisMonthAi)
    pushPlanLines('Senere (fra neste måned, utdrag):', laterAi)
  }
}

function appendServiceSubscriptionsSection(lines: string[], person: PersonData, meta: AiFinanceContextMeta): void {
  const { isHouseholdAggregate, profileNamesById } = meta
  const subs = person.serviceSubscriptions ?? []
  lines.push('Tjenesteabonnementer (streaming, programvare m.m., registrert i appen):')
  if (subs.length === 0) {
    lines.push('Ingen tjenesteabonnementer registrert.')
    return
  }

  let sumM = 0
  let sumY = 0
  for (const s of subs) {
    if (!subscriptionActiveForTotals(s)) continue
    sumM += monthlyEquivalentNok(s)
    sumY += yearlyEquivalentNok(s)
  }
  if (isHouseholdAggregate) {
    lines.push(
      `Aktive abonnementer (sum hele husholdningen): ca. ${Math.round(sumM)} kr/mnd, ca. ${Math.round(sumY)} kr/år (omregnet).`,
    )
    type PerProfileAgg = { m: number; y: number; labels: string[] }
    const byPid = new Map<string, PerProfileAgg>()
    const bump = (pid: string, s: ServiceSubscription) => {
      let a = byPid.get(pid)
      if (!a) {
        a = { m: 0, y: 0, labels: [] }
        byPid.set(pid, a)
      }
      a.m += monthlyEquivalentNok(s)
      a.y += yearlyEquivalentNok(s)
      a.labels.push(s.label)
    }
    for (const s of subs) {
      if (!subscriptionActiveForTotals(s)) continue
      const pid = s.sourceProfileId
      bump(pid && pid.length > 0 ? pid : '_ukjent', s)
    }
    lines.push('Tabell — tjenesteabonnementer per profil (kun aktive, omregnet til kr/mnd og kr/år):')
    lines.push('profil | ca. kr/mnd | ca. kr/år | registrerte tjenester')
    const sortedProfiles = Object.entries(profileNamesById).sort((a, b) => a[1].localeCompare(b[1], 'nb'))
    for (const [pid, pname] of sortedProfiles) {
      const agg = byPid.get(pid) ?? { m: 0, y: 0, labels: [] }
      const uniqueLabels = [...new Set(agg.labels)].sort((a, b) => a.localeCompare(b, 'nb'))
      const services = uniqueLabels.length
        ? truncateSubscriptionServiceCell(uniqueLabels.join(', '))
        : '–'
      const safeName = pname.replace(/\|/g, ' ').trim() || 'Profil'
      lines.push(`${safeName} | ${Math.round(agg.m)} | ${Math.round(agg.y)} | ${services}`)
    }
    const orphan = byPid.get('_ukjent')
    if (orphan && (orphan.m > 0 || orphan.y > 0 || orphan.labels.length > 0)) {
      const uniqueLabels = [...new Set(orphan.labels)].sort((a, b) => a.localeCompare(b, 'nb'))
      const services = uniqueLabels.length
        ? truncateSubscriptionServiceCell(uniqueLabels.join(', '))
        : '–'
      lines.push(`Ukjent profil | ${Math.round(orphan.m)} | ${Math.round(orphan.y)} | ${services}`)
    }
    lines.push(`Totalt husholdning | ${Math.round(sumM)} | ${Math.round(sumY)} | alle profiler`)
    lines.push('')
  } else {
    lines.push(
      `Aktive abonnementer: ca. ${Math.round(sumM)} kr/mnd til sammen, ca. ${Math.round(sumY)} kr/år (omregnet).`,
    )
  }

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

export type AiFinanceContextMeta = {
  budgetYear: number
  scopeLabel: string
  isHouseholdAggregate: boolean
  profileNamesById: Record<string, string>
  peopleById: Record<string, PersonData>
}

export function buildAiFinanceContextText(person: PersonData, meta: AiFinanceContextMeta): string {
  const { budgetYear, scopeLabel, isHouseholdAggregate, profileNamesById } = meta
  const lines: string[] = []
  lines.push('--- Brukerens data fra appen (kun lesing) ---')
  lines.push(`Budsjettår: ${budgetYear}`)
  lines.push(`Visningsmodus: ${scopeLabel}`)
  lines.push(
    'Inntekt i budsjett og transaksjoner: der brukeren har valgt forenklet trekk, er planlagte budsjettbeløp og lister vist som netto i summeringer (beløp i cellen kan fortsatt være brutto). Dette er ikke offisiell skatt.',
  )
  if (isHouseholdAggregate) {
    lines.push(
      'Bruk av data: tallene under er aggregert på tvers av alle profiler. Transaksjoner og enkeltposter som er merket med profil, tilhører den profilen.',
    )
    lines.push(
      'Ved spørsmål om fordeling mellom personer: bruk profilmerket innhold i teksten under der det finnes; ikke anta fordeling utover det som står.',
    )
  } else {
    lines.push('Bruk av data: tallene under gjelder kun den valgte profilen (samme som visningsmodus over).')
  }
  lines.push('')

  if (isHouseholdAggregate) {
    appendServiceSubscriptionsSection(lines, person, meta)
    lines.push('')
    appendTransactionsSection(lines, person, meta)
    lines.push('')
    appendPlannedFollowUpSection(lines, person)
  } else {
    appendTransactionsSection(lines, person, meta)
    lines.push('')
    appendPlannedFollowUpSection(lines, person)
    lines.push('')
    appendServiceSubscriptionsSection(lines, person, meta)
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
      const planned = plannedYearTotalForAi(c)
      const spent = typeof c.spent === 'number' && Number.isFinite(c.spent) ? c.spent : 0
      lines.push(
        `- ${c.name} (${typeLabel(c.type)}): brukt ${spent} kr, planlagt ${planned} kr (år, netto der trekk er på for inntekt)`,
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

  if (isHouseholdAggregate) {
    lines.push(
      'Gjeld — side i appen (navigasjon): Med Familie og flere profiler finnes Gjeld → «Husholdning» (/gjeld/husholdning). Siden følger «Viser data for»: ved valg av Husholdning vises alle profiler; ved valg av én profil vises kun den profilens gjeld på samme rute. Innehold: KPI, diagrammer med forkortede tall på søyler (k/M), modal ved klikk. Samme underliggende gjeld som i listen over.',
    )
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
  const peopleById = getEffectivePeopleForAi(state)
  return buildAiFinanceContextText(person, {
    budgetYear: state.budgetYear,
    scopeLabel,
    isHouseholdAggregate,
    profileNamesById,
    peopleById,
  })
}
