import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { getCrawlConfig, updateCrawlConfig } from '@/lib/services/crawl-service'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET() {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const config = await getCrawlConfig()
    return ok(requestId, { config })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][crawl][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load crawl config')
  }
}

export async function PUT(request: NextRequest) {
  const requestId = createRequestId()

  try {
    const { login } = await requireAdminSession()
    const body = await request.json()

    const config = await updateCrawlConfig(body)

    await appendLog({
      action: 'update_crawl_config',
      actorLogin: login,
      detail: JSON.stringify(body),
    })

    return ok(requestId, { config })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][crawl][PUT]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to update crawl config')
  }
}
