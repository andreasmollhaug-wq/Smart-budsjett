import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'
import { currentYearMonthOslo, getMonthlyMessageLimit } from '@/lib/aiUsage'
import { BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST } from '@/lib/bankImport/bankImport.constants'

export const dynamic = 'force-dynamic'

type SuggestKey = {
  key: string
  kind: 'income' | 'expense'
  forklaring: string
}

function resolveOpenAiTemperature(): number {
  const raw = process.env.OPENAI_TEMPERATURE
  if (raw == null || raw.trim() === '') return 0.12
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 2) return 0.12
  return n
}

const SYSTEM_PROMPT = [
  'Du hjelper med å foreslå budsjettkategori for banktransaksjoner i appen Dottir.',
  'Svar KUN med kompakt JSON-objekt, ingen markdown, ingen forklarende tekst rundt.',
  'Nøyaktig dette skjemaet: {"suggestions":[{"key":"<eksakt key fra forespørselen>","category":"<kategorinavn fra riktig liste eller null>"}]}',
  'Hver "key" må være nøyaktig lik en key du fikk. Ikke endre, forkorte eller normalisere key.',
  'Velg "category" kun fra listen som matcher radens kind (inntekt vs utgift). Bruk null når du er usikker.',
  'Ikke finn opp kategorinavn som ikke står. Bruk maks ett kategorinavn per key.',
].join('\n')

function stripJsonFromAssistantText(raw: string): string {
  const t = raw.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m
  const m = t.match(fence)
  if (m?.[1]) return m[1].trim()
  return t
}

function parseSuggestionsPayload(
  text: string,
): { key: string; category: string | null }[] | null {
  const inner = stripJsonFromAssistantText(text)
  try {
    const o = JSON.parse(inner) as unknown
    if (!o || typeof o !== 'object') return null
    const arr = (o as { suggestions?: unknown }).suggestions
    if (!Array.isArray(arr)) return null
    const out: { key: string; category: string | null }[] = []
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue
      const key = (item as { key?: unknown }).key
      const cat = (item as { category?: unknown }).category
      if (typeof key !== 'string' || !key.trim()) continue
      if (cat === null) {
        out.push({ key: key.trim(), category: null })
        continue
      }
      if (typeof cat === 'string') {
        const c = cat.trim()
        out.push({ key: key.trim(), category: c ? c : null })
      }
    }
    return out
  } catch {
    return null
  }
}

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
    | {
        keys?: SuggestKey[]
        incomeCategories?: string[]
        expenseCategories?: string[]
      }
    | null

  const keysIn = Array.isArray(body?.keys) ? body!.keys! : []
  const incomeAllow = new Set(
    (Array.isArray(body?.incomeCategories) ? body!.incomeCategories! : [])
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim())
      .filter(Boolean),
  )
  const expenseAllow = new Set(
    (Array.isArray(body?.expenseCategories) ? body!.expenseCategories! : [])
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim())
      .filter(Boolean),
  )

  if (keysIn.length === 0) {
    return NextResponse.json({ suggestions: [], usage: { used: usedBefore, limit, bonusCredits: bonusBefore } })
  }

  if (keysIn.length > BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST) {
    return NextResponse.json(
      {
        error: `For mange typer i ett KI-kall (maks ${BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST}).`,
      },
      { status: 400 },
    )
  }

  const requestKeySet = new Set<string>()
  for (const k of keysIn) {
    if (!k || typeof k.key !== 'string' || !k.key.trim()) continue
    if (k.kind !== 'income' && k.kind !== 'expense') continue
    requestKeySet.add(k.key.trim())
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Manglende OPENAI_API_KEY. KI-forslag er ikke tilgjengelig i denne miljøkonfigurasjonen.',
      },
      { status: 503 },
    )
  }

  const userPayload = {
    keys: keysIn
      .filter((k) => k && typeof k.key === 'string' && (k.kind === 'income' || k.kind === 'expense'))
      .map((k) => ({
        key: k.key.trim(),
        kind: k.kind,
        forklaring: typeof k.forklaring === 'string' ? k.forklaring.trim() : '',
      })),
    incomeCategories: [...incomeAllow],
    expenseCategories: [...expenseAllow],
  }

  if (userPayload.keys.length === 0) {
    return NextResponse.json({ suggestions: [], usage: { used: usedBefore, limit, bonusCredits: bonusBefore } })
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const temperature = resolveOpenAiTemperature()
  const keyCount = userPayload.keys.length
  /** JSON-svar med mange forslag krever mer plass; skalerer med antall nøkler (inntil modellens tak). */
  const maxOutTokens = Math.min(32_768, Math.max(900, 400 + keyCount * 110))
  const useCompletionTokenLimit = /^gpt-5/i.test(model) || /^o[0-9]/i.test(model)

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
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
      temperature,
      ...(useCompletionTokenLimit
        ? { max_completion_tokens: maxOutTokens }
        : { max_tokens: maxOutTokens }),
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

  const reply = data?.choices?.[0]?.message?.content?.trim() ?? ''
  const parsed = reply ? parseSuggestionsPayload(reply) : null

  const usageSnapshot = (b: number) => ({
    used: usedBefore,
    limit,
    bonusCredits: b,
  })

  if (!parsed || parsed.length === 0) {
    return NextResponse.json({
      suggestions: [],
      usage: usageSnapshot(bonusBefore),
      warning: reply ? 'Klarte ikke å tolke modellens svar som JSON.' : 'Tomt svar fra modell.',
    })
  }

  const validated: { key: string; category: string | null }[] = []
  const seen = new Set<string>()
  for (const row of parsed) {
    if (!requestKeySet.has(row.key) || seen.has(row.key)) continue
    seen.add(row.key)
    const original = keysIn.find((k) => k.key.trim() === row.key)
    if (!original || (original.kind !== 'income' && original.kind !== 'expense')) continue
    if (row.category === null) {
      validated.push({ key: row.key, category: null })
      continue
    }
    const allow = original.kind === 'income' ? incomeAllow : expenseAllow
    if (allow.has(row.category)) {
      validated.push({ key: row.key, category: row.category })
    }
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
      suggestions: validated,
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
    suggestions: validated,
    usage: { used: usedBefore, limit, bonusCredits: bonusAfter },
  })
}
