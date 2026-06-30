import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getImage } from '@/lib/services/image-service'
import { buildImageLinks } from '@/lib/services/image-service'
import { getPreferredPublicImageSource } from '@/lib/image-links'
import { getSiteUrl, siteMeta } from '@/lib/site'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ImageViewClient } from './image-view-client'

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
  if (image.exif?.camera) {
    parts.push(`Shot with ${image.exif.camera}`)
    if (image.exif.lens) parts.push(`on ${image.exif.lens}`)
  }
  parts.push(`Uploaded by ${image.uploaderLogin}`)
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    name: image.title || image.filename,
    description: `Image by ${image.uploaderLogin}`,
    uploadDate: image.createdAt,
    ...(image.width && image.height ? { width: image.width, height: image.height } : {}),
  }

  return (
    <div className='relative min-h-screen pb-8' data-theme-scope='public'>
      <BlurGradientBackground />
      <SiteHeader />

      <main className='mx-auto w-full max-w-5xl px-5 sm:px-8'>
        <ImageViewClient image={image} links={links} imageId={id} siteUrl={siteUrl} />
      </main>

      <SiteFooter />

      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
