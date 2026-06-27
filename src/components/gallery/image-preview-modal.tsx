'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { formatBytes } from '@/lib/utils'

type Props = {
  images: (ImageRecord & { links: ImageLinks })[]
  index: number
  onNavigate: (index: number) => void
  onClose: () => void
}

export function ImagePreviewModal({ images, index, onNavigate, onClose }: Props) {
  const image = images[index]
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && index < images.length - 1) onNavigate(index + 1)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [index, images.length, onClose, onNavigate])

  const linkFormats = [
    { label: 'CDN 加速', value: image.links.cdn },
    { label: '原始链接', value: image.links.raw },
    ...(image.links.customCdn ? [{ label: '自定义 CDN', value: image.links.customCdn }] : []),
    { label: 'Markdown', value: image.links.markdown },
  ]

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4' onClick={onClose}>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

      <div
        className='relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl md:flex-row'
        onClick={e => e.stopPropagation()}>
        <div className='flex flex-1 items-center justify-center bg-black/5 p-4'>
          <img src={image.links.cdn} alt={image.filename} className='max-h-[70vh] max-w-full object-contain' />
        </div>

        <div className='w-full overflow-y-auto p-5 md:w-80'>
          <div className='mb-4 flex items-start justify-between'>
            <h3 className='text-sm font-semibold text-[var(--color-ink)]'>图片详情</h3>
            <button type='button' onClick={onClose} className='text-xl text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'>&times;</button>
          </div>

          <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>文件名</p>
          <p className='mb-3 break-all text-sm text-[var(--color-ink)]'>{image.filename}</p>

          <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>信息</p>
          <p className='mb-3 text-sm text-[var(--color-ink)]'>
            {formatBytes(image.size)}
            {image.width && image.height && ` · ${image.width}×${image.height}`}
          </p>

          <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>上传者</p>
          <p className='mb-3 text-sm text-[var(--color-ink)]'>{image.uploaderLogin}</p>

          <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>上传时间</p>
          <p className='mb-3 text-sm text-[var(--color-ink)]'>{new Date(image.createdAt).toLocaleString('zh-CN')}</p>

          {image.exif?.shootDate && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>拍摄时间</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>{new Date(image.exif.shootDate).toLocaleString('zh-CN')}</p>
            </>
          )}

          {image.exif?.camera && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>相机</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>{image.exif.camera}</p>
            </>
          )}

          {image.exif?.lens && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>镜头</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>{image.exif.lens}</p>
            </>
          )}

          {(image.exif?.aperture || image.exif?.shutterSpeed || image.exif?.iso || image.exif?.focalLength) && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>拍摄参数</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>
                {[image.exif.focalLength, image.exif.aperture, image.exif.shutterSpeed, image.exif.iso && `ISO ${image.exif.iso}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </>
          )}

          {image.exif?.location && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>位置</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>
                {image.exif.location.lat.toFixed(6)}, {image.exif.location.lng.toFixed(6)}
              </p>
            </>
          )}

          <div className='space-y-2'>
            {linkFormats.map(fmt => (
              <div key={fmt.label}>
                <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{fmt.label}</p>
                <div className='flex gap-2'>
                  <input
                    readOnly
                    value={fmt.value}
                    className='flex-1 truncate rounded-lg border border-[var(--color-border-strong)] bg-white px-2 py-1.5 text-xs text-[var(--color-ink)]'
                  />
                  <button
                    type='button'
                    onClick={() => copyToClipboard(fmt.value, fmt.label)}
                    className='shrink-0 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--color-brand-strong)]'>
                    {copied === fmt.label ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className='mt-4 flex gap-2'>
            {index > 0 && (
              <button type='button' onClick={() => onNavigate(index - 1)} className='rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink)]'>
                上一张
              </button>
            )}
            {index < images.length - 1 && (
              <button type='button' onClick={() => onNavigate(index + 1)} className='rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink)]'>
                下一张
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
