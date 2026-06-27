'use client'

import { useLang } from '@/lib/i18n/context'

export function AdminNoPermission() {
  const { t } = useLang()
  return (
    <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
      {t.admin.noPermissionDesc}
    </div>
  )
}
