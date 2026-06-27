'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'

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

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user?.login) setSession(data) })
      .catch(() => {})
  }, [])

  if (!session?.user?.login) {
    return (
      <Link
        href='/login'
        className='rounded-full border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] shadow-sm transition hover:text-[var(--color-ink)]'>
        登录
      </Link>
    )
  }

  return (
    <div className='relative'>
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
        <>
          <div className='fixed inset-0 z-40' onClick={() => setOpen(false)} />
          <div className='absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-[var(--glass-border)] bg-white/90 py-1 shadow-lg backdrop-blur'>
            <Link href='/dashboard' onClick={() => setOpen(false)} className='block px-4 py-2 text-sm text-[var(--color-ink)] hover:bg-[var(--color-bg)]'>
              个人中心
            </Link>
            {session.user.role === 'admin' && (
              <Link href='/admin' onClick={() => setOpen(false)} className='block px-4 py-2 text-sm text-[var(--color-ink)] hover:bg-[var(--color-bg)]'>
                管理后台
              </Link>
            )}
            <button
              type='button'
              onClick={() => signOut({ callbackUrl: '/' })}
              className='block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50'>
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  )
}
