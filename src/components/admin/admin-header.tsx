'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/context'
import { LangToggle } from '@/components/lang-toggle'

export function AdminHeader() {
  const { t } = useLang()
  return (
    <header className='mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-7 pb-5 sm:px-8'>
      <div>
        <h1 className='font-title text-3xl text-[var(--color-ink)]'>MPic Admin</h1>
        <p className='text-sm text-[var(--color-ink-soft)]'>{t.admin.pageTitle}</p>
      </div>

      <div className='flex items-center gap-3'>
        <LangToggle />
        <nav className='flex items-center gap-3 text-sm text-[var(--color-ink-soft)]'>
          <Link href='/' className='transition hover:text-[var(--color-ink)]'>
            {t.nav.frontend}
          </Link>
          <Link href='/dashboard' className='transition hover:text-[var(--color-ink)]'>
            {t.nav.dashboard}
          </Link>
        </nav>
      </div>
    </header>
  )
}
