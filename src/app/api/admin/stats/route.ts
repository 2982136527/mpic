import { requireAdminSession } from '@/lib/api/session'
import { getAdminStats } from '@/lib/services/image-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET() {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const stats = await getAdminStats()
    return ok(requestId, stats)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][stats][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load stats')
  }
}
