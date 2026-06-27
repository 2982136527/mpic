'use client'

import { useEffect, useRef } from 'react'
import { useLang } from '@/lib/i18n/context'

type Props = {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
}

export function LoadMore({ hasMore, loading, onLoadMore }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { t } = useLang()

  useEffect(() => {
    if (!hasMore || loading) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: '200px' },
    )

    const el = sentinelRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [hasMore, loading, onLoadMore])

  if (!hasMore) return null

  return (
    <div ref={sentinelRef} className='py-8 text-center'>
      {loading && (
        <div className='inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)]'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent' />
          {t.common.loading}
        </div>
      )}
    </div>
  )
}
