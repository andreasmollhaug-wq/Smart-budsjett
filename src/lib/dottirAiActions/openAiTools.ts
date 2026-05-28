export const PROPOSE_FINANCE_ACTION_TOOL = {
  type: 'function' as const,
  function: {
    name: 'propose_finance_action',
    description:
      'Foreslå en konkret endring i brukerens budsjett (plan) eller transaksjon (faktisk). Kalles når brukeren ber om å legge inn, endre eller registrere beløp. Ikke kall i husholdningsmodus. Profil er alltid aktiv visningsprofil.',
    parameters: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ['budget', 'transaction'],
          description: 'budget = planlagt budsjett; transaction = faktisk transaksjon med dato',
        },
        categoryName: {
          type: 'string',
          description: 'Budsjettkategori / transaksjonskategori, f.eks. Strøm eller Mat & dagligvarer',
        },
        parentCategory: {
          type: 'string',
          enum: ['inntekter', 'regninger', 'utgifter', 'gjeld', 'sparing'],
          description: 'Kun for kind=budget',
        },
        amountNok: {
          type: 'number',
          description: 'Beløp i hele kroner, positivt',
        },
        period: {
          type: 'object',
          description: 'Kun for kind=budget',
          properties: {
            mode: {
              type: 'string',
              enum: ['monthly_all', 'single_month', 'month_range', 'months'],
            },
            month: { type: 'number', description: '1-12, for single_month' },
            from: { type: 'number', description: '1-12, for month_range' },
            to: { type: 'number', description: '1-12, for month_range' },
            months: {
              type: 'array',
              items: { type: 'number' },
              description: '1-12, for months',
            },
          },
          required: ['mode'],
        },
        budgetYear: {
          type: 'number',
          description: 'Kun for kind=budget — bruk budsjettår fra tallblokken',
        },
        createLineIfMissing: {
          type: 'boolean',
          description: 'For budget: opprett ny linje hvis den ikke finnes',
        },
        date: {
          type: 'string',
          description: 'Kun for kind=transaction — yyyy-mm-dd',
        },
        description: {
          type: 'string',
          description: 'Kun for kind=transaction — kort beskrivelse',
        },
        type: {
          type: 'string',
          enum: ['income', 'expense'],
          description: 'Kun for kind=transaction',
        },
        subcategory: {
          type: 'string',
          description: 'Valgfri underkategori for transaksjon',
        },
        plannedFollowUp: {
          type: 'boolean',
          description: 'Transaksjon med fremtidig dato — planlagt oppfølging',
        },
      },
      required: ['kind', 'categoryName', 'amountNok'],
    },
  },
}

export const AI_ACTIONS_PROMPT = [
  `DOTTIR AI-HANDLINGER (BUDSJETT OG TRANSAKSJONER)`,
  `- Når brukeren ber deg **legge inn**, **endre**, **sette** eller **registrere** beløp i budsjett eller som transaksjon: kall verktøyet \`propose_finance_action\` **i tillegg** til et kort, naturlig svar på norsk.`,
  `- **Budsjett** (kind=budget): plan — «hver måned», «budsjetter», «planlegg», år uten konkret dato for en enkelthendelse.`,
  `- **Transaksjon** (kind=transaction): faktisk hendelse — «kjøpte», «betalte», «fikk lønn», konkret dato eller «i går»/«i dag».`,
  `- Bruk **parentCategory** riktig (Strøm → regninger, Mat → utgifter, Lønn → inntekter).`,
  `- **budgetYear** og **Visningsmodus** hentes fra tallblokken — ikke gjett.`,
  `- I **husholdningsmodus** (Visningsmodus sier Husholdning): **ikke** kall verktøyet. Forklar at bruker må velge én profil i «Viser data for».`,
  `- **Ikke** foreslå endring for annen profil enn visningsmodus — be om profilbytte i profilvelgeren.`,
  `- Sett \`createLineIfMissing: true\` når brukeren vil legge inn på en linje som ikke finnes (f.eks. ny Strøm-linje).`,
  `- For transaksjoner: standard inntekt er netto (\`incomeIsNet\` utelates). Bruk brutto/trekk kun hvis brukeren sier det eksplisitt.`,
  `- Du **lagrer ikke** selv — brukeren bekrefter i appen. Ikke skriv at endringen allerede er gjort før bekreftelse.`,
  `- Hold brukersvar kort når du kaller verktøyet (1–3 setninger); detaljer vises i bekreftelseskortet.`,
].join('\n')

export type ToolCallAccumulator = {
  id: string
  name: string
  arguments: string
}

export function accumulateToolCallDelta(
  acc: Map<number, ToolCallAccumulator>,
  deltaToolCalls: Array<{
    index?: number
    id?: string
    function?: { name?: string; arguments?: string }
  }>,
): void {
  for (const tc of deltaToolCalls) {
    const idx = tc.index ?? 0
    const existing = acc.get(idx) ?? { id: '', name: '', arguments: '' }
    if (tc.id) existing.id = tc.id
    if (tc.function?.name) existing.name = tc.function.name
    if (tc.function?.arguments) existing.arguments += tc.function.arguments
    acc.set(idx, existing)
  }
}

export function parseToolCallArguments(acc: Map<number, ToolCallAccumulator>): unknown | null {
  for (const tc of acc.values()) {
    if (tc.name !== 'propose_finance_action' || !tc.arguments.trim()) continue
    try {
      return JSON.parse(tc.arguments) as unknown
    } catch {
      return null
    }
  }
  return null
}

export function extractToolCallFromCompletion(message: {
  tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>
}): unknown | null {
  const calls = message.tool_calls ?? []
  for (const tc of calls) {
    if (tc.function?.name === 'propose_finance_action' && tc.function.arguments) {
      try {
        return JSON.parse(tc.function.arguments) as unknown
      } catch {
        return null
      }
    }
  }
  return null
}
