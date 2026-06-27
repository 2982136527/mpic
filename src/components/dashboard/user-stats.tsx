'use client'

import { formatBytes } from '@/lib/utils'

type Props = {
  imageCount: number
  totalSize: number
  quotaBytes: number
}

export function UserStats({ imageCount, totalSize, quotaBytes }: Props) {
  const usagePercent = quotaBytes > 0 ? Math.min(100, (totalSize / quotaBytes) * 100) : 0

  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      <div className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <p className='text-xs text-[var(--color-ink-soft)]'>图片总数</p>
        <p className='mt-1 text-2xl font-semibold text-[var(--color-ink)]'>{imageCount}</p>
      </div>

      <div className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <p className='text-xs text-[var(--color-ink-soft)]'>已用存储</p>
        <p className='mt-1 text-2xl font-semibold text-[var(--color-ink)]'>{formatBytes(totalSize)}</p>
      </div>

      <div className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <p className='text-xs text-[var(--color-ink-soft)]'>存储配额</p>
        <p className='mt-1 text-2xl font-semibold text-[var(--color-ink)]'>{formatBytes(quotaBytes)}</p>
        <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-strong)]'>
          <div
            className='h-full rounded-full bg-[var(--color-brand)] transition-all'
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className='mt-1 text-[10px] text-[var(--color-ink-soft)]'>{usagePercent.toFixed(1)}% 已使用</p>
      </div>
    </div>
  )
}
