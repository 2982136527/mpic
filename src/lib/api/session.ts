import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { HttpError } from '@/lib/api/errors'

export async function requireSession() {
  const session = await getAuthSession()
  const login = session?.user?.login

  if (!session?.user || !login) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required')
  }

  return { session, login }
}

export async function requireAdminSession() {
  const { session, login } = await requireSession()

  if (!isAdminLogin(login)) {
    throw new HttpError(403, 'FORBIDDEN', 'Admin access denied')
  }

  return { session, login }
}
