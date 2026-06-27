'use client'

import { useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { ImageCard } from '@/components/gallery/image-card'
import { ImagePreviewModal } from '@/components/gallery/image-preview-modal'

type Props = {
  images: (ImageRecord & { links: ImageLinks })[]
}

export function ImageGrid({ images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className='py-20 text-center text-sm text-[var(--color-ink-soft)]'>
        暂无图片
      </div>
    )
  }

  return (
    <>
      <div className='columns-2 gap-4 sm:columns-3 lg:columns-4'>
        {images.map((image, i) => (
          <ImageCard key={image.id} image={image} onClick={() => setSelectedIndex(i)} />
        ))}
      </div>

      {selectedIndex !== null && (
        <ImagePreviewModal
          images={images}
          index={selectedIndex}
          onNavigate={setSelectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  )
}
