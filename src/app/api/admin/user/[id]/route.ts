import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { updateUser, deleteUser } from '@/lib/services/user-service'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId()

  try {
    const { login: adminLogin } = await requireAdminSession()
    const { id } = await params
    const body = await request.json()

    const changes: Record<string, unknown> = {}
    if (body.role !== undefined) changes.role = body.role
    if (body.banned !== undefined) changes.banned = body.banned
    if (body.quotaBytes !== undefined) changes.quotaBytes = Number(body.quotaBytes)

    await updateUser(id, changes)

    await appendLog({
      action: 'update_user',
      actorLogin: adminLogin,
      targetId: id,
      detail: JSON.stringify(changes),
    })

    return ok(requestId, { updated: true })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][user][PATCH]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Update failed')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId()

  try {
    const { login: adminLogin } = await requireAdminSession()
    const { id } = await params

    await deleteUser(id)

    await appendLog({
      action: 'delete_user',
      actorLogin: adminLogin,
      targetId: id,
      detail: 'Admin deleted user',
    })

    return ok(requestId, { deleted: true })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][user][DELETE]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Delete failed')
  }
}
