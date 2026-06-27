import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { getCrawlConfig } from '@/lib/services/crawl-service'
import { AdminCrawlPage } from '@/components/admin/admin-crawl-page'
import { AdminNoPermission } from '@/components/admin/admin-no-permission'

export default async function AdminCrawlPageServer() {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/crawl')
  }

  if (!isAdminLogin(session.user.login)) {
    return <AdminNoPermission />
  }

  const config = await getCrawlConfig()

  return <AdminCrawlPage config={config} />
}
