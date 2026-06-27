'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type FilterItem = { name: string; count: number }

type Props = {
  cameras: FilterItem[]
  lenses: FilterItem[]
  currentCamera: string
  currentLens: string
}

function FilterDropdown({
  label,
  icon,
  items,
  current,
  paramKey,
}: {
  label: string
  icon: React.ReactNode
  items: FilterItem[]
  current: string
  paramKey: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (name: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (name) {
      params.set(paramKey, name)
    } else {
      params.delete(paramKey)
    }
    params.delete('page')
    router.push(`/?${params.toString()}`)
    setOpen(false)
  }

  const currentLabel = current || `全部${label}`
  const currentCount = current
    ? items.find(i => i.name === current)?.count || 0
    : items.reduce((s, i) => s + i.count, 0)

  return (
    <div className='relative' ref={ref}>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md'>
        {icon}
        {currentLabel}
        <span className='text-xs text-[var(--color-ink-soft)]'>{currentCount} 张</span>
        <svg className={`ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
          <polyline points='6 9 12 15 18 9' />
        </svg>
      </button>

      {open && (
        <div
          className='absolute left-0 top-full z-20 mt-2 w-64 origin-top-left overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-white/95 shadow-xl backdrop-blur-xl'
          style={{ animation: 'jelly-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          <div className='max-h-72 overflow-y-auto p-1.5'>
            <button
              type='button'
              onClick={() => handleSelect('')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--color-brand)]/10 ${
                !current ? 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]' : 'text-[var(--color-ink)]'
              }`}>
              <span>全部{label}</span>
              <span className='text-xs text-[var(--color-ink-soft)]'>{items.reduce((s, i) => s + i.count, 0)}</span>
            </button>

            {items.map((item, i) => (
              <button
                key={item.name}
                type='button'
                onClick={() => handleSelect(current === item.name ? '' : item.name)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--color-brand)]/10 ${
                  current === item.name ? 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]' : 'text-[var(--color-ink)]'
                }`}
                style={{ animationDelay: `${(i + 1) * 30}ms`, animation: 'jelly-slide 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards', opacity: 0 }}>
                <span className='truncate'>{item.name}</span>
                <span className='ml-2 shrink-0 text-xs text-[var(--color-ink-soft)]'>{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ExifFilters({ cameras, lenses, currentCamera, currentLens }: Props) {
  if (cameras.length === 0 && lenses.length === 0) return null

  return (
    <div className='mb-4 flex flex-wrap gap-3'>
      {cameras.length > 0 && (
        <FilterDropdown
          label='相机'
          icon={
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' />
              <circle cx='12' cy='13' r='4' />
            </svg>
          }
          items={cameras}
          current={currentCamera}
          paramKey='camera'
        />
      )}

      {lenses.length > 0 && (
        <FilterDropdown
          label='镜头'
          icon={
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <circle cx='12' cy='12' r='10' />
              <circle cx='12' cy='12' r='4' />
              <line x1='2' y1='12' x2='6' y2='12' />
              <line x1='18' y1='12' x2='22' y2='12' />
            </svg>
          }
          items={lenses}
          current={currentLens}
          paramKey='lens'
        />
      )}
    </div>
  )
}
