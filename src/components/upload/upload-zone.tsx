'use client'

import { useCallback, useRef, useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import type { AlbumRecord } from '@/types/album'
import { useLang } from '@/lib/i18n/context'

type UploadResult = {
  image: ImageRecord
  links: ImageLinks
  isDuplicate: boolean
}

type Props = {
  onUploaded: (result: UploadResult) => void
  albums?: AlbumRecord[]
  selectedAlbumId?: string | null
}

export function UploadZone({ onUploaded, albums = [], selectedAlbumId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [albumId, setAlbumId] = useState<string>('')
  const { t } = useLang()

  const effectiveAlbumId = selectedAlbumId || albumId

  const currentAlbumName = effectiveAlbumId
    ? albums.find(a => a.id === effectiveAlbumId)?.name || t.common.ungrouped
    : t.common.ungrouped

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      setUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)
        if (effectiveAlbumId) formData.append('albumId', effectiveAlbumId)
        formData.append('isPublic', String(isPublic))

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error?.message || 'Upload failed')
        }

        onUploaded(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [onUploaded, effectiveAlbumId, isPublic],
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      for (const file of Array.from(files)) {
        upload(file)
      }
    },
    [upload],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items)
      const imageItem = items.find(item => item.type.startsWith('image/'))
      if (imageItem) {
        const file = imageItem.getAsFile()
        if (file) upload(file)
      }
    },
    [upload],
  )

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-3'>
        {!selectedAlbumId && albums.length > 0 && (
          <div className='flex items-center gap-2'>
            <label className='text-xs text-[var(--color-ink-soft)]'>{t.upload.album}</label>
            <select
              value={albumId}
              onChange={e => setAlbumId(e.target.value)}
              className='rounded-lg border border-[var(--color-border-strong)] bg-white px-2 py-1 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)]'>
              <option value=''>{t.common.ungrouped}</option>
              {albums.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}
        {selectedAlbumId && (
          <span className='rounded-full bg-[var(--color-brand)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand)]'>
            {t.upload.uploadTo(currentAlbumName)}
          </span>
        )}
        <div className='flex items-center gap-2'>
          <label className='text-xs text-[var(--color-ink-soft)]'>{t.upload.visibility}</label>
          <button
            type='button'
            onClick={() => setIsPublic(!isPublic)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
              isPublic
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
            {isPublic ? t.common.publicLabel : t.common.privateLabel}
          </button>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onPaste={handlePaste}
        tabIndex={0}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5'
            : 'border-[var(--color-border-strong)] bg-white/50 hover:border-[var(--color-brand)]'
        }`}
        onClick={() => inputRef.current?.click()}>
        <input
          ref={inputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp,image/gif'
          multiple
          className='hidden'
          onChange={e => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className='flex items-center justify-center gap-2 text-sm text-[var(--color-ink-soft)]'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent' />
            {t.upload.uploading}
          </div>
        ) : (
          <>
            <p className='text-sm font-medium text-[var(--color-ink)]'>{t.upload.dragOrClick}</p>
            <p className='mt-1 text-xs text-[var(--color-ink-soft)]'>{t.upload.fileHint}</p>
          </>
        )}
      </div>

      {error && (
        <p className='mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'>{error}</p>
      )}
    </div>
  )
}
