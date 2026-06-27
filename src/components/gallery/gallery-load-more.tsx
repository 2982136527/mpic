'use client'

import { useCallback, useRef, useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { useLang } from '@/lib/i18n/context'

type Props = {
  initialHasMore: boolean
  search: string
  initialPage: number
  yearMonth?: string
  camera?: string
  lens?: string
}

export function GalleryLoadMore({ initialHasMore, search, initialPage, yearMonth, camera, lens }: Props) {
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const { t } = useLang()
  const [currentPage, setCurrentPage] = useState(initialPage)
  const sentinelRef = useRef<HTMLDivElement>(null)

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
        const container = document.querySelector('[data-image-grid]')
        if (container) {
          data.images.forEach((img: ImageRecord & { links: ImageLinks }) => {
            const card = createImageCard(img)
            container.appendChild(card)
          })
        }
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

      sentinelRef.current = node

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

  if (!hasMore) return null

  return (
    <div ref={sentinelCallback} className='py-8 text-center'>
      {loading && (
        <div className='inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)]'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent' />
          {t.common.loading}
        </div>
      )}
    </div>
  )
}

function createImageCard(image: ImageRecord & { links: ImageLinks }): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'mb-4 break-inside-avoid'

  wrapper.innerHTML = `
    <button type="button" class="group w-full overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.45)] text-left shadow-sm break-inside-avoid transition-shadow hover:shadow-lg" style="box-shadow: 0 24px 80px -40px rgba(120,45,20,0.55), inset 0 1px 0 0 rgba(255,255,255,0.65)">
      <img src="${image.links.cdn}" alt="${image.filename}" loading="lazy" class="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]" />
    </button>
  `

  return wrapper
}
