import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/api/session'
import { listImages, buildImageLinks } from '@/lib/services/image-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const requestId = createRequestId()

  try {
    const { login } = await requireSession()
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)

    const result = await listImages({ page, pageSize: 30, uploaderLogin: login })

    const images = result.images.map(img => ({
      ...img,
      links: buildImageLinks(img),
    }))

    return ok(requestId, { images, total: result.total, hasMore: result.hasMore })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][user][images][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load images')
  }
}
