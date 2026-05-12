import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { safeRedirectPath } from '@/lib/safeRedirectPath'

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.redirect(new URL('/logg-inn?error=config', request.url))
  }

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  /** E-postbekreftelse: sett `emailRedirectTo` til `/auth/callback?next=…` (f.eks. `/konto/betalinger?trial=welcome`). */
  const next = safeRedirectPath(requestUrl.searchParams.get('next'))

  if (!code) {
    const err = requestUrl.searchParams.get('error')
    const errCode = requestUrl.searchParams.get('error_code')
    const errDesc = requestUrl.searchParams.get('error_description')
    if (err || errCode || errDesc) {
      const home = new URL('/', request.url)
      if (err) home.searchParams.set('error', err)
      if (errCode) home.searchParams.set('error_code', errCode)
      if (errDesc) home.searchParams.set('error_description', errDesc)
      return NextResponse.redirect(home)
    }
    return NextResponse.redirect(new URL('/logg-inn?error=missing_code', request.url))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const msg = (error.message ?? '').toLowerCase()
    if (
      msg.includes('expired') ||
      msg.includes('code verifier') ||
      msg.includes('flow state') ||
      msg.includes('pkce')
    ) {
      const home = new URL('/', request.url)
      home.searchParams.set('error', 'access_denied')
      home.searchParams.set('error_code', 'otp_expired')
      home.searchParams.set(
        'error_description',
        'Email lenke er ugyldig eller utløpt. Be om ny lenke under Glemt passord.',
      )
      return NextResponse.redirect(home)
    }
    return NextResponse.redirect(new URL('/logg-inn?error=session', request.url))
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
