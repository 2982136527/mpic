import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { runCrawl } from '@/lib/services/crawl-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'
import { scheduleNextCrawl } from '@/lib/crawl/continuation'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const result = await runCrawl(true)

    // Self-trigger next run if there's more to crawl
    if (result.shouldContinue) {
      const cronSecret = process.env.CRON_SECRET
      scheduleNextCrawl(request.url, cronSecret, '[api][admin][crawl][run][continue]')
    }

    return ok(requestId, { result: { fetched: result.fetched, duplicates: result.duplicates, errors: result.errors } })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][crawl][run][POST]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to run crawl')
  }
}
