'use client'

import { useEffect, useRef, useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { getPublicImageSourceCandidates } from '@/lib/image-links'
import { getImageSourceLabel, isPixivImageRecord } from '@/lib/image-source'

type Props = {
  image: ImageRecord & { links: ImageLinks }
  onClick: () => void
  priority?: boolean
}

export function ImageCard({ image, onClick, priority = false }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [sourceIndex, setSourceIndex] = useState(0)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const sourceCandidates = getPublicImageSourceCandidates(image.links)
  const sourceSignature = sourceCandidates.join('|')
  const currentSrc = sourceCandidates[sourceIndex] || ''
  const width = image.width || 4
  const height = image.height || 5
  const title = image.title || image.filename
  const isPixiv = isPixivImageRecord(image)
  const sourceLabel = getImageSourceLabel(image.sourceProvider)
  const previewTags = image.tags?.slice(0, 3) || []
  const showSourceBadge = Boolean(sourceLabel) && !isPixiv
  const showPreviewMeta = !isPixiv && (Boolean(image.title) || previewTags.length > 0)

  useEffect(() => {
    setLoaded(false)
    setSourceIndex(0)
  }, [sourceSignature])

  useEffect(() => {
    const node = imageRef.current
    if (node?.complete) {
      setLoaded(true)
    }
  }, [currentSrc])

  return (
    <button
      type='button'
      onClick={onClick}
      className='group relative mb-4 block w-full overflow-hidden rounded-2xl bg-[var(--glass-bg)] text-left shadow-sm break-inside-avoid transition-shadow hover:shadow-lg'
    >
      <div
        aria-hidden='true'
        className={`absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(240,198,157,0.16))] transition-opacity duration-300 ${loaded ? 'opacity-0' : 'opacity-100'}`}
      />
      {showSourceBadge && (
        <div className='pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium tracking-[0.08em] text-white/95 backdrop-blur-sm'>
          {sourceLabel}
        </div>
      )}
      <img
        ref={imageRef}
        src={currentSrc}
        alt={title}
        loading={priority ? 'eager' : 'lazy'}
        decoding='async'
        fetchPriority={priority ? 'high' : 'auto'}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (sourceIndex < sourceCandidates.length - 1) {
            setLoaded(false)
            setSourceIndex(prev => prev + 1)
            return
          }
          setLoaded(true)
        }}
        className={`relative block h-auto w-full transition-[opacity,transform] duration-500 group-hover:scale-[1.03] ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {showPreviewMeta && (
        <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-10 text-white'>
          {image.title && (
            <p className='truncate text-xs font-medium tracking-[0.02em] text-white/95'>{image.title}</p>
          )}
          {previewTags.length > 0 && (
            <div className='mt-2 flex flex-wrap gap-1'>
              {previewTags.map(tag => (
                <span
                  key={tag}
                  className='rounded-full bg-white/18 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-sm'
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  )
}
