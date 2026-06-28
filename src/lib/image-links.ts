import type { ImageLinks } from '@/types/image'

export function getPublicImageSourceCandidates(links: ImageLinks): string[] {
  return Array.from(new Set([links.customCdn, links.cdn, links.raw].filter(Boolean)))
}

export function getPreferredPublicImageSource(links: ImageLinks): string {
  return getPublicImageSourceCandidates(links)[0] || ''
}
