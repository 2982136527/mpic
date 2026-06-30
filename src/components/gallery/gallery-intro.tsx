'use client'

import { useLang } from '@/lib/i18n/context'

export function GalleryIntro() {
  const { t } = useLang()

  if (!t.gallery?.intro) return null

  return (
    <p className='mb-6 text-balance text-center text-sm leading-relaxed text-[var(--color-ink-soft)]'>
      {t.gallery.intro}
    </p>
  )
}
