import { NextResponse } from 'next/server'
import { getVisitCount } from '@/lib/services/visit-counter-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const count = await getVisitCount()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
