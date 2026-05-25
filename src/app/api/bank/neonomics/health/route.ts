import { NextResponse } from 'next/server'
import { isNeonomicsServerEnabled } from '@/lib/neonomics/feature'
import { getNeonomicsAccessToken } from '@/lib/neonomics/token'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isNeonomicsServerEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    await getNeonomicsAccessToken()
    return NextResponse.json({ ok: true, token: 'ok' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Token failed'
    return NextResponse.json({ ok: false, error: msg }, { status: 503 })
  }
}
