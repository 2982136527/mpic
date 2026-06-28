'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/context'
import { GitHubSignInButton } from '@/components/auth/github-signin-button'

const ERROR_LABELS: Record<string, string> = {
  AccessDenied: 'accessDenied',
  Callback: 'callbackFailed',
  OAuthCallback: 'oauthCallbackFailed',
  OAuthSignin: 'oauthSigninFailed',
  OAuthCreateAccount: 'oauthCreateAccountFailed',
  OAuthAccountNotLinked: 'oauthAccountNotLinked',
  Configuration: 'configurationFailed',
  Default: 'loginFailed',
  github: 'githubSigninFailed',
}

export function LoginForm({ callbackUrl, error }: { callbackUrl: string; error?: string }) {
  const { t } = useLang()
  const errorKey = error ? (ERROR_LABELS[error] || ERROR_LABELS.Default) : null
  return (
    <>
      <h2 className='font-title text-4xl text-[var(--color-ink)]'>{t.auth.loginTitle}</h2>
      <p className='mt-3 text-sm leading-6 text-[var(--color-ink-soft)]'>
        {t.auth.loginDesc}
      </p>

      {errorKey && (
        <div className='mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {t.auth[errorKey as keyof typeof t.auth]}
        </div>
      )}

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
