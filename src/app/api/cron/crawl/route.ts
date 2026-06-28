import { NextResponse } from 'next/server'
import { runCrawl } from '@/lib/services/crawl-service'
import { scheduleNextCrawl } from '@/lib/crawl/continuation'

export const maxDuration = 300

export async function GET(request: Request) {
  // Verify cron secret from Vercel
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runCrawl()

    // Continue in-process within the current function budget.
    if (result.shouldContinue) {
      scheduleNextCrawl({ logPrefix: '[api][cron][crawl][continue]' })
    }

    return NextResponse.json({ ok: true, fetched: result.fetched, duplicates: result.duplicates, errors: result.errors })
  } catch (error) {
    console.error('[api][cron][crawl]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
