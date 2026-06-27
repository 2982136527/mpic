'use client'

import { useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { formatBytes } from '@/lib/utils'

type Props = {
  images: (ImageRecord & { links: ImageLinks })[]
  onDelete: (id: string) => Promise<void>
}

export function MyImagesList({ images: initialImages, onDelete }: Props) {
  const [images, setImages] = useState(initialImages)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这张图片？')) return
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

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  if (images.length === 0) {
    return <p className='py-8 text-center text-sm text-[var(--color-ink-soft)]'>暂无上传记录</p>
  }

  return (
    <div className='space-y-2'>
      {images.map(image => (
        <div key={image.id} className='flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 p-3 backdrop-blur'>
          <img src={image.links.cdn} alt='' className='h-14 w-14 shrink-0 rounded-xl object-cover' />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium text-[var(--color-ink)]'>{image.filename}</p>
            <p className='text-xs text-[var(--color-ink-soft)]'>{formatBytes(image.size)} · {new Date(image.createdAt).toLocaleDateString('zh-CN')}</p>
          </div>
          <div className='flex shrink-0 gap-2'>
            <button
              type='button'
              onClick={() => handleCopy(image.links.cdn, image.id)}
              className='rounded-lg border border-[var(--color-border-strong)] bg-white px-2 py-1 text-xs text-[var(--color-ink)] transition hover:border-[var(--color-brand)]'>
              {copied === image.id ? '已复制' : '复制链接'}
            </button>
            <button
              type='button'
              disabled={deleting === image.id}
              onClick={() => handleDelete(image.id)}
              className='rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 transition hover:bg-red-100 disabled:opacity-50'>
              {deleting === image.id ? '删除中' : '删除'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
