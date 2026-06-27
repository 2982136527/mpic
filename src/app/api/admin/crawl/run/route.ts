import { requireAdminSession } from '@/lib/api/session'
import { runCrawl } from '@/lib/services/crawl-service'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function POST() {
  const requestId = createRequestId()

  try {
    const { login } = await requireAdminSession()

    const result = await runCrawl(true)

    await appendLog({
      action: 'crawl.manual_run',
      actorLogin: login,
      detail: `fetched=${result.fetched} duplicates=${result.duplicates} errors=${result.errors}`,
    })

    return ok(requestId, { result })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][crawl][run][POST]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to run crawl')
  }
}
