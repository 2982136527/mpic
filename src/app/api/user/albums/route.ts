import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/api/session'
import { listAlbums, createAlbum } from '@/lib/services/album-service'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET() {
  const requestId = createRequestId()
  try {
    const { login } = await requireSession()
    const albums = await listAlbums(login)
    return ok(requestId, { albums })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load albums')
  }
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId()
  try {
    const { login } = await requireSession()
    const body = await request.json()
    const { name, isPublic } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return fail(requestId, 400, 'INVALID_NAME', 'Album name is required')
    }

    const album = await createAlbum(name.trim(), login, isPublic !== false)

    await appendLog({
      action: 'create_album',
      actorLogin: login,
      targetId: album.id,
      detail: album.name,
    })

    return ok(requestId, { album })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to create album')
  }
}
