import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { getAccessOverview, listAccessLogs } from '@/lib/services/access-log-service'
import { AdminAccessPage } from '@/components/admin/admin-access-page'
import { AdminNoPermission } from '@/components/admin/admin-no-permission'
import type { AccessLogType } from '@/types/access'

const PAGE_SIZE = 100
const ACCESS_TYPES: AccessLogType[] = ['page_view', 'random_api', 'images_api', 'image_meta_api']

type PageProps = {
  searchParams: Promise<{ page?: string; type?: string }>
}

export default async function AdminAccessLogsPage({ searchParams }: PageProps) {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/access')
  }

  if (!isAdminLogin(session.user.login)) {
    return <AdminNoPermission />
  }

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const type = ACCESS_TYPES.includes(params.type as AccessLogType) ? (params.type as AccessLogType) : undefined

  const [overview, result] = await Promise.all([
    getAccessOverview(),
    listAccessLogs({ page, pageSize: PAGE_SIZE, type }),
  ])

  return (
    <AdminAccessPage
      overview={overview}
      logs={result.logs}
      total={result.total}
      page={page}
      pageSize={PAGE_SIZE}
      activeType={type}
    />
  )
}
