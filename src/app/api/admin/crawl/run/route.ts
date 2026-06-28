import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { runCrawl } from '@/lib/services/crawl-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    let force = false
    try {
      const body = await request.json()
      force = body?.force === true
    } catch {
      // Allow empty body for simple trigger requests.
    }
    const result = await runCrawl(force)

    return ok(requestId, {
      result: {
        fetched: result.fetched,
        duplicates: result.duplicates,
        errors: result.errors,
        shouldContinue: result.shouldContinue,
      },
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][crawl][run][POST]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to run crawl')
  }
}
