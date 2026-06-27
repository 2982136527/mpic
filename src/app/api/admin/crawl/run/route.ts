import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { runCrawl } from '@/lib/services/crawl-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function POST(request: NextRequest) {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const result = await runCrawl(true)

    // Self-trigger next run if there's more to crawl
    if (result.shouldContinue) {
      const cronSecret = process.env.CRON_SECRET
      const baseUrl = new URL(request.url).origin
      fetch(`${baseUrl}/api/cron/crawl`, {
        headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
      }).catch(() => {})
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
