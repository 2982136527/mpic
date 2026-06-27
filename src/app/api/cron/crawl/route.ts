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

    // Self-trigger next run if there's more to crawl
    if (result.shouldContinue && cronSecret) {
      const baseUrl = new URL(request.url).origin
      fetch(`${baseUrl}/api/cron/crawl`, {
        headers: { Authorization: `Bearer ${cronSecret}` },
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, fetched: result.fetched, duplicates: result.duplicates, errors: result.errors })
  } catch (error) {
    console.error('[api][cron][crawl]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
