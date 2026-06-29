import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/api/session'
import { getAlbum, updateAlbum, deleteAlbum } from '@/lib/services/album-service'
import { updateImageAlbum } from '@/lib/services/image-service'
import { listAllImageRecords } from '@/lib/services/image-store'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId()
  try {
    const { login } = await requireSession()
    const { id } = await params
    const album = await getAlbum(id)

    if (!album) {
      return fail(requestId, 404, 'NOT_FOUND', 'Album not found')
    }
    if (album.ownerLogin !== login) {
      return fail(requestId, 403, 'FORBIDDEN', 'Not your album')
    }

    const body = await request.json()
    const changes: { name?: string; isPublic?: boolean } = {}
    if (body.name !== undefined) changes.name = body.name
    if (body.isPublic !== undefined) changes.isPublic = body.isPublic

    await updateAlbum(id, changes)

    await appendLog({
      action: 'update_album',
      actorLogin: login,
      targetId: id,
      detail: JSON.stringify(changes),
    })

    return ok(requestId, { success: true })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to update album')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId()
  try {
    const { login } = await requireSession()
    const { id } = await params
    const album = await getAlbum(id)

    if (!album) {
      return fail(requestId, 404, 'NOT_FOUND', 'Album not found')
    }
    if (album.ownerLogin !== login) {
      return fail(requestId, 403, 'FORBIDDEN', 'Not your album')
    }

    // Move all images in this album to ungrouped
    const images = await listAllImageRecords()
    const imagesInAlbum = images.filter(img => img.albumId === id)
    for (const img of imagesInAlbum) {
      await updateImageAlbum(img.id, null)
    }

    await deleteAlbum(id)

    await appendLog({
      action: 'delete_album',
      actorLogin: login,
      targetId: id,
      detail: album.name,
    })

    return ok(requestId, { success: true })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to delete album')
  }
}
