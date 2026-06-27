import { formatBytes } from '@/lib/utils'

type Props = {
  totalImages: number
  totalSize: number
  totalUsers: number
  todayUploads: number
}

export function AdminStatsCard({ totalImages, totalSize, totalUsers, todayUploads }: Props) {
  const stats = [
    { label: '总图片数', value: String(totalImages) },
    { label: '总存储', value: formatBytes(totalSize) },
    { label: '注册用户', value: String(totalUsers) },
    { label: '今日上传', value: String(todayUploads) },
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-4'>
      {stats.map(stat => (
        <div key={stat.label} className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
          <p className='text-xs text-[var(--color-ink-soft)]'>{stat.label}</p>
          <p className='mt-1 text-2xl font-semibold text-[var(--color-ink)]'>{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
