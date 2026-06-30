'use client'

import { useLang } from '@/lib/i18n/context'

export function SiteDesc() {
  const { t } = useLang()
  return <p className='mt-1 text-left text-sm text-[var(--color-ink-soft)]'>{t.nav.siteDesc}</p>
}
