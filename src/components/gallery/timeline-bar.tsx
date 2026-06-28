'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/i18n/context'

type TimelineItem = {
  yearMonth: string
  count: number
}

type Props = {
  timeline: TimelineItem[]
  current: string
}

export function TimelineBar({ timeline, current }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLang()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (yearMonth: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (yearMonth === current) {
      params.delete('yearMonth')
    } else if (yearMonth) {
      params.set('yearMonth', yearMonth)
    } else {
      params.delete('yearMonth')
    }
    params.delete('page')
    router.push(`/?${params.toString()}`)
    setOpen(false)
  }

  if (timeline.length === 0) return null

  const formatYearMonth = (ym: string) => {
    const [year, month] = ym.split('-')
    return t.gallery.yearMonth(year, month)
  }

  const currentLabel = current ? formatYearMonth(current) : t.gallery.allTime
  const currentCount = current ? timeline.find(item => item.yearMonth === current)?.count || 0 : timeline.reduce((s, item) => s + item.count, 0)

  return (
    <div className={`relative mb-4 ${open ? 'z-50' : 'z-10'}`} ref={ref}>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md'>
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
          <line x1='16' y1='2' x2='16' y2='6' />
          <line x1='8' y1='2' x2='8' y2='6' />
          <line x1='3' y1='10' x2='21' y2='10' />
        </svg>
        {currentLabel}
        <span className='text-xs text-[var(--color-ink-soft)]'>{currentCount} {t.gallery.countImages}</span>
        <svg className={`ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
          <polyline points='6 9 12 15 18 9' />
        </svg>
      </button>

      {open && (
        <div
          className='absolute left-0 top-full z-[60] mt-2 w-56 origin-top-left overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-white/95 shadow-xl backdrop-blur-xl'
          style={{ animation: 'jelly-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          <div className='max-h-72 overflow-y-auto p-1.5'>
            <button
              type='button'
              onClick={() => handleSelect('')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--color-brand)]/10 ${
                !current ? 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]' : 'text-[var(--color-ink)]'
              }`}>
              <span>{t.gallery.allTime}</span>
              <span className='text-xs text-[var(--color-ink-soft)]'>{timeline.reduce((s, item) => s + item.count, 0)}</span>
            </button>

            {timeline.map((item, i) => (
              <button
                key={item.yearMonth}
                type='button'
                onClick={() => handleSelect(item.yearMonth)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--color-brand)]/10 ${
                  current === item.yearMonth ? 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]' : 'text-[var(--color-ink)]'
                }`}
                style={{ animationDelay: `${(i + 1) * 30}ms`, animation: 'jelly-slide 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards', opacity: 0 }}>
                <span>{formatYearMonth(item.yearMonth)}</span>
                <span className='text-xs text-[var(--color-ink-soft)]'>{item.count} {t.gallery.countImages}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
