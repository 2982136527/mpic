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
  const sentinelRef = useRef<HTMLDivElement>(null)

  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const nextPage = initialPage + 1
      const params = new URLSearchParams({ page: String(nextPage) })
      if (search) params.set('search', search)

      const res = await fetch(`/api/images?${params}`)
      const data = await res.json()

      if (data.images?.length > 0) {
        const container = document.querySelector('[data-image-grid]')
        if (container) {
          for (const img of data.images) {
            const card = createImageCard(img)
            container.appendChild(card)
          }
        }
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, initialPage, search])

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
        { rootMargin: '200px' },
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

function createImageCard(image: ImageRecord & { links: ImageLinks }): HTMLElement {
  const div = document.createElement('div')
  div.className = 'mb-4 break-inside-avoid'
  div.innerHTML = `
    <button type="button" class="group w-full overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.45)] text-left shadow-sm transition hover:shadow-md" style="box-shadow: 0 24px 80px -40px rgba(120,45,20,0.55), inset 0 1px 0 0 rgba(255,255,255,0.65)">
      <div class="overflow-hidden">
        <img src="${image.links.cdn}" alt="${image.filename}" loading="lazy" class="w-full object-cover transition group-hover:scale-[1.02]" />
      </div>
      <div class="p-3">
        <p class="truncate text-xs font-medium text-[var(--color-ink)]">${image.filename}</p>
        <p class="mt-1 text-[11px] text-[var(--color-ink-soft)]">${image.uploaderLogin}</p>
      </div>
    </button>
  `
  return div
}
