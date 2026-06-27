'use client'

import { useState } from 'react'
import type { AlbumRecord } from '@/types/album'

type Props = {
  albums: AlbumRecord[]
  selectedAlbumId: string | null
  onSelect: (albumId: string | null) => void
  onCreate: (name: string, isPublic: boolean) => Promise<void>
  onUpdate: (id: string, changes: Partial<Pick<AlbumRecord, 'name' | 'isPublic'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function AlbumManager({ albums, selectedAlbumId, onSelect, onCreate, onUpdate, onDelete }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIsPublic, setNewIsPublic] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      await onCreate(newName.trim(), newIsPublic)
      setNewName('')
      setNewIsPublic(true)
      setShowCreate(false)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    setLoading(true)
    try {
      await onUpdate(id, { name: editName.trim(), isPublic: editIsPublic })
      setEditingId(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除相册「${name}」？相册内的图片不会被删除，将变为未分组。`)) return
    setLoading(true)
    try {
      await onDelete(id)
      if (selectedAlbumId === id) onSelect(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-[var(--color-ink)]'>相册管理</h3>
        <button
          type='button'
          onClick={() => setShowCreate(!showCreate)}
          className='rounded-lg bg-[var(--color-brand)] px-3 py-1 text-xs font-medium text-white transition hover:bg-[var(--color-brand-strong)]'>
          新建相册
        </button>
      </div>

      {showCreate && (
        <div className='rounded-xl border border-[var(--glass-border)] bg-white/80 p-3 backdrop-blur'>
          <input
            type='text'
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder='相册名称'
            className='mb-2 w-full rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)]'
          />
          <div className='mb-2 flex items-center gap-3'>
            <label className='flex items-center gap-1.5 text-xs text-[var(--color-ink)]'>
              <input type='radio' name='newPublic' checked={newIsPublic} onChange={() => setNewIsPublic(true)} />
              公开
            </label>
            <label className='flex items-center gap-1.5 text-xs text-[var(--color-ink)]'>
              <input type='radio' name='newPublic' checked={!newIsPublic} onChange={() => setNewIsPublic(false)} />
              隐私
            </label>
          </div>
          <div className='flex gap-2'>
            <button
              type='button'
              disabled={loading || !newName.trim()}
              onClick={handleCreate}
              className='rounded-lg bg-[var(--color-brand)] px-3 py-1 text-xs font-medium text-white disabled:opacity-50'>
              创建
            </button>
            <button
              type='button'
              onClick={() => setShowCreate(false)}
              className='rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-1 text-xs text-[var(--color-ink)]'>
              取消
            </button>
          </div>
        </div>
      )}

      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={() => onSelect(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            selectedAlbumId === null
              ? 'bg-[var(--color-brand)] text-white'
              : 'border border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)]'
          }`}>
          全部
        </button>
        <button
          type='button'
          onClick={() => onSelect('')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            selectedAlbumId === ''
              ? 'bg-[var(--color-brand)] text-white'
              : 'border border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)]'
          }`}>
          未分组
        </button>
        {albums.map(album => (
          <div key={album.id} className='relative'>
            {editingId === album.id ? (
              <div className='flex items-center gap-1 rounded-full border border-[var(--color-brand)] bg-white px-2 py-1'>
                <input
                  type='text'
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className='w-20 text-xs outline-none'
                  autoFocus
                />
                <button type='button' onClick={() => setEditIsPublic(!editIsPublic)} className='text-xs'>
                  {editIsPublic ? '公开' : '隐私'}
                </button>
                <button type='button' onClick={() => handleUpdate(album.id)} disabled={loading} className='text-xs text-[var(--color-brand)]'>
                  保存
                </button>
                <button type='button' onClick={() => setEditingId(null)} className='text-xs text-[var(--color-ink-soft)]'>
                  取消
                </button>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => onSelect(album.id)}
                onDoubleClick={() => { setEditingId(album.id); setEditName(album.name); setEditIsPublic(album.isPublic) }}
                className={`group flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedAlbumId === album.id
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'border border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)]'
                }`}>
                {album.name}
                <span className={`ml-0.5 text-[10px] ${selectedAlbumId === album.id ? 'text-white/70' : 'text-[var(--color-ink-soft)]'}`}>
                  {album.isPublic ? '公开' : '隐私'}
                </span>
                <button
                  type='button'
                  onClick={e => { e.stopPropagation(); handleDelete(album.id, album.name) }}
                  className={`ml-1 hidden text-[10px] group-hover:inline ${selectedAlbumId === album.id ? 'text-white/70 hover:text-white' : 'text-red-400 hover:text-red-600'}`}>
                  x
                </button>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
