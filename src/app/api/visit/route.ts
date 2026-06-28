import { NextResponse, type NextRequest } from 'next/server'

export async function POST(_request: NextRequest) {
  return new NextResponse(null, { status: 204 })
}
