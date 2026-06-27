import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { getUserStats, listImages, buildImageLinks } from '@/lib/services/image-service'
import { getUser } from '@/lib/services/user-service'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { SiteHeader } from '@/components/site-header'
import { UserStats } from '@/components/dashboard/user-stats'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/dashboard')
  }

  const login = session.user.login
  const stats = await getUserStats(login)
  const user = await getUser(login)
  const quotaBytes = user?.quotaBytes || 0

  const result = await listImages({ page: 1, pageSize: 50, uploaderLogin: login })
  const images = result.images.map(img => ({
    ...img,
    links: buildImageLinks(img),
  }))

  return (
    <div className='relative min-h-screen pb-8' data-theme-scope='public'>
      <BlurGradientBackground />
      <SiteHeader />

      <main className='mx-auto w-full max-w-6xl px-5 sm:px-8'>
        <div className='mb-6'>
          <h2 className='font-title text-3xl text-[var(--color-ink)]'>个人中心</h2>
          <p className='mt-1 text-sm text-[var(--color-ink-soft)]'>@{login}</p>
        </div>

        <UserStats imageCount={stats.imageCount} totalSize={stats.totalSize} quotaBytes={quotaBytes} />

        <div className='mt-6'>
          <DashboardContent initialImages={images} />
        </div>
      </main>
    </div>
  )
}
