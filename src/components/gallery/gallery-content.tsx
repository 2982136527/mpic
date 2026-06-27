'use client'

import { useState, useCallback, useRef } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { ImageGrid } from '@/components/gallery/image-grid'
import { useLang } from '@/lib/i18n/context'

type ImageWithLinks = ImageRecord & { links: ImageLinks }

type Props = {
  initialImages: ImageWithLinks[]
  initialHasMore: boolean
  search: string
  yearMonth?: string
  camera?: string
  lens?: string
}

export function GalleryContent({ initialImages, initialHasMore, search, yearMonth, camera, lens }: Props) {
  const [images, setImages] = useState(initialImages)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { t } = useLang()

  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const nextPage = currentPage + 1
      const params = new URLSearchParams({ page: String(nextPage) })
      if (search) params.set('search', search)
      if (yearMonth) params.set('yearMonth', yearMonth)
      if (camera) params.set('camera', camera)
      if (lens) params.set('lens', lens)

      const res = await fetch(`/api/images?${params}`)
      const data = await res.json()

      if (data.images?.length > 0) {
        setImages(prev => [...prev, ...data.images])
        setCurrentPage(nextPage)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentPage, search, yearMonth, camera, lens])

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      if (!node || !hasMore) return

      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting) {
            loadMore()
          }
        },
        { rootMargin: '500px' },
      )

      observerRef.current.observe(node)
    },
    [hasMore, loadMore],
  )

  return (
    <>
      <ImageGrid images={images} />

      {hasMore && (
        <div ref={sentinelCallback} className='py-8 text-center'>
          {loading && (
            <div className='inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)]'>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent' />
              {t.common.loading}
            </div>
          )}
        </div>
      )}
    </>
  )
}
