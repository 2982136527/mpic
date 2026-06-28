'use client'

import { useState } from 'react'
import Masonry from 'react-masonry-css'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { ImageCard } from '@/components/gallery/image-card'
import { ImagePreviewModal } from '@/components/gallery/image-preview-modal'
import { useLang } from '@/lib/i18n/context'

type ImageWithLinks = ImageRecord & { links: ImageLinks }

type Props = {
  images: ImageWithLinks[]
}

const breakpointColumns = {
  default: 5,
  1280: 4,
  1024: 3,
  640: 2,
}

const PRIORITY_IMAGE_COUNT = 6

export function ImageGrid({ images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const { t } = useLang()

  if (images.length === 0) {
    return (
      <div className='py-20 text-center text-sm text-[var(--color-ink-soft)]'>
        {t.common.noImages}
      </div>
    )
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className='my-masonry-grid'
        columnClassName='my-masonry-grid_column'>
        {images.map((image, i) => (
          <ImageCard
            key={image.id}
            image={image}
            priority={i < PRIORITY_IMAGE_COUNT}
            onClick={() => setSelectedIndex(i)}
          />
        ))}
      </Masonry>

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
