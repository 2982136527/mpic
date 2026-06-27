'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useLang } from '@/lib/i18n/context'

export function AdminImagesActions() {
  const { t } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    router.push(`/admin/images?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className='flex gap-2 rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t.gallery.searchPlaceholder}
        className='flex-1 rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
      />
      <button type='submit' className='rounded-xl bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-strong)]'>
        {t.common.search}
      </button>
    </form>
  )
}
