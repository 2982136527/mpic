'use client'

import { useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { getImageSourceLabel } from '@/lib/image-source'
import { PublicImage } from '@/components/ui/public-image'
import { formatBytes } from '@/lib/utils'
import { useLang } from '@/lib/i18n/context'

type Props = {
  images: (ImageRecord & { links: ImageLinks })[]
}

export function AdminImagesTable({ images: initialImages }: Props) {
  const { t } = useLang()
  const [images, setImages] = useState(initialImages)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm(t.admin.confirmPermanentDelete)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/image/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setImages(prev => prev.filter(img => img.id !== id))
    } catch {
      alert(t.admin.deleteFailed)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-left text-sm'>
        <thead className='text-xs text-[var(--color-ink-soft)]'>
          <tr>
            <th className='px-3 py-2'>{t.admin.preview}</th>
            <th className='px-3 py-2'>{t.admin.filename}</th>
            <th className='px-3 py-2'>{t.admin.size}</th>
            <th className='px-3 py-2'>{t.admin.uploader}</th>
            <th className='px-3 py-2'>{t.admin.time}</th>
            <th className='px-3 py-2'>{t.admin.action}</th>
          </tr>
        </thead>
        <tbody>
          {images.length === 0 ? (
            <tr>
              <td className='px-3 py-6 text-[var(--color-ink-soft)]' colSpan={6}>{t.common.noData}</td>
            </tr>
          ) : (
            images.map(image => (
              <tr key={image.id} className='border-t border-white/70'>
                <td className='px-3 py-2'>
                  <PublicImage links={image.links} alt='' loading='lazy' className='h-10 w-10 rounded-lg object-cover' />
                </td>
                <td className='max-w-[240px] px-3 py-2 text-[var(--color-ink)]'>
                  <div className='truncate'>{image.title || image.filename}</div>
                  <div className='truncate text-xs text-[var(--color-ink-soft)]'>
                    {image.filename}
                    {image.sourceProvider && ` · ${getImageSourceLabel(image.sourceProvider)}`}
                  </div>
                </td>
                <td className='px-3 py-2 text-[var(--color-ink-soft)]'>
                  {image.storageKind === 'external' ? t.gallery.external : formatBytes(image.size)}
                </td>
                <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{image.uploaderLogin}</td>
                <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{new Date(image.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className='px-3 py-2'>
                  <button
                    type='button'
                    disabled={deleting === image.id}
                    onClick={() => handleDelete(image.id)}
                    className='rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 transition hover:bg-red-100 disabled:opacity-50'>
                    {deleting === image.id ? t.common.deleting : t.admin.permanentDelete}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
