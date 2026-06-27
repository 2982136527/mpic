'use client'

import { useLang } from '@/lib/i18n/context'

type Props = {
  total: number
}

export function AdminImagesHeader({ total }: Props) {
  const { t } = useLang()
  return (
    <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
      <h2 className='font-title text-3xl text-[var(--color-ink)]'>{t.admin.imageManage}</h2>
      <p className='text-sm text-[var(--color-ink-soft)]'>{t.admin.totalImagesCount(total)}</p>
    </section>
  )
}
