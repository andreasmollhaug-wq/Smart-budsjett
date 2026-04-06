import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/iris') return true
  if (pathname.startsWith('/personvern')) return true
  if (pathname.startsWith('/vilkar')) return true
  if (pathname.startsWith('/logg-inn')) return true
  if (pathname.startsWith('/registrer')) return true
  if (pathname.startsWith('/auth')) return true
  return false
}

function isAuthOnlyPath(pathname: string): boolean {
  return pathname.startsWith('/logg-inn') || pathname.startsWith('/registrer')
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.get('ref') === 'iris') {
    return NextResponse.redirect(new URL('/iris', request.url))
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    const pathname = request.nextUrl.pathname
    if (!isPublicPath(pathname)) {
      return NextResponse.redirect(new URL('/logg-inn?error=config', request.url))
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (isPublicPath(pathname)) {
    if (user && isAuthOnlyPath(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  if (!user) {
    const redirectUrl = new URL('/logg-inn', request.url)
    redirectUrl.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
