import { type NextRequest, NextResponse } from 'next/server'
import {
  SMARTVANE_YM_COOKIE,
  parseYmCookie,
  parseYmFromQuery,
  serializeYmCookie,
  smartvaneYmCookieOptions,
} from '@/features/smartvane/smartvaneMonthCookie'

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value)
  })
}

/**
 * Synker `/smartvane/maned` og `/smartvane/insikt` med kanonisk `?y=&m=`:
 * - Gyldig query → lagrer i cookie (siste valgte måned).
 * - Mangler/ugyldig query → redirect til cookie eller inneværende måned (samme logikk som bunnnav
 *   når du ikke har valgt måned — men her holder vi også Innsikt i takt med forrige Måned-besøk).
 */
export function applySmartvaneMonthCanonicalUrl(
  request: NextRequest,
  supabaseResponse: NextResponse,
): NextResponse {
  const pathname = request.nextUrl.pathname
  if (pathname !== '/smartvane/maned' && pathname !== '/smartvane/insikt') {
    return supabaseResponse
  }

  const parsed = parseYmFromQuery(
    request.nextUrl.searchParams.get('y'),
    request.nextUrl.searchParams.get('m'),
  )

  if (parsed) {
    supabaseResponse.cookies.set(
      SMARTVANE_YM_COOKIE,
      serializeYmCookie(parsed),
      smartvaneYmCookieOptions,
    )
    return supabaseResponse
  }

  const fromCookie = parseYmCookie(request.cookies.get(SMARTVANE_YM_COOKIE)?.value)
  const now = new Date()
  const target = fromCookie ?? { year: now.getFullYear(), month: now.getMonth() + 1 }

  const url = request.nextUrl.clone()
  url.searchParams.set('y', String(target.year))
  url.searchParams.set('m', String(target.month))

  const redirect = NextResponse.redirect(url)
  copyResponseCookies(supabaseResponse, redirect)
  redirect.cookies.set(SMARTVANE_YM_COOKIE, serializeYmCookie(target), smartvaneYmCookieOptions)
  return redirect
}
