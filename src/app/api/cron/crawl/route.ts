import { NextResponse } from 'next/server'
import { runCrawl } from '@/lib/services/crawl-service'

export async function GET(request: Request) {
  // Verify cron secret from Vercel
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runCrawl()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[api][cron][crawl]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
