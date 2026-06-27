import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { listUsers } from '@/lib/services/user-service'
import { AdminUsersPage } from '@/components/admin/admin-users-page'

export default async function AdminUsersPageServer() {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/users')
  }

  if (!isAdminLogin(session.user.login)) {
    return <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>无管理员权限。</div>
  }

  const users = await listUsers()

  return <AdminUsersPage users={users} />
}
