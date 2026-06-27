import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { getAdminStats } from '@/lib/services/image-service'
import { AdminStatsCard } from '@/components/admin/admin-stats-card'
import { AdminNoPermission } from '@/components/admin/admin-no-permission'
import { AdminOverview } from '@/components/admin/admin-overview'

export default async function AdminPage() {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin')
  }

  if (!isAdminLogin(session.user.login)) {
    return <AdminNoPermission />
  }

  const stats = await getAdminStats()

  return (
    <div className='space-y-5'>
      <AdminOverview login={session.user.login} />
      <AdminStatsCard {...stats} />
    </div>
  )
}
