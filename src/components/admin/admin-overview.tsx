'use client'

import { useLang } from '@/lib/i18n/context'

export function AdminOverview({ login }: { login: string }) {
  const { t } = useLang()
  return (
    <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
      <h2 className='font-title text-3xl text-[var(--color-ink)]'>{t.admin.overview}</h2>
      <p className='text-sm text-[var(--color-ink-soft)]'>{t.admin.adminLabel(login)}</p>
    </section>
  )
}
