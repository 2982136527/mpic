import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { getCrawlConfig, updateCrawlConfig } from '@/lib/services/crawl-service'
import { wakeCrawlWorkflow } from '@/lib/services/crawl-dispatch-service'
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
    const currentConfig = await getCrawlConfig()
    const changes: Record<string, unknown> = {}
    const wakeRequested = body?.wake === true

    if (typeof body.enabled === 'boolean') {
      changes.enabled = body.enabled
    }
    if (Array.isArray(body.sources)) {
      changes.sources = body.sources
    }

    const config = await updateCrawlConfig(changes)
    let wakeResult: Awaited<ReturnType<typeof wakeCrawlWorkflow>> | null = null

    if (config.enabled && (wakeRequested || currentConfig.enabled !== config.enabled)) {
      wakeResult = await wakeCrawlWorkflow(currentConfig.enabled === config.enabled ? 'admin_wake' : 'admin_enable')
    }

    await appendLog({
      action: 'update_crawl_config',
      actorLogin: login,
      detail: JSON.stringify({
        ...changes,
        ...(wakeRequested ? { wake: true } : {}),
        ...(wakeResult ? { wakeResult } : {}),
      }),
    })

    return ok(requestId, { config, wakeResult })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][crawl][PUT]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to update crawl config')
  }
}
