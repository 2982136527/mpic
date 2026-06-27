import { requireAdminSession } from '@/lib/api/session'
import { listRepos, syncRepoSizes } from '@/lib/services/repo-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function GET() {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const repos = await listRepos()
    return ok(requestId, { repos })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][repos][GET]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to load repos')
  }
}

export async function POST() {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const repos = await syncRepoSizes()
    return ok(requestId, { repos, message: 'Repo sizes synced from GitHub' })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][admin][repos][POST]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Failed to sync repo sizes')
  }
}
