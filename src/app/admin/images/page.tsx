import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { listImages, buildImageLinks } from '@/lib/services/image-service'
import { AdminImagesTable } from '@/components/admin/admin-images-table'
import { AdminImagesActions } from '@/components/admin/admin-images-actions'
import { AdminNoPermission } from '@/components/admin/admin-no-permission'
import { AdminImagesHeader } from '@/components/admin/admin-images-header'

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function AdminImagesPage({ searchParams }: PageProps) {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/images')
  }

  if (!isAdminLogin(session.user.login)) {
    return <AdminNoPermission />
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
      <AdminImagesHeader total={result.total} />

      <AdminImagesActions />

      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <AdminImagesTable images={images} />
      </section>
    </div>
  )
}
