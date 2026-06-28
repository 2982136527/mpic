import { AdminNav } from '@/components/admin/admin-nav'
import { AdminHeader } from '@/components/admin/admin-header'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative min-h-screen pb-10' data-theme-scope='admin'>
      <BlurGradientBackground />

      <AdminHeader />

      <div className='mx-auto w-full max-w-6xl px-5 sm:px-8'>
        <AdminNav />
      </div>

      <main className='mx-auto mt-5 w-full max-w-6xl px-5 sm:px-8'>{children}</main>
    </div>
  )
}
