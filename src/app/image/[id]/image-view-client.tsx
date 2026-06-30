'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { useLang } from '@/lib/i18n/context'
import { getPreferredPublicImageSource } from '@/lib/image-links'
import { formatBytes } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'

type Props = {
  image: ImageRecord
  links: ImageLinks
  imageId: string
  siteUrl: string
}

export function ImageViewClient({ image, links, imageId, siteUrl }: Props) {
  const { t } = useLang()
  const displayUrl = getPreferredPublicImageSource(links)
  const [imgError, setImgError] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {}
  }, [])

  const handleShare = useCallback(async () => {
    const shareUrl = `${siteUrl}/image/${imageId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title || image.filename,
          text: image.title || image.filename,
          url: shareUrl,
        })
      } catch {}
    } else {
      copyToClipboard(shareUrl, 'share')
    }
  }, [siteUrl, imageId, image.title, image.filename, copyToClipboard])

  const linkFormats = [
    { label: t.gallery.cdn || 'CDN', key: 'cdn', url: links.cdn },
    { label: t.gallery.original || 'Original', key: 'original', url: links.raw },
    { label: 'Markdown', key: 'markdown', url: links.markdown },
  ].filter(l => l.url)

  return (
    <div className='mt-6 space-y-6'>
      <GlassCard className='overflow-hidden p-0'>
        {displayUrl && !imgError ? (
          <img
            src={displayUrl}
            alt={image.title || image.filename}
            className='mx-auto max-h-[70vh] w-full object-contain'
            onError={() => setImgError(true)}
          />
        ) : (
          <div className='flex h-64 items-center justify-center text-[var(--color-ink-soft)]'>
            Failed to load image
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <Link href='/' className='inline-flex items-center gap-1 text-sm text-[var(--color-brand)] transition hover:text-[var(--color-brand-strong)]'>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M19 12H5'/><polyline points='12 19 5 12 12 5'/></svg>
          {t.common?.viewInGallery || 'Back to Gallery'}
        </Link>

        <div className='mt-4'>
          {image.title && (
            <h1 className='text-xl font-semibold'>{image.title}</h1>
          )}
          <p className='mt-0.5 text-sm text-[var(--color-ink-soft)]'>{image.filename}</p>
        </div>

        <div className='mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm'>
          {image.width && image.height && (
            <>
              <span className='text-[var(--color-ink-soft)]'>{t.gallery.info || 'Info'}</span>
              <span>{image.width} &times; {image.height} &middot; {formatBytes(image.size)}</span>
            </>
          )}
          {image.uploaderLogin && (
            <>
              <span className='text-[var(--color-ink-soft)]'>{t.gallery.uploader || 'Uploader'}</span>
              <span>{image.uploaderLogin}</span>
            </>
          )}
          <span className='text-[var(--color-ink-soft)]'>{t.gallery.uploadTime || 'Upload time'}</span>
          <span>{new Date(image.createdAt).toLocaleDateString()}</span>
          {image.exif?.camera && (
            <>
              <span className='text-[var(--color-ink-soft)]'>{t.gallery.camera || 'Camera'}</span>
              <span>{image.exif.camera}{image.exif.lens ? ` + ${image.exif.lens}` : ''}</span>
            </>
          )}
          {image.exif?.iso && image.exif?.aperture && image.exif?.shutterSpeed && (
            <>
              <span className='text-[var(--color-ink-soft)]'>{t.gallery.shootingParams || 'Parameters'}</span>
              <span>{image.exif.focalLength || ''} {image.exif.aperture} {image.exif.shutterSpeed} ISO{image.exif.iso}</span>
            </>
          )}
          {image.sourceProvider && (
            <>
              <span className='text-[var(--color-ink-soft)]'>{t.gallery.source || 'Source'}</span>
              <span className='truncate'>
                {image.sourceProvider}
                {image.sourcePageUrl && (
                  <a href={image.sourcePageUrl} target='_blank' rel='noopener noreferrer' className='ml-1.5 text-[var(--color-brand)] hover:underline'>
                    {t.gallery.sourcePage || 'View source'}
                  </a>
                )}
              </span>
            </>
          )}
        </div>

        {image.tags && image.tags.length > 0 && (
          <div className='mt-4 flex flex-wrap gap-2'>
            {image.tags.map(tag => (
              <span key={tag} className='rounded-full bg-[var(--glass-bg-strong)] px-2.5 py-0.5 text-xs text-[var(--color-ink-soft)]'>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className='mt-6 flex flex-wrap gap-3'>
          <button
            type='button'
            onClick={() => copyToClipboard(displayUrl || links.cdn || links.raw, 'link')}
            className='rounded-full border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] px-4 py-1.5 text-sm text-[var(--color-ink-soft)] shadow-sm transition hover:text-[var(--color-ink)] active:scale-95'
          >
            {copiedField === 'link' ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            type='button'
            onClick={handleShare}
            className='rounded-full border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] px-4 py-1.5 text-sm text-[var(--color-ink-soft)] shadow-sm transition hover:text-[var(--color-ink)] active:scale-95'
          >
            Share
          </button>
        </div>

        {linkFormats.length > 0 && (
          <div className='mt-6 space-y-2 border-t border-[var(--glass-border)] pt-4'>
            <p className='text-xs text-[var(--color-ink-soft)]'>{t.common?.linkFormats || 'Link formats'}</p>
            <div className='space-y-1.5'>
              {linkFormats.map(({ label, key, url }) => (
                <div key={key} className='flex items-center gap-2'>
                  <span className='w-16 shrink-0 text-xs text-[var(--color-ink-soft)]'>{label}</span>
                  <input
                    readOnly
                    value={url}
                    className='min-w-0 flex-1 truncate rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-1 text-xs text-[var(--color-ink-soft)] outline-none'
                  />
                  <button
                    type='button'
                    onClick={() => copyToClipboard(url, key)}
                    className='shrink-0 text-xs text-[var(--color-brand)] transition hover:text-[var(--color-brand-strong)]'
                  >
                    {copiedField === key ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
