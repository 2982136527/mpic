import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { listImages, buildImageLinks } from '@/lib/services/image-service'
import { getSiteUrl, siteMeta } from '@/lib/site'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ImageGrid } from '@/components/gallery/image-grid'
import type { ImageRecord, ImageLinks } from '@/types/image'

type ImageWithLinks = ImageRecord & { links: ImageLinks }

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const siteUrl = getSiteUrl()

  return {
    title: `${decodedTag} Images`,
    description: `Browse ${decodedTag} images and artwork on ${siteMeta.name} — free ACG image hosting and photo sharing platform.`,
    openGraph: {
      title: `${decodedTag} Images · ${siteMeta.name}`,
      description: `Browse ${decodedTag} images on ${siteMeta.name}.`,
      url: `${siteUrl}/tag/${tag}`,
      siteName: siteMeta.name,
    },
    alternates: {
      canonical: `${siteUrl}/tag/${tag}`,
    },
  }
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)

  const result = await listImages({ pageSize: 60, publicOnly: true, search: decodedTag })
  const images: ImageWithLinks[] = result.images.map(img => ({ ...img, links: buildImageLinks(img) }))

  if (images.length === 0) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${decodedTag} Images`,
    description: `Collection of ${decodedTag} images on ${siteMeta.name}`,
    url: `${getSiteUrl()}/tag/${tag}`,
    numberOfItems: result.total,
  }

  return (
    <div className='relative min-h-screen pb-8' data-theme-scope='public'>
      <BlurGradientBackground />
      <SiteHeader />

      <main className='mx-auto w-full max-w-6xl px-5 sm:px-8'>
        <div className='mb-6 animate-fade-in-up'>
          <h1 className='font-title text-2xl text-[var(--color-ink)]'>{decodedTag}</h1>
          <p className='mt-1 text-sm text-[var(--color-ink-soft)]'>
            {result.total} {result.total === 1 ? 'image' : 'images'}
          </p>
        </div>

        <Suspense>
          <ImageGrid images={images} />
        </Suspense>
      </main>

      <SiteFooter />

      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
