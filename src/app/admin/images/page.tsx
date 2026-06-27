import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { listImages, buildImageLinks } from '@/lib/services/image-service'
import { AdminImagesTable } from '@/components/admin/admin-images-table'
import { AdminImagesActions } from '@/components/admin/admin-images-actions'

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function AdminImagesPage({ searchParams }: PageProps) {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/images')
  }

  if (!isAdminLogin(session.user.login)) {
    return <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>无管理员权限。</div>
  }

  const params = await searchParams
  const search = params.search || ''
  const page = Math.max(1, Number(params.page) || 1)

  const result = await listImages({ page, pageSize: 50, search })
  const images = result.images.map(img => ({
    ...img,
    links: buildImageLinks(img),
  }))

  return (
    <div className='space-y-5'>
      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <h2 className='font-title text-3xl text-[var(--color-ink)]'>图片管理</h2>
        <p className='text-sm text-[var(--color-ink-soft)]'>共 {result.total} 张图片</p>
      </section>

      <AdminImagesActions />

      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <AdminImagesTable images={images} />
      </section>
    </div>
  )
}
