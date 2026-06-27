'use client'

import { useState } from 'react'
import type { SiteSettings } from '@/types/settings'

type Props = {
  settings: SiteSettings
  onSave: (changes: Partial<SiteSettings>) => Promise<void>
}

export function AdminSettingsForm({ settings, onSave }: Props) {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await onSave(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-4'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>站点设置</h3>
        <label className='block text-xs text-[var(--color-ink-soft)]'>
          站点名称
          <input
            value={form.siteName}
            onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))}
            className='mt-1 w-full rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
          />
        </label>
        <label className='block text-xs text-[var(--color-ink-soft)]'>
          站点描述
          <input
            value={form.siteDescription}
            onChange={e => setForm(f => ({ ...f, siteDescription: e.target.value }))}
            className='mt-1 w-full rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
          />
        </label>
      </div>

      <div className='space-y-4'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>上传设置</h3>
        <label className='block text-xs text-[var(--color-ink-soft)]'>
          单文件最大体积 (MB)
          <input
            type='number'
            value={Math.round(form.maxFileSizeBytes / 1024 / 1024)}
            onChange={e => setForm(f => ({ ...f, maxFileSizeBytes: Number(e.target.value) * 1024 * 1024 }))}
            className='mt-1 w-full rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
          />
        </label>
        <label className='block text-xs text-[var(--color-ink-soft)]'>
          新用户默认配额 (MB)
          <input
            type='number'
            value={Math.round(form.defaultQuotaBytes / 1024 / 1024)}
            onChange={e => setForm(f => ({ ...f, defaultQuotaBytes: Number(e.target.value) * 1024 * 1024 }))}
            className='mt-1 w-full rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
          />
        </label>
        <label className='flex items-center gap-2 text-xs text-[var(--color-ink-soft)]'>
          <input
            type='checkbox'
            checked={form.allowRegistration}
            onChange={e => setForm(f => ({ ...f, allowRegistration: e.target.checked }))}
            className='rounded'
          />
          允许新用户注册
        </label>
        <label className='flex items-center gap-2 text-xs text-[var(--color-ink-soft)]'>
          <input
            type='checkbox'
            checked={form.enableCompress}
            onChange={e => setForm(f => ({ ...f, enableCompress: e.target.checked }))}
            className='rounded'
          />
          默认开启前端压缩
        </label>
      </div>

      <div className='space-y-4'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>CDN 设置</h3>
        <label className='block text-xs text-[var(--color-ink-soft)]'>
          自定义 CDN 域名前缀
          <input
            value={form.cdnBaseUrl}
            onChange={e => setForm(f => ({ ...f, cdnBaseUrl: e.target.value }))}
            placeholder='https://cdn.example.com'
            className='mt-1 w-full rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
          />
        </label>
      </div>

      <div className='flex items-center gap-3'>
        <button
          type='submit'
          disabled={saving}
          className='rounded-xl bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50'>
          {saving ? '保存中...' : '保存设置'}
        </button>
        {saved && <span className='text-xs text-green-600'>已保存</span>}
      </div>
    </form>
  )
}
