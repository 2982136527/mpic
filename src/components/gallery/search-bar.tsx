'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') || '')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const params = new URLSearchParams()
      if (value.trim()) params.set('search', value.trim())
      router.push(`/?${params.toString()}`)
    },
    [value, router],
  )

  return (
    <form onSubmit={handleSubmit} className='flex gap-2'>
      <input
        type='text'
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder='搜索图片...'
        className='flex-1 rounded-xl border border-[var(--color-border-strong)] bg-white/80 px-4 py-2 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]'
      />
      <button
        type='submit'
        className='rounded-xl bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-brand-strong)]'>
        搜索
      </button>
    </form>
  )
}
