import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { listLogs } from '@/lib/services/log-service'
import { AdminLogsTable } from '@/components/admin/admin-logs-table'

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/logs')
  }

  if (!isAdminLogin(session.user.login)) {
    return <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>无管理员权限。</div>
  }

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const result = await listLogs({ page })

  return (
    <div className='space-y-5'>
      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <h2 className='font-title text-3xl text-[var(--color-ink)]'>操作日志</h2>
        <p className='text-sm text-[var(--color-ink-soft)]'>共 {result.total} 条记录</p>
      </section>

      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <AdminLogsTable logs={result.logs} />
      </section>
    </div>
  )
}
