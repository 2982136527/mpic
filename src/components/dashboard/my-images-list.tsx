'use client'

import { useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import type { AlbumRecord } from '@/types/album'
import { formatBytes } from '@/lib/utils'

type Props = {
  images: (ImageRecord & { links: ImageLinks })[]
  albums?: AlbumRecord[]
  onDelete: (id: string) => Promise<void>
  onTogglePrivacy?: (id: string, isPublic: boolean) => Promise<void>
  onMoveToAlbum?: (id: string, albumId: string | null) => Promise<void>
}

export function MyImagesList({ images, albums = [], onDelete, onTogglePrivacy, onMoveToAlbum }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [movingAlbum, setMovingAlbum] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这张图片？')) return
    setDeleting(id)
    try {
      await onDelete(id)
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

  const handleTogglePrivacy = async (id: string, currentIsPublic: boolean) => {
    if (!onTogglePrivacy) return
    const newIsPublic = !currentIsPublic
    await onTogglePrivacy(id, newIsPublic)
  }

  const handleMoveToAlbum = async (imageId: string, albumId: string | null) => {
    if (!onMoveToAlbum) return
    await onMoveToAlbum(imageId, albumId)
    setMovingAlbum(null)
  }

  const getAlbumName = (albumId?: string) => {
    if (!albumId) return '未分组'
    return albums.find(a => a.id === albumId)?.name || '未知相册'
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
            <div className='flex items-center gap-2'>
              <p className='truncate text-sm font-medium text-[var(--color-ink)]'>{image.filename}</p>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                image.isPublic !== false
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {image.isPublic !== false ? '公开' : '隐私'}
              </span>
            </div>
            <p className='text-xs text-[var(--color-ink-soft)]'>
              {formatBytes(image.size)} · {new Date(image.createdAt).toLocaleDateString('zh-CN')}
              {image.albumId && ` · ${getAlbumName(image.albumId)}`}
            </p>
          </div>
          <div className='flex shrink-0 flex-wrap items-center gap-1.5'>
            {onTogglePrivacy && (
              <button
                type='button'
                onClick={() => handleTogglePrivacy(image.id, image.isPublic !== false)}
                className={`rounded-lg border px-2 py-1 text-xs transition ${
                  image.isPublic !== false
                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}>
                {image.isPublic !== false ? '设为隐私' : '设为公开'}
              </button>
            )}
            {onMoveToAlbum && (
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setMovingAlbum(movingAlbum === image.id ? null : image.id)}
                  className='rounded-lg border border-[var(--color-border-strong)] bg-white px-2 py-1 text-xs text-[var(--color-ink)] transition hover:border-[var(--color-brand)]'>
                  移动
                </button>
                {movingAlbum === image.id && (
                  <div className='absolute right-0 top-full z-10 mt-1 w-36 rounded-xl border border-[var(--glass-border)] bg-white p-1 shadow-lg'>
                    <button
                      type='button'
                      onClick={() => handleMoveToAlbum(image.id, null)}
                      className='w-full rounded-lg px-2 py-1 text-left text-xs text-[var(--color-ink)] hover:bg-gray-100'>
                      未分组
                    </button>
                    {albums.map(a => (
                      <button
                        key={a.id}
                        type='button'
                        onClick={() => handleMoveToAlbum(image.id, a.id)}
                        className='w-full rounded-lg px-2 py-1 text-left text-xs text-[var(--color-ink)] hover:bg-gray-100'>
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
