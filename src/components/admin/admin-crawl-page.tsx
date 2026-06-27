'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CrawlConfig, CrawlSource, CrawlLogEntry } from '@/types/crawl'
import { useLang } from '@/lib/i18n/context'

type Props = {
  config: CrawlConfig
}

type SourceFormState = {
  name: string
  url: string
  category: 'anime' | 'real'
  responseType: 'redirect' | 'json' | 'direct'
  jsonPath: string
}

const EMPTY_SOURCE_FORM: SourceFormState = {
  name: '',
  url: '',
  category: 'anime',
  responseType: 'redirect',
  jsonPath: '',
}

export function AdminCrawlPage({ config }: Props) {
  const { t } = useLang()
  const [form, setForm] = useState(config)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sourceForm, setSourceForm] = useState<SourceFormState>(EMPTY_SOURCE_FORM)
  const [showForm, setShowForm] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [logs, setLogs] = useState<CrawlLogEntry[]>([])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crawl/logs')
      if (!res.ok) return
      const data = await res.json()
      setLogs(data.logs || [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/crawl', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert(t.admin.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleRunNow = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/admin/crawl/run', { method: 'POST' })
      if (!res.ok) throw new Error('Run failed')
      const data = await res.json()
      const r = data.result
      setRunResult(t.admin.crawlResults(r.fetched, r.duplicates, r.errors))
      fetchLogs()
    } catch {
      alert(t.common.operationFailed)
    } finally {
      setRunning(false)
    }
  }

  const toggleSource = (id: string) => {
    setForm(f => ({
      ...f,
      sources: f.sources.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }))
  }

  const toggleCategory = (category: 'anime' | 'real', enabled: boolean) => {
    setForm(f => ({
      ...f,
      sources: f.sources.map(s => (s.category === category ? { ...s, enabled } : s)),
    }))
  }

  const openAddForm = () => {
    setEditingId(null)
    setSourceForm(EMPTY_SOURCE_FORM)
    setShowForm(true)
  }

  const openEditForm = (source: CrawlSource) => {
    setEditingId(source.id)
    setSourceForm({
      name: source.name,
      url: source.url,
      category: source.category,
      responseType: source.responseType,
      jsonPath: source.jsonPath || '',
    })
    setShowForm(true)
  }

  const handleSourceFormSubmit = () => {
    if (!sourceForm.name || !sourceForm.url) return

    if (editingId) {
      setForm(f => ({
        ...f,
        sources: f.sources.map(s =>
          s.id === editingId
            ? { ...s, ...sourceForm, jsonPath: sourceForm.responseType === 'json' ? sourceForm.jsonPath : undefined }
            : s,
        ),
      }))
    } else {
      const newSource: CrawlSource = {
        id: `src_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        ...sourceForm,
        jsonPath: sourceForm.responseType === 'json' ? sourceForm.jsonPath : undefined,
        enabled: true,
      }
      setForm(f => ({ ...f, sources: [...f.sources, newSource] }))
    }

    setShowForm(false)
    setEditingId(null)
    setSourceForm(EMPTY_SOURCE_FORM)
  }

  const deleteSource = (id: string) => {
    if (!confirm(t.admin.crawlConfirmDelete)) return
    setForm(f => ({ ...f, sources: f.sources.filter(s => s.id !== id) }))
  }

  const handleTest = async () => {
    if (!sourceForm.url) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/crawl/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceForm.url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Test failed')

      const r = data
      setSourceForm(f => ({
        ...f,
        responseType: r.responseType === 'unknown' ? f.responseType : r.responseType,
        jsonPath: r.suggestedPath || f.jsonPath,
      }))

      const info = [
        `类型: ${r.responseType}`,
        `状态码: ${r.status}`,
        r.contentType ? `Content-Type: ${r.contentType}` : '',
        r.location ? `跳转: ${r.location}` : '',
        r.suggestedPath ? `JSON路径: ${r.suggestedPath}` : '',
        r.suggestedUrl ? `图片URL: ${r.suggestedUrl}` : '',
      ].filter(Boolean).join(' | ')
      setTestResult(info)
    } catch (err) {
      setTestResult(`失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setTesting(false)
    }
  }

  const animeSources = form.sources.filter(s => s.category === 'anime')
  const realSources = form.sources.filter(s => s.category === 'real')

  return (
    <div className='space-y-6'>
      {/* Global Settings */}
      <div className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>{t.admin.crawlSettings}</h3>

        <div className='mt-4 space-y-4'>
          <label className='flex items-center gap-2 text-xs text-[var(--color-ink-soft)]'>
            <input
              type='checkbox'
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className='rounded'
            />
            {t.admin.crawlEnabled}
          </label>

          <label className='block text-xs text-[var(--color-ink-soft)]'>
            {t.admin.crawlInterval}
            <input
              type='number'
              value={form.intervalMinutes}
              onChange={e => setForm(f => ({ ...f, intervalMinutes: Number(e.target.value) }))}
              min={0}
              className='mt-1 w-40 rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
            />
            <span className='ml-2 text-[10px] text-[var(--color-ink-soft)] opacity-60'>{t.admin.crawlIntervalHint}</span>
          </label>

          <label className='block text-xs text-[var(--color-ink-soft)]'>
            {t.admin.crawlBatchSize}
            <input
              type='number'
              value={form.batchSize}
              onChange={e => setForm(f => ({ ...f, batchSize: Number(e.target.value) }))}
              min={1}
              max={50}
              className='mt-1 w-40 rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
            />
          </label>

          <p className='text-xs text-[var(--color-ink-soft)]'>
            {t.admin.crawlLastRun}：{form.lastRunAt ? new Date(form.lastRunAt).toLocaleString() : t.admin.crawlNeverRun}
          </p>
        </div>

        <div className='mt-4 flex items-center gap-3'>
          <button
            type='button'
            onClick={handleSave}
            disabled={saving}
            className='rounded-xl bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50'>
            {saving ? t.admin.saving : t.admin.saveSettings}
          </button>
          {saved && <span className='text-xs text-green-600'>{t.common.saved}</span>}
        </div>
      </div>

      {/* Run Now */}
      <div className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={handleRunNow}
            disabled={running}
            className='rounded-xl bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50'>
            {running ? t.admin.crawlRunning : t.admin.crawlRunNow}
          </button>
          {runResult && <span className='text-xs text-[var(--color-ink-soft)]'>{runResult}</span>}
        </div>
      </div>

      {/* Add Source Button */}
      <div className='flex justify-end'>
        <button
          type='button'
          onClick={openAddForm}
          className='rounded-xl bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]'>
          + {t.admin.crawlAddSource}
        </button>
      </div>

      {/* Source Form Modal */}
      {showForm && (
        <div className='rounded-2xl border border-[var(--color-brand)] bg-white p-5 shadow-lg'>
          <h3 className='text-sm font-semibold text-[var(--color-ink)]'>
            {editingId ? t.admin.crawlEditSource : t.admin.crawlSourceForm}
          </h3>

          <div className='mt-3 space-y-3'>
            <input
              value={sourceForm.name}
              onChange={e => setSourceForm(f => ({ ...f, name: e.target.value }))}
              placeholder={t.admin.crawlNamePlaceholder}
              className='w-full rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
            />
            <input
              value={sourceForm.url}
              onChange={e => setSourceForm(f => ({ ...f, url: e.target.value }))}
              placeholder={t.admin.crawlUrlPlaceholder}
              className='w-full rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
            />
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={handleTest}
                disabled={testing || !sourceForm.url}
                className='rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-xs text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)] disabled:opacity-50'>
                {testing ? '...' : '探测'}
              </button>
              {testResult && <span className='text-xs text-[var(--color-ink-soft)]'>{testResult}</span>}
            </div>
            <div className='flex gap-3'>
              <select
                value={sourceForm.category}
                onChange={e => setSourceForm(f => ({ ...f, category: e.target.value as 'anime' | 'real' }))}
                className='rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'>
                <option value='anime'>{t.admin.crawlCategoryAnime}</option>
                <option value='real'>{t.admin.crawlCategoryReal}</option>
              </select>
              <select
                value={sourceForm.responseType}
                onChange={e => setSourceForm(f => ({ ...f, responseType: e.target.value as 'redirect' | 'json' | 'direct' }))}
                className='rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'>
                <option value='redirect'>redirect</option>
                <option value='json'>json</option>
                <option value='direct'>direct</option>
              </select>
            </div>
            {sourceForm.responseType === 'json' && (
              <input
                value={sourceForm.jsonPath}
                onChange={e => setSourceForm(f => ({ ...f, jsonPath: e.target.value }))}
                placeholder={t.admin.crawlJsonPathPlaceholder}
                className='w-full rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none'
              />
            )}
          </div>

          <div className='mt-4 flex gap-2'>
            <button
              type='button'
              onClick={handleSourceFormSubmit}
              disabled={!sourceForm.name || !sourceForm.url}
              className='rounded-xl bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50'>
              {t.common.confirm}
            </button>
            <button
              type='button'
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className='rounded-xl border border-[var(--color-border-strong)] bg-white px-4 py-2 text-sm text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]'>
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Anime Sources */}
      <SourcesTable
        title={t.admin.crawlCategoryAnime}
        sources={animeSources}
        onToggle={toggleSource}
        onToggleAll={enabled => toggleCategory('anime', enabled)}
        onEdit={openEditForm}
        onDelete={deleteSource}
        t={t}
      />

      {/* Real Sources */}
      <SourcesTable
        title={t.admin.crawlCategoryReal}
        sources={realSources}
        onToggle={toggleSource}
        onToggleAll={enabled => toggleCategory('real', enabled)}
        onEdit={openEditForm}
        onDelete={deleteSource}
        t={t}
      />

      {/* Crawl Logs */}
      <div className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>{t.admin.crawlLogs}</h3>

        {logs.length === 0 ? (
          <p className='mt-3 text-xs text-[var(--color-ink-soft)]'>{t.admin.crawlNoLogs}</p>
        ) : (
          <div className='mt-3 overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead>
                <tr className='border-b border-[var(--color-border)] text-[var(--color-ink-soft)]'>
                  <th className='pb-2 pr-3 font-medium'>{t.admin.crawlLogTime}</th>
                  <th className='pb-2 pr-3 font-medium'>{t.admin.crawlLogDuration}</th>
                  <th className='pb-2 pr-3 font-medium'>{t.admin.crawlLogFetched}</th>
                  <th className='pb-2 pr-3 font-medium'>{t.admin.crawlLogDuplicates}</th>
                  <th className='pb-2 pr-3 font-medium'>{t.admin.crawlLogErrors}</th>
                  <th className='pb-2 font-medium'>{t.admin.crawlLogSources}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className='border-b border-[var(--color-border)] last:border-0'>
                    <td className='py-2 pr-3 text-[var(--color-ink)]'>{new Date(log.startedAt).toLocaleString()}</td>
                    <td className='py-2 pr-3 text-[var(--color-ink-soft)]'>{(log.duration / 1000).toFixed(1)}s</td>
                    <td className='py-2 pr-3 font-medium text-green-600'>{log.fetched}</td>
                    <td className='py-2 pr-3 text-[var(--color-ink-soft)]'>{log.duplicates}</td>
                    <td className='py-2 pr-3 text-red-500'>{log.errors}</td>
                    <td className='py-2 text-[var(--color-ink-soft)]'>
                      {log.sources.filter(s => s.fetched > 0 || s.errors > 0).map(s => s.name).join(', ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SourcesTable({
  title,
  sources,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  t,
}: {
  title: string
  sources: CrawlSource[]
  onToggle: (id: string) => void
  onToggleAll: (enabled: boolean) => void
  onEdit: (source: CrawlSource) => void
  onDelete: (id: string) => void
  t: ReturnType<typeof useLang>['t']
}) {
  const enabledCount = sources.filter(s => s.enabled).length

  return (
    <div className='rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>
          {title} ({enabledCount}/{sources.length})
        </h3>
        <div className='flex gap-2 text-xs'>
          <button type='button' onClick={() => onToggleAll(true)} className='text-[var(--color-brand)] hover:underline'>
            {t.common.all}
          </button>
          <span className='text-[var(--color-ink-soft)]'>/</span>
          <button type='button' onClick={() => onToggleAll(false)} className='text-[var(--color-ink-soft)] hover:underline'>
            {t.common.cancel}
          </button>
        </div>
      </div>

      <div className='mt-3 overflow-x-auto'>
        <table className='w-full text-left text-xs'>
          <thead>
            <tr className='border-b border-[var(--color-border)] text-[var(--color-ink-soft)]'>
              <th className='pb-2 pr-3 font-medium'>{t.admin.crawlSourceEnabled}</th>
              <th className='pb-2 pr-3 font-medium'>{t.admin.crawlSourceName}</th>
              <th className='pb-2 pr-3 font-medium'>{t.admin.crawlSourceUrl}</th>
              <th className='pb-2 pr-3 font-medium'>{t.admin.crawlResponseType}</th>
              <th className='pb-2 font-medium'>{t.common.edit}</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(source => (
              <tr key={source.id} className='border-b border-[var(--color-border)] last:border-0'>
                <td className='py-2 pr-3'>
                  <input type='checkbox' checked={source.enabled} onChange={() => onToggle(source.id)} className='rounded' />
                </td>
                <td className='py-2 pr-3 text-[var(--color-ink)]'>{source.name}</td>
                <td className='max-w-[280px] truncate py-2 pr-3 text-[var(--color-ink-soft)]'>{source.url}</td>
                <td className='py-2 pr-3 text-[var(--color-ink-soft)]'>{source.responseType}</td>
                <td className='py-2'>
                  <div className='flex gap-2'>
                    <button type='button' onClick={() => onEdit(source)} className='text-[var(--color-brand)] hover:underline'>
                      {t.admin.crawlEditSource}
                    </button>
                    <button type='button' onClick={() => onDelete(source.id)} className='text-red-500 hover:underline'>
                      {t.admin.crawlDeleteSource}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
