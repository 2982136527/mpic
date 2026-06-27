'use client'

import type { ImageRecord, ImageLinks } from '@/types/image'

type Props = {
  image: ImageRecord & { links: ImageLinks }
  onClick: () => void
}

export function ImageCard({ image, onClick }: Props) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='group mb-4 block w-full overflow-hidden rounded-2xl bg-[var(--glass-bg)] text-left shadow-sm break-inside-avoid transition-shadow hover:shadow-lg'
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
