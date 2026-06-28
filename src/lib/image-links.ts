import type { ImageLinks } from '@/types/image'

export function getPublicImageSourceCandidates(links: ImageLinks): string[] {
  if (links.displayCandidates && links.displayCandidates.length > 0) {
    return Array.from(new Set(links.displayCandidates.filter(Boolean)))
  }
  return Array.from(new Set([links.customCdn, links.cdn, links.raw].filter(Boolean)))
}

export function getPreferredPublicImageSource(links: ImageLinks): string {
  return getPublicImageSourceCandidates(links)[0] || ''
}
