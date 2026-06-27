import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/api/session'
import { deleteImage } from '@/lib/services/image-service'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId()

  try {
    const { login } = await requireSession()
    const { id } = await params

    await deleteImage(id, login, false)

    await appendLog({
      action: 'delete',
      actorLogin: login,
      targetId: id,
      detail: 'User deleted own image',
    })

    return ok(requestId, { deleted: true })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][user][image][DELETE]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Delete failed')
  }
}
