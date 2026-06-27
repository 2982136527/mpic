'use client'

import { useRef, useEffect, useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'

type Props = {
  image: ImageRecord & { links: ImageLinks }
  onClick: () => void
}

export function ImageCard({ image, onClick }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <button
      ref={ref}
      type='button'
      onClick={onClick}
      className='group mb-4 block w-full overflow-hidden rounded-2xl bg-[var(--glass-bg)] text-left shadow-sm break-inside-avoid'
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px -12px rgba(120, 45, 20, 0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '' }}
    >
      <img
        src={image.links.cdn}
        alt={image.filename}
        loading='lazy'
        className='block w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]'
      />
    </button>
  )
}
