'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: '仪表盘' },
  { href: '/admin/images', label: '图片管理' },
  { href: '/admin/users', label: '用户管理' },
  { href: '/admin/settings', label: '系统设置' },
  { href: '/admin/logs', label: '操作日志' },
]

export function AdminNav() {
  const pathname = usePathname()

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
