import { NextResponse } from 'next/server'
import { AI_APP_HELP_TEXT } from '@/lib/aiAppHelp'
import { buildAiUserContextFromPersistedState } from '@/lib/aiUserContext'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'
import { currentYearMonthOslo, getMonthlyMessageLimit } from '@/lib/aiUsage'

type ChatRole = 'user' | 'assistant'

type IncomingMessage = {
  role: ChatRole
  content: string
}

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT_BASE = [
  'Du er en nyttig økonomiassistent for en app som hjelper brukere med budsjett, sparing og gjeld.',
  'Skriv på norsk.',
  'Still korte oppklaringsspørsmål når det trengs for å gi et bedre svar.',
  'Struktur i denne systemmeldingen: først denne instruksen, deretter en bruksveiledning for Smart Budsjett (menyer og funksjoner), til slutt brukerens faktiske tall (tekstblokk fra appen).',
  'Spørsmål om hvordan appen brukes skal besvares ut fra bruksveiledningen. Ikke finn opp menypunkter, faner eller knapper som ikke er beskrevet der.',
  'Bruk tallblokken under til å svare presist der det er relevant. Ikke gjett beløp, kategorier eller transaksjoner som ikke står der.',
  'Tallene følger profilvelgeren i appen: én profil eller samlet husholdning når det er valgt (Familie med flere profiler). I husholdningsmodus er like budsjettkategorinavn summert på tvers av profiler; linjer med profilfelt er merket med hvem de gjelder. Tjenesteabonnementer i husholdningsmodus inkluderer en tabell per profil og står før transaksjonslisten.',
  'Tekstblokken kan være avkortet ved svært stor datamengde (øvre tegngrense). Ikke anta at noe finnes bare fordi brukeren nevner det — bare det som står i teksten teller.',
  'Chatgrensesnittet viser ren tekst uten Markdown. Ikke bruk **, _, #, kodeblokker eller annen Markdown — bruk vanlige avsnitt, linjeskift og punktlister med bindestrek eller nummer.',
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

  const limit = getMonthlyMessageLimit()
  const month = currentYearMonthOslo()

  const [{ data: usageRow, error: usageErr }, { data: bonusRow, error: bonusErr }] =
    await Promise.all([
      supabase
        .from('ai_monthly_usage')
        .select('message_count')
        .eq('user_id', user.id)
        .eq('year_month', month)
        .maybeSingle(),
      supabase.from('user_ai_bonus_credits').select('credits').eq('user_id', user.id).maybeSingle(),
    ])

  if (usageErr) {
    return NextResponse.json({ error: usageErr.message }, { status: 500 })
  }
  if (bonusErr) {
    return NextResponse.json({ error: bonusErr.message }, { status: 500 })
  }

  const usedBefore = usageRow?.message_count ?? 0
  const bonusBefore = bonusRow?.credits ?? 0

  if (usedBefore >= limit && bonusBefore <= 0) {
    return NextResponse.json(
      {
        error:
          'Du har brukt alle inkluderte meldinger denne måneden og har ingen ekstra meldinger igjen. Du kan kjøpe flere eller prøve igjen neste måned.',
        usage: { used: usedBefore, limit, bonusCredits: 0 },
      },
      { status: 429 },
    )
  }

  const body = (await req.json().catch(() => null)) as
    | { messages?: IncomingMessage[] }
    | null
  const messages = body?.messages ?? []

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        reply:
          'Manglende OPENAI_API_KEY. Opprett en `.env.local` i prosjektroten og legg inn `OPENAI_API_KEY=...`, eller sett variabelen i Vercel.',
      },
      { status: 200 },
    )
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

  const useCompletionTokenLimit = /^gpt-5/i.test(model) || /^o[0-9]/i.test(model)

  const thread = messages.filter(
    (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
  )

  const { data: appStateRow, error: appStateErr } = await supabase
    .from('user_app_state')
    .select('state')
    .eq('user_id', user.id)
    .maybeSingle()

  if (appStateErr) {
    console.error('[enkelexcel-ai] user_app_state:', appStateErr.message)
  }

  let financeContext: string
  try {
    financeContext = buildAiUserContextFromPersistedState(appStateRow?.state)
  } catch (e) {
    console.error('[enkelexcel-ai] buildAiUserContextFromPersistedState', e)
    financeContext =
      'Økonomidata fra appen kunne ikke leses inn (teknisk feil). Du kan fortsatt stille generelle spørsmål.'
  }

  const systemContent = [SYSTEM_PROMPT_BASE, AI_APP_HELP_TEXT, financeContext].join('\n\n')

  const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemContent },
    ...thread.map((m) => ({ role: m.role, content: m.content })),
  ]

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      temperature: 0.2,
      ...(useCompletionTokenLimit ? { max_completion_tokens: 800 } : { max_tokens: 800 }),
    }),
  })

  type OpenAIErrorShape = { error?: { message?: string } }
  type OpenAIChoice = { message?: { content?: string | null } }
  type OpenAIOkShape = { choices?: OpenAIChoice[] }

  const data = (await resp.json().catch(() => null)) as (OpenAIErrorShape & OpenAIOkShape) | null

  if (!resp.ok) {
    const msg = data?.error?.message ?? `OpenAI API error (${resp.status})`
    return NextResponse.json({ error: msg }, { status: resp.status })
  }

  const reply = data?.choices?.[0]?.message?.content?.trim() ?? null

  const usageSnapshot = (b: number) => ({
    used: usedBefore,
    limit,
    bonusCredits: b,
  })

  if (!reply) {
    return NextResponse.json({
      reply: 'EnkelExcel AI sendte ingen tekst.',
      usage: usageSnapshot(bonusBefore),
    })
  }

  const useIncludedMonthly = usedBefore < limit

  if (useIncludedMonthly) {
    const { data: incData, error: incErr } = await supabase.rpc('increment_ai_monthly_usage')

    if (incErr) {
      return NextResponse.json(
        { error: `Kunne ikke oppdatere bruk: ${incErr.message}` },
        { status: 500 },
      )
    }

    const inc = incData as { message_count?: number } | null
    const usedAfter =
      typeof inc?.message_count === 'number' ? inc.message_count : usedBefore + 1

    return NextResponse.json({
      reply,
      usage: { used: usedAfter, limit, bonusCredits: bonusBefore },
    })
  }

  const { data: decData, error: decErr } = await supabase.rpc('decrement_ai_bonus_credit')

  if (decErr) {
    return NextResponse.json(
      { error: `Kunne ikke oppdatere bruk: ${decErr.message}` },
      { status: 500 },
    )
  }

  const dec = decData as { credits_remaining?: number } | null
  const bonusAfter =
    typeof dec?.credits_remaining === 'number' ? dec.credits_remaining : bonusBefore - 1

  return NextResponse.json({
    reply,
    usage: { used: usedBefore, limit, bonusCredits: bonusAfter },
  })
}
