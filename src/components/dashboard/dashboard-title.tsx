'use client'

import { useLang } from '@/lib/i18n/context'

export function DashboardTitle({ login }: { login: string }) {
  const { t } = useLang()
  return (
    <div className='mb-6'>
      <h2 className='font-title text-3xl text-[var(--color-ink)]'>{t.dashboard.pageTitle}</h2>
      <p className='mt-1 text-sm text-[var(--color-ink-soft)]'>@{login}</p>
    </div>
  )
}
