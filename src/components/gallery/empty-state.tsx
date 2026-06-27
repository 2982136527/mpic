'use client'

import { useLang } from '@/lib/i18n/context'

export function EmptyState() {
  const { t } = useLang()
  return (
    <div className='rounded-2xl border border-white/70 bg-white/60 py-20 text-center backdrop-blur'>
      <p className='text-lg font-title text-[var(--color-ink)]'>{t.gallery.welcomeTitle}</p>
      <p className='mt-2 text-sm text-[var(--color-ink-soft)]'>{t.gallery.welcomeDesc}</p>
    </div>
  )
}
