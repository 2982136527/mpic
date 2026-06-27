'use client'

import { useCallback, useRef, useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'

type Props = {
  initialHasMore: boolean
  search: string
  initialPage: number
}

export function GalleryLoadMore({ initialHasMore, search, initialPage }: Props) {
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
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

      const res = await fetch(`/api/images?${params}`)
      const data = await res.json()

      if (data.images?.length > 0) {
        const container = document.querySelector('[data-image-grid]')
        if (container) {
          data.images.forEach((img: ImageRecord & { links: ImageLinks }, i: number) => {
            const card = createImageCard(img, i)
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
  }, [loading, hasMore, currentPage, search])

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
          加载中...
        </div>
      )}
    </div>
  )
}

function createImageCard(image: ImageRecord & { links: ImageLinks }, index: number): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'mb-4 break-inside-avoid'
  wrapper.style.opacity = '0'
  wrapper.style.transform = 'translateY(24px) scale(0.97)'
  wrapper.style.transition = `opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${index * 60}ms, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${index * 60}ms`

  wrapper.innerHTML = `
    <button type="button" class="group w-full overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.45)] text-left shadow-sm break-inside-avoid transition-shadow hover:shadow-lg" style="box-shadow: 0 24px 80px -40px rgba(120,45,20,0.55), inset 0 1px 0 0 rgba(255,255,255,0.65)">
      <img src="${image.links.cdn}" alt="${image.filename}" loading="lazy" class="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]" />
    </button>
  `

  // Trigger fly-in animation after append
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrapper.style.opacity = '1'
      wrapper.style.transform = 'translateY(0) scale(1)'
    })
  })

  return wrapper
}
