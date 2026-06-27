'use client'

import { useCallback, useRef, useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import { formatBytes } from '@/lib/utils'

type UploadResult = {
  image: ImageRecord
  links: ImageLinks
  isDuplicate: boolean
}

type Props = {
  onUploaded: (result: UploadResult) => void
}

export function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      setUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)

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
    [onUploaded],
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
    <div>
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
            上传中...
          </div>
        ) : (
          <>
            <p className='text-sm font-medium text-[var(--color-ink)]'>点击选择、拖拽或粘贴图片</p>
            <p className='mt-1 text-xs text-[var(--color-ink-soft)]'>支持 JPG / PNG / WebP / GIF</p>
          </>
        )}
      </div>

      {error && (
        <p className='mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'>{error}</p>
      )}
    </div>
  )
}
