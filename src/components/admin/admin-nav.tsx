'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/i18n/context'

export function AdminNav() {
  const pathname = usePathname()
  const { t } = useLang()

  const links = [
    { href: '/admin', label: t.admin.dashboard },
    { href: '/admin/images', label: t.admin.imageManage },
    { href: '/admin/users', label: t.admin.userManage },
    { href: '/admin/crawl', label: t.admin.crawlManage },
    { href: '/admin/access', label: t.admin.accessLogs },
    { href: '/admin/settings', label: t.admin.settings },
    { href: '/admin/docs', label: t.admin.docs },
    { href: '/admin/logs', label: t.admin.logs },
  ]

  return (
    <nav className='flex flex-wrap gap-2'>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm transition',
            pathname === link.href
              ? 'bg-[var(--color-brand)] text-white'
              : 'border border-[var(--color-border-strong)] bg-white text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]',
          )}>
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
