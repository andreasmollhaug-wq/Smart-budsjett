import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ChatRole = 'user' | 'assistant'

type IncomingMessage = {
  role: ChatRole
  content: string
}

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

  const body = (await req.json().catch(() => null)) as
    | { messages?: IncomingMessage[] }
    | null
  const messages = body?.messages ?? []

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        reply:
          'Manglende ANTHROPIC_API_KEY. Opprett en `.env.local` i prosjektroten og legg inn `ANTHROPIC_API_KEY=...`.',
      },
      { status: 200 },
    )
  }

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest'

  // Convert our chat format into Anthropic's expected `messages` format.
  const anthropicMessages = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role,
      content: [{ type: 'text', text: m.content }],
    }))

  const system = [
    'Du er en nyttig økonomiassistent for en app som hjelper brukere med budsjett, sparing og gjeld.',
    'Skriv på norsk.',
    'Still korte oppklaringsspørsmål når det trengs for å gi et bedre svar.',
  ].join('\n')

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system,
      max_tokens: 800,
      temperature: 0.2,
      messages: anthropicMessages,
    }),
  })

  const data: any = await resp.json().catch(() => null)

  if (!resp.ok) {
    const msg = data?.error?.message ?? `Claude API error (${resp.status})`
    return NextResponse.json({ error: msg }, { status: resp.status })
  }

  const reply =
    Array.isArray(data?.content) && data.content.length > 0
      ? data.content
          .filter((c: any) => c?.type === 'text' && typeof c.text === 'string')
          .map((c: any) => c.text)
          .join('')
      : null

  return NextResponse.json(
    { reply: reply ?? 'EnkelExcel AI sendte ingen tekst.' },
    { status: 200 },
  )
}

