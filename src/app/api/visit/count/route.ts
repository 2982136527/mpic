import { NextResponse } from 'next/server'
import { getPageViewCount } from '@/lib/services/vercel-analytics-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const count = await getPageViewCount()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: null })
  }
}
