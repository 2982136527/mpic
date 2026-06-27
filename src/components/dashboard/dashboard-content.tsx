'use client'

import { useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { UploadZone } from '@/components/upload/upload-zone'
import { MyImagesList } from '@/components/dashboard/my-images-list'

type Props = {
  initialImages: (ImageRecord & { links: ImageLinks })[]
}

export function DashboardContent({ initialImages }: Props) {
  const [images, setImages] = useState(initialImages)

  const handleUploaded = (result: { image: ImageRecord; links: ImageLinks }) => {
    setImages(prev => [{ ...result.image, links: result.links }, ...prev])
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/user/image/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
  }

  return (
    <div className='space-y-6'>
      <UploadZone onUploaded={handleUploaded} />

      <div>
        <h3 className='mb-3 text-sm font-semibold text-[var(--color-ink)]'>我的图片</h3>
        <MyImagesList images={images} onDelete={handleDelete} />
      </div>
    </div>
  )
}
