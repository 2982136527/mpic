import { AdminNav } from '@/components/admin/admin-nav'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative min-h-screen pb-10' data-theme-scope='admin'>
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,#f5c389_0%,#f5c38900_40%),radial-gradient(circle_at_90%_22%,#ea9d70_0%,#ea9d7000_40%),linear-gradient(160deg,#fff8ef_0%,#fdebdc_45%,#f6decf_100%)]' />

      <AdminHeader />

      <div className='mx-auto w-full max-w-6xl px-5 sm:px-8'>
        <AdminNav />
      </div>

      <main className='mx-auto mt-5 w-full max-w-6xl px-5 sm:px-8'>{children}</main>
    </div>
  )
}
