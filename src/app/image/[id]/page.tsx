import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getImage, buildImageLinks } from '@/lib/services/image-service'
import { listImages } from '@/lib/services/image-service'
import { getPreferredPublicImageSource } from '@/lib/image-links'
import { getSiteUrl, siteMeta } from '@/lib/site'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ImageViewClient } from './image-view-client'
import type { ImageRecord, ImageLinks } from '@/types/image'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const image = await getImage(id, { publicOnly: true })
  if (!image) return {}

  const links = buildImageLinks(image)
  const imageUrl = getPreferredPublicImageSource(links)
  const siteUrl = getSiteUrl()
  const title = image.title || image.filename

  const parts: string[] = []
  if (image.tags && image.tags.length > 0) {
    parts.push(image.tags.join(', '))
  }
  if (image.exif?.camera) {
    parts.push(`Shot with ${image.exif.camera}`)
    if (image.exif.lens) parts.push(`on ${image.exif.lens}`)
  }
  parts.push(`by ${image.uploaderLogin}`)
  const description = parts.join(' · ')

  const ogImage = imageUrl
    ? {
        url: imageUrl,
        width: image.width ?? undefined,
        height: image.height ?? undefined,
      }
    : undefined

  return {
    title,
    description,
    openGraph: {
      title: `${title} · ${siteMeta.name}`,
      description,
      type: 'article',
      url: `${siteUrl}/image/${id}`,
      images: ogImage ? [ogImage] : [],
      siteName: siteMeta.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${siteMeta.name}`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

export default async function ImagePage({ params }: Props) {
  const { id } = await params
  const image = await getImage(id, { publicOnly: true })
  if (!image) notFound()

  const links = buildImageLinks(image)
  const imageUrl = getPreferredPublicImageSource(links)
  const siteUrl = getSiteUrl()
  const pageTitle = image.title || image.filename

  // Fetch recent images for crawlable cross-linking
  let relatedImages: (ImageRecord & { links: ImageLinks })[] = []
  try {
    const result = await listImages({ pageSize: 7, publicOnly: true })
    relatedImages = result.images
      .filter(img => img.id !== id)
      .slice(0, 6)
      .map(img => ({ ...img, links: buildImageLinks(img) }))
  } catch {}

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ImageObject',
        contentUrl: imageUrl,
        name: pageTitle,
        description: `Image by ${image.uploaderLogin}`,
        uploadDate: image.createdAt,
        ...(image.tags && image.tags.length > 0 ? { keywords: image.tags.join(', ') } : {}),
        ...(image.width && image.height ? { width: image.width, height: image.height } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: siteMeta.name, item: siteUrl },
          { '@type': 'ListItem', position: 2, name: pageTitle, item: `${siteUrl}/image/${id}` },
        ],
      },
    ],
  }

  return (
    <div className='relative min-h-screen pb-8' data-theme-scope='public'>
      <BlurGradientBackground />
      <SiteHeader />

      <main className='mx-auto w-full max-w-5xl px-5 sm:px-8'>
        <ImageViewClient image={image} links={links} imageId={id} siteUrl={siteUrl} relatedImages={relatedImages} />
      </main>

      <SiteFooter />

      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
