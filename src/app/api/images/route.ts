import { NextRequest } from 'next/server'
import { listImages, buildImageLinks } from '@/lib/services/image-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const requestId = createRequestId()

  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize')) || 30))
    const search = request.nextUrl.searchParams.get('search') || undefined

    const result = await listImages({ page, pageSize, search })

    const images = result.images.map(img => ({
      ...img,
      links: buildImageLinks(img),
    }))

    return ok(requestId, { images, total: result.total, hasMore: result.hasMore, page, pageSize })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][images][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load images')
  }
}
