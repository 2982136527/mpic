'use client'

import { useState } from 'react'
import type { ImageRecord, ImageLinks } from '@/types/image'
import type { AlbumRecord } from '@/types/album'
import { UploadZone } from '@/components/upload/upload-zone'
import { MyImagesList } from '@/components/dashboard/my-images-list'
import { AlbumManager } from '@/components/dashboard/album-manager'

type Props = {
  initialImages: (ImageRecord & { links: ImageLinks })[]
  initialAlbums: AlbumRecord[]
}

export function DashboardContent({ initialImages, initialAlbums }: Props) {
  const [images, setImages] = useState(initialImages)
  const [albums, setAlbums] = useState(initialAlbums)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)

  const filteredImages = selectedAlbumId === null
    ? images
    : selectedAlbumId === ''
      ? images.filter(img => !img.albumId)
      : images.filter(img => img.albumId === selectedAlbumId)

  const handleUploaded = (result: { image: ImageRecord; links: ImageLinks }) => {
    setImages(prev => [{ ...result.image, links: result.links }, ...prev])
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/user/image/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const handleTogglePrivacy = async (id: string, isPublic: boolean) => {
    const res = await fetch(`/api/user/image/${id}/privacy`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic }),
    })
    if (!res.ok) throw new Error('Failed to update privacy')
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, isPublic } : img
    ))
  }

  const handleMoveToAlbum = async (id: string, albumId: string | null) => {
    const res = await fetch(`/api/user/image/${id}/album`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumId }),
    })
    if (!res.ok) throw new Error('Failed to move to album')
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, albumId: albumId || undefined } : img
    ))
  }

  const handleCreateAlbum = async (name: string, isPublic: boolean) => {
    const res = await fetch('/api/user/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, isPublic }),
    })
    if (!res.ok) throw new Error('Failed to create album')
    const data = await res.json()
    setAlbums(prev => [...prev, data.album])
  }

  const handleUpdateAlbum = async (id: string, changes: Partial<Pick<AlbumRecord, 'name' | 'isPublic'>>) => {
    const res = await fetch(`/api/user/album/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    if (!res.ok) throw new Error('Failed to update album')
    setAlbums(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a))
  }

  const handleDeleteAlbum = async (id: string) => {
    const res = await fetch(`/api/user/album/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete album')
    setAlbums(prev => prev.filter(a => a.id !== id))
    // Clear albumId from images that were in this album
    setImages(prev => prev.map(img => img.albumId === id ? { ...img, albumId: undefined } : img))
  }

  return (
    <div className='space-y-6'>
      <UploadZone onUploaded={handleUploaded} albums={albums} selectedAlbumId={selectedAlbumId} />

      <AlbumManager
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        onSelect={setSelectedAlbumId}
        onCreate={handleCreateAlbum}
        onUpdate={handleUpdateAlbum}
        onDelete={handleDeleteAlbum}
      />

      <div>
        <h3 className='mb-3 text-sm font-semibold text-[var(--color-ink)]'>
          我的图片
          {selectedAlbumId !== null && (
            <span className='ml-2 text-xs font-normal text-[var(--color-ink-soft)]'>
              ({selectedAlbumId === '' ? '未分组' : albums.find(a => a.id === selectedAlbumId)?.name || ''})
            </span>
          )}
        </h3>
        <MyImagesList
          images={filteredImages}
          albums={albums}
          onDelete={handleDelete}
          onTogglePrivacy={handleTogglePrivacy}
          onMoveToAlbum={handleMoveToAlbum}
        />
      </div>
    </div>
  )
}
