'use client'

import { useEffect, useRef, useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { getPublicImageSourceCandidates } from '@/lib/image-links'

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
      <img
        ref={imageRef}
        src={currentSrc}
        alt={image.filename}
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
    </button>
  )
}
