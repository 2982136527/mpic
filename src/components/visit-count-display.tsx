'use client'

import { useEffect, useState } from 'react'

export function VisitCountDisplay() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/visit/count', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.count != null) setCount(data.count) })
      .catch(() => {})
  }, [])

  return (
    <span className='flex items-center gap-1 text-xs text-[var(--color-ink-soft)]' title='页面访问次数'>
      <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/>
        <circle cx='12' cy='12' r='3'/>
      </svg>
      {count === null ? '—' : count < 1000 ? count : `${(count / 1000).toFixed(1)}k`}
    </span>
  )
}
