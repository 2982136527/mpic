import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'
import { listImages } from '@/lib/services/image-service'
import { getPreferredPublicImageSource } from '@/lib/image-links'
import { buildImageLinks } from '@/lib/services/image-service'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    const result = await listImages({ pageSize: 1000, publicOnly: true })
    const imagePages: MetadataRoute.Sitemap = result.images.map(image => {
      const links = buildImageLinks(image)
      const imageUrl = getPreferredPublicImageSource(links)
      return {
        url: `${siteUrl}/image/${image.id}`,
        lastModified: new Date(image.createdAt),
        changeFrequency: 'monthly',
        priority: 0.6,
        images: imageUrl ? [imageUrl] : undefined,
      }
    })

    return [...staticPages, ...imagePages]
  } catch {
    return staticPages
  }
}
