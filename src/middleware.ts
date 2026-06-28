import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const canonicalRedirect = getCanonicalRedirect(request)

  if (canonicalRedirect) {
    return canonicalRedirect
  }

  // Public pages
  if (
    pathname === '/' ||
    pathname.startsWith('/login')
  ) {
    return NextResponse.next()
  }

  // Public APIs
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/images') ||
    pathname.startsWith('/api/image/') ||
    pathname.startsWith('/api/random') ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/api/timeline') ||
    pathname.startsWith('/api/visit') ||
    pathname.startsWith('/api/pixiv/proxy')
  ) {
    return NextResponse.next()
  }

  const requiresAuth = pathname.startsWith('/dashboard')
    || pathname.startsWith('/admin')
    || pathname === '/api/upload'
    || pathname.startsWith('/api/user/')
    || pathname.startsWith('/api/admin/')

  if (!requiresAuth) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request })
  if (!token?.login) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

function getCanonicalRedirect(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'production') return null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) return null

  let canonical: URL
  try {
    canonical = new URL(siteUrl)
  } catch {
    return null
  }

  const currentHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
  if (!currentHost || currentHost === canonical.host) {
    return null
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return null
  }

  const target = request.nextUrl.clone()
  target.protocol = canonical.protocol
  target.host = canonical.host
  return NextResponse.redirect(target, 308)
}
