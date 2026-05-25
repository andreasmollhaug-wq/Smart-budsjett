import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'
import {
  buildOpenAiMessages,
  fetchAiQuota,
  incrementAiUsageAfterReply,
  resolveMaxOutTokens,
  resolveOpenAiModel,
  resolveOpenAiTemperature,
  usesCompletionTokenLimit,
  type AiIncomingMessage,
} from '@/lib/enkelexcelAiServer'

export const dynamic = 'force-dynamic'

function sseLine(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
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
        error:
          'Manglende OPENAI_API_KEY. Opprett en `.env.local` i prosjektroten og legg inn `OPENAI_API_KEY=...`, eller sett variabelen i Vercel.',
      },
      { status: 503 },
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

  const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: built.openaiMessages,
      temperature,
      stream: true,
      ...(useCompletionTokenLimit
        ? { max_completion_tokens: maxOutTokens }
        : { max_tokens: maxOutTokens }),
    }),
  })

  if (!openaiResp.ok || !openaiResp.body) {
    const errText = await openaiResp.text().catch(() => '')
    return NextResponse.json(
      { error: errText || `OpenAI API error (${openaiResp.status})` },
      { status: openaiResp.status },
    )
  }

  const encoder = new TextEncoder()
  let fullReply = ''

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openaiResp.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const payload = trimmed.slice(5).trim()
            if (payload === '[DONE]') continue
            try {
              const parsed = JSON.parse(payload) as {
                choices?: { delta?: { content?: string | null } }[]
              }
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                fullReply += delta
                controller.enqueue(encoder.encode(sseLine({ delta })))
              }
            } catch {
              /* ignore partial json */
            }
          }
        }

        const reply = fullReply.trim() || 'dottir AI sendte ingen tekst.'
        const usageResult = await incrementAiUsageAfterReply(
          supabase,
          usedBefore,
          limit,
          bonusBefore,
        )

        if (!usageResult.ok) {
          controller.enqueue(encoder.encode(sseLine({ error: usageResult.error })))
        } else {
          controller.enqueue(encoder.encode(sseLine({ done: true, usage: usageResult.usage })))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Streaming feilet'
        controller.enqueue(encoder.encode(sseLine({ error: msg })))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
