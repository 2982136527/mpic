'use client'

import type { SiteSettings } from '@/types/settings'
import { AdminSettingsForm } from '@/components/admin/admin-settings-form'

type Props = {
  settings: SiteSettings
}

export function AdminSettingsPage({ settings }: Props) {
  const handleSave = async (changes: Partial<SiteSettings>) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    if (!res.ok) throw new Error('Save failed')
  }

  return (
    <div className='space-y-5'>
      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <h2 className='font-title text-3xl text-[var(--color-ink)]'>系统设置</h2>
        <p className='text-sm text-[var(--color-ink-soft)]'>全局配置项</p>
      </section>

      <section className='rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur'>
        <AdminSettingsForm settings={settings} onSave={handleSave} />
      </section>
    </div>
  )
}
