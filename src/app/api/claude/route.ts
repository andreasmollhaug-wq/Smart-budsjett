import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  /** GPT-5.x / reasoning-modeller krever max_completion_tokens; eldre bruker max_tokens. */
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

  return NextResponse.json(
    { reply: reply ?? 'EnkelExcel AI sendte ingen tekst.' },
    { status: 200 },
  )
}
