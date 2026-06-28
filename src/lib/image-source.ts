import type { ImageRecord } from '@/types/image'

export function isPixivImageRecord(image: Pick<ImageRecord, 'sourceProvider'>): boolean {
  return image.sourceProvider === 'pixiv'
}

export function getImageSourceLabel(provider?: string): string {
  if (!provider) return ''
  if (provider === 'pixiv') return 'Pixiv'
  return provider
}
