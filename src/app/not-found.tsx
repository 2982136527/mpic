'use client'

import Link from 'next/link'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { GlassCard } from '@/components/ui/glass-card'

export default function NotFound() {
  return (
    <div className='relative flex min-h-screen items-center justify-center' data-theme-scope='public'>
      <BlurGradientBackground />

      <GlassCard className='mx-5 max-w-md text-center'>
        <h1 className='font-title text-4xl text-[var(--color-ink)]'>404</h1>
        <p className='mt-2 text-sm text-[var(--color-ink-soft)]'>
          The page you&rsquo;re looking for doesn&rsquo;t exist.
        </p>
        <Link
          href='/'
          className='mt-6 inline-block rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-brand-strong)]'
        >
          Back to Gallery
        </Link>
      </GlassCard>
    </div>
  )
}
