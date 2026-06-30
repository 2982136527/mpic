'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/context'
import { GlassCard } from '@/components/ui/glass-card'

const features = [
  'featurePixiv',
  'featureExif',
  'featureGallery',
  'featureUpload',
  'featureMulti',
  'featureOpen',
] as const

export function AboutContent() {
  const { t } = useLang()

  return (
    <div className='mt-8 space-y-8'>
      <GlassCard>
        <h1 className='text-2xl font-title text-[var(--color-ink)]'>{t.about.title}</h1>
        <p
          className='mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]'
          dangerouslySetInnerHTML={{ __html: t.about.intro }}
        />
      </GlassCard>

      <GlassCard>
        <h2 className='text-lg font-title text-[var(--color-ink)]'>{t.about.features}</h2>
        <ul className='mt-4 space-y-4'>
          {features.map(key => (
            <li key={key} className='text-sm leading-relaxed text-[var(--color-ink-soft)]'>
              <span dangerouslySetInnerHTML={{ __html: t.about[key] }} />
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard>
        <h2 className='text-lg font-title text-[var(--color-ink)]'>{t.about.forWho}</h2>
        <p className='mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]'>
          {t.about.forWhoDesc}
        </p>
      </GlassCard>

      <GlassCard>
        <h2 className='text-lg font-title text-[var(--color-ink)]'>{t.about.startTitle}</h2>
        <p className='mt-3 text-sm text-[var(--color-ink-soft)]'>{t.about.startDesc}</p>
        <div className='mt-5 flex flex-wrap gap-3'>
          <Link
            href='/'
            className='rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-brand-strong)]'
          >
            {t.about.exploreGallery}
          </Link>
          <Link
            href='/login'
            className='rounded-full border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] px-5 py-2 text-sm text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]'
          >
            {t.about.loginToUpload}
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
