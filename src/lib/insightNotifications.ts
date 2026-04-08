import type { AppNotification, AppNotificationKind, Debt, PersonData, Transaction } from '@/lib/store'

function ymNow(): { y: number; m: number; ym: string; day: number } {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const ym = `${y}-${String(m).padStart(2, '0')}`
  return { y, m: m - 1, ym, day }
}

function txInMonth(txs: Transaction[], ym: string): boolean {
  return txs.some((t) => t.date && t.date.startsWith(ym))
}

function expenseBudgetRatioForCategory(
  person: PersonData,
  budgetYear: number,
  monthIndex: number,
): { categoryId: string; name: string; ratio: number } | null {
  let best: { categoryId: string; name: string; ratio: number } | null = null
  for (const c of person.budgetCategories) {
    if (c.type !== 'expense') continue
    const planned = c.budgeted[monthIndex] ?? 0
    if (planned <= 0) continue
    const spent = sumSpentExpenseForCategoryInMonth(person.transactions, c.name, budgetYear, monthIndex)
    const ratio = spent / planned
    if (ratio >= 0.9 && (!best || ratio > best.ratio)) {
      best = { categoryId: c.id, name: c.name, ratio }
    }
  }
  return best
}

function sumSpentExpenseForCategoryInMonth(
  txs: Transaction[],
  categoryName: string,
  year: number,
  monthIndex: number,
): number {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  let s = 0
  for (const t of txs) {
    if (t.type !== 'expense') continue
    if (t.category !== categoryName) continue
    if (!t.date || !t.date.startsWith(prefix)) continue
    s += t.amount
  }
  return s
}

function parsePauseEnd(d: Debt): number | null {
  if (!d.pauseEndDate || !d.repaymentPaused) return null
  const t = new Date(d.pauseEndDate).getTime()
  return Number.isFinite(t) ? t : null
}

/**
 * Nye innsiktsvarsler (idempotente id-er). Kalles med full app-tilstand.
 */
export function computeInsightDeltas(input: {
  financeScope: 'profile' | 'household'
  subscriptionPlan: 'solo' | 'family'
  profiles: { id: string }[]
  activeProfileId: string
  people: Record<string, PersonData>
  budgetYear: number
  onboarding: { status: string }
  deliveredInsightIds: string[]
  existingNotificationIds: Set<string>
}): { toAdd: AppNotification[]; newDeliveredIds: string[] } {
  const toAdd: AppNotification[] = []
  const newDeliveredIds: string[] = []

  const { y, m, ym, day } = ymNow()
  const pid = input.activeProfileId
  const person = input.people[pid]
  const txs = person?.transactions ?? []

  const householdBlocked =
    input.financeScope === 'household' && input.subscriptionPlan === 'family' && input.profiles.length >= 2

  const mark = (id: string, title: string, body: string, kind: AppNotificationKind) => {
    if (input.existingNotificationIds.has(id)) return
    if (input.deliveredInsightIds.includes(id)) return
    toAdd.push({
      id,
      title,
      body,
      kind,
      createdAt: new Date().toISOString(),
      read: false,
    })
    newDeliveredIds.push(id)
  }

  // 1) Ingen transaksjoner denne måneden (etter dag 10)
  if (!householdBlocked && day >= 10 && !txInMonth(txs, ym)) {
    const id = `insight:no-tx:${ym}`
    mark(
      id,
      'Ingen transaksjoner denne måneden',
      'Du har ikke registrert utgifter eller inntekter i inneværende måned ennå. Et lite oppdatert bilde hjelper budsjett og oversikt.',
      'insight',
    )
  }

  // 2) Budsjettkategori nær tak (én per måned)
  if (!householdBlocked && person && input.budgetYear === y) {
    const near = expenseBudgetRatioForCategory(person, y, m)
    if (near && near.ratio >= 0.9) {
      const id = `insight:budget-near:${near.categoryId}:${ym}`
      mark(
        id,
        'Budsjettet er stramt i en kategori',
        `«${near.name}» er opp mot eller over det budsjetterte denne måneden (${Math.round(near.ratio * 100)} % av plan). Sjekk transaksjoner eller juster planen om det trengs.`,
        'insight',
      )
    }
  }

  // 3) Gjeld: pause slutter snart
  for (const d of person?.debts ?? []) {
    const end = parsePauseEnd(d)
    if (end == null) continue
    const days = (end - Date.now()) / (86400 * 1000)
    if (days >= 0 && days <= 14) {
      const id = `insight:debt-pause:${d.id}:${ym}`
      mark(
        id,
        'Avdragspause går ut snart',
        `For «${d.name}» er avdragspause satt til å gå ut rundt ${d.pauseEndDate}. Sjekk at tallene i Gjeld stemmer etter dette.`,
        'insight',
      )
    }
  }

  // 4) Snøball: lite igjen på et lån
  for (const d of person?.debts ?? []) {
    if (d.repaymentPaused) continue
    if (d.remainingAmount > 0 && d.monthlyPayment > 0 && d.remainingAmount <= d.monthlyPayment * 2) {
      const id = `insight:debt-nearly-paid:${d.id}:${ym}`
      mark(
        id,
        'Nesten ferdig med et lån',
        `«${d.name}» har lav restgjeld sammenlignet med månedlig betaling. Neste steg kan være å oppdatere Gjeld og eventuelt snøballrekkefølgen.`,
        'insight',
      )
    }
  }

  // 5) Onboarding fortsatt pending (én gang)
  if (input.onboarding.status === 'pending') {
    const id = 'insight:onboarding-pending'
    mark(
      id,
      'Fullfør oppstarten',
      'Startveiledningen er ikke fullført. Åpne Min konto → Innstillinger og velg «Vis veiledningen på nytt», eller fullfør stegene når det passer.',
      'insight',
    )
  }

  // 6) Sparemål med koblet kategori — lite aktivitet (forenklet)
  for (const g of person?.savingsGoals ?? []) {
    if (!g.linkedBudgetCategoryId) continue
    const cat = person.budgetCategories.find((c) => c.id === g.linkedBudgetCategoryId)
    if (!cat) continue
    const recent = txs.filter(
      (t) =>
        t.type === 'expense' &&
        t.category === cat.name &&
        t.date &&
        new Date(t.date).getTime() > Date.now() - 35 * 86400000,
    )
    if (recent.length === 0) {
      const id = `insight:savings-quiet:${g.id}:${ym}`
      mark(
        id,
        'Sparing uten registrerte innskudd nylig',
        `For sparemålet «${g.name}» ser vi få eller ingen transaksjoner i den koblede kategorien siste uker. Registrer innskudd, eller juster koblingen om den ikke brukes.`,
        'insight',
      )
    }
  }

  return { toAdd, newDeliveredIds }
}
