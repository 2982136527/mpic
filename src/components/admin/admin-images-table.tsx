'use client'

import { useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { formatBytes } from '@/lib/utils'

type Props = {
  images: (ImageRecord & { links: ImageLinks })[]
  onDelete: (id: string) => Promise<void>
}

export function AdminImagesTable({ images: initialImages, onDelete }: Props) {
  const [images, setImages] = useState(initialImages)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('确定永久删除这张图片？此操作不可撤销。')) return
    setDeleting(id)
    try {
      await onDelete(id)
      setImages(prev => prev.filter(img => img.id !== id))
    } catch {
      alert('删除失败')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-left text-sm'>
        <thead className='text-xs text-[var(--color-ink-soft)]'>
          <tr>
            <th className='px-3 py-2'>预览</th>
            <th className='px-3 py-2'>文件名</th>
            <th className='px-3 py-2'>大小</th>
            <th className='px-3 py-2'>上传者</th>
            <th className='px-3 py-2'>时间</th>
            <th className='px-3 py-2'>操作</th>
          </tr>
        </thead>
        <tbody>
          {images.length === 0 ? (
            <tr>
              <td className='px-3 py-6 text-[var(--color-ink-soft)]' colSpan={6}>暂无数据</td>
            </tr>
          ) : (
            images.map(image => (
              <tr key={image.id} className='border-t border-white/70'>
                <td className='px-3 py-2'>
                  <img src={image.links.cdn} alt='' className='h-10 w-10 rounded-lg object-cover' />
                </td>
                <td className='max-w-[200px] truncate px-3 py-2 text-[var(--color-ink)]'>{image.filename}</td>
                <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{formatBytes(image.size)}</td>
                <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{image.uploaderLogin}</td>
                <td className='px-3 py-2 text-[var(--color-ink-soft)]'>{new Date(image.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className='px-3 py-2'>
                  <button
                    type='button'
                    disabled={deleting === image.id}
                    onClick={() => handleDelete(image.id)}
                    className='rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 transition hover:bg-red-100 disabled:opacity-50'>
                    {deleting === image.id ? '删除中' : '永久删除'}
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
