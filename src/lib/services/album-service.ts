import { getPublicJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import type { AlbumRecord, AlbumsIndex } from '@/types/album'
import { randomBytes } from 'crypto'

const ALBUMS_PATH = 'data/albums.json'

function emptyIndex(): AlbumsIndex {
  return { version: 1, albums: [] }
}

function generateId(): string {
  return randomBytes(8).toString('hex')
}

export async function listAlbums(ownerLogin: string): Promise<AlbumRecord[]> {
  const data = await getPublicJsonFile<AlbumsIndex>(ALBUMS_PATH)
  const index = data || emptyIndex()
  return index.albums.filter(a => a.ownerLogin === ownerLogin)
}

export async function getAlbum(id: string): Promise<AlbumRecord | null> {
  const data = await getPublicJsonFile<AlbumsIndex>(ALBUMS_PATH)
  const index = data || emptyIndex()
  return index.albums.find(a => a.id === id) || null
}

export async function createAlbum(
  name: string,
  ownerLogin: string,
  isPublic: boolean,
): Promise<AlbumRecord> {
  const album: AlbumRecord = {
    id: generateId(),
    name,
    ownerLogin,
    isPublic,
    createdAt: new Date().toISOString(),
  }

  await updateJsonWithRetry<AlbumsIndex>(ALBUMS_PATH, current => {
    const index = current || emptyIndex()
    index.albums.push(album)
    return index
  })

  return album
}

export async function updateAlbum(
  id: string,
  changes: Partial<Pick<AlbumRecord, 'name' | 'isPublic'>>,
): Promise<void> {
  await updateJsonWithRetry<AlbumsIndex>(ALBUMS_PATH, current => {
    const index = current || emptyIndex()
    const album = index.albums.find(a => a.id === id)
    if (!album) return index
    if (changes.name !== undefined) album.name = changes.name
    if (changes.isPublic !== undefined) album.isPublic = changes.isPublic
    return index
  })
}

export async function deleteAlbum(id: string): Promise<void> {
  await updateJsonWithRetry<AlbumsIndex>(ALBUMS_PATH, current => {
    const index = current || emptyIndex()
    index.albums = index.albums.filter(a => a.id !== id)
    return index
  })
}
