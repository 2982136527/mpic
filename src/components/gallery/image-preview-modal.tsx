'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { getImageSourceLabel } from '@/lib/image-source'
import { getPublicImageSourceCandidates } from '@/lib/image-links'
import { formatBytes } from '@/lib/utils'
import { useLang } from '@/lib/i18n/context'

type Props = {
  images: (ImageRecord & { links: ImageLinks })[]
  index: number
  onNavigate: (index: number) => void
  onClose: () => void
}

export function ImagePreviewModal({ images, index, onNavigate, onClose }: Props) {
  const image = images[index]
  const [copied, setCopied] = useState<string | null>(null)
  const [entering, setEntering] = useState(false)
  const [sourceIndex, setSourceIndex] = useState(0)
  const { t, lang } = useLang()
  const sourceCandidates = getPublicImageSourceCandidates(image.links)
  const sourceSignature = sourceCandidates.join('|')
  const currentSrc = sourceCandidates[sourceIndex] || ''
  const title = image.title || image.filename
  const sourceLabel = getImageSourceLabel(image.sourceProvider)

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => setEntering(true))
  }, [])

  useEffect(() => {
    setSourceIndex(0)
  }, [sourceSignature, index])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && index < images.length - 1) onNavigate(index + 1)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [index, images.length, onClose, onNavigate])

  const locale = lang === 'zh' ? 'zh-CN' : 'en-US'

  const linkFormats = image.storageKind === 'external'
    ? [
        ...(image.links.raw ? [{ label: t.gallery.directLink, value: image.links.raw }] : []),
        ...(image.links.cdn ? [{ label: t.gallery.proxyLink, value: image.links.cdn }] : []),
        ...(image.sourcePageUrl ? [{ label: t.gallery.sourcePage, value: image.sourcePageUrl }] : []),
        ...(image.links.markdown ? [{ label: 'Markdown', value: image.links.markdown }] : []),
      ]
    : [
        { label: t.gallery.cdn, value: image.links.cdn },
        { label: t.gallery.original, value: image.links.raw },
        ...(image.links.customCdn ? [{ label: t.gallery.customCdn, value: image.links.customCdn }] : []),
        ...(image.links.markdown ? [{ label: 'Markdown', value: image.links.markdown }] : []),
      ]

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      onClick={onClose}
      style={{
        opacity: entering ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        style={{
          opacity: entering ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      <div
        className='relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl md:flex-row'
        onClick={e => e.stopPropagation()}
        style={{
          opacity: entering ? 1 : 0,
          transform: entering ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(16px)',
          transition: 'opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className='flex flex-1 items-center justify-center bg-black/5 p-4'>
          <img
            src={currentSrc}
            alt={title}
            onError={() => {
              if (sourceIndex < sourceCandidates.length - 1) {
                setSourceIndex(prev => prev + 1)
              }
            }}
            className='max-h-[70vh] max-w-full object-contain'
          />
        </div>

        <div className='w-full overflow-y-auto p-5 md:w-80'>
          <div className='mb-4 flex items-start justify-between'>
            <h3 className='text-sm font-semibold text-[var(--color-ink)]'>{t.gallery.imageDetails}</h3>
            <button type='button' onClick={onClose} className='text-xl text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition'>&times;</button>
          </div>

          {image.title && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.title}</p>
              <p className='mb-3 break-all text-sm text-[var(--color-ink)]'>{image.title}</p>
            </>
          )}

          <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.filename}</p>
          <p className='mb-3 break-all text-sm text-[var(--color-ink)]'>{image.filename}</p>

          <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.info}</p>
          <p className='mb-3 text-sm text-[var(--color-ink)]'>
            {image.storageKind === 'external' ? t.gallery.external : formatBytes(image.size)}
            {image.width && image.height && ` · ${image.width}×${image.height}`}
          </p>

          {sourceLabel && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.source}</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>{sourceLabel}</p>
            </>
          )}

          <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.uploader}</p>
          <p className='mb-3 text-sm text-[var(--color-ink)]'>{image.uploaderLogin}</p>

          <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.uploadTime}</p>
          <p className='mb-3 text-sm text-[var(--color-ink)]'>{new Date(image.createdAt).toLocaleString(locale)}</p>

          {image.exif?.shootDate && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.takenTime}</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>{new Date(image.exif.shootDate).toLocaleString(locale)}</p>
            </>
          )}

          {image.exif?.camera && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.camera}</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>{image.exif.camera}</p>
            </>
          )}

          {image.exif?.lens && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.lens}</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>{image.exif.lens}</p>
            </>
          )}

          {(image.exif?.aperture || image.exif?.shutterSpeed || image.exif?.iso || image.exif?.focalLength) && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.shootingParams}</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>
                {[image.exif.focalLength, image.exif.aperture, image.exif.shutterSpeed, image.exif.iso && `ISO ${image.exif.iso}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </>
          )}

          {image.exif?.location && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.location}</p>
              <p className='mb-3 text-sm text-[var(--color-ink)]'>
                {image.exif.location.lat.toFixed(6)}, {image.exif.location.lng.toFixed(6)}
              </p>
            </>
          )}

          {image.tags && image.tags.length > 0 && (
            <>
              <p className='mb-1 text-xs text-[var(--color-ink-soft)]'>{t.gallery.tags}</p>
              <div className='mb-3 flex flex-wrap gap-1.5'>
                {image.tags.map(tag => (
                  <span
                    key={tag}
                    className='rounded-full bg-[var(--color-brand)]/10 px-2 py-1 text-[11px] text-[var(--color-brand-strong)]'
                  >
                    #{tag}
                  </span>
                ))}
              </div>
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
                    {copied === fmt.label ? t.common.copied : t.common.copy}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className='mt-4 flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={async () => {
                const pageUrl = `${window.location.origin}/image/${image.id}`
                if (navigator.share) {
                  try {
                    await navigator.share({ title: image.title || image.filename, url: pageUrl })
                  } catch {}
                } else {
                  await copyToClipboard(pageUrl, 'share')
                }
              }}
              className='rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--color-brand-strong)]'>
              {copied === 'share' ? t.common.copied : t.common.share}
            </button>
            <a
              href={`/image/${image.id}`}
              target='_blank'
              rel='noopener noreferrer'
              className='rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink)] transition hover:border-[var(--color-brand)]'>
              {t.common.viewInGallery}
            </a>
          </div>

          <div className='mt-4 flex gap-2'>
            {index > 0 && (
              <button type='button' onClick={() => onNavigate(index - 1)} className='rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink)] transition hover:border-[var(--color-brand)]'>
                {t.gallery.prevImage}
              </button>
            )}
            {index < images.length - 1 && (
              <button type='button' onClick={() => onNavigate(index + 1)} className='rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink)] transition hover:border-[var(--color-brand)]'>
                {t.gallery.nextImage}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
