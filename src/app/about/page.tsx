import type { Metadata } from 'next'
import { getSiteUrl, siteMeta } from '@/lib/site'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AboutContent } from './about-content'

export const metadata: Metadata = {
  title: 'About',
  description:
    `Learn about ${siteMeta.name} — a free ACG image hosting and photo sharing platform with Pixiv proxy support, EXIF data viewing, and a public gallery for artists and photographers.`,
  openGraph: {
    title: `About · ${siteMeta.name}`,
    description: `Learn about ${siteMeta.name}, the free ACG image hosting and sharing platform.`,
    url: `${getSiteUrl()}/about`,
  },
}

export default function AboutPage() {
  return (
    <div className='relative min-h-screen pb-8' data-theme-scope='public'>
      <BlurGradientBackground />
      <SiteHeader />

      <main className='mx-auto w-full max-w-3xl px-5 sm:px-8'>
        <AboutContent />
      </main>

      <SiteFooter />
    </div>
  )
}
