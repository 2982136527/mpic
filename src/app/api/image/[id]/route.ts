import { after, NextRequest } from 'next/server'
import { getImage, buildImageLinks } from '@/lib/services/image-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'
import { appendAccessLog } from '@/lib/services/access-log-service'
import { createAccessLogEntry } from '@/lib/access-tracking'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId()

  try {
    const { id } = await params
    const image = await getImage(id, { publicOnly: true })

    if (!image) {
      const response = fail(requestId, 404, 'NOT_FOUND', 'Image not found')
      logImageMetaAccess(request, { status: 404, imageId: id, detail: 'NOT_FOUND' })
      return response
    }

    const response = ok(requestId, { image, links: buildImageLinks(image) })
    logImageMetaAccess(request, {
      status: 200,
      imageId: image.id,
      imageTitle: image.title || image.filename,
      detail: 'ok',
    })
    return response
  } catch (error) {
    if (error instanceof HttpError) {
      const response = fail(requestId, error.status, error.code, error.message)
      logImageMetaAccess(request, { status: error.status, detail: error.code })
      return response
    }
    console.error('[api][image][GET]', requestId, error)
    const response = fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load image')
    logImageMetaAccess(request, { status: 500, detail: 'INTERNAL_ERROR' })
    return response
  }
}

function logImageMetaAccess(
  request: NextRequest,
  input: { status: number; imageId?: string; imageTitle?: string; detail?: string },
) {
  after(async () => {
    try {
      const entry = await createAccessLogEntry(request, {
        type: 'image_meta_api',
        status: input.status,
        imageId: input.imageId,
        imageTitle: input.imageTitle,
        detail: input.detail,
      })
      await appendAccessLog(entry)
    } catch (error) {
      console.error('[api][image][access]', error)
    }
  })
}
