import Link from 'next/link'
import { UserMenu } from '@/components/auth/user-menu'

export function SiteHeader() {
  return (
    <header className='relative z-50 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 pb-3 sm:px-8 sm:pt-8 animate-fade-in-up'>
      <div>
        <Link href='/' className='font-title text-3xl leading-none tracking-tight text-[var(--color-ink)] transition hover:text-[var(--color-brand)]'>
          Mpic
        </Link>
        <p className='mt-1 text-sm text-[var(--color-ink-soft)]'>公开相册图床</p>
      </div>

      <div className='flex items-center gap-3'>
        <UserMenu />
      </div>
    </header>
  )
}
