import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { AdminDocsPage } from '@/components/admin/admin-docs-page'
import { AdminNoPermission } from '@/components/admin/admin-no-permission'

export default async function AdminDocsPageServer() {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/docs')
  }

  if (!isAdminLogin(session.user.login)) {
    return <AdminNoPermission />
  }

  return <AdminDocsPage />
}
