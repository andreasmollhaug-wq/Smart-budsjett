import { type NextRequest, NextResponse } from 'next/server'
import { currentCalendarYearMonthOslo } from '@/lib/aiUsage'
import {
  SMARTVANE_YM_COOKIE,
  parseYmCookie,
  parseYmFromQuery,
  serializeYmCookie,
  smartvaneYmCookieOptions,
} from '@/features/smartvane/smartvaneMonthCookie'

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    /** Én-arg `set` bevarer path/httpOnly/sameSite m.m. — viktig for Supabase ved redirect. */
    to.cookies.set(c)
  })
}

/**
 * Synker `/smartvane/maned` og `/smartvane/insikt` med kanonisk `?y=&m=`:
 * - Gyldig query → lagrer i cookie (siste valgte måned).  
 * - Mangler/ugyldig query → redirect til cookie eller inneværende måned i **Europe/Oslo** (samme som AI-kvote).
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
  const target = fromCookie ?? currentCalendarYearMonthOslo()

  const url = request.nextUrl.clone()
  url.searchParams.set('y', String(target.year))
  url.searchParams.set('m', String(target.month))

  const redirect = NextResponse.redirect(url)
  copyResponseCookies(supabaseResponse, redirect)
  redirect.cookies.set(SMARTVANE_YM_COOKIE, serializeYmCookie(target), smartvaneYmCookieOptions)
  return redirect
}
