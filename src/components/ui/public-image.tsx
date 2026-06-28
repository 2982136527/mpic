'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ImgHTMLAttributes, SyntheticEvent } from 'react'
import type { ImageLinks } from '@/types/image'
import { getPublicImageSourceCandidates } from '@/lib/image-links'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  links: ImageLinks
}

export function PublicImage({ links, onError, ...props }: Props) {
  const sourceCandidates = useMemo(
    () => getPublicImageSourceCandidates(links),
    [links.customCdn, links.cdn, links.raw],
  )
  const [sourceIndex, setSourceIndex] = useState(0)
  const sourceSignature = sourceCandidates.join('|')

  useEffect(() => {
    setSourceIndex(0)
  }, [sourceSignature])

  const handleError = useCallback(
    (event: SyntheticEvent<HTMLImageElement, Event>) => {
      if (sourceIndex < sourceCandidates.length - 1) {
        setSourceIndex(prev => prev + 1)
        return
      }

      onError?.(event)
    },
    [onError, sourceCandidates.length, sourceIndex],
  )

  return <img {...props} src={sourceCandidates[sourceIndex] || ''} onError={handleError} />
}
