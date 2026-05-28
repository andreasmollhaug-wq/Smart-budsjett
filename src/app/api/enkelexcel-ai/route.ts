import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'
import { extractToolCallFromCompletion } from '@/lib/dottirAiActions/openAiTools'
import {
  buildOpenAiMessages,
  fetchAiQuota,
  getOpenAiFinanceTools,
  incrementAiUsageAfterReply,
  lastUserMessageContent,
  resolveFinanceActionFromTool,
  resolveMaxOutTokens,
  resolveOpenAiModel,
  resolveOpenAiTemperature,
  usesCompletionTokenLimit,
  type AiIncomingMessage,
} from '@/lib/enkelexcelAiServer'

export const dynamic = 'force-dynamic'

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

  const quota = await fetchAiQuota(supabase, user.id)
  if (!quota.ok) {
    return NextResponse.json({ error: quota.error }, { status: quota.status })
  }

  const { usedBefore, bonusBefore, limit } = quota

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

  const body = (await req.json().catch(() => null)) as { messages?: AiIncomingMessage[] } | null
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

  const built = await buildOpenAiMessages(supabase, user.id, messages)
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: built.status })
  }

  const model = resolveOpenAiModel()
  const temperature = resolveOpenAiTemperature()
  const maxOutTokens = resolveMaxOutTokens()
  const useCompletionTokenLimit = usesCompletionTokenLimit(model)

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: built.openaiMessages,
      temperature,
      tools: getOpenAiFinanceTools(),
      tool_choice: 'auto',
      ...(useCompletionTokenLimit
        ? { max_completion_tokens: maxOutTokens }
        : { max_tokens: maxOutTokens }),
    }),
  })

  type OpenAIErrorShape = { error?: { message?: string } }
  type OpenAIChoice = {
    message?: {
      content?: string | null
      tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>
    }
  }
  type OpenAIOkShape = { choices?: OpenAIChoice[] }

  const data = (await resp.json().catch(() => null)) as (OpenAIErrorShape & OpenAIOkShape) | null

  if (!resp.ok) {
    const msg = data?.error?.message ?? `OpenAI API error (${resp.status})`
    return NextResponse.json({ error: msg }, { status: resp.status })
  }

  const message = data?.choices?.[0]?.message
  const reply = message?.content?.trim() ?? null
  const rawTool = message ? extractToolCallFromCompletion(message) : null
  const action = resolveFinanceActionFromTool(
    rawTool,
    built.persistedState,
    lastUserMessageContent(messages),
  )

  const usageResult = await incrementAiUsageAfterReply(supabase, usedBefore, limit, bonusBefore)
  if (!usageResult.ok) {
    return NextResponse.json({ error: usageResult.error }, { status: usageResult.status })
  }

  if (!reply && !action) {
    return NextResponse.json({
      reply: 'dottir AI sendte ingen tekst.',
      usage: usageResult.usage,
    })
  }

  return NextResponse.json({
    reply: reply ?? 'Jeg har laget et forslag du kan bekrefte nedenfor.',
    usage: usageResult.usage,
    ...(action ? { action } : {}),
  })
}
