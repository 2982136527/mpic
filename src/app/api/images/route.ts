import { after, NextRequest } from 'next/server'
import { listImages, buildImageLinks } from '@/lib/services/image-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'
import { appendAccessLog } from '@/lib/services/access-log-service'
import { createAccessLogEntry } from '@/lib/access-tracking'

export async function GET(request: NextRequest) {
  const requestId = createRequestId()

  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize')) || 30))
    const search = request.nextUrl.searchParams.get('search') || undefined
    const publicOnly = request.nextUrl.searchParams.get('publicOnly') !== 'false'
    const yearMonth = request.nextUrl.searchParams.get('yearMonth') || undefined
    const date = request.nextUrl.searchParams.get('date') || undefined
    const camera = request.nextUrl.searchParams.get('camera') || undefined
    const lens = request.nextUrl.searchParams.get('lens') || undefined
    const before = request.nextUrl.searchParams.get('before') || undefined
    const beforeId = request.nextUrl.searchParams.get('beforeId') || undefined

    const result = await listImages({ page, pageSize, search, publicOnly, yearMonth, date, camera, lens, before, beforeId })

    const images = result.images.map(img => ({
      ...img,
      links: buildImageLinks(img),
    }))

    const response = ok(requestId, { images, total: result.total, hasMore: result.hasMore, page, pageSize })
    logImagesAccess(request, 200, `returned=${images.length} publicOnly=${publicOnly}`)
    return response
  } catch (error) {
    if (error instanceof HttpError) {
      const response = fail(requestId, error.status, error.code, error.message)
      logImagesAccess(request, error.status, error.code)
      return response
    }
    console.error('[api][images][GET]', requestId, error)
    const response = fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load images')
    logImagesAccess(request, 500, 'INTERNAL_ERROR')
    return response
  }
}

function logImagesAccess(request: NextRequest, status: number, detail: string) {
  after(async () => {
    try {
      const entry = await createAccessLogEntry(request, {
        type: 'images_api',
        status,
        detail,
      })
      await appendAccessLog(entry)
    } catch (error) {
      console.error('[api][images][access]', error)
    }
  })
}
