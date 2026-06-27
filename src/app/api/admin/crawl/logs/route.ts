import { requireAdminSession } from '@/lib/api/session'
import { getCrawlLogs } from '@/lib/services/crawl-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET() {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const logs = await getCrawlLogs()
    return ok(requestId, { logs })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][crawl][logs][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load crawl logs')
  }
}
