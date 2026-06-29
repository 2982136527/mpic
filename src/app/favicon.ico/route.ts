import { NextRequest, NextResponse } from 'next/server'

function redirectToIcon(request: NextRequest) {
  return NextResponse.redirect(new URL('/icon.svg', request.url), {
    status: 308,
  })
}

export function GET(request: NextRequest) {
  return redirectToIcon(request)
}

export function HEAD(request: NextRequest) {
  return redirectToIcon(request)
}
