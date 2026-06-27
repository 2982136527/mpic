import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { getSettings, updateSettings } from '@/lib/services/settings-service'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET() {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const settings = await getSettings()
    return ok(requestId, { settings })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][settings][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load settings')
  }
}

export async function PUT(request: NextRequest) {
  const requestId = createRequestId()

  try {
    const { login } = await requireAdminSession()
    const body = await request.json()

    const settings = await updateSettings(body)

    await appendLog({
      action: 'update_settings',
      actorLogin: login,
      detail: JSON.stringify(body),
    })

    return ok(requestId, { settings })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][settings][PUT]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to update settings')
  }
}
