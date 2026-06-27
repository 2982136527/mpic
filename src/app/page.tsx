import { Suspense } from 'react'
import { listImages, buildImageLinks, getTimeline, getExifFilters } from '@/lib/services/image-service'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SearchBar } from '@/components/gallery/search-bar'
import { TimelineBar } from '@/components/gallery/timeline-bar'
import { ExifFilters } from '@/components/gallery/exif-filters'
import { ImageGrid } from '@/components/gallery/image-grid'
import { GalleryLoadMore } from '@/components/gallery/gallery-load-more'
import type { ImageRecord, ImageLinks } from '@/types/image'

type ImageWithLinks = ImageRecord & { links: ImageLinks }

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string; yearMonth?: string; camera?: string; lens?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const page = Math.max(1, Number(params.page) || 1)
  const yearMonth = params.yearMonth || ''
  const camera = params.camera || ''
  const lens = params.lens || ''

  let images: ImageWithLinks[] = []
  let hasMore = false
  let total = 0
  let timeline: { yearMonth: string; count: number }[] = []
  let cameras: { name: string; count: number }[] = []
  let lenses: { name: string; count: number }[] = []

  try {
    const [result, tl] = await Promise.all([
      listImages({ page, pageSize: 30, search, publicOnly: true, yearMonth: yearMonth || undefined, camera: camera || undefined, lens: lens || undefined }),
      getTimeline(true),
    ])
    images = result.images.map(img => ({
      ...img,
      links: buildImageLinks(img),
    }))
    hasMore = result.hasMore
    total = result.total
    timeline = tl

    const filters = await getExifFilters(true)
    cameras = filters.cameras
    lenses = filters.lenses
  } catch {
    // GitHub env vars not configured or API error
  }

  return (
    <div className='relative min-h-screen pb-8' data-theme-scope='public'>
      <BlurGradientBackground />
      <SiteHeader />

      <main className='mx-auto w-full max-w-6xl px-5 sm:px-8'>
        <div className='mb-4 animate-fade-in-up'>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        {timeline.length > 0 && (
          <Suspense>
            <div className='animate-fade-in-up animate-stagger-1'>
              <TimelineBar timeline={timeline} current={yearMonth} />
            </div>
          </Suspense>
        )}

        {(cameras.length > 0 || lenses.length > 0) && (
          <Suspense>
            <div className='animate-fade-in-up animate-stagger-2'>
              <ExifFilters cameras={cameras} lenses={lenses} currentCamera={camera} currentLens={lens} />
            </div>
          </Suspense>
        )}

        {total === 0 ? (
          <div className='animate-fade-in-up animate-stagger-3 rounded-2xl border border-white/70 bg-white/60 py-20 text-center backdrop-blur'>
            <p className='text-lg font-title text-[var(--color-ink)]'>欢迎使用 Mpic</p>
            <p className='mt-2 text-sm text-[var(--color-ink-soft)]'>暂无图片，请登录后上传</p>
          </div>
        ) : (
          <div className='animate-fade-in-up animate-stagger-3'>
            <ImageGrid images={images} />
          </div>
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
