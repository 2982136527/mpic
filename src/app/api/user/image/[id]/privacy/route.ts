import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/api/session'
import { getImage, updateImagePrivacy } from '@/lib/services/image-service'
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
    if (typeof body.isPublic !== 'boolean') {
      return fail(requestId, 400, 'INVALID_PARAM', 'isPublic must be a boolean')
    }

    await updateImagePrivacy(id, body.isPublic)

    await appendLog({
      action: 'update_privacy',
      actorLogin: login,
      targetId: id,
      detail: `isPublic: ${body.isPublic}`,
    })

    return ok(requestId, { success: true })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to update privacy')
  }
}
