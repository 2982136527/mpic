'use client'

import { signIn } from 'next-auth/react'
import { useLang } from '@/lib/i18n/context'

type Props = {
  callbackUrl?: string
  label?: string
}

export function GitHubSignInButton({ callbackUrl = '/', label }: Props) {
  const { t } = useLang()
  return (
    <button
      type='button'
      onClick={() => signIn('github', { callbackUrl })}
      className='rounded-xl bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]'>
      {label || t.auth.githubSignIn}
    </button>
  )
}
