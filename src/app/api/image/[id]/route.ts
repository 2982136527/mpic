import { NextRequest } from 'next/server'
import { getImage, buildImageLinks } from '@/lib/services/image-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId()

  try {
    const { id } = await params
    const image = await getImage(id)

    if (!image) {
      return fail(requestId, 404, 'NOT_FOUND', 'Image not found')
    }

    return ok(requestId, { image, links: buildImageLinks(image) })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][image][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load image')
  }
}
