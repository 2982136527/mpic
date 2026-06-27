import { Suspense } from 'react'
import { listImages, buildImageLinks } from '@/lib/services/image-service'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SearchBar } from '@/components/gallery/search-bar'
import { ImageGrid } from '@/components/gallery/image-grid'
import { GalleryLoadMore } from '@/components/gallery/gallery-load-more'
import type { ImageRecord, ImageLinks } from '@/types/image'

type ImageWithLinks = ImageRecord & { links: ImageLinks }

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const page = Math.max(1, Number(params.page) || 1)

  let images: ImageWithLinks[] = []
  let hasMore = false
  let total = 0

  try {
    const result = await listImages({ page, pageSize: 30, search })
    images = result.images.map(img => ({
      ...img,
      links: buildImageLinks(img),
    }))
    hasMore = result.hasMore
    total = result.total
  } catch {
    // GitHub env vars not configured or API error
  }

  return (
    <div className='relative min-h-screen pb-8' data-theme-scope='public'>
      <BlurGradientBackground />
      <SiteHeader />

      <main className='mx-auto w-full max-w-6xl px-5 sm:px-8'>
        <div className='mb-6'>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        {total === 0 ? (
          <div className='rounded-2xl border border-white/70 bg-white/60 py-20 text-center backdrop-blur'>
            <p className='text-lg font-title text-[var(--color-ink)]'>欢迎使用 Mpic</p>
            <p className='mt-2 text-sm text-[var(--color-ink-soft)]'>暂无图片，请登录后上传</p>
          </div>
        ) : (
          <ImageGrid images={images} />
        )}

        <GalleryLoadMore
          initialHasMore={hasMore}
          search={search}
          initialPage={page}
        />
      </main>

      <SiteFooter />
    </div>
  )
}
