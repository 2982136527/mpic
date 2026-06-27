import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/api/session'
import { getImage, updateImageAlbum } from '@/lib/services/image-service'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId()
  try {
    const { login } = await requireSession()
    const { id } = await params
    const image = await getImage(id)

    if (!image) {
      return fail(requestId, 404, 'NOT_FOUND', 'Image not found')
    }
    if (image.uploaderLogin !== login) {
      return fail(requestId, 403, 'FORBIDDEN', 'Not your image')
    }

    const body = await request.json()
    const albumId = body.albumId === null ? null : body.albumId

    await updateImageAlbum(id, albumId)

    await appendLog({
      action: 'update_album',
      actorLogin: login,
      targetId: id,
      detail: `albumId: ${albumId || 'ungrouped'}`,
    })

    return ok(requestId, { success: true })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to update album')
  }
}
