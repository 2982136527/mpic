'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/context'
import { GitHubSignInButton } from '@/components/auth/github-signin-button'

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const { t } = useLang()
  return (
    <>
      <h2 className='font-title text-4xl text-[var(--color-ink)]'>{t.auth.loginTitle}</h2>
      <p className='mt-3 text-sm leading-6 text-[var(--color-ink-soft)]'>
        {t.auth.loginDesc}
      </p>

      <div className='mt-6 flex flex-wrap gap-3'>
        <GitHubSignInButton callbackUrl={callbackUrl} />
        <Link
          href='/'
          className='rounded-xl border border-[var(--color-border-strong)] bg-white px-5 py-2 text-sm text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]'>
          {t.common.backHome}
        </Link>
      </div>
    </>
  )
}
