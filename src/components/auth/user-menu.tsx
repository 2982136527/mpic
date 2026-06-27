'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { useLang } from '@/lib/i18n/context'

type SessionData = {
  user?: {
    login?: string
    role?: string
    image?: string
  }
}

export function UserMenu() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLang()

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user?.login) setSession(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!session?.user?.login) {
    return (
      <Link
        href='/login'
        className='rounded-full border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] shadow-sm transition hover:text-[var(--color-ink)]'>
        {t.nav.login}
      </Link>
    )
  }

  return (
    <div className='relative' ref={ref}>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='flex items-center gap-2 rounded-full border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] shadow-sm transition hover:text-[var(--color-ink)]'>
        {session.user.image && (
          <img src={session.user.image} alt='' className='h-5 w-5 rounded-full' />
        )}
        <span>{session.user.login}</span>
      </button>

      {open && (
        <div
          className='absolute right-0 z-[100] mt-2 w-40 origin-top-right overflow-hidden rounded-xl border border-[var(--glass-border)] bg-white/95 py-1 shadow-xl backdrop-blur-xl'
          style={{ animation: 'jelly-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          <Link href='/dashboard' onClick={() => setOpen(false)} className='block px-4 py-2 text-sm text-[var(--color-ink)] transition hover:bg-[var(--color-brand)]/10'>
            {t.nav.dashboard}
          </Link>
          {session.user.role === 'admin' && (
            <Link href='/admin' onClick={() => setOpen(false)} className='block px-4 py-2 text-sm text-[var(--color-ink)] transition hover:bg-[var(--color-brand)]/10'>
              {t.nav.admin}
            </Link>
          )}
          <button
            type='button'
            onClick={() => signOut({ callbackUrl: '/' })}
            className='block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50'>
            {t.nav.signOut}
          </button>
        </div>
      )}
    </div>
  )
}
