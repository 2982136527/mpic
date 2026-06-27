import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { listLogs } from '@/lib/services/log-service'
import { AdminLogsTable } from '@/components/admin/admin-logs-table'
import { AdminNoPermission } from '@/components/admin/admin-no-permission'
import { AdminLogsHeader } from '@/components/admin/admin-logs-header'

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/logs')
  }

  if (!isAdminLogin(session.user.login)) {
    return <AdminNoPermission />
  }

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const result = await listLogs({ page })

  return (
    <div className='space-y-5'>
      <AdminLogsHeader total={result.total} />

      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <AdminLogsTable logs={result.logs} />
      </section>
    </div>
  )
}
