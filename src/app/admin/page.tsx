import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { getAdminStats } from '@/lib/services/image-service'
import { AdminStatsCard } from '@/components/admin/admin-stats-card'

export default async function AdminPage() {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin')
  }

  if (!isAdminLogin(session.user.login)) {
    return (
      <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
        当前账号无管理员权限。
      </div>
    )
  }

  const stats = await getAdminStats()

  return (
    <div className='space-y-5'>
      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <h2 className='font-title text-3xl text-[var(--color-ink)]'>数据概览</h2>
        <p className='text-sm text-[var(--color-ink-soft)]'>管理员：@{session.user.login}</p>
      </section>

      <AdminStatsCard {...stats} />
    </div>
  )
}
