'use client'

import { useLang } from '@/lib/i18n/context'

export function SiteFooterText() {
  const { t } = useLang()
  return (
    <p>
      MPic &mdash; {t.nav.siteDesc}{' '}
      <a href='https://github.com/2982136527/mpic' target='_blank' rel='noopener noreferrer' className='underline transition hover:text-[var(--color-brand)]'>
        GitHub
      </a>
    </p>
  )
}
