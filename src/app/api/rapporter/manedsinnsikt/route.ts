import { NextResponse } from 'next/server'
import { isPersistedAppSlice, profileNamesMapFromSlice, resolvePersonDataForAi } from '@/lib/aiUserContext'
import {
  buildMonthlyInsightPayload,
  formatMonthlyInsightContextForAi,
  type MonthlyInsightPayload,
} from '@/lib/monthlyInsightCompute'
import { currentYearMonthOslo } from '@/lib/aiUsage'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'

export const dynamic = 'force-dynamic'

/** Kvotestatus for inneværende kalendermåned (Oslo) — brukes i UI. */
export async function GET() {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: 'Serverkonfigurasjon mangler.' }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  const subStatus = await fetchUserSubscriptionStatus(supabase, user.id)
  const denied = subscriptionForbiddenUnlessAccess(subStatus)
  if (denied) return denied

  const ym = currentYearMonthOslo()
  const { data: row, error } = await supabase
    .from('monthly_insight_usage')
    .select('year_month')
    .eq('user_id', user.id)
    .eq('year_month', ym)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    yearMonth: ym,
    used: row != null,
  })
}

const SYSTEM_PROMPT = [
  'Du skriver et kort månedsinnsikt for Smart Budsjett på norsk.',
  'Du får strukturerte tall og transaksjoner nedenfor — de er sannhetskilde. Ikke finn opp beløp, prosenter eller transaksjoner som ikke står der.',
  'Forklar kort hovedtrekkene: inntekt og kostnader mot budsjett, netto, og om faktiske kostnader i måneden er over eller under snittet hittil i år når det er oppgitt.',
  'Nevn de viktigste avvikene (over/under budsjett) og om noen store enkelttransaksjoner kan forklare utslag (f.eks. vedlikehold, ikke gjett utover det som står i listen).',
  'Hold deg til 4–8 korte avsnitt eller punktlister med bindestrek. Ingen Markdown: ikke **, _, # eller kodeblokker.',
  'Avslutt med én setning om at dette er automatisert hjelp i appen, ikke personlig økonomisk rådgivning.',
].join('\n')

export async function POST(req: Request) {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: 'Serverkonfigurasjon mangler.' }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  const subStatus = await fetchUserSubscriptionStatus(supabase, user.id)
  const denied = subscriptionForbiddenUnlessAccess(subStatus)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as { year?: unknown; monthIndex?: unknown } | null
  const year = typeof body?.year === 'number' && Number.isFinite(body.year) ? body.year : NaN
  const monthIndex =
    typeof body?.monthIndex === 'number' && Number.isFinite(body.monthIndex) ? body.monthIndex : NaN
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Ugyldig år.' }, { status: 400 })
  }
  if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return NextResponse.json({ error: 'Ugyldig måned.' }, { status: 400 })
  }

  const { data: appStateRow, error: appStateErr } = await supabase
    .from('user_app_state')
    .select('state')
    .eq('user_id', user.id)
    .maybeSingle()

  if (appStateErr) {
    return NextResponse.json({ error: appStateErr.message }, { status: 500 })
  }

  const raw = appStateRow?.state
  if (!isPersistedAppSlice(raw)) {
    return NextResponse.json({ error: 'Fant ikke lagret appdata.' }, { status: 400 })
  }

  const { person, scopeLabel, isHouseholdAggregate } = resolvePersonDataForAi(raw)
  const profileNamesById = profileNamesMapFromSlice(raw)
  const txs = person.transactions ?? []
  const cats = person.budgetCategories ?? []

  let payload: MonthlyInsightPayload
  try {
    payload = buildMonthlyInsightPayload(txs, cats, year, monthIndex, scopeLabel, {
      isHouseholdAggregate,
      profileNamesById,
      people: raw.people,
      labelLists: {
        customBudgetLabels: person.customBudgetLabels ?? {},
        hiddenBudgetLabels: person.hiddenBudgetLabels ?? {},
      },
    })
  } catch (e) {
    console.error('[manedsinnsikt] buildMonthlyInsightPayload', e)
    return NextResponse.json({ error: 'Kunne ikke beregne månedsinnsikt.' }, { status: 500 })
  }

  const { data: quotaData, error: quotaErr } = await supabase.rpc('try_insert_monthly_insight_generation')
  if (quotaErr) {
    return NextResponse.json({ error: quotaErr.message }, { status: 500 })
  }

  const quota = quotaData as { ok?: boolean; year_month?: string; error?: string } | null
  const quotaYm = typeof quota?.year_month === 'string' ? quota.year_month : null
  if (!quota?.ok) {
    return NextResponse.json(
      {
        error:
          'Du har allerede generert månedsinnsikt med AI denne kalendermåneden. Neste mulighet er neste måned, eller når kjøp av ekstra genereringer blir tilgjengelig.',
        code: 'monthly_insight_quota',
        quotaYearMonth: quotaYm,
      },
      { status: 429 },
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    if (quotaYm) {
      await supabase.rpc('refund_monthly_insight_generation', { p_year_month: quotaYm })
    }
    return NextResponse.json(
      { error: 'Manglende OPENAI_API_KEY på server.' },
      { status: 500 },
    )
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const useCompletionTokenLimit = /^gpt-5/i.test(model) || /^o[0-9]/i.test(model)
  const contextBlock = formatMonthlyInsightContextForAi(payload)
  const userContent = 'Skriv sammendraget basert på dataene under.\n\n' + contextBlock

  let summary: string
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.25,
        ...(useCompletionTokenLimit ? { max_completion_tokens: 1200 } : { max_tokens: 1200 }),
      }),
    })

    type OpenAIErrorShape = { error?: { message?: string } }
    type OpenAIChoice = { message?: { content?: string | null } }
    const data = (await resp.json().catch(() => null)) as (OpenAIErrorShape & { choices?: OpenAIChoice[] }) | null

    if (!resp.ok) {
      const msg = data?.error?.message ?? `OpenAI API error (${resp.status})`
      if (quotaYm) {
        await supabase.rpc('refund_monthly_insight_generation', { p_year_month: quotaYm })
      }
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    summary = data?.choices?.[0]?.message?.content?.trim() ?? ''
    if (!summary) {
      if (quotaYm) {
        await supabase.rpc('refund_monthly_insight_generation', { p_year_month: quotaYm })
      }
      return NextResponse.json({ error: 'Ingen tekst fra modellen.' }, { status: 502 })
    }
  } catch (e) {
    console.error('[manedsinnsikt] OpenAI', e)
    if (quotaYm) {
      await supabase.rpc('refund_monthly_insight_generation', { p_year_month: quotaYm })
    }
    return NextResponse.json({ error: 'Kunne ikke kontakte språkmodell.' }, { status: 502 })
  }

  return NextResponse.json({
    payload,
    summary,
    quotaYearMonth: quotaYm,
  })
}
