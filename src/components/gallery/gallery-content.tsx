'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

const INITIAL_PRELOAD_OFFSET = 8
const PRELOAD_BATCH_SIZE = 12
const LOAD_MORE_ROOT_MARGIN = '1200px'

export function GalleryContent({ initialImages, initialHasMore, search, yearMonth, camera, lens }: Props) {
  const [images, setImages] = useState(initialImages)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState(() => getCursor(initialImages))
  const { t } = useLang()

  const observerRef = useRef<IntersectionObserver | null>(null)
  const preloadedUrlsRef = useRef(new Set<string>())

  const preloadImages = useCallback((items: ImageWithLinks[]) => {
    if (typeof window === 'undefined' || items.length === 0) return

    window.setTimeout(() => {
      for (const image of items) {
        const url = image.links.cdn
        if (!url || preloadedUrlsRef.current.has(url)) continue

        preloadedUrlsRef.current.add(url)
        const preload = new window.Image()
        preload.decoding = 'async'
        preload.src = url
      }
    }, 0)
  }, [])

  useEffect(() => {
    preloadImages(initialImages.slice(INITIAL_PRELOAD_OFFSET, INITIAL_PRELOAD_OFFSET + PRELOAD_BATCH_SIZE))
  }, [initialImages, preloadImages])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (yearMonth) params.set('yearMonth', yearMonth)
      if (camera) params.set('camera', camera)
      if (lens) params.set('lens', lens)
      if (cursor) {
        params.set('before', cursor.sortValue)
        params.set('beforeId', cursor.id)
      }

      const res = await fetch(`/api/images?${params}`)
      const data = await res.json()

      if (data.images?.length > 0) {
        setImages(prev => appendUniqueImages(prev, data.images))
        setCursor(getCursor(data.images))
        setHasMore(data.hasMore)
        preloadImages(data.images.slice(0, PRELOAD_BATCH_SIZE))
      } else {
        setHasMore(false)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, cursor, search, yearMonth, camera, lens, preloadImages])

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
        { rootMargin: LOAD_MORE_ROOT_MARGIN },
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

function getCursor(images: ImageWithLinks[]) {
  const lastImage = images.at(-1)
  if (!lastImage) return null

  return {
    id: lastImage.id,
    sortValue: lastImage.exif?.shootDate || lastImage.createdAt,
  }
}

function appendUniqueImages(current: ImageWithLinks[], incoming: ImageWithLinks[]) {
  if (incoming.length === 0) return current

  const seen = new Set(current.map(image => image.id))
  const next = [...current]

  for (const image of incoming) {
    if (seen.has(image.id)) continue
    seen.add(image.id)
    next.push(image)
  }

  return next
}
