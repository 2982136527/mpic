import { requireSession } from '@/lib/api/session'
import { getUserStats } from '@/lib/services/image-service'
import { getUser } from '@/lib/services/user-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET() {
  const requestId = createRequestId()

  try {
    const { login } = await requireSession()
    const stats = await getUserStats(login)
    const user = await getUser(login)

    return ok(requestId, {
      ...stats,
      quotaBytes: user?.quotaBytes || 0,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][user][stats][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load stats')
  }
}
