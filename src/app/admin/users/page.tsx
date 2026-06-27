import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { listUsers } from '@/lib/services/user-service'
import { AdminUsersPage } from '@/components/admin/admin-users-page'
import { AdminNoPermission } from '@/components/admin/admin-no-permission'

export default async function AdminUsersPageServer() {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/users')
  }

  if (!isAdminLogin(session.user.login)) {
    return <AdminNoPermission />
  }

  const users = await listUsers()

  return <AdminUsersPage users={users} />
}
