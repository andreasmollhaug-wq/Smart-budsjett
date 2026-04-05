import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { currentYearMonthOslo, getMonthlyMessageLimit } from '@/lib/aiUsage'

type ChatRole = 'user' | 'assistant'

type IncomingMessage = {
  role: ChatRole
  content: string
}

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = [
  'Du er en nyttig økonomiassistent for en app som hjelper brukere med budsjett, sparing og gjeld.',
  'Skriv på norsk.',
  'Still korte oppklaringsspørsmål når det trengs for å gi et bedre svar.',
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

  const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
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
