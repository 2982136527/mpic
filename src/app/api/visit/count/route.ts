import { NextResponse } from 'next/server'
import { getVisitCount } from '@/lib/services/visit-counter-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const count = getVisitCount()
  return NextResponse.json({ count })
}
