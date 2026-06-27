'use client'

import type { ImageRecord, ImageLinks } from '@/types/image'
import { formatBytes } from '@/lib/utils'

type Props = {
  image: ImageRecord & { links: ImageLinks }
  onClick: () => void
}

export function ImageCard({ image, onClick }: Props) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='group mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-left shadow-sm transition hover:shadow-md'
      style={{ boxShadow: 'var(--glass-shadow)' }}>
      <div className='overflow-hidden'>
        <img
          src={image.links.cdn}
          alt={image.filename}
          loading='lazy'
          className='w-full object-cover transition group-hover:scale-[1.02]'
        />
      </div>
      <div className='p-3'>
        <p className='truncate text-xs font-medium text-[var(--color-ink)]'>{image.filename}</p>
        <p className='mt-1 text-[11px] text-[var(--color-ink-soft)]'>
          {formatBytes(image.size)} &middot; {image.uploaderLogin}
        </p>
      </div>
    </button>
  )
}
