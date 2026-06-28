'use client'

import { useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'

type Props = {
  image: ImageRecord & { links: ImageLinks }
  onClick: () => void
}

export function ImageCard({ image, onClick }: Props) {
  const [loaded, setLoaded] = useState(false)
  const width = image.width || 4
  const height = image.height || 5

  return (
    <button
      type='button'
      onClick={onClick}
      className='group relative mb-4 block w-full overflow-hidden rounded-2xl bg-[var(--glass-bg)] text-left shadow-sm break-inside-avoid transition-shadow hover:shadow-lg'
    >
      <div
        aria-hidden='true'
        className={`absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(240,198,157,0.16))] transition-opacity duration-300 ${loaded ? 'opacity-0' : 'opacity-100'}`}
      />
      <img
        src={image.links.cdn}
        alt={image.filename}
        loading='lazy'
        decoding='async'
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`relative block h-auto w-full transition-[opacity,transform] duration-500 group-hover:scale-[1.03] ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </button>
  )
}
