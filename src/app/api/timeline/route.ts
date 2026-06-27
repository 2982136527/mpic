import { NextRequest } from 'next/server'
import { getTimeline, getExifFilters } from '@/lib/services/image-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const requestId = createRequestId()
  try {
    const publicOnly = request.nextUrl.searchParams.get('publicOnly') === 'true'
    const [timeline, filters] = await Promise.all([
      getTimeline(publicOnly),
      getExifFilters(publicOnly),
    ])
    return ok(requestId, { timeline, ...filters })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load timeline')
  }
}
