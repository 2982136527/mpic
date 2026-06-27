'use client'

import { formatBytes } from '@/lib/utils'
import { useLang } from '@/lib/i18n/context'

type Props = {
  imageCount: number
  totalSize: number
  quotaBytes: number
}

export function UserStats({ imageCount, totalSize, quotaBytes }: Props) {
  const usagePercent = quotaBytes > 0 ? Math.min(100, (totalSize / quotaBytes) * 100) : 0
  const { t } = useLang()

  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      <div className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <p className='text-xs text-[var(--color-ink-soft)]'>{t.dashboard.totalImages}</p>
        <p className='mt-1 text-2xl font-semibold text-[var(--color-ink)]'>{imageCount}</p>
      </div>

      <div className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <p className='text-xs text-[var(--color-ink-soft)]'>{t.dashboard.usedStorage}</p>
        <p className='mt-1 text-2xl font-semibold text-[var(--color-ink)]'>{formatBytes(totalSize)}</p>
      </div>

      <div className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <p className='text-xs text-[var(--color-ink-soft)]'>{t.dashboard.storageQuotaLabel}</p>
        <p className='mt-1 text-2xl font-semibold text-[var(--color-ink)]'>{formatBytes(quotaBytes)}</p>
        <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-strong)]'>
          <div
            className='h-full rounded-full bg-[var(--color-brand)] transition-all'
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className='mt-1 text-[10px] text-[var(--color-ink-soft)]'>{t.dashboard.usedPercent(usagePercent.toFixed(1))}</p>
      </div>
    </div>
  )
}
