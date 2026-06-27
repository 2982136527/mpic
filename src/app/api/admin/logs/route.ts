import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { listLogs } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const requestId = createRequestId()

  try {
    await requireAdminSession()

    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
    const result = await listLogs({ page })

    return ok(requestId, result)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][logs][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load logs')
  }
}
