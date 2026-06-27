import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const pathname = request.nextUrl.pathname

  // Public routes - always allow
  if (
    pathname === '/' ||
    pathname.startsWith('/api/images') ||
    pathname.startsWith('/api/image/') ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/login')
  ) {
    return NextResponse.next()
  }

  // Protected routes - require auth
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
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/upload', '/api/user/:path*', '/api/admin/:path*'],
}
